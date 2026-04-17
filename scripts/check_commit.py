import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

docs = list(db.collection("commits").limit(5).stream())
for doc in docs:
    d = doc.to_dict()
    print(f"\n--- {doc.id} ---")
    for k, v in d.items():
        print(f"  {k}: {v}")
