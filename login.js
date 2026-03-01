import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInwithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp({firebaseConfig});
const auth = getAuth(app);

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEvemtListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await singInWithEmailAndPassword(auth, email, password);
        window.location.href = "admin.html";
    } catch (error) {
        errorMsg.textContent = "Invalid login credentials.";
    }
});