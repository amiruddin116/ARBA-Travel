#!/usr/bin/env python3
"""Summarize SleekFlow leads data for the /sleekflow skill."""

import json
import os
import sys
from collections import Counter
from pathlib import Path


def find_data_dir():
    """Walk up from cwd to find data/leads.jsonl."""
    cwd = Path.cwd()
    for p in [cwd, *cwd.parents]:
        if (p / "data" / "leads.jsonl").exists():
            return p / "data"
    return None


def main():
    data_dir = find_data_dir()
    if not data_dir:
        print("ERROR: Could not find data/leads.jsonl. Make sure you're in the ARBA-Travel project directory.")
        sys.exit(1)

    leads_file = data_dir / "leads.jsonl"
    transcripts_dir = data_dir / "transcripts"

    leads = []
    with open(leads_file) as f:
        for line in f:
            line = line.strip()
            if line:
                leads.append(json.loads(line))

    total = len(leads)

    dates = []
    for l in leads:
        lc = l.get("lastContact", "")
        if lc:
            dates.append(lc[:10])
    date_range = f"{min(dates)} to {max(dates)}" if dates else "unknown"

    assignees = Counter(l.get("assignee", "") for l in leads)
    statuses = Counter(l.get("status", "") for l in leads)
    conv_statuses = Counter(l.get("conversationStatus", "") for l in leads)

    transcript_count = len(list(transcripts_dir.glob("*.txt"))) if transcripts_dir.exists() else 0

    print(f"## SleekFlow WhatsApp Data — ARBA Travel")
    print()
    print(f"**{total} leads** | **{transcript_count} transcripts** | Date range: **{date_range}**")
    print()

    print("### Status breakdown")
    for status, count in statuses.most_common(10):
        label = status if status else "(empty)"
        print(f"- {label}: {count}")
    print()

    if any(k for k in conv_statuses if k):
        print("### Conversation status")
        for status, count in conv_statuses.most_common(10):
            label = status if status else "(empty)"
            print(f"- {label}: {count}")
        print()

    print("### Top assignees")
    for assignee, count in assignees.most_common(15):
        label = assignee if assignee else "(unassigned)"
        print(f"- {label}: {count}")
    print()

    print("### Available fields")
    print("**Leads** (`data/leads.jsonl`): id, firstName, lastName, phoneNumber, conversationId, lastContact, updatedAt, assignee, status, conversationStatus")
    print()
    print("**Transcripts** (`data/transcripts/<id>.txt`): header (name, phone, assignee, status) + chronological messages as `[YYYY-MM-DD HH:MM:SS] sender: text`")
    print()

    print("### Example questions you can ask")
    print("- Average response time from first customer message to first agent reply")
    print("- Which agents handle the most conversations? Best close rate?")
    print("- Most requested destinations or packages")
    print("- Leads that went cold (no reply after X hours)")
    print("- Conversations where customer said 'paid' but status isn't paid")
    print("- Daily volume breakdown across the week")
    print("- Sentiment or keyword analysis across transcripts")
    print()
    print("**What would you like to know?**")


if __name__ == "__main__":
    main()
