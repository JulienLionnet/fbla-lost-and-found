// Import Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

//project config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "lost-and-found-fbla-2026.firebaseapp.com",
  projectId: "lost-and-found-fbla-2026",
  storageBucket: "lost-and-found-fbla-2026.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);