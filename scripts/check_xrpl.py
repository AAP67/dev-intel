import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

# Check various names XRPL might be under
names = ["XRP", "XRPL", "XRP Ledger", "Ripple", "xrp", "xrpl"]
for name in names:
    doc = db.collection("ecosystems").document(name).get()
    if doc.exists:
        d = doc.to_dict()
        print(f"Found: {name}")
        print(f"  MAD={d.get('mad_total',0)} FT={d.get('mad_full_time',0)} PT={d.get('mad_part_time',0)} OT={d.get('mad_one_time',0)}")
        print(f"  repos={d.get('repo_count',0)}")

# Also search for anything with xrp/ripple
print("\nSearching all ecosystems with 'xrp' or 'ripple'...")
ecos = db.collection("ecosystems").stream()
for doc in ecos:
    name = doc.id.lower()
    if "xrp" in name or "ripple" in name or "xrpl" in name:
        d = doc.to_dict()
        print(f"  {doc.id}: MAD={d.get('mad_total',0)} repos={d.get('repo_count',0)}")
