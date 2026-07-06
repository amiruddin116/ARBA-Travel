#!/usr/bin/env python3
"""
Sales Raw Data : Full Sync
==========================

Full resync of closed-lead raw data from the ARBA MySQL warehouse
(crm.arbatravel.com) into the "Raw" sheet of the Google Sheet
"Sales Raw Data 2022-2027".

This is the FULL sync: it clears the "Raw" sheet and reloads every closed
lead (status IN Closed / Modified / Payment) whose depart_date falls in
2022-2029, sorted by timestamp ascending. For the fast daily delta use the
incremental script (sync_depart_update.py); the daily cron itself is handled
by the Google Apps Script gsheet_depart_sync.js.

Prerequisites
-------------
- VPN connected (to reach crm.arbatravel.com:3306).
- Python deps installed:  pip install -r scripts/requirements.txt
- Configuration supplied via environment variables (see CONFIG below).
  Nothing secret is hardcoded or committed — set these in your shell or a
  local .env that is git-ignored.

Environment variables
----------------------
  WAREHOUSE_HOST        default: crm.arbatravel.com
  WAREHOUSE_PORT        default: 3306
  WAREHOUSE_DB          MySQL database name            (required)
  WAREHOUSE_USER        MySQL user                     (required)
  WAREHOUSE_PASSWORD    MySQL password                 (required)
  GOOGLE_SA_JSON        path to a Google service-account key JSON file
                        with edit access to the target spreadsheet (required)
  DEPART_SPREADSHEET_ID default: 1K3hr-RKkl5GFmS-iuAjYMf6MaK0D5CrQzWWVZqDM3PA
  DEPART_SHEET_NAME     default: Raw

Usage
-----
    python3 scripts/sync_depart_dashboard.py

On success it prints the number of data rows written.
"""

from __future__ import annotations

import os
import sys
from datetime import date, datetime

try:
    import pymysql
except ImportError:
    sys.exit("Missing dependency 'pymysql'. Run: pip install -r scripts/requirements.txt")

try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
except ImportError:
    sys.exit(
        "Missing Google API deps. "
        "Run: pip install -r scripts/requirements.txt"
    )

# --------------------------------------------------------------------------- #
# CONFIG
# --------------------------------------------------------------------------- #

SPREADSHEET_ID = os.environ.get(
    "DEPART_SPREADSHEET_ID", "1K3hr-RKkl5GFmS-iuAjYMf6MaK0D5CrQzWWVZqDM3PA"
)
SHEET_NAME = os.environ.get("DEPART_SHEET_NAME", "Raw")

# depart_date window (inclusive years)
DEPART_YEAR_MIN = 2022
DEPART_YEAR_MAX = 2029

# Closed-lead statuses to include.
CLOSED_STATUSES = ("Closed", "Modified", "Payment")

# Sheet column order — MUST match the header the Apps Script daily sync expects.
HEADER = [
    "timestamp", "leadID", "closed_time", "tc", "status", "Destination",
    "type", "Pax", "travel_date", "depart_date", "return_date", "cust_note",
    "ad_id", "Month", "Year", "Amount", "tripid",
]

# Google Sheets write chunking (rows per values.append call). Keeps each API
# request well under payload limits for a ~20K-row full load.
WRITE_CHUNK_ROWS = 5000

SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# --------------------------------------------------------------------------- #
# WAREHOUSE QUERY
# --------------------------------------------------------------------------- #
#
# NOTE ON SCHEMA: adjust the table/column names below to match the real ARBA
# warehouse. The query is written against a `leads` table whose columns map to
# the sheet as follows. Verify these names against the live schema before the
# first run — only the identifiers need touching, the transform logic does not.
#
#   sheet column   <-  source expression
#   ------------------------------------------------------------------
#   timestamp      <-  l.timestamp        (sort key, ascending)
#   leadID         <-  l.id
#   closed_time    <-  l.closed_time
#   tc             <-  l.tc               (travel consultant / agent)
#   status         <-  l.status
#   Destination    <-  l.destination
#   type           <-  l.type
#   Pax            <-  adult + child + childnb   (infant EXCLUDED)
#   travel_date    <-  l.travel_date
#   depart_date    <-  l.depart_date
#   return_date    <-  l.return_date
#   cust_note      <-  l.cust_note
#   ad_id          <-  l.ad_id
#   Month/Year     <-  derived in Python from closed_time
#   Amount         <-  l.amount
#   tripid         <-  l.tripid
#
# Placeholders (%s) are used for every user/config value — no string
# interpolation of untrusted input into SQL.

QUERY = """
    SELECT
        l.timestamp                                              AS `timestamp`,
        l.id                                                     AS leadID,
        l.closed_time                                            AS closed_time,
        l.tc                                                     AS tc,
        l.status                                                 AS status,
        l.destination                                            AS Destination,
        l.type                                                   AS type,
        (COALESCE(l.adult, 0)
         + COALESCE(l.child, 0)
         + COALESCE(l.childnb, 0))                               AS Pax,
        l.travel_date                                            AS travel_date,
        l.depart_date                                            AS depart_date,
        l.return_date                                            AS return_date,
        l.cust_note                                              AS cust_note,
        l.ad_id                                                  AS ad_id,
        l.amount                                                 AS Amount,
        l.tripid                                                 AS tripid
    FROM leads AS l
    WHERE l.status IN %s
      AND l.depart_date IS NOT NULL
      AND YEAR(l.depart_date) BETWEEN %s AND %s
    ORDER BY l.timestamp ASC
"""


# --------------------------------------------------------------------------- #
# HELPERS
# --------------------------------------------------------------------------- #

def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        sys.exit(f"ERROR: required environment variable {name} is not set.")
    return val


def _fmt_cell(value) -> str:
    """Normalize a DB value into a plain string suitable for a sheet cell."""
    if value is None:
        return ""
    if isinstance(value, (datetime, date)):
        # Preserve time component when present, else date-only.
        if isinstance(value, datetime) and (value.hour or value.minute or value.second):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        return value.strftime("%Y-%m-%d")
    return str(value)


def _month_year_from_closed(closed_time) -> tuple[str, str]:
    """Derive (Month, Year) from closed_time, per the skill spec."""
    if closed_time is None:
        return "", ""
    if isinstance(closed_time, (datetime, date)):
        dt = closed_time
    else:
        dt = None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(str(closed_time), fmt)
                break
            except ValueError:
                continue
        if dt is None:
            return "", ""
    return dt.strftime("%B"), str(dt.year)


# --------------------------------------------------------------------------- #
# FETCH
# --------------------------------------------------------------------------- #

def fetch_rows() -> list[list[str]]:
    """Query the warehouse and return sheet-ready rows (excluding header)."""
    conn = pymysql.connect(
        host=os.environ.get("WAREHOUSE_HOST", "crm.arbatravel.com"),
        port=int(os.environ.get("WAREHOUSE_PORT", "3306")),
        db=_require_env("WAREHOUSE_DB"),
        user=_require_env("WAREHOUSE_USER"),
        password=_require_env("WAREHOUSE_PASSWORD"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=30,
        read_timeout=300,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(QUERY, (CLOSED_STATUSES, DEPART_YEAR_MIN, DEPART_YEAR_MAX))
            records = cur.fetchall()
    finally:
        conn.close()

    rows: list[list[str]] = []
    for r in records:
        month, year = _month_year_from_closed(r.get("closed_time"))
        rows.append([
            _fmt_cell(r.get("timestamp")),
            _fmt_cell(r.get("leadID")),
            _fmt_cell(r.get("closed_time")),
            _fmt_cell(r.get("tc")),
            _fmt_cell(r.get("status")),
            _fmt_cell(r.get("Destination")),
            _fmt_cell(r.get("type")),
            _fmt_cell(r.get("Pax")),
            _fmt_cell(r.get("travel_date")),
            _fmt_cell(r.get("depart_date")),
            _fmt_cell(r.get("return_date")),
            _fmt_cell(r.get("cust_note")),
            _fmt_cell(r.get("ad_id")),
            month,
            year,
            _fmt_cell(r.get("Amount")),
            _fmt_cell(r.get("tripid")),
        ])
    return rows


# --------------------------------------------------------------------------- #
# WRITE TO GOOGLE SHEETS
# --------------------------------------------------------------------------- #

def _sheets_service():
    creds = Credentials.from_service_account_file(
        _require_env("GOOGLE_SA_JSON"), scopes=SHEETS_SCOPES
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def write_sheet(rows: list[list[str]]) -> None:
    """Clear the Raw sheet and write header + rows (chunked appends)."""
    svc = _sheets_service()
    values_api = svc.spreadsheets().values()

    # 1. Clear existing contents of the target sheet.
    values_api.clear(spreadsheetId=SPREADSHEET_ID, range=SHEET_NAME).execute()

    # 2. Write the header row.
    values_api.update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"{SHEET_NAME}!A1",
        valueInputOption="USER_ENTERED",
        body={"values": [HEADER]},
    ).execute()

    # 3. Append data rows in chunks after the header.
    for start in range(0, len(rows), WRITE_CHUNK_ROWS):
        chunk = rows[start:start + WRITE_CHUNK_ROWS]
        values_api.append(
            spreadsheetId=SPREADSHEET_ID,
            range=f"{SHEET_NAME}!A1",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body={"values": chunk},
        ).execute()


# --------------------------------------------------------------------------- #
# MAIN
# --------------------------------------------------------------------------- #

def main() -> None:
    print("Fetching closed leads from ARBA warehouse ...", flush=True)
    rows = fetch_rows()
    print(f"Fetched {len(rows)} rows. Writing to sheet '{SHEET_NAME}' ...", flush=True)
    write_sheet(rows)
    print(f"Full sync complete: {len(rows)} rows written.")


if __name__ == "__main__":
    main()
