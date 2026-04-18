import os
import json
import requests

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN")
HEADERS = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GITHUB_TOKEN}",
}

with open("scripts/repo_eco_map.json") as f:
    repo_eco_map = json.load(f)

# Show top 10 orgs being polled
from collections import defaultdict
org_counts = defaultdict(int)
for repo in repo_eco_map:
    parts = repo.split("/")
    if len(parts) >= 2:
        org_counts[parts[0]] += 1

top_orgs = sorted(org_counts.items(), key=lambda x: -x[1])[:10]
print("Top 10 orgs by repo count:")
for org, count in top_orgs:
    print(f"  {org}: {count} repos")

# Test first 5 orgs
print("\nTesting API calls:")
for org, _ in top_orgs[:5]:
    r = requests.get(f"https://api.github.com/orgs/{org}/events",
                     headers=HEADERS, params={"per_page": 5}, timeout=10)
    print(f"  {org}: HTTP {r.status_code}, {len(r.json()) if r.status_code == 200 else 0} events")
    if r.status_code == 200:
        for e in r.json()[:2]:
            print(f"    {e['type']} - {e['repo']['name']}")
