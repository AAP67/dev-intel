import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

total = 0
has_ecosystems = 0
has_activity = 0
empty = 0

last_doc = None
while True:
    query = db.collection("developers").order_by("__name__").limit(500)
    if last_doc:
        query = query.start_after(last_doc)
    docs = list(query.stream())
    if not docs:
        break
    for doc in docs:
        total += 1
        d = doc.to_dict()
        ecos = d.get("ecosystems") or []
        if len(ecos) > 0:
            has_ecosystems += 1
        else:
            empty += 1
    last_doc = docs[-1]
    if total % 10000 == 0:
        print(f"  Scanned {total:,}...")

print(f"\nTotal developers: {total:,}")
print(f"With ecosystems: {has_ecosystems:,}")
print(f"Empty (old broken data): {empty:,}")
print(f"Coverage: {has_ecosystems/total*100:.1f}%")
