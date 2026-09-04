#!/usr/bin/env python3
"""
Sales Raw Data : Full Sync
==========================

Full resync of closed-lead raw data from the ARBA MySQL warehouse
(crm.arbatravel.com) into the "Raw" sheet of the Google Sheet
"Sales Raw Data 2022-2027".

Clears the "Raw" sheet and reloads every closed lead (status IN
Closed / Modified / Payment) whose depart_date falls in 2022-2029, sorted by
timestamp ascending. Use this when the sheet is out of sync or for a first
load; for the fast daily delta use sync_depart_update.py (the daily cron
itself is handled by the Apps Script gsheet_depart_sync.js).

Also records the sync cursor to scripts/.depart_sync_state.json so the
incremental update has a starting point.

Prerequisites
-------------
- VPN connected (to reach crm.arbatravel.com:3306).
- pip install -r scripts/requirements.txt
- Environment configured (see scripts/README.md).

Usage
-----
    python3 scripts/sync_depart_dashboard.py

Prints the number of data rows written on success.
"""

from __future__ import annotations

import depart_common as dc


def main() -> None:
    print("Connecting to ARBA warehouse ...", flush=True)
    conn = dc.connect()
    try:
        # Capture the cursor BEFORE fetching; any concurrent change is caught
        # (idempotently) by the next incremental run.
        cursor = dc.warehouse_now(conn)
        print("Fetching closed leads ...", flush=True)
        with conn.cursor() as cur:
            cur.execute(
                dc.FULL_QUERY,
                (dc.CLOSED_STATUSES, dc.DEPART_YEAR_MIN, dc.DEPART_YEAR_MAX),
            )
            records = cur.fetchall()
    finally:
        conn.close()

    rows = [dc.record_to_row(r) for r in records]
    print(f"Fetched {len(rows)} rows. Writing to sheet '{dc.SHEET_NAME}' ...", flush=True)

    values_api = dc.sheets_values()
    dc.write_all_rows(values_api, rows)

    dc.save_cursor(cursor)
    print(f"Full sync complete: {len(rows)} rows written.")


if __name__ == "__main__":
    main()
