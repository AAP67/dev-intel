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

# Test known active orgs
test_orgs = ["solana-labs", "ethereum", "Uniswap", "aave", "MystenLabs", "aptos-labs"]

for org in test_orgs:
    r = requests.get(f"https://api.github.com/orgs/{org}/events",
                     headers=HEADERS, params={"per_page": 10}, timeout=10)
    if r.status_code != 200:
        print(f"{org}: HTTP {r.status_code}")
        continue
    events = r.json()
    pushes = [e for e in events if e["type"] == "PushEvent"]
    matched = 0
    for e in pushes:
        repo = e["repo"]["name"].lower()
        if repo in repo_eco_map:
            matched += 1
    print(f"{org}: {len(events)} events, {len(pushes)} pushes, {matched} matched taxonomy")
