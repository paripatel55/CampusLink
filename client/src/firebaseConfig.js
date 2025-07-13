import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCyss-GlZGmDE-7EKxjvsioVoKSI2eah2I",
  authDomain: "campuslink-465401.firebaseapp.com",
  projectId: "campuslink-465401",
  storageBucket: "campuslink-465401.firebasestorage.app",
  messagingSenderId: "275180162229",
  appId: "1:275180162229:web:9fb8f46b509b83fe66c2fc",
  measurementId: "G-KVWMY2KBXE"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
