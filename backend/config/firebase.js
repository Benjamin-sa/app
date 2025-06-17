const admin = require("firebase-admin");

// Initialize Firebase Admin
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  // Production: Use environment variable (Heroku)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} else {
  // Development: Use local file
  try {
    serviceAccount = require("../firebase-key.json");
  } catch (error) {
    console.error(
      "Firebase service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable or add firebase-key.json file."
    );
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`, // Add storage bucket
});

// Get Firestore instance
const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { firestore, auth, storage };
