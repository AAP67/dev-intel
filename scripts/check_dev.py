import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

docs = list(db.collection("developers").limit(3).stream())
for doc in docs:
    d = doc.to_dict()
    print(f"\n--- {doc.id} ---")
    for k, v in d.items():
        print(f"  {k}: {v}")
    
    # Check if activity sub-collection exists
    acts = list(db.collection("developers").document(doc.id).collection("activity").limit(3).stream())
    print(f"  activity sub-docs: {len(acts)}")
    for a in acts:
        print(f"    {a.id}: {a.to_dict()}")
