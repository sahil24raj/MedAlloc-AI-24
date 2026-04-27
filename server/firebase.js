const admin = require('firebase-admin');

let db;

function initFirebase() {
  if (db) return db;

  try {
    let serviceAccount;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
        serviceAccount = JSON.parse(rawJson.startsWith('{') ? rawJson : Buffer.from(rawJson, 'base64').toString());
      } catch (e) {
        console.error("FIREBASE_SERVICE_ACCOUNT JSON Parse failed:", e.message);
      }
    } else if (process.env.VERCEL) {
      console.warn("FIREBASE_SERVICE_ACCOUNT not found in environment. Firestore might fail.");
      // Fallback or attempt default initialization if running on GCP/Firebase environment
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      db = admin.firestore();
      return db;
    }

    if (!admin.apps.length) {
      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        // Local fallback or error
        console.log("No Firebase service account found. Using default credentials.");
        admin.initializeApp();
      }
    }
    
    db = admin.firestore();
    console.log("Firebase/Firestore Initialized");
    return db;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return null;
  }
}

module.exports = { initFirebase, db: initFirebase() };
