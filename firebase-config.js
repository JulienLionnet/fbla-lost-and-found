import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { getFirestore } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYLkGt8vFT2gfqNBKBZb26dlA0uxomZXw",
  authDomain: "lost-and-found-fbla-44b57.firebaseapp.com",
  projectId: "lost-and-found-fbla-44b57",
  storageBucket: "lost-and-found-fbla-44b57.firebasestorage.app",
  messagingSenderId: "401811273070",
  appId: "1:401811273070:web:34ba736b07c64bcf5d7d7f",
  measurementId: "G-XMW9BM4FTX"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
