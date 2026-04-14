"""
bq_to_firestore.py — Read from BigQuery in chunks, write to Firestore.
Processes 50K rows at a time so Codespace doesn't run out of memory.

Usage:
    export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
    python3 scripts/bq_to_firestore.py --table backfill_2025 --dry-run
    python3 scripts/bq_to_firestore.py --table backfill_2025
"""

import os
import sys
import json
import time
import argparse
from datetime import datetime, timedelta
from collections import defaultdict

CHUNK_SIZE = 50000
BATCH_SIZE = 200
SLEEP = 0.5


def load_repo_eco_map(path="scripts/repo_eco_map.json"):
    with open(path) as f:
        return json.load(f)


def classify(active_days):
    if active_days >= 10:
        return "full_time"
    elif active_days >= 2:
        return "part_time"
    elif active_days >= 1:
        return "one_time"
    return "unknown"


def compute_active_days_28d(dates):
    if not dates:
        return 0
    sorted_d = sorted(dates)
    latest = datetime.strptime(sorted_d[-1], "%Y-%m-%d")
    cutoff = latest - timedelta(days=28)
    return sum(1 for d in sorted_d if datetime.strptime(d, "%Y-%m-%d") >= cutoff)


def get_total_rows(client, project_id, table_name):
    query = f"SELECT COUNT(*) as cnt FROM `{project_id}.dev_intel.{table_name}`"
    result = list(client.query(query).result())
    return result[0]["cnt"]


def fetch_chunk(client, project_id, table_name, offset, limit):
    query = f"""
        SELECT * FROM `{project_id}.dev_intel.{table_name}`
        LIMIT {limit} OFFSET {offset}
    """
    return [dict(row) for row in client.query(query).result()]


def get_firestore_db():
    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path:
            firebase_admin.initialize_app(credentials.Certificate(cred_path))
        else:
            firebase_admin.initialize_app()
    return firestore.client()


def process_and_write_chunk(rows, repo_eco_map, db, chunk_num, is_dry_run):
    from firebase_admin import firestore

    developers = {}
    dev_eco_dates = defaultdict(lambda: defaultdict(set))
    commits = []
    skipped = 0

    for row in rows:
        username = (row.get("github_username") or "").strip()
        repo = (row.get("repo_full_name") or "").lower().strip()
        ts = str(row.get("committed_at") or "")
        sha = row.get("commit_sha") or ""

        if not username or not repo:
            skipped += 1
            continue

        ecosystems = repo_eco_map.get(repo, [])
        if not ecosystems:
            skipped += 1
            continue

        if username not in developers:
            developers[username] = {
                "github_id": row.get("github_id"),
                "first_seen": ts,
                "last_seen": ts,
                "total_commits": 0,
            }
        dev = developers[username]
        dev["total_commits"] += 1
        if ts and ts < dev["first_seen"]:
            dev["first_seen"] = ts
        if ts and ts > dev["last_seen"]:
            dev["last_seen"] = ts

        date_str = ts[:10] if ts else None
        for eco in ecosystems:
            if date_str:
                dev_eco_dates[username][eco].add(date_str)

        commits.append({
            "sha": sha,
            "developer": username,
            "repo_full_name": repo,
            "ecosystems": ecosystems,
            "committed_at": ts,
            "message": (row.get("commit_message") or "")[:500],
            "source": "bigquery",
        })

    print(f"  Chunk {chunk_num}: {len(commits):,} commits, {len(developers):,} devs, {skipped:,} skipped")

    if is_dry_run:
        return len(commits), len(developers), skipped, dev_eco_dates

    # Write developers
    dev_list = list(developers.items())
    for i in range(0, len(dev_list), BATCH_SIZE):
        batch = db.batch()
        for username, data in dev_list[i : i + BATCH_SIZE]:
            eco_dates = dev_eco_dates.get(username, {})
            all_ecos = list(eco_dates.keys())
            max_active = max(
                (compute_active_days_28d(dates) for dates in eco_dates.values()),
                default=0,
            )
            ref = db.collection("developers").document(username)
            batch.set(ref, {
                "github_username": username,
                "github_id": data["github_id"],
                "ecosystems": all_ecos,
                "classification": classify(max_active),
                "total_commits": data["total_commits"],
                "active_days_28d": max_active,
                "first_seen": data["first_seen"],
                "last_seen": data["last_seen"],
                "updated_at": firestore.SERVER_TIMESTAMP,
            }, merge=True)
        batch.commit()
        time.sleep(SLEEP)

    # Write activity sub-docs
    batch = db.batch()
    count = 0
    for username, eco_dates_inner in dev_eco_dates.items():
        for eco, dates in eco_dates_inner.items():
            sorted_d = sorted(dates)
            ref = (
                db.collection("developers")
                .document(username)
                .collection("activity")
                .document(eco)
            )
            batch.set(ref, {
                "ecosystem": eco,
                "first_active": sorted_d[0] if sorted_d else None,
                "last_active": sorted_d[-1] if sorted_d else None,
                "commit_count": len(dates),
                "active_days_28d": compute_active_days_28d(dates),
            }, merge=True)
            count += 1
            if count % BATCH_SIZE == 0:
                batch.commit()
                time.sleep(SLEEP)
                batch = db.batch()
    batch.commit()

    # Write commits
    for i in range(0, len(commits), BATCH_SIZE):
        batch = db.batch()
        for c in commits[i : i + BATCH_SIZE]:
            doc_id = f"{c['sha'][:12]}_{c['repo_full_name'].replace('/', '__')}"
            ref = db.collection("commits").document(doc_id)
            batch.set(ref, c)
        batch.commit()
        time.sleep(SLEEP)

    return len(commits), len(developers), skipped, dev_eco_dates


def update_ecosystem_aggregates(db, all_dev_eco_dates):
    from firebase_admin import firestore

    eco_devs = defaultdict(lambda: {"total": 0, "ft": 0, "pt": 0, "ot": 0})
    for username, eco_dates in all_dev_eco_dates.items():
        for eco, dates in eco_dates.items():
            ad = compute_active_days_28d(dates)
            if ad == 0:
                continue
            eco_devs[eco]["total"] += 1
            c = classify(ad)
            if c == "full_time":
                eco_devs[eco]["ft"] += 1
            elif c == "part_time":
                eco_devs[eco]["pt"] += 1
            elif c == "one_time":
                eco_devs[eco]["ot"] += 1

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
        if count % BATCH_SIZE == 0:
            batch.commit()
            time.sleep(SLEEP)
            batch = db.batch()
    batch.commit()
    print(f"  Updated {count} ecosystems")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", required=True)
    parser.add_argument("--project", default="ecoscout-41c0e")
    parser.add_argument("--repo-map", default="scripts/repo_eco_map.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    repo_eco_map = load_repo_eco_map(args.repo_map)
    print(f"Loaded {len(repo_eco_map):,} repo mappings")

    from google.cloud import bigquery
    bq_client = bigquery.Client(project=args.project)

    total_rows = get_total_rows(bq_client, args.project, args.table)
    total_chunks = (total_rows + CHUNK_SIZE - 1) // CHUNK_SIZE
    print(f"Table has {total_rows:,} rows -> {total_chunks} chunks of {CHUNK_SIZE:,}")

    db = None if args.dry_run else get_firestore_db()

    total_commits = 0
    total_devs = 0
    total_skipped = 0
    all_dev_eco_dates = defaultdict(lambda: defaultdict(set))

    for chunk_num in range(1, total_chunks + 1):
        offset = (chunk_num - 1) * CHUNK_SIZE
        print(f"\n--- Chunk {chunk_num}/{total_chunks} (offset {offset:,}) ---")

        rows = fetch_chunk(bq_client, args.project, args.table, offset, CHUNK_SIZE)
        commits, devs, skipped, dev_eco_dates = process_and_write_chunk(
            rows, repo_eco_map, db, chunk_num, args.dry_run
        )
        total_commits += commits
        total_devs += devs
        total_skipped += skipped

        for username, eco_dates in dev_eco_dates.items():
            for eco, dates in eco_dates.items():
                all_dev_eco_dates[username][eco].update(dates)

        del rows

    if not args.dry_run:
        print("\nUpdating ecosystem aggregates...")
        update_ecosystem_aggregates(db, all_dev_eco_dates)

    print(f"\n{'=== DRY RUN ===' if args.dry_run else '=== DONE ==='}")
    print(f"Total commits: {total_commits:,}")
    print(f"Unique developers: {len(all_dev_eco_dates):,}")
    print(f"Skipped: {total_skipped:,}")

    if args.dry_run:
        eco_counts = defaultdict(int)
        for username, eco_dates in all_dev_eco_dates.items():
            for eco in eco_dates:
                eco_counts[eco] += 1
        top = sorted(eco_counts.items(), key=lambda x: -x[1])[:20]
        print(f"\nTop 20 ecosystems by developer count:")
        for eco, c in top:
            print(f"  {eco:30s} {c:,}")

        activity_docs = sum(len(ecos) for ecos in all_dev_eco_dates.values())
        total_writes = len(all_dev_eco_dates) + activity_docs + total_commits
        cost = total_writes * 0.18 / 100_000
        est_hours = (total_writes / BATCH_SIZE * SLEEP) / 3600
        print(f"\nEstimated Firestore writes: {total_writes:,}")
        print(f"Estimated cost: ${cost:.2f}")
        print(f"Estimated time: {est_hours:.1f} hours")


if __name__ == "__main__":
    main()
