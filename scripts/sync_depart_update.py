#!/usr/bin/env python3
"""
Sales Raw Data : Incremental Update
===================================

Fast delta sync of closed-lead raw data from the ARBA MySQL warehouse
(crm.arbatravel.com) into the "Raw" sheet of the Google Sheet
"Sales Raw Data 2022-2027".

Fetches only leads changed since the last sync (using last_modified_time),
then reconciles them against the current sheet contents:

- **updated**  — a lead already in the sheet whose data changed
- **added**    — a newly-closed lead (in the depart-date window) not yet present
- **removed**  — a lead whose status changed to non-closed (or moved out of the
                 depart-date window) and must leave the sheet

After reconciling, rows are re-sorted by timestamp ascending and the sheet is
rewritten. The new cursor is saved to scripts/.depart_sync_state.json.

A full sync (sync_depart_dashboard.py) must have run at least once to
establish the initial cursor.

Prerequisites
-------------
- VPN connected (to reach crm.arbatravel.com:3306).
- pip install -r scripts/requirements.txt
- Environment configured (see scripts/README.md).

Usage
-----
    python3 scripts/sync_depart_update.py

Prints updated / added / removed counts on success.
"""

from __future__ import annotations

import sys

import depart_common as dc


def _timestamp_key(row: list[str]) -> str:
    """Sort key: the timestamp column (ISO strings sort chronologically)."""
    return row[dc.COL_TIMESTAMP]


def main() -> None:
    cursor = dc.load_cursor()
    if not cursor:
        sys.exit(
            "ERROR: no sync cursor found (scripts/.depart_sync_state.json).\n"
            "Run the full sync first: python3 scripts/sync_depart_dashboard.py"
        )

    print(f"Connecting to ARBA warehouse (changes since {cursor}) ...", flush=True)
    conn = dc.connect()
    try:
        new_cursor = dc.warehouse_now(conn)
        with conn.cursor() as cur:
            cur.execute(dc.UPDATE_QUERY, (cursor,))
            records = cur.fetchall()
    finally:
        conn.close()

    print(f"Fetched {len(records)} changed lead(s). Reading current sheet ...", flush=True)
    values_api = dc.sheets_values()
    current = dc.read_data_rows(values_api)

    # Index current rows by leadID (last write wins on any dup).
    index: dict[str, list[str]] = {row[dc.COL_LEAD_ID]: row for row in current}

    updated = added = removed = 0
    for r in records:
        lead_id = dc.fmt_cell(r.get("leadID"))
        if not lead_id:
            continue
        if dc.is_closed_in_range(r):
            new_row = dc.record_to_row(r)
            if lead_id in index:
                if index[lead_id] != new_row:
                    updated += 1
                index[lead_id] = new_row
            else:
                index[lead_id] = new_row
                added += 1
        else:
            # Lead no longer belongs in the sheet — drop it if present.
            if index.pop(lead_id, None) is not None:
                removed += 1

    if updated == added == removed == 0:
        dc.save_cursor(new_cursor)
        print("Up to date: 0 updated, 0 added, 0 removed.")
        return

    merged = sorted(index.values(), key=_timestamp_key)
    print(f"Rewriting sheet with {len(merged)} rows ...", flush=True)
    dc.write_all_rows(values_api, merged)

    dc.save_cursor(new_cursor)
    print(
        f"Update complete: {updated} updated, {added} added, {removed} removed "
        f"({len(merged)} rows total)."
    )


if __name__ == "__main__":
    main()
