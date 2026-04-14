"""
load_backfill.py — Load BigQuery export into Firestore.

Usage:
    export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
    python3 load_backfill.py ./backfill/ --dry-run
    python3 load_backfill.py ./backfill/
"""

import json
import os
import sys
import glob
import argparse
from datetime import datetime, timedelta
from collections import defaultdict


def load_repo_eco_map(path="repo_eco_map.json"):
    with open(path) as f:
        return json.load(f)


def process_files(backfill_dir, repo_eco_map):
    """Read all NDJSON files and build developer + commit data."""
    developers = {}        # username → {github_id, first_seen, last_seen, total_commits}
    dev_eco_dates = defaultdict(lambda: defaultdict(set))  # username → {eco → {dates}}
    commits = []
    skipped = 0

    files = sorted(glob.glob(os.path.join(backfill_dir, "*.json")))
    if not files:
        print(f"No JSON files in {backfill_dir}")
        sys.exit(1)

    print(f"Processing {len(files)} files...")
    for fi, fp in enumerate(files):
        with open(fp) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError:
                    skipped += 1
                    continue

                username = row.get("github_username", "").strip()
                repo = row.get("repo_full_name", "").lower().strip()
                ts = row.get("committed_at", "")
                sha = row.get("commit_sha", "")

                if not username or not repo:
                    skipped += 1
                    continue

                ecosystems = repo_eco_map.get(repo, [])
                if not ecosystems:
                    skipped += 1
                    continue

                # Track developer
                if username not in developers:
                    developers[username] = {
                        "github_id": row.get("github_id"),
                        "first_seen": ts,
                        "last_seen": ts,
                        "total_commits": 0,
                    }
                dev = developers[username]
                dev["total_commits"] += 1
                if ts < dev["first_seen"]:
                    dev["first_seen"] = ts
                if ts > dev["last_seen"]:
                    dev["last_seen"] = ts

                # Track eco activity by date
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
                    "message": row.get("commit_message", "")[:500],
                    "source": "bigquery",
                })

        print(f"  File {fi+1}/{len(files)}: {len(commits)} commits total")

    print(f"\nParsed: {len(commits)} commits, {len(developers)} developers, {skipped} skipped")
    return developers, dev_eco_dates, commits


def classify(active_days):
    if active_days >= 10:
        return "full_time"
    elif active_days >= 2:
        return "part_time"
    elif active_days >= 1:
        return "one_time"
    return "unknown"


def compute_active_days_28d(dates):
    """Count active days in last 28 days relative to most recent date."""
    if not dates:
        return 0
    sorted_d = sorted(dates)
    latest = datetime.strptime(sorted_d[-1], "%Y-%m-%d")
    cutoff = latest - timedelta(days=28)
    return sum(1 for d in sorted_d if datetime.strptime(d, "%Y-%m-%d") >= cutoff)


def write_to_firestore(developers, dev_eco_dates, commits):
    """Write everything to Firestore."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("ERROR: pip install firebase-admin")
        sys.exit(1)

    if not firebase_admin._apps:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()

    db = firestore.client()

    # 1. Write developers + their activity sub-docs
    print(f"\nWriting {len(developers)} developers...")
    dev_list = list(developers.items())
    for i in range(0, len(dev_list), 400):
        batch = db.batch()
        for username, data in dev_list[i : i + 400]:
            eco_dates = dev_eco_dates.get(username, {})
            all_ecos = list(eco_dates.keys())

            # Compute max active days across ecosystems
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
        print(f"  Developers: {min(i + 400, len(dev_list))}/{len(dev_list)}")

    # 2. Write developer activity sub-collections
    print("\nWriting developer activity sub-docs...")
    count = 0
    batch = db.batch()
    for username, eco_dates in dev_eco_dates.items():
        for eco, dates in eco_dates.items():
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
            if count % 400 == 0:
                batch.commit()
                batch = db.batch()
                print(f"  Activity docs: {count}")
    batch.commit()
    print(f"  Activity docs: {count} (done)")

    # 3. Write commits (this is the big one)
    print(f"\nWriting {len(commits)} commits...")
    for i in range(0, len(commits), 400):
        batch = db.batch()
        for c in commits[i : i + 400]:
            doc_id = f"{c['sha'][:12]}_{c['repo_full_name'].replace('/', '__')}"
            ref = db.collection("commits").document(doc_id)
            batch.set(ref, {
                "sha": c["sha"],
                "developer": c["developer"],
                "repo_full_name": c["repo_full_name"],
                "ecosystems": c["ecosystems"],
                "committed_at": c["committed_at"],
                "message": c["message"],
                "source": c["source"],
            })
        batch.commit()
        if (i + 400) % 4000 == 0 or i + 400 >= len(commits):
            print(f"  Commits: {min(i + 400, len(commits))}/{len(commits)}")

    # 4. Update ecosystem MAD counts
    print("\nUpdating ecosystem aggregates...")
    eco_devs = defaultdict(lambda: {"total": 0, "ft": 0, "pt": 0, "ot": 0})
    for username, eco_dates in dev_eco_dates.items():
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
        batch.update(ref, {
            "mad_total": counts["total"],
            "mad_full_time": counts["ft"],
            "mad_part_time": counts["pt"],
            "mad_one_time": counts["ot"],
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    batch.commit()
    print(f"  Updated {count} ecosystems")

    print("\nBackfill complete!")


def dry_run_stats(developers, dev_eco_dates, commits):
    print(f"\n--- DRY RUN ---")
    print(f"Developers: {len(developers)}")
    print(f"Commits: {len(commits)}")

    eco_counts = defaultdict(int)
    for username, eco_dates in dev_eco_dates.items():
        for eco in eco_dates:
            eco_counts[eco] += 1
    top = sorted(eco_counts.items(), key=lambda x: -x[1])[:15]
    print(f"\nTop 15 ecosystems by developer count:")
    for eco, c in top:
        print(f"  {eco}: {c}")

    # Estimated Firestore writes
    activity_docs = sum(len(ecos) for ecos in dev_eco_dates.values())
    total_writes = len(developers) + activity_docs + len(commits) + len(eco_counts)
    print(f"\nEstimated Firestore writes: {total_writes:,}")
    print(f"  (free tier: 20K writes/day, Blaze plan: $0.18 per 100K writes)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("backfill_dir")
    parser.add_argument("--repo-map", default="repo_eco_map.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    repo_eco_map = load_repo_eco_map(args.repo_map)
    print(f"Loaded {len(repo_eco_map)} repo mappings")

    developers, dev_eco_dates, commits = process_files(args.backfill_dir, repo_eco_map)

    if args.dry_run:
        dry_run_stats(developers, dev_eco_dates, commits)
    else:
        write_to_firestore(developers, dev_eco_dates, commits)


if __name__ == "__main__":
    main()
