"""
recompute_mad.py — Recompute monthly active developer counts per ecosystem.

Walks through all developers and their activity sub-docs, then writes
aggregated MAD numbers onto each ecosystem doc.

Uses pagination to avoid Firestore stream timeouts on large collections.
"""

import os
import time
from datetime import datetime, timedelta
from collections import defaultdict
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

# Latest commit date in backfill data
latest_date = datetime(2025,10, 8)
cutoff = latest_date - timedelta(days=28)
cutoff_str = cutoff.strftime("%Y-%m-%d")
print(f"Using cutoff: {cutoff_str} (MAD = active within 28 days before this)")

eco_devs = defaultdict(lambda: {"total": 0, "ft": 0, "pt": 0, "ot": 0})
dev_count = 0

print("\nReading developers (paginated)...")
last_doc = None
page = 0

while True:
    query = db.collection("developers").order_by("__name__").limit(500)
    if last_doc:
        query = query.start_after(last_doc)
    docs = list(query.stream())
    if not docs:
        break
    page += 1

    for dev_doc in docs:
        username = dev_doc.id
        activity = (
            db.collection("developers")
            .document(username)
            .collection("activity")
            .stream()
        )
        for act in activity:
            a = act.to_dict()
            last_active = a.get("last_active") or ""
            if not last_active or last_active < cutoff_str:
                continue
            active_days = a.get("commit_count", 0)
            if active_days == 0:
                continue
            eco = a.get("ecosystem")
            if not eco:
                continue

            eco_devs[eco]["total"] += 1
            if active_days >= 10:
                eco_devs[eco]["ft"] += 1
            elif active_days >= 2:
                eco_devs[eco]["pt"] += 1
            else:
                eco_devs[eco]["ot"] += 1

        dev_count += 1
        if dev_count % 5000 == 0:
            print(f"  Processed {dev_count:,} developers (page {page})...")

    last_doc = docs[-1]

print(f"\nTotal developers processed: {dev_count:,}")
print(f"Ecosystems with activity: {len(eco_devs)}")

print("\nWriting aggregates to ecosystems collection...")
batch = db.batch()
count = 0
for eco, counts in eco_devs.items():
    ref = db.collection("ecosystems").document(eco)
    batch.set(ref, {
        "mad_total": counts["total"],
        "mad_full_time": counts["ft"],
        "mad_part_time": counts["pt"],
        "mad_one_time": counts["ot"],
        "updated_at": firestore.SERVER_TIMESTAMP,
    }, merge=True)
    count += 1
    if count % 100 == 0:
        batch.commit()
        time.sleep(0.5)
        batch = db.batch()
batch.commit()
print(f"Updated {count} ecosystems")

top = sorted(eco_devs.items(), key=lambda x: -x[1]["total"])[:15]
print("\nTop 15 ecosystems by MAD:")
for eco, c in top:
    print(f"  {eco:30s} MAD={c['total']:>6,}  FT={c['ft']:>6,}  PT={c['pt']:>6,}  OT={c['ot']:>6,}")
