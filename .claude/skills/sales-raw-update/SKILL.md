---
name: sales-raw-update
description: "Incremental update of sales raw data from ARBA warehouse to Google Sheet. Use when the user says: 'sales raw data : update', 'sales raw data update', 'update sales raw data', or similar."
---

# Sales Raw Data : Update

Incremental update of closed-lead raw data from ARBA warehouse to the Google Sheet "Sales Raw Data 2022-2027".

## Trigger
User says: "sales raw data : update", "sales raw data update", "update sales raw data", or similar.

## What it does
Runs `python3 scripts/sync_depart_update.py` which:
- Connects to MySQL warehouse at crm.arbatravel.com (requires VPN)
- Fetches only rows changed since last sync (using `last_modified_time`)
- Updates existing rows in place, appends new closings, removes rows where status changed to non-closed
- Sorts by timestamp ascending after update
- Saves sync cursor to `scripts/.depart_sync_state.json`

## Difference from full sync
- **sync-full** (`sync_depart_dashboard.py`): Clears sheet, reloads all ~20K rows. Use when data is out of sync or first time.
- **sync-update** (`sync_depart_update.py`): Only fetches changed rows (~42/day). Fast and efficient.

## Prerequisites
- VPN must be connected (to reach crm.arbatravel.com:3306)
- Full sync must have been run at least once before

## Steps
1. Run: `python3 scripts/sync_depart_update.py`
2. Report the counts (updated, added, removed) from the output
