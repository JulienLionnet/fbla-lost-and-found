import { db, app } from "./firebase-config.js";
 
import { collection, addDoc, getDocs, deleteDoc, doc, query, where }
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
 
  // --- LOAD ITEMS (catalog.html only) ---
  if (itemList) {
    loadItems();
  }
 
  async function loadItems() {
    itemList.innerHTML = "";
 
    const q = query(
      collection(db, "items"),
      where("status", "==", "approved")
    );
 
    const querySnapshot = await getDocs(q);
 
    if (querySnapshot.empty) {
      itemList.innerHTML = "<li style='color:#999; list-style:none;'>No items found.</li>";
      return;
    }
 
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const li = document.createElement("li");
 
      li.style.marginBottom = "20px";
      li.innerHTML = `
        <strong>${data.name}</strong> (${data.category}) <br>
        ${data.description} <br>
        ${data.location} <br>
        ${data.dateTime} <br>
        ${data.imageUrl ? `<img src="${data.imageUrl}" width="150px">` : ""}
        <hr>
      `;
 
      itemList.appendChild(li);
    });
  }
 
});