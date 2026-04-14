# Firestore Data Model — Dev Intel
# ================================
# No SQL schema needed. This doc defines the collections and document shapes.
# Paste this into your project as a reference.

# ──────────────────────────────────────────────
# Collection: ecosystems
# Doc ID: ecosystem name (e.g., "Ethereum")
# ──────────────────────────────────────────────
# {
#   "name": "Ethereum",
#   "repo_count": 139856,
#   "parent_names": ["EVM Compatible Layer 1s"],
#   "child_names": ["Base", "Arbitrum", "Optimism", ...],
#   "mad_total": 6244,          ← updated by aggregation function
#   "mad_full_time": 1820,
#   "mad_part_time": 2100,
#   "mad_one_time": 2324,
#   "updated_at": Timestamp
# }

# ──────────────────────────────────────────────
# Collection: repos
# Doc ID: auto-generated
# ──────────────────────────────────────────────
# {
#   "full_name": "solana-labs/solana",       ← indexed
#   "github_owner": "solana-labs",
#   "github_name": "solana",
#   "github_url": "https://github.com/solana-labs/solana",
#   "ecosystems": ["Solana", "SVM Layer 1s"],  ← denormalized array
#   "primary_language": "Rust",
#   "stars": 12500,
#   "updated_at": Timestamp
# }

# ──────────────────────────────────────────────
# Collection: developers
# Doc ID: github_username (e.g., "aeyakovenko")
# ──────────────────────────────────────────────
# {
#   "github_username": "aeyakovenko",
#   "github_id": 12345678,
#   "avatar_url": "https://avatars.githubusercontent.com/...",
#   "top_languages": ["Rust", "TypeScript", "C"],
#   "ecosystems": ["Solana"],                ← denormalized: which ecosystems they're active in
#   "classification": "full_time",           ← "full_time" | "part_time" | "one_time"
#   "total_commits": 2847,
#   "first_seen": Timestamp,
#   "last_seen": Timestamp,
#   "active_days_28d": 18,                   ← max across ecosystems
#   "updated_at": Timestamp
# }

# ──────────────────────────────────────────────
# Sub-collection: developers/{username}/activity
# Doc ID: ecosystem name
# ──────────────────────────────────────────────
# {
#   "ecosystem": "Solana",
#   "first_active": Timestamp,
#   "last_active": Timestamp,
#   "commit_count": 1247,
#   "active_days_28d": 18,
#   "recent_repos": ["solana-labs/solana", "solana-labs/solana-web3.js"]
# }

# ──────────────────────────────────────────────
# Collection: commits
# Doc ID: auto-generated (or sha_repoId composite)
# ──────────────────────────────────────────────
# {
#   "sha": "abc123...",
#   "developer": "aeyakovenko",             ← github username (not a ref)
#   "repo_full_name": "solana-labs/solana",
#   "ecosystems": ["Solana"],                ← denormalized from repo
#   "committed_at": Timestamp,
#   "message": "fix: validator restart logic",
#   "source": "bigquery",                   ← "bigquery" | "github_events"
# }

# ──────────────────────────────────────────────
# Collection: ecosystem_snapshots
# Doc ID: auto (or {ecosystem}_{date})
# ──────────────────────────────────────────────
# {
#   "ecosystem": "Solana",
#   "date": "2025-01-15",
#   "mad_total": 7625,
#   "mad_full_time": 2100,
#   "mad_part_time": 2800,
#   "mad_one_time": 2725,
#   "total_commits": 45000,
#   "new_developers": 312
# }

# ──────────────────────────────────────────────
# INDEXES NEEDED (create in Firebase Console or firestore.indexes.json)
# ──────────────────────────────────────────────
# 1. commits: (developer, committed_at DESC)    — for dev activity queries
# 2. commits: (ecosystems, committed_at DESC)    — for ecosystem feed
# 3. developers: (classification, last_seen DESC) — for leaderboard
# 4. developers: (ecosystems, active_days_28d DESC) — for ecosystem drill-down
# 5. ecosystem_snapshots: (ecosystem, date DESC) — for trend charts

# ──────────────────────────────────────────────
# WHY THIS SHAPE
# ──────────────────────────────────────────────
# - Ecosystems are denormalized INTO repos, commits, and developers
#   because Firestore has no JOINs. One extra array field saves
#   thousands of reads vs looking up a junction collection.
#
# - Developer classification lives on the developer doc (not computed
#   at query time) because Firestore can't do COUNT(DISTINCT dates).
#   A Cloud Function recomputes it after each ingestion run.
#
# - The ecosystem_snapshots collection replaces the SQL materialized
#   view. A Cloud Function writes one doc per ecosystem per day.
