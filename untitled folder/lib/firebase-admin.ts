import admin from 'firebase-admin';

// Check if the app has already been initialized
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error: any) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

// Export the initialized admin instance's firestore database
export const db = admin.firestore();
