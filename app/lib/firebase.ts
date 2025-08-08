import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0jHaD6MIrfKkpGE8ZWLg7xxcXoiuA7Ck",
  authDomain: "oryza-33d8f.firebaseapp.com",
  projectId: "oryza-33d8f",
  storageBucket: "oryza-33d8f.firebasestorage.app",
  messagingSenderId: "208924881683",
  appId: "1:208924881683:web:be7129369f276a72e7a0e6",
  measurementId: "G-MLSDPFXJEX"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, auth, firestore, storage };
