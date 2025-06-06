const admin = require("firebase-admin");

// Initialize Firebase Admin
const serviceAccount = require("../firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`, // Add storage bucket
});

// Get Firestore instance
const firestore = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { firestore, auth, storage };
