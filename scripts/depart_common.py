#!/usr/bin/env python3
"""
Shared helpers for the Sales Raw Data sync scripts.

Both sync_depart_dashboard.py (full sync) and sync_depart_update.py
(incremental update) build on this module: warehouse connection, the row
projection + transform, Google Sheets I/O, and the sync-cursor state file.

Configuration comes entirely from environment variables — see README.md.
Nothing secret is hardcoded or committed.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime
from pathlib import Path

try:
    import pymysql
except ImportError:
    sys.exit("Missing dependency 'pymysql'. Run: pip install -r scripts/requirements.txt")

try:
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build
except ImportError:
    sys.exit("Missing Google API deps. Run: pip install -r scripts/requirements.txt")

# --------------------------------------------------------------------------- #
# CONFIG
# --------------------------------------------------------------------------- #

SPREADSHEET_ID = os.environ.get(
    "DEPART_SPREADSHEET_ID", "1K3hr-RKkl5GFmS-iuAjYMf6MaK0D5CrQzWWVZqDM3PA"
)
SHEET_NAME = os.environ.get("DEPART_SHEET_NAME", "Raw")

# depart_date window (inclusive years) for a lead to appear in the sheet.
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

# Column indexes into a built row (kept in sync with HEADER above).
COL_TIMESTAMP = 0
COL_LEAD_ID = 1

# Google Sheets write chunking (rows per values.append call).
WRITE_CHUNK_ROWS = 5000

SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

# Sync-cursor state file (shared by full + incremental sync).
STATE_FILE = Path(__file__).resolve().parent / ".depart_sync_state.json"

# --------------------------------------------------------------------------- #
# WAREHOUSE QUERY
# --------------------------------------------------------------------------- #
#
# NOTE ON SCHEMA: adjust the table/column names below to match the real ARBA
# warehouse. The projection maps a `leads` table to the sheet columns. Verify
# these identifiers against the live schema before the first run — only the
# names need touching, the transform logic does not.
#
#   sheet column   <-  source expression
#   ------------------------------------------------------------------
#   timestamp      <-  l.timestamp      (sort key, ascending)
#   leadID         <-  l.id
#   closed_time    <-  l.closed_time
#   tc             <-  l.tc             (travel consultant / agent)
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
#   (last_modified_time is selected for the incremental cursor, not written)

BASE_SELECT = """
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
        l.tripid                                                 AS tripid,
        l.last_modified_time                                     AS last_modified_time
    FROM leads AS l
"""

# Full sync: every closed lead in the depart-date window, sorted ascending.
FULL_QUERY = BASE_SELECT + """
    WHERE l.status IN %s
      AND l.depart_date IS NOT NULL
      AND YEAR(l.depart_date) BETWEEN %s AND %s
    ORDER BY l.timestamp ASC
"""

# Incremental: every lead (any status) changed since the last cursor. Status
# and depart_date are classified in Python so we can also detect removals.
UPDATE_QUERY = BASE_SELECT + """
    WHERE l.last_modified_time > %s
    ORDER BY l.last_modified_time ASC
"""


# --------------------------------------------------------------------------- #
# ENV / FORMAT HELPERS
# --------------------------------------------------------------------------- #

def require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        sys.exit(f"ERROR: required environment variable {name} is not set.")
    return val


def fmt_cell(value) -> str:
    """Normalize a DB value into a plain string suitable for a sheet cell."""
    if value is None:
        return ""
    if isinstance(value, (datetime, date)):
        if isinstance(value, datetime) and (value.hour or value.minute or value.second):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        return value.strftime("%Y-%m-%d")
    return str(value)


def _parse_dt(value):
    """Best-effort parse of a date/datetime value into a datetime, or None."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, date):
        return datetime(value.year, value.month, value.day)
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(str(value), fmt)
        except ValueError:
            continue
    return None


def month_year_from_closed(closed_time) -> tuple[str, str]:
    """Derive (Month, Year) from closed_time, per the skill spec."""
    dt = _parse_dt(closed_time)
    if dt is None:
        return "", ""
    return dt.strftime("%B"), str(dt.year)


# --------------------------------------------------------------------------- #
# ROW BUILDING / CLASSIFICATION
# --------------------------------------------------------------------------- #

def record_to_row(r: dict) -> list[str]:
    """Turn a DictCursor warehouse record into a sheet row (HEADER order)."""
    month, year = month_year_from_closed(r.get("closed_time"))
    return [
        fmt_cell(r.get("timestamp")),
        fmt_cell(r.get("leadID")),
        fmt_cell(r.get("closed_time")),
        fmt_cell(r.get("tc")),
        fmt_cell(r.get("status")),
        fmt_cell(r.get("Destination")),
        fmt_cell(r.get("type")),
        fmt_cell(r.get("Pax")),
        fmt_cell(r.get("travel_date")),
        fmt_cell(r.get("depart_date")),
        fmt_cell(r.get("return_date")),
        fmt_cell(r.get("cust_note")),
        fmt_cell(r.get("ad_id")),
        month,
        year,
        fmt_cell(r.get("Amount")),
        fmt_cell(r.get("tripid")),
    ]


def is_closed_in_range(r: dict) -> bool:
    """True if the lead belongs in the sheet (closed status, depart in window)."""
    if r.get("status") not in CLOSED_STATUSES:
        return False
    dt = _parse_dt(r.get("depart_date"))
    if dt is None:
        return False
    return DEPART_YEAR_MIN <= dt.year <= DEPART_YEAR_MAX


# --------------------------------------------------------------------------- #
# WAREHOUSE
# --------------------------------------------------------------------------- #

def connect():
    """Open a warehouse connection (VPN required)."""
    return pymysql.connect(
        host=os.environ.get("WAREHOUSE_HOST", "crm.arbatravel.com"),
        port=int(os.environ.get("WAREHOUSE_PORT", "3306")),
        db=require_env("WAREHOUSE_DB"),
        user=require_env("WAREHOUSE_USER"),
        password=require_env("WAREHOUSE_PASSWORD"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        connect_timeout=30,
        read_timeout=300,
    )


def warehouse_now(conn) -> str:
    """Return the warehouse clock as an ISO string, used as the next cursor."""
    with conn.cursor() as cur:
        cur.execute("SELECT NOW() AS now")
        return fmt_cell(cur.fetchone()["now"])


# --------------------------------------------------------------------------- #
# SYNC-CURSOR STATE
# --------------------------------------------------------------------------- #

def load_cursor() -> str | None:
    if not STATE_FILE.exists():
        return None
    try:
        with open(STATE_FILE) as f:
            return json.load(f).get("last_modified_time")
    except (json.JSONDecodeError, OSError):
        return None


def save_cursor(cursor: str) -> None:
    with open(STATE_FILE, "w") as f:
        json.dump({"last_modified_time": cursor}, f, indent=2)


# --------------------------------------------------------------------------- #
# GOOGLE SHEETS I/O
# --------------------------------------------------------------------------- #

def sheets_values():
    """Return the spreadsheets().values() API handle."""
    creds = Credentials.from_service_account_file(
        require_env("GOOGLE_SA_JSON"), scopes=SHEETS_SCOPES
    )
    svc = build("sheets", "v4", credentials=creds, cache_discovery=False)
    return svc.spreadsheets().values()


def read_data_rows(values_api) -> list[list[str]]:
    """Read current data rows from the sheet (excludes the header row)."""
    resp = values_api.get(
        spreadsheetId=SPREADSHEET_ID, range=SHEET_NAME
    ).execute()
    rows = resp.get("values", [])
    if not rows:
        return []
    # Drop the header row if present.
    if rows[0][:2] == HEADER[:2]:
        rows = rows[1:]
    # Pad short rows so column indexing is safe.
    width = len(HEADER)
    return [r + [""] * (width - len(r)) for r in rows]


def write_all_rows(values_api, rows: list[list[str]]) -> None:
    """Clear the sheet and write header + all rows (chunked appends)."""
    values_api.clear(spreadsheetId=SPREADSHEET_ID, range=SHEET_NAME).execute()
    values_api.update(
        spreadsheetId=SPREADSHEET_ID,
        range=f"{SHEET_NAME}!A1",
        valueInputOption="USER_ENTERED",
        body={"values": [HEADER]},
    ).execute()
    for start in range(0, len(rows), WRITE_CHUNK_ROWS):
        chunk = rows[start:start + WRITE_CHUNK_ROWS]
        values_api.append(
            spreadsheetId=SPREADSHEET_ID,
            range=f"{SHEET_NAME}!A1",
            valueInputOption="USER_ENTERED",
            insertDataOption="INSERT_ROWS",
            body={"values": chunk},
        ).execute()
