import { app } from "./firebase-config.js";

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// Allowed emails for regular users
function isAllowedEmail(email) {
  return email.endsWith("@gmail.com")
      || email.endsWith("@henhudschools.org")
      || email.endsWith("@students.henhudschools.org");
}

// Admin emails — redirected to admin panel
const ADMIN_EMAILS = [
  "julienmlionnet@gmail.com",
  "jucrockettlionnet@students.henhudschools.org",
  "etramos@students.henhudschools.org",
  "eramos101910@yahoo.com"
];

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userInfo = document.getElementById("userInfo");
  const statusMsg = document.getElementById("statusMsg");

  // --- AUTH STATE ---
  onAuthStateChanged(auth, (user) => {
    if (user) {
      userInfo.textContent = `Signed in as ${user.displayName} (${user.email})`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "block";
    } else {
      userInfo.textContent = "";
      loginBtn.style.display = "block";
      logoutBtn.style.display = "none";
    }
  });

  // --- LOGIN ---
  loginBtn.addEventListener("click", async () => {
    statusMsg.textContent = "";
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!isAllowedEmail(email) && !isAdmin(email)) {
        // Not an allowed account — sign them out
        await signOut(auth);
        statusMsg.textContent = "Only @gmail.com or @henhudschools.org accounts are allowed.";
        return;
      }

      // Redirect admins to admin panel, everyone else to submit page
      if (isAdmin(email)) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "submit.html";
      }

    } catch (error) {
      console.error("Login failed:", error);
      statusMsg.textContent = "Login failed. Please try again.";
    }
  });

  // --- LOGOUT ---
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });

});
