import os
import time
from collections import defaultdict
import json
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import bigquery

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()
bq = bigquery.Client(project="ecoscout-41c0e")

# Load repo-ecosystem map
with open("scripts/repo_eco_map.json") as f:
    repo_eco_map = json.load(f)

# Read the MAD window from BigQuery
print("Reading mad_window from BigQuery...")
rows = list(bq.query("SELECT * FROM `ecoscout-41c0e.dev_intel.mad_window`").result())
print(f"  {len(rows):,} rows")

# Aggregate: developer → ecosystem → active_days
dev_eco = defaultdict(lambda: defaultdict(lambda: {"days": 0, "commits": 0, "first": None, "last": None}))

for row in rows:
    username = row["github_username"]
    repo = row["repo_full_name"]
    ecosystems = repo_eco_map.get(repo, [])
    for eco in ecosystems:
        entry = dev_eco[username][eco]
        entry["days"] = max(entry["days"], row["active_days"])
        entry["commits"] += row["total_commits"]
        fa = str(row["first_active"])
        la = str(row["last_active"])
        if not entry["first"] or fa < entry["first"]:
            entry["first"] = fa
        if not entry["last"] or la > entry["last"]:
            entry["last"] = la

print(f"  {len(dev_eco):,} developers across ecosystems")

# Update activity sub-docs in Firestore
print("\nUpdating activity sub-docs...")
batch = db.batch()
count = 0
for username, ecos in dev_eco.items():
    safe = username.replace("/", "__")
    for eco, data in ecos.items():
        ref = (
            db.collection("developers")
            .document(safe)
            .collection("activity")
            .document(eco.replace("/", "__"))
        )
        batch.set(ref, {
            "ecosystem": eco,
            "active_days_28d": data["days"],
            "commit_count": data["commits"],
            "first_active": data["first"],
            "last_active": data["last"],
        }, merge=True)
        count += 1
        if count % 200 == 0:
            batch.commit()
            time.sleep(0.5)
            batch = db.batch()
            if count % 2000 == 0:
                print(f"  Updated {count:,} sub-docs...")
batch.commit()
print(f"  Updated {count:,} sub-docs total")

# Now compute MAD aggregates
print("\nComputing ecosystem MAD...")
eco_mad = defaultdict(lambda: {"total": 0, "ft": 0, "pt": 0, "ot": 0})
for username, ecos in dev_eco.items():
    for eco, data in ecos.items():
        days = data["days"]
        if days == 0:
            continue
        eco_mad[eco]["total"] += 1
        if days >= 10:
            eco_mad[eco]["ft"] += 1
        elif days >= 2:
            eco_mad[eco]["pt"] += 1
        else:
            eco_mad[eco]["ot"] += 1

# Write to ecosystems collection
batch = db.batch()
for eco, counts in eco_mad.items():
    ref = db.collection("ecosystems").document(eco)
    batch.set(ref, {
        "mad_total": counts["total"],
        "mad_full_time": counts["ft"],
        "mad_part_time": counts["pt"],
        "mad_one_time": counts["ot"],
        "updated_at": firestore.SERVER_TIMESTAMP,
    }, merge=True)
batch.commit()

top = sorted(eco_mad.items(), key=lambda x: -x[1]["total"])[:15]
print("\nTop 15 ecosystems by MAD:")
for eco, c in top:
    print(f"  {eco:30s} MAD={c['total']:>6,}  FT={c['ft']:>5,}  PT={c['pt']:>5,}  OT={c['ot']:>5,}")
