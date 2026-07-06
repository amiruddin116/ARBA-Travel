# Sales Raw Data sync scripts

Syncs closed-lead raw data from the ARBA MySQL warehouse (`crm.arbatravel.com`)
into the **"Raw"** sheet of the Google Sheet *Sales Raw Data 2022-2027*
(`1K3hr-RKkl5GFmS-iuAjYMf6MaK0D5CrQzWWVZqDM3PA`).

| Script | Skill | What it does |
| --- | --- | --- |
| `sync_depart_dashboard.py` | `/sales-raw-full` | Clears the sheet and reloads **all** ~20K closed leads. |
| `sync_depart_update.py` | `/sales-raw-update` | Incremental delta since last sync (updated / added / removed). |
| `depart_common.py` | — | Shared helpers (warehouse, transform, Sheets I/O, cursor). |

The incremental update requires the full sync to have run at least once — the
full sync records the starting cursor in `scripts/.depart_sync_state.json`.

The daily cron is handled separately by the Google Apps Script
`gsheet_depart_sync.js`; these scripts are for on-demand full/manual syncs.

## Setup

```bash
pip install -r scripts/requirements.txt
```

## Configuration (environment variables)

Nothing secret is hardcoded. Provide these via your shell or a git-ignored
`.env`:

| Variable | Required | Default |
| --- | --- | --- |
| `WAREHOUSE_HOST` | no | `crm.arbatravel.com` |
| `WAREHOUSE_PORT` | no | `3306` |
| `WAREHOUSE_DB` | **yes** | — |
| `WAREHOUSE_USER` | **yes** | — |
| `WAREHOUSE_PASSWORD` | **yes** | — |
| `GOOGLE_SA_JSON` | **yes** | — (path to service-account key JSON with edit access to the sheet) |
| `DEPART_SPREADSHEET_ID` | no | `1K3hr-RKkl5GFmS-iuAjYMf6MaK0D5CrQzWWVZqDM3PA` |
| `DEPART_SHEET_NAME` | no | `Raw` |

The Google service account (email in the key JSON) must be shared as an
**Editor** on the target spreadsheet.

## Run

```bash
# VPN must be connected to reach crm.arbatravel.com:3306
python3 scripts/sync_depart_dashboard.py
```

Prints the number of rows written on success.

## Output columns (17)

`timestamp, leadID, closed_time, tc, status, Destination, type, Pax,
travel_date, depart_date, return_date, cust_note, ad_id, Month, Year,
Amount, tripid`

- **Pax** = `adult + child + childnb` (infant excluded)
- **Month / Year** derived from `closed_time`
- Rows sorted by `timestamp` ascending
- Filter: `status IN (Closed, Modified, Payment)` and `depart_date` year in 2022–2029

## ⚠️ Verify the warehouse schema before first run

The SQL in `depart_common.py` (`BASE_SELECT` / `FULL_QUERY` / `UPDATE_QUERY`)
is written against a `leads` table with best-guess column names (`l.timestamp`,
`l.closed_time`, `l.tc`, `l.destination`, `l.adult`, `l.child`, `l.childnb`,
`l.amount`, `l.tripid`, `l.last_modified_time`, …). Confirm the real table and
column names against the live warehouse and adjust the identifiers if they
differ — the transform logic (Pax sum, Month/Year derivation, sort, sheet
layout, reconcile) needs no changes. In particular the incremental update
relies on a `last_modified_time` column being bumped whenever a lead changes.
