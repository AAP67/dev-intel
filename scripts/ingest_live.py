"""
ingest_live.py — Poll GitHub Events API, write to Firestore.

Usage:
    export GITHUB_TOKEN=ghp_...
    export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
    python3 ingest_live.py
"""

import os
import sys
import json
import time
import requests
from datetime import datetime, timezone, timedelta
from collections import defaultdict

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
GITHUB_HEADERS = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GITHUB_TOKEN}" if GITHUB_TOKEN else "",
}

BOT_PATTERNS = [
    "[bot]", "-bot", "dependabot", "renovate", "github-actions",
    "codecov", "mergify", "greenkeeper", "snyk-bot",
]


def is_bot(username):
    lower = username.lower()
    return any(p in lower for p in BOT_PATTERNS)


def fetch_org_events(org, max_pages=2):
    events = []
    for page in range(1, max_pages + 1):
        try:
            r = requests.get(
                f"https://api.github.com/orgs/{org}/events",
                headers=GITHUB_HEADERS,
                params={"per_page": 30, "page": page},
                timeout=10,
            )
            if r.status_code != 200:
                return events
            data = r.json()
            if not data:
                break
            events.extend(data)
        except requests.RequestException:
            break
    return events


def extract_commits(events, repo_eco_map):
    commits = []
    developers = {}

    for event in events:
        if event.get("type") != "PushEvent":
            continue
        actor = event.get("actor", {})
        username = actor.get("login", "")
        if not username or is_bot(username):
            continue

        repo_name = event.get("repo", {}).get("name", "").lower()
        ecosystems = repo_eco_map.get(repo_name, [])
        if not ecosystems:
            continue

        for commit in event.get("payload", {}).get("commits", []):
            if not commit.get("distinct", False):
                continue
            commits.append({
                "sha": commit["sha"],
                "developer": username,
                "repo_full_name": repo_name,
                "ecosystems": ecosystems,
                "committed_at": event.get("created_at"),
                "message": (commit.get("message") or "")[:500],
                "source": "github_events",
            })

        if username not in developers:
            developers[username] = {
                "github_id": actor.get("id"),
                "avatar_url": actor.get("avatar_url"),
            }

    return commits, developers


def get_top_orgs(repo_eco_map, n=200):
    org_counts = defaultdict(int)
    for repo in repo_eco_map:
        parts = repo.split("/")
        if len(parts) >= 2:
            org_counts[parts[0]] += 1
    return [org for org, _ in sorted(org_counts.items(), key=lambda x: -x[1])[:n]]


def write_to_firestore(commits, developers, repo_eco_map):
    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path:
            firebase_admin.initialize_app(credentials.Certificate(cred_path))
        else:
            firebase_admin.initialize_app()

    db = firestore.client()
    now = datetime.now(timezone.utc).isoformat()

    # Batch write commits
    batch = db.batch()
    count = 0
    for c in commits:
        doc_id = f"{c['sha'][:12]}_{c['repo_full_name'].replace('/', '__')}"
        ref = db.collection("commits").document(doc_id)
        batch.set(ref, c)
        count += 1
        if count % 400 == 0:
            batch.commit()
            batch = db.batch()
    batch.commit()

    # Update developer docs
    dev_eco_dates = defaultdict(lambda: defaultdict(set))
    for c in commits:
        date_str = c["committed_at"][:10] if c["committed_at"] else None
        if date_str:
            for eco in c["ecosystems"]:
                dev_eco_dates[c["developer"]][eco].add(date_str)

    batch = db.batch()
    bcount = 0
    for username, info in developers.items():
        eco_dates = dev_eco_dates.get(username, {})
        all_ecos = list(eco_dates.keys())
        max_active = max(
            (len(dates) for dates in eco_dates.values()), default=0
        )

        ref = db.collection("developers").document(username)
        batch.set(ref, {
            "github_username": username,
            "github_id": info.get("github_id"),
            "avatar_url": info.get("avatar_url"),
            "ecosystems": all_ecos,
            "last_seen": now,
            "updated_at": firestore.SERVER_TIMESTAMP,
        }, merge=True)
        bcount += 1
        if bcount % 400 == 0:
            batch.commit()
            batch = db.batch()
    batch.commit()

    return count


def main():
    if not GITHUB_TOKEN:
        print("WARNING: No GITHUB_TOKEN. Rate limit = 60 req/hr.")

    map_path = os.environ.get("REPO_ECO_MAP", "repo_eco_map.json")
    with open(map_path) as f:
        repo_eco_map = json.load(f)
    print(f"Loaded {len(repo_eco_map)} repo mappings")

    orgs = get_top_orgs(repo_eco_map, n=200)
    print(f"Polling {len(orgs)} orgs...")

    all_commits = []
    all_devs = {}

    for i, org in enumerate(orgs):
        events = fetch_org_events(org)
        if events:
            commits, devs = extract_commits(events, repo_eco_map)
            all_commits.extend(commits)
            all_devs.update(devs)
        if (i + 1) % 50 == 0:
            print(f"  {i+1}/{len(orgs)} orgs — {len(all_commits)} commits")
        time.sleep(0.1)

    print(f"\nCollected {len(all_commits)} commits, {len(all_devs)} developers")

    if all_commits:
        n = write_to_firestore(all_commits, all_devs, repo_eco_map)
        print(f"Wrote {n} commits to Firestore")
    else:
        print("No new commits")


if __name__ == "__main__":
    main()
