---
name: sleekflow
description: Load and analyze ARBA Travel's SleekFlow WhatsApp chat data (leads + transcripts). Use this skill whenever the user types /sleekflow, asks about WhatsApp chat data, SleekFlow insights, lead analysis, agent performance, response times, or sales conversion from WhatsApp conversations. Also trigger when the user references "the chat data", "transcript analysis", or "lead data" in the context of ARBA Travel.
---

# SleekFlow WhatsApp Data Loader

This skill loads context from ARBA Travel's extracted SleekFlow WhatsApp data so the user can immediately ask sales insight questions.

## Step 1: Load the data summary

Run the summary script to give the user an overview of what's available:

```bash
python3 <skill-path>/scripts/summarize.py
```

Present the output to the user as-is — it contains the lead count, date range, status breakdown, top assignees, available fields, and example questions.

## Step 2: Answer questions

When the user asks a question, analyze the data by reading and processing the relevant files:

- **For structured queries** (counts, breakdowns, rankings): parse `data/leads.jsonl` with Python — each line is a JSON object
- **For transcript analysis** (response times, keywords, sentiment): read files from `data/transcripts/` — each file has a header block and chronological messages in `[YYYY-MM-DD HH:MM:SS] sender: text` format
- **For cross-referencing**: join leads data with transcripts via the `conversationId` field (transcript filename = conversationId)

Write Python scripts for any non-trivial analysis rather than trying to eyeball the data. The dataset has 1000+ leads so manual inspection won't cut it.

## Data location

- `data/leads.jsonl` — one JSON object per line with fields: id, firstName, lastName, phoneNumber, conversationId, lastContact, updatedAt, assignee, status, conversationStatus
- `data/transcripts/<conversationId>.txt` — plain text chat transcripts

## Important notes

- The token in `.session_token` expires after ~24h. If the user wants to pull fresh data, they need to re-extract from DevTools.
- The extraction script `pull_sleekflow.py` in the project root can be rerun with different date windows.
