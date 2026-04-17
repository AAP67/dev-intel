import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

# Check a few developer activity docs
docs = list(db.collection("developers").limit(5).stream())
for dev_doc in docs:
    username = dev_doc.id
    acts = list(db.collection("developers").document(username).collection("activity").stream())
    for a in acts[:2]:
        d = a.to_dict()
        print(f"  {username} | {d.get('ecosystem')} | last_active={d.get('last_active')} | days_28d={d.get('active_days_28d')}")
