// Import Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

//project config
const firebaseConfig = {
  apiKey: "AIzaSyATiSWBRVl-YQdeeWigUYeRkYmlyyB39gw",
  authDomain: "lost-and-found-fbla-44b57.firebaseapp.com",
  projectId: "lost-and-found-fbla-44b57",
  storageBucket: "lost-and-found-fbla-44b57.firebasestorage.app",
  messagingSenderId: "401811273070",
  appId: "1:401811273070:web:34ba736b07c64bcf5d7d7f",
  measurementId: "G-XMW9BM4FTX"
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);