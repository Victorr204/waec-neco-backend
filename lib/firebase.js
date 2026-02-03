import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Service account credentials from Firebase Console
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

let app;
let db;
let auth;

try {
  if (!getApps().length) {
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
  } else {
    app = getApp();
  }

  db = getFirestore(app);
  auth = getAuth(app);
  
  // Firestore settings for better performance
  db.settings({ ignoreUndefinedProperties: true });
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { db, auth };