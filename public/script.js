import { db, app } from "./firebase-config.js";

import { collection, addDoc, getDocs, query, where }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getStorage, ref, uploadBytes, getDownloadURL }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { getAuth, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const storage = getStorage(app, "gs://lost-and-found-fbla-2026.firebasestorage.app");
const auth = getAuth(app);

const ADMIN_EMAILS = [
  "julienmlionnet@gmail.com",
  "jucrockettlionnet@students.henhudschools.org",
  "etramos@students.henhudschools.org",
  "eramos101910@yahoo.com"
];

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Adds an "Admin Panel" link to the navbar if the signed-in user is an admin
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

  // Update navbar based on auth state (works on both submit.html and catalog.html)
  onAuthStateChanged(auth, (user) => {
    updateNavbar(user);
  });

  // --- SUBMIT FORM (submit.html only) ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const itemName = document.getElementById("itemName").value;
      const itemCategory = document.getElementById("itemCategory").value;
      const itemDescription = document.getElementById("itemDescription").value;
      const itemLocation = document.getElementById("itemLocation").value;
      const itemDateTime = document.getElementById("itemDateTime").value;
      const imageFile = document.getElementById("itemImage").files[0];

      let imageUrl = "";

      // Upload image to Firebase Storage if provided
      if (imageFile) {
        const imageRef = ref(storage, `items/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      // Save item to Firestore
      await addDoc(collection(db, "items"), {
        name: itemName,
        category: itemCategory,
        description: itemDescription,
        location: itemLocation,
        dateTime: itemDateTime,
        imageUrl: imageUrl,
        status: "pending",
        createdAt: new Date()
      });

      form.reset();
      alert("Item submitted successfully! It will appear in the catalog once approved.");
    });
  }

  // --- CATALOG (catalog.html only) ---
  if (itemList) {

    // Holds all loaded items so we can filter without re-fetching from Firestore
    let allItems = [];

    const searchInput = document.querySelector(".search-bar input");
    const searchButton = document.querySelector(".search-bar button");
    const categoryFilter = document.getElementById("categoryFilter");
    const sortFilter = document.getElementById("sortFilter");

    // Re-render the list based on current search + filter + sort values
    function applyFilters() {
      const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : "";
      const selectedCategory = categoryFilter ? categoryFilter.value : "all";
      const selectedSort = sortFilter ? sortFilter.value : "newest";

      let filtered = allItems.filter(item => {
        // Category filter
        const categoryMatch =
          selectedCategory === "all" ||
          (item.category || "").toLowerCase() === selectedCategory;

        // Search filter — checks name, description, location, category
        const searchMatch =
          !searchQuery ||
          (item.name || "").toLowerCase().includes(searchQuery) ||
          (item.description || "").toLowerCase().includes(searchQuery) ||
          (item.location || "").toLowerCase().includes(searchQuery) ||
          (item.category || "").toLowerCase().includes(searchQuery);

        return categoryMatch && searchMatch;
      });

      // Sort
      filtered.sort((a, b) => {
        if (selectedSort === "newest") {
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        } else if (selectedSort === "oldest") {
          return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
        } else if (selectedSort === "name-az") {
          return (a.name || "").localeCompare(b.name || "");
        } else if (selectedSort === "name-za") {
          return (b.name || "").localeCompare(a.name || "");
        }
        return 0;
      });

      renderItems(filtered);
    }

    // Build the list item cards from a given array of items
    function renderItems(items) {
      itemList.innerHTML = "";

      if (items.length === 0) {
        itemList.innerHTML = "<li style='color:#999; list-style:none; text-align:center; padding:30px;'>No items match your search.</li>";
        return;
      }

      items.forEach(data => {
        const li = document.createElement("li");
        li.style.marginBottom = "20px";
        li.style.listStyle = "none";

        const category = (data.category || "unknown").toLowerCase();
        const categoryColor =
          category === "lost" ? "#e53935" :
          category === "found" ? "#43a047" :
          category === "returned" ? "#1e88e5" : "#888";

        li.innerHTML = `
          <div style="background:white; border-radius:12px; padding:20px; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <strong style="font-size:17px; color:#1d2b4f;">${data.name}</strong>
              <span style="background:${categoryColor}; color:white; padding:3px 12px; border-radius:20px; font-size:12px; font-weight:bold;">
                ${category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            </div>
            <p style="font-size:13px; color:#555; margin:4px 0;"><strong>📍 Location:</strong> ${data.location || "—"}</p>
            <p style="font-size:13px; color:#555; margin:4px 0;"><strong>🕐 Date & Time:</strong> ${data.dateTime || "—"}</p>
            <p style="font-size:13px; color:#555; margin:8px 0;">${data.description || ""}</p>
            ${data.imageUrl ? `<img src="${data.imageUrl}" style="margin-top:10px; border-radius:8px; max-width:180px;">` : ""}
          </div>
        `;

        itemList.appendChild(li);
      });
    }

    // Load all approved items from Firestore once, then store in allItems
    async function loadItems() {
      itemList.innerHTML = "<li style='color:#999; list-style:none; text-align:center; padding:30px;'>Loading...</li>";

      const q = query(
        collection(db, "items"),
        where("status", "==", "approved")
      );

      const querySnapshot = await getDocs(q);

      allItems = [];
      querySnapshot.forEach(docSnap => {
        allItems.push({ id: docSnap.id, ...docSnap.data() });
      });

      applyFilters();
    }

    // Hook up search button and input
    if (searchButton) searchButton.addEventListener("click", applyFilters);
    if (searchInput) {
      searchInput.addEventListener("input", applyFilters);
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          searchInput.value = "";
          applyFilters();
        }
      });
    }

    // Hook up category and sort dropdowns
    if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
    if (sortFilter) sortFilter.addEventListener("change", applyFilters);

    loadItems();
  }

});
