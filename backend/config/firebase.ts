import admin from "firebase-admin";

// Type for partial service account when coming from env variable
interface ServiceAccountLike {
  project_id: string;
  client_email?: string;
  private_key?: string;
  [key: string]: any;
}

let serviceAccount: ServiceAccountLike;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    serviceAccount = require("../firebase-key.json");
  } catch (error) {
    console.error(
      "Firebase service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or add firebase-key.json file."
    );
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
  });
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
export default admin;
