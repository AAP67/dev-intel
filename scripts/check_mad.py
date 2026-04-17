import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

for eco_name in ["Ethereum", "Solana", "Polygon", "Base", "Bitcoin"]:
    doc = db.collection("ecosystems").document(eco_name).get()
    if doc.exists:
        d = doc.to_dict()
        print(f"{eco_name}: MAD={d.get('mad_total',0):,} | FT={d.get('mad_full_time',0):,} | PT={d.get('mad_part_time',0):,}")
