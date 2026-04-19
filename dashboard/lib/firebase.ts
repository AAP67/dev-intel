import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdm4MtTFtpgOC2LN-pZjy3gplynOJcG2U",
  authDomain: "ecoscout-41c0e.firebaseapp.com",
  projectId: "ecoscout-41c0e",
  storageBucket: "ecoscout-41c0e.firebasestorage.app",
  messagingSenderId: "286285363161",
  appId: "1:286285363161:web:f67b47be1290e8491d0bc8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);