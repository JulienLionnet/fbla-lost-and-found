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
 
// ─── SUBMIT PAGE ────────────────────────────────────────────────
function initSubmitForm() {
  const form = document.getElementById("itemForm");
  if (!form) return;
 
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
 
    const itemName     = document.getElementById("itemName").value;
    const itemCategory = document.getElementById("itemCategory").value;
    const itemDesc     = document.getElementById("itemDescription").value;
    const itemLocation = document.getElementById("itemLocation").value;
    const itemDateTime = document.getElementById("itemDateTime").value;
    const imageFile    = document.getElementById("itemImage").files[0];
 
    let imageUrl = "";
    if (imageFile) {
      const imageRef = ref(storage, `items/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }
 
    await addDoc(collection(db, "items"), {
      name: itemName,
      category: itemCategory,
      description: itemDesc,
      location: itemLocation,
      dateTime: itemDateTime,
      imageUrl: imageUrl,
      status: "pending",
      createdAt: new Date()
    });
 
    form.reset();
    alert("Item submitted! It will appear in the catalog once approved.");
  });
}
 
// ─── CATALOG PAGE ───────────────────────────────────────────────
function initCatalog() {
  const itemList = document.getElementById("itemList");
  if (!itemList) return;
 
  let allItems = [];
 
  const searchInput    = document.querySelector(".search-bar input");
  const searchButton   = document.querySelector(".search-bar button");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter     = document.getElementById("sortFilter");
 
  function renderItems(items) {
    itemList.innerHTML = "";
 
    if (items.length === 0) {
      itemList.innerHTML = "<li style='color:#999;list-style:none;text-align:center;padding:30px;'>No items match your search.</li>";
      return;
    }
 
    items.forEach(data => {
      const li = document.createElement("div");
       
      const category = (data.category || "unknown").toLowerCase();
      const badgeColor =
        category === "lost"     ? "#e53935" :
        category === "found"    ? "#43a047" :
        category === "returned" ? "#1e88e5" : "#888";
 
      li.innerHTML = `
        <div style="background:white;border-radius:12px;padding:20px;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong style="font-size:17px;color:#1d2b4f;">${data.name}</strong>
            <span style="background:${badgeColor};color:white;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:bold;">
              ${category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          </div>
          <p style="font-size:13px;color:#555;margin:4px 0;"><strong>📍 Location:</strong> ${data.location || "—"}</p>
          <p style="font-size:13px;color:#555;margin:4px 0;"><strong>🕐 Date & Time:</strong> ${data.dateTime || "—"}</p>
          <p style="font-size:13px;color:#555;margin:8px 0;">${data.description || ""}</p>
          ${data.imageUrl ? `<img src="${data.imageUrl}" style="margin-top:10px;border-radius:8px;max-width:180px;">` : ""}
        </div>
      `;
 
      itemList.appendChild(li);
    });
  }
 
  function applyFilters() {
    const searchQuery      = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";
    const selectedSort     = sortFilter ? sortFilter.value : "newest";
 
    let filtered = allItems.filter(item => {
      const cat = (item.category || "").toLowerCase();
 
      const categoryMatch =
        selectedCategory === "all" || cat === selectedCategory;
 
      const searchMatch =
        !searchQuery ||
        (item.name        || "").toLowerCase().includes(searchQuery) ||
        (item.description || "").toLowerCase().includes(searchQuery) ||
        (item.location    || "").toLowerCase().includes(searchQuery) ||
        cat.includes(searchQuery);
 
      return categoryMatch && searchMatch;
    });
 
    filtered.sort((a, b) => {
      if (selectedSort === "newest") {
        return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      }
      if (selectedSort === "oldest") {
        return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
      }
      if (selectedSort === "name-az") return (a.name || "").localeCompare(b.name || "");
      if (selectedSort === "name-za") return (b.name || "").localeCompare(a.name || "");
      return 0;
    });
 
    renderItems(filtered);
  }
 
  async function loadItems() {
    itemList.innerHTML = "<li style='color:#999;list-style:none;text-align:center;padding:30px;'>Loading...</li>";
 
    const q = query(collection(db, "items"), where("status", "==", "approved"));
    const snapshot = await getDocs(q);
 
    allItems = [];
    snapshot.forEach(docSnap => {
      allItems.push({ id: docSnap.id, ...docSnap.data() });
    });
 
    console.log(`Loaded ${allItems.length} approved items`);
    applyFilters();
  }
 
  if (searchButton) searchButton.addEventListener("click", applyFilters);
  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Escape") { searchInput.value = ""; applyFilters(); }
    });
  }
  if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
  if (sortFilter)     sortFilter.addEventListener("change", applyFilters);
 
  loadItems();
}
 
// ─── INIT ───────────────────────────────────────────────────────
onAuthStateChanged(auth, updateNavbar);
initSubmitForm();
initCatalog();
 