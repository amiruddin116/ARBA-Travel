---
name: sales-raw-full
description: "Full sync of sales raw data from ARBA warehouse to Google Sheet. Use when the user says: 'sales raw data : full sync', 'sales raw data full sync', 'full sync sales raw data', or similar."
---

# Sales Raw Data : Full Sync

Full resync of closed-lead raw data from ARBA warehouse to the Google Sheet "Sales Raw Data 2022-2027".

## Trigger
User says: "sales raw data : full sync", "sales raw data full sync", "full sync sales raw data", or similar.

## What it does
Runs `python3 scripts/sync_depart_dashboard.py` which:
- Connects to MySQL warehouse at crm.arbatravel.com (requires VPN)
- Fetches all closed leads (status IN Closed/Modified/Payment) with depart_date 2022-2029
- Writes ~20K rows to the "Raw" sheet in spreadsheet `1K3hr-RKkl5GFmS-iuAjYMf6MaK0D5CrQzWWVZqDM3PA`
- Column structure: timestamp, leadID, closed_time, tc, status, Destination, type, Pax, travel_date, depart_date, return_date, cust_note, ad_id, Month, Year, Amount, tripid
- Pax = adult + child + childnb (infant excluded)
- Month/Year derived from closed_time
- Sorted by timestamp ascending

## Prerequisites
- VPN must be connected (to reach crm.arbatravel.com:3306)

## Steps
1. Run: `python3 scripts/sync_depart_dashboard.py`
2. Report the row count from the output

## Daily incremental sync
The daily sync is handled by Google Apps Script (`gsheet_depart_sync.js`) — no action needed here. Only run this skill for a full resync.
