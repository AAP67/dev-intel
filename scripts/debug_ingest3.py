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

# Check why ethereum pushes don't match
r = requests.get("https://api.github.com/orgs/ethereum/events",
                  headers=HEADERS, params={"per_page": 30}, timeout=10)
for e in r.json():
    if e["type"] == "PushEvent":
        repo = e["repo"]["name"].lower()
        matched = repo in repo_eco_map
        print(f"  {repo} -> {'MATCH' if matched else 'NO MATCH'}")
        if not matched:
            # Check close matches
            close = [k for k in list(repo_eco_map.keys())[:100] if repo.split("/")[1] in k]
            if close:
                print(f"    Close: {close[:3]}")
