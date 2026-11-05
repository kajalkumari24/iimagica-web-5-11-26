import admin from "firebase-admin";
import fs from "fs";
import path from "path";

let firebaseApp = null;

export const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (parseError) {
        console.error("Firebase Error: Invalid JSON in FIREBASE_SERVICE_ACCOUNT env variable. Make sure it's a single line valid JSON.");
        return null;
      }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const filePath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

      if (!fs.existsSync(filePath)) {
        console.error(`Firebase Error: Service account file not found at path: ${filePath}`);
        return null;
      }

      const data = fs.readFileSync(filePath, "utf8");
      serviceAccount = JSON.parse(data);
    }

    if (!serviceAccount) {
      console.info("Firebase service account not configured. Set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH to enable FCM.");
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("Firebase initialization error:", error.message);
    return null;
  }
};

export const getMessaging = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp ? admin.messaging() : null;
};

export default admin;
