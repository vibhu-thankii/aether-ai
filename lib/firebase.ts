// Import the functions you need from the SDKs you need
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// This is the object you copied from the Firebase console in the previous step.
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCMLqeAcEWmwpRZDR80upCaz0iPWYZo-bM",
    authDomain: "aether-ai-web.firebaseapp.com",
    projectId: "aether-ai-web",
    storageBucket: "aether-ai-web.firebasestorage.app",
    messagingSenderId: "243924186672",
    appId: "1:243924186672:web:50bdd17c3fccfd0520dff5",
    measurementId: "G-THN80D8TN6"
  };
// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };