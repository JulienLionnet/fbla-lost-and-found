import { db, app } from "./firebase-config.js"; 

import { collection, addDoc, getDocs, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; 

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
const storage = getStorage(app, "gs://lost-and-found-fbla-44b57.firebasestorage.app");

import { query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// Admin emails
const ADMIN_EMAILS = [
  "julienmlionnet@gmail.com",
  "jucrockettlionnet@students.henhudschools.org",
  "etramos@students.henhudschools.org",
  "eramos101910@yahoo.com"
];

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

function isAllowedEmail(email) {
  return email.endsWith("@gmail.com")
      || email.endsWith("@henhudschools.org")
      || email.endsWith("@students.henhudschools.org");
}

// --- NAVBAR ADMIN LINK ---
function updateNavbar(user) {
  const navLinks = document.querySelector(".nav-links");
  if (!navLinks) return;

  const existing = document.getElementById("adminNavLink");
  if (existing) existing.remove();

  if (user && isAdmin(user.email)) {
    const adminLink = document.createElement("a");
    adminLink.href = "admin.html";
    adminLink.id = "adminNavLink";
    adminLink.textContent = "Admin Panel";
    adminLink.style.color = "#e65100";
    adminLink.style.fontWeight = "bold";
    navLinks.appendChild(adminLink);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("itemForm");
  const itemList = document.getElementById("itemList");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userInfo = document.getElementById("userInfo");
  const submitSection = document.getElementById("submitSection");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const resultsCount = document.getElementById("resultsCount");

  let allItems = [];
  let currentUser = null;
  let currentCategory = "all";
  let currentSearch = "";

  // --- AUTH STATE LISTENER ---
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    updateNavbar(user);

    if (user) {
      if (userInfo) userInfo.textContent = `Signed in as ${user.displayName} (${user.email})`;
      if (loginBtn) loginBtn.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "inline-block";
      if (submitSection) submitSection.style.display = "block";
    } else {
      if (userInfo) userInfo.textContent = "";
      if (loginBtn) loginBtn.style.display = "inline-block";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (submitSection) submitSection.style.display = "none";
    }

    // Re-render so delete buttons show/hide based on auth
    if (itemList && allItems.length > 0) {
      applyFilters();
    }
  });

  // --- LOGIN BUTTON ---
  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, provider);
        const email = result.user.email;
        if (!isAllowedEmail(email) && !isAdmin(email)) {
          alert("Only @gmail.com, @henhudschools.org, or @students.henhudschools.org accounts are allowed.");
          await signOut(auth);
        }
      } catch (error) {
        console.error("Login failed:", error);
        alert("Login failed. Please try again.");
      }
    });
  }

  // --- LOGOUT BUTTON ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
    });
  }

  // --- SUBMIT FORM ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = auth.currentUser;
      if (!user || (!isAllowedEmail(user.email) && !isAdmin(user.email))) {
        alert("Please sign in with a Gmail or HenHud school account first.");
        return;
      }

      const itemName = document.getElementById("itemName").value;
      const itemCategory = document.getElementById("itemCategory").value;
      const itemDescription = document.getElementById("itemDescription").value;
      const itemLocation = document.getElementById("itemLocation").value;
      const itemDateTime = document.getElementById("itemDateTime").value;
      const imageFile = document.getElementById("itemImage").files[0];

      let imageUrl = "";

      if (imageFile) {
        const imageRef = ref(storage, `items/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "items"), {
        name: itemName,
        category: itemCategory,
        description: itemDescription,
        location: itemLocation,
        dateTime: itemDateTime,
        imageUrl: imageUrl,
        createdAt: new Date(),
        userId: user.uid,
        submittedBy: user.email
      });

      form.reset();
      alert("Item submitted successfully!");
    });
  }

  // --- LOAD ITEMS (catalog page) ---
  if (itemList) {
    loadItems();
  }

  async function loadItems() {
    itemList.innerHTML = `<p class="no-items-msg">Loading items...</p>`;
    allItems = [];

    const q = query(
      collection(db, "items"),
      where("status", "==", "approved")
    );

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      allItems.push({ id: docSnap.id, ...docSnap.data() });
    });

    applyFilters();
  }

  // --- APPLY CATEGORY + SEARCH FILTERS ---
  function applyFilters() {
    let filtered = allItems;

    // Filter by category
    if (currentCategory !== "all") {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase() === currentCategory
      );
    }

    // Filter by search term
    if (currentSearch) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(currentSearch) ||
        item.description?.toLowerCase().includes(currentSearch) ||
        item.location?.toLowerCase().includes(currentSearch)
      );
    }

    renderItems(filtered);
  }

  // --- RENDER ITEM CARDS ---
  function renderItems(items) {
    itemList.innerHTML = "";

    if (resultsCount) {
      resultsCount.textContent = items.length === 0
        ? ""
        : `Showing ${items.length} item${items.length !== 1 ? "s" : ""}`;
    }

    if (items.length === 0) {
      itemList.innerHTML = `<p class="no-items-msg">No items found.</p>`;
      return;
    }

    items.forEach((data) => {
      const card = document.createElement("div");
      card.className = "item-card";

      const cat = data.category?.toLowerCase() || "lost";
      const dateFormatted = data.dateTime
        ? new Date(data.dateTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
        : "Unknown date";

      const imageHTML = data.imageUrl
        ? `<div class="item-card-image"><img src="${data.imageUrl}" alt="${data.name}"></div>`
        : `<div class="item-card-image"><i class="fa-solid fa-box-open"></i></div>`;

      card.innerHTML = `
        ${imageHTML}
        <div class="item-card-body">
          <h3>${data.name}</h3>
          <p><i class="fa-solid fa-align-left"></i>${data.description || "No description"}</p>
          <p><i class="fa-solid fa-location-dot"></i>${data.location || "Unknown location"}</p>
          <p><i class="fa-regular fa-clock"></i>${dateFormatted}</p>
        </div>
        <div class="item-card-footer">
          <span class="cat-badge ${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
        </div>
      `;

      itemList.appendChild(card);
    });
  }

  // --- CATEGORY TABS ---
  document.querySelectorAll(".cat-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.dataset.cat;
      applyFilters();
    });
  });

  // --- SEARCH ---
  function performSearch() {
    currentSearch = searchInput ? searchInput.value.trim().toLowerCase() : "";
    applyFilters();
  }

  if (searchBtn) searchBtn.addEventListener("click", performSearch);
  if (searchInput) searchInput.addEventListener("input", performSearch);

});
