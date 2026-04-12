// Import Firebase core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

//project config
const firebaseConfig = {
 apiKey: "AIzaSyALCHmmgYUqD2OxfJAMj8IXJeHE2DxsKz0",
  authDomain: "lost-and-found-fbla-2026.firebaseapp.com",
  projectId: "lost-and-found-fbla-2026",
  storageBucket: "lost-and-found-fbla-2026.firebasestorage.app",
  messagingSenderId: "95198601383",
  appId: "1:95198601383:web:88c67f0e00574f133b7b82"
};
// measurementId: "G-XMW9BM4FTX"
  //measurement id is from old one, replace when you find the new one
export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);