// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

// import serviceAccount from "./oryza-33d8f-firebase-adminsdk-fbsvc-ac83e1b808.json"


const adminApp = !getApps().length
    ? initializeApp({
        credential: cert("serviceAccount" as ServiceAccount)
    })
    : getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminFirestore = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
