"""
seed_taxonomy.py — Parse Electric Capital taxonomy and seed Firestore.


Usage:
    export GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
    python3 seed_taxonomy.py --top-n 50
"""


import json
import csv
import os
import sys
import argparse
from pathlib import Path


EC_REPO_PATH = os.environ.get("EC_REPO_PATH", "./crypto-ecosystems")
sys.path.insert(0, EC_REPO_PATH)


from src.open_dev_data.taxonomy import Taxonomy




def load_taxonomy():
    print("Loading Electric Capital taxonomy...")
    t = Taxonomy()
    t.load(os.path.join(EC_REPO_PATH, "migrations"))
    s = t.stats()
    print(f"  Ecosystems: {s.eco_count}  |  Repos: {s.repo_count}")
    return t




def extract_data(t, top_n=None):
    """Extract ecosystems and repos from taxonomy."""
    ecosystems = []
    for eco_name, eco_id in t.eco_ids.items():
        repos = t.eco_to_repos.get(eco_id, set())
        parents = [t.eco_id_to_name[p] for p in t.child_to_parents.get(eco_id, set())]
        children = [t.eco_id_to_name[c] for c in t.parent_to_children.get(eco_id, set())]
        ecosystems.append({
            "name": eco_name,
            "repo_count": len(repos),
            "parent_names": parents,
            "child_names": children,
        })
    ecosystems.sort(key=lambda x: -x["repo_count"])


    if top_n:
        top_names = set(e["name"] for e in ecosystems[:top_n])
        ecosystems = ecosystems[:top_n]
    else:
        top_names = None


    # Extract repos with ecosystem mapping
    repos = {}
    for eco_name, eco_id in t.eco_ids.items():
        if top_names and eco_name not in top_names:
            continue
        for repo_id in t.eco_to_repos.get(eco_id, set()):
            url = t.repo_id_to_url[repo_id]
            full_name = url.replace("https://github.com/", "").strip("/")
            parts = full_name.split("/")
            if len(parts) < 2:
                continue
            key = full_name.lower()
            if key not in repos:
                repos[key] = {
                    "full_name": full_name,
                    "github_owner": parts[0],
                    "github_name": parts[1],
                    "github_url": url,
                    "ecosystems": [],
                }
            repos[key]["ecosystems"].append(eco_name)


    # Dedupe ecosystem lists
    for r in repos.values():
        r["ecosystems"] = sorted(set(r["ecosystems"]))


    return ecosystems, list(repos.values())




def export_csv_and_map(repos, output_dir="."):
    """Export repo_list.csv (for BigQuery) and repo_eco_map.json."""
    csv_path = os.path.join(output_dir, "repo_list.csv")
    with open(csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["full_name"])
        for r in repos:
            w.writerow([r["full_name"].lower()])
    print(f"  Exported {len(repos)} repos → repo_list.csv")


    map_path = os.path.join(output_dir, "repo_eco_map.json")
    mapping = {r["full_name"].lower(): r["ecosystems"] for r in repos}
    with open(map_path, "w") as f:
        json.dump(mapping, f)
    print(f"  Exported repo-ecosystem map → repo_eco_map.json")




def seed_firestore(ecosystems, repos):
    """Write ecosystems and repos to Firestore."""
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
    except ImportError:
        print("ERROR: pip install firebase-admin")
        sys.exit(1)


    # Initialize Firebase
    if not firebase_admin._apps:
        cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_path:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()  # uses default credentials


    db = firestore.client()


    # 1. Seed ecosystems (batch writes, max 500 per batch)
    print(f"\nSeeding {len(ecosystems)} ecosystems...")
    for i in range(0, len(ecosystems), 100):
        batch = db.batch()
        for eco in ecosystems[i : i + 100]:
            ref = db.collection("ecosystems").document(eco["name"])
            batch.set(ref, {
                "name": eco["name"],
                "repo_count": eco["repo_count"],
                "parent_names": eco["parent_names"],
                "child_names": eco["child_names"],
                "mad_total": 0,
                "mad_full_time": 0,
                "mad_part_time": 0,
                "mad_one_time": 0,
                "updated_at": firestore.SERVER_TIMESTAMP,
            }, merge=True)
        batch.commit()
        import time; time.sleep(3)


        print(f"  Ecosystems: {min(i + 100, len(ecosystems))}/{len(ecosystems)}")


    # 2. Seed repos (batch writes)
    print(f"\nSeeding {len(repos)} repos...")
    for i in range(0, len(repos), 100):
        batch = db.batch()
        for repo in repos[i : i + 100]:
            # Use sanitized full_name as doc ID (replace / with __)
            doc_id = repo["full_name"].lower().replace("/", "__")
            ref = db.collection("repos").document(doc_id)
            batch.set(ref, {
                "full_name": repo["full_name"],
                "github_owner": repo["github_owner"],
                "github_name": repo["github_name"],
                "github_url": repo["github_url"],
                "ecosystems": repo["ecosystems"],
                "updated_at": firestore.SERVER_TIMESTAMP,
            }, merge=True)
        batch.commit()
        import time; time.sleep(3)
        print(f"  Repos: {min(i + 100, len(repos))}/{len(repos)}")


    print(f"\nDone! Seeded {len(ecosystems)} ecosystems + {len(repos)} repos to Firestore.")




def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--top-n", type=int, default=None)
    args = parser.parse_args()


    t = load_taxonomy()
    ecosystems, repos = extract_data(t, args.top_n)
    print(f"\nProcessing {len(ecosystems)} ecosystems, {len(repos)} repos")


    export_csv_and_map(repos)


    if args.dry_run:
        print("\n--dry-run: Files exported, Firestore skipped.")
        with open("ecosystems.json", "w") as f:
            json.dump(ecosystems[:50], f, indent=2)
    else:
        seed_firestore(ecosystems, repos)




if __name__ == "__main__":
    main()



