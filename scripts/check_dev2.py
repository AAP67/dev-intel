import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

# Check a known developer from the BigQuery data
from google.cloud import bigquery
bq = bigquery.Client(project="ecoscout-41c0e")
rows = list(bq.query("SELECT github_username FROM `ecoscout-41c0e.dev_intel.backfill_2025` LIMIT 5").result())

for row in rows:
    username = row["github_username"]
    safe = username.replace("/", "__")
    doc = db.collection("developers").document(safe).get()
    if doc.exists:
        d = doc.to_dict()
        print(f"\n--- {username} ---")
        print(f"  ecosystems: {d.get('ecosystems')}")
        print(f"  first_seen: {d.get('first_seen')}")
        print(f"  total_commits: {d.get('total_commits')}")
        acts = list(db.collection("developers").document(safe).collection("activity").limit(3).stream())
        print(f"  activity sub-docs: {len(acts)}")
        for a in acts:
            print(f"    {a.id}: {a.to_dict()}")
    else:
        print(f"\n--- {username} --- NOT FOUND")
