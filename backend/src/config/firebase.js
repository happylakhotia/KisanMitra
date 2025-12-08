import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let firebaseApp;

try {
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  
  console.log('Firebase Admin initialized successfully');
  console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  console.error('Please check your .env file has correct Firebase credentials');
}

export const auth = admin.auth();
export const db = admin.firestore();
export default firebaseApp;

