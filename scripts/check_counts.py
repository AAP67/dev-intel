import os
import firebase_admin
from firebase_admin import credentials, firestore

firebase_admin.initialize_app(credentials.Certificate(
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
))
db = firestore.client()

for col in ["ecosystems", "repos", "developers", "commits"]:
    count = db.collection(col).count().get()[0][0].value
    print(f"{col}: {count:,}")
