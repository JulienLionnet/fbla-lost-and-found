import { db, app } from "./firebase-config.js";

import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// Hardcoded admin emails
const ADMIN_EMAILS = [
  "julienmlionnet@gmail.com",
  "jucrockettlionnet@students.henhudschools.org",
  "etramos@students.henhudschools.org",
  "eramos101910@yahoo.com"
];

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

let allItems = [];
let currentTab = "pending";

document.addEventListener("DOMContentLoaded", () => {

  const adminLogin = document.getElementById("adminLogin");
  const adminPanel = document.getElementById("adminPanel");
  const adminLoginBtn = document.getElementById("adminLoginBtn");
  const adminLogoutBtn = document.getElementById("adminLogoutBtn");
  const adminUserInfo = document.getElementById("adminUserInfo");
  const adminError = document.getElementById("adminError");
  const adminItemList = document.getElementById("adminItemList");
  const editModal = document.getElementById("editModal");
  const cancelEdit = document.getElementById("cancelEdit");
  const saveEdit = document.getElementById("saveEdit");

  // --- AUTH STATE ---
  onAuthStateChanged(auth, (user) => {
    if (user && isAdmin(user.email)) {
      adminLogin.style.display = "none";
      adminPanel.style.display = "block";
      adminUserInfo.textContent = `Signed in as ${user.displayName} (${user.email})`;
      loadItems();
    } else if (user && !isAdmin(user.email)) {
      signOut(auth);
      adminError.textContent = "Access denied. This page is for admins only.";
    } else {
      adminLogin.style.display = "block";
      adminPanel.style.display = "none";
    }
  });

  // --- LOGIN ---
  adminLoginBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      adminError.textContent = "Login failed. Please try again.";
    }
  });

  // --- LOGOUT ---
  adminLogoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });

  // --- TABS ---
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      renderItems();
    });
  });

  // --- LOAD ALL ITEMS ---
  async function loadItems() {
    adminItemList.innerHTML = `<p class="empty-msg">Loading...</p>`;
    allItems = [];

    const q = query(collection(db, "items"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => {
      allItems.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderItems();
  }

  // --- RENDER ITEMS BASED ON TAB ---
  function renderItems() {
    adminItemList.innerHTML = "";

    let filtered = allItems;
    if (currentTab !== "all") {
      filtered = allItems.filter(item => (item.status || "pending") === currentTab);
    }

    if (filtered.length === 0) {
      adminItemList.innerHTML = `<p class="empty-msg">No items found.</p>`;
      return;
    }

    filtered.forEach(item => {
      const status = item.status || "pending";
      const category = item.category?.toLowerCase() || "lost";
      const card = document.createElement("div");
      card.className = "admin-card";

      card.innerHTML = `
        <span class="status-badge status-${status}">${status.toUpperCase()}</span>
        <h3>${item.name}</h3>
        <p><strong>Category:</strong> <span class="cat-badge ${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</span></p>
        <p><strong>Location:</strong> ${item.location}</p>
        <p><strong>Date & Time:</strong> ${item.dateTime}</p>
        <p><strong>Description:</strong> ${item.description}</p>
        <p><strong>Submitted by:</strong> ${item.submittedBy || "unknown"}</p>
        ${item.imageUrl ? `<br><img src="${item.imageUrl}" alt="Item image">` : ""}
        <div class="card-actions">
          ${status !== "approved" ? `<button class="approve-btn" data-id="${item.id}">✔ Approve</button>` : ""}
          ${status !== "rejected" ? `<button class="reject-btn" data-id="${item.id}">✘ Reject</button>` : ""}
          ${category !== "returned" ? `<button class="return-btn" data-id="${item.id}">↩ Mark as Returned</button>` : ""}
          <button class="edit-btn" data-id="${item.id}">✎ Edit</button>
          <button class="delete-btn" data-id="${item.id}">🗑 Delete</button>
        </div>
      `;

      // Approve
      const approveBtn = card.querySelector(".approve-btn");
      if (approveBtn) {
        approveBtn.addEventListener("click", async () => {
          await updateDoc(doc(db, "items", item.id), { status: "approved" });
          item.status = "approved";
          renderItems();
        });
      }

      // Reject
      const rejectBtn = card.querySelector(".reject-btn");
      if (rejectBtn) {
        rejectBtn.addEventListener("click", async () => {
          await updateDoc(doc(db, "items", item.id), { status: "rejected" });
          item.status = "rejected";
          renderItems();
        });
      }

      // Mark as Returned — updates category to "returned" and keeps status approved
      const returnBtn = card.querySelector(".return-btn");
      if (returnBtn) {
        returnBtn.addEventListener("click", async () => {
          await updateDoc(doc(db, "items", item.id), {
            category: "returned",
            status: "approved"  // make sure it stays visible in catalog
          });
          item.category = "returned";
          item.status = "approved";
          renderItems();
        });
      }

      // Edit
      card.querySelector(".edit-btn").addEventListener("click", () => {
        document.getElementById("editItemId").value = item.id;
        document.getElementById("editName").value = item.name || "";
        document.getElementById("editCategory").value = item.category || "lost";
        document.getElementById("editLocation").value = item.location || "";
        document.getElementById("editDateTime").value = item.dateTime || "";
        document.getElementById("editDescription").value = item.description || "";
        editModal.classList.add("active");
      });

      // Delete
      card.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
          await deleteDoc(doc(db, "items", item.id));
          allItems = allItems.filter(i => i.id !== item.id);
          renderItems();
        }
      });

      adminItemList.appendChild(card);
    });
  }

  // --- EDIT MODAL: CANCEL ---
  cancelEdit.addEventListener("click", () => {
    editModal.classList.remove("active");
  });

  // --- EDIT MODAL: SAVE ---
  saveEdit.addEventListener("click", async () => {
    const id = document.getElementById("editItemId").value;
    const updated = {
      name: document.getElementById("editName").value,
      category: document.getElementById("editCategory").value,
      location: document.getElementById("editLocation").value,
      dateTime: document.getElementById("editDateTime").value,
      description: document.getElementById("editDescription").value,
    };

    await updateDoc(doc(db, "items", id), updated);

    const index = allItems.findIndex(i => i.id === id);
    if (index !== -1) allItems[index] = { ...allItems[index], ...updated };

    editModal.classList.remove("active");
    renderItems();
  });

  // Close modal if clicking outside
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) editModal.classList.remove("active");
  });

});
