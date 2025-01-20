// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBG48AeWOc9tTyaYQYRfQ2hEF9Nsns4WSs",
  authDomain: "tetris-assurance-7add5.firebaseapp.com",
  projectId: "tetris-assurance-7add5",
  storageBucket: "tetris-assurance-7add5.firebasestorage.app",
  messagingSenderId: "383054273082",
  appId: "1:383054273082:web:ae0761f570250c04d0b303",
  measurementId: "G-B7FHE9T86C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);