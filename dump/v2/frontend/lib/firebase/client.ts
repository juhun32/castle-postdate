// filepath: frontend/lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getFirestore,
    connectFirestoreEmulator,
    Firestore,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db: Firestore = getFirestore(app);

// The getApps().length check helps, but for emulators, care is needed with HMR.
if (process.env.NODE_ENV === "development") {
    // Check if already connected to avoid errors, especially with HMR
    // Firestore emulator
    // @ts-ignore // Firestore internal property to check emulator connection
    if (!db._settings.host) {
        try {
            connectFirestoreEmulator(db, "localhost", 8080);
            console.log("Firestore Emulator connected");
        } catch (e) {
            console.warn(
                "Error connecting to Firestore Emulator (might be already connected or not running):",
                e
            );
        }
    }
}

export { app, db };
