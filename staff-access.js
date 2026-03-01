const password = prompt("Enter dashboard access password:");

if (password !== "FBLA2026") {
  alert("Access denied.");
  window.location.href = "index.html";
}
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    }
});

import { db } from "./firebase-config.js";
import { 
    collection, 
    updateDoc, 
    getDocs,
    deleteDoc, 
    doc}
     from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const adminList = document.getElementById("adminList");

async function loadAdminItems() {
  adminList.innerHTML = ""; 

  const querySnapshot = await getDocs(collection(db, "items"));
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${data.name}</strong> -
             ${data.category} <br>
             Status: ${data.status} <br>
             ${data.description} <br>
             <hr>
    
        `;
// Approval button for admin
        const approveBtn = document.createElement("button");
        approveBtn.textContent = "Approve";
        approveBtn.addEventListener("click", async () => {
            await updateDoc(doc(db, "items", docSnap.id), {
                 status: "approved" });
            loadAdminItems();
        });

//Delete button for admin
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";

        deleteBtn.addEventListener("click", async () => {
            await deleteDoc(doc(db, "items", docSnap.id));
            loadAdminItems();
        });

        li.appendChild(approveBtn);
        li.appendChild(deleteBtn);

        adminList.appendChild(li);
    });
}

  loadAdminItems();