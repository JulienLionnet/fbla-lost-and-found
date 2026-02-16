// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYLkGt8vFT2gfqNBKBZb26dlA0uxomZXw",
  authDomain: "lost-and-found-fbla-44b57.firebaseapp.com",
  projectId: "lost-and-found-fbla-44b57",
  storageBucket: "lost-and-found-fbla-44b57.firebasestorage.app",
  messagingSenderId: "401811273070",
  appId: "1:401811273070:web:34ba736b07c64bcf5d7d7f",
  measurementId: "G-XMW9BM4FTX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);