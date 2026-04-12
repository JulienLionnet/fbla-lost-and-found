import 
{ db,app }
 from "./firebase-config.js"; 

 import 
 { collection, addDoc, getDocs, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; 

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
const storage = getStorage(app,"gs://lost-and-found-fbla-2026.firebasestorage.app");

import { query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => 
  {
const form = document.getElementById("itemForm"); 
const itemList = document.getElementById("itemList");

 // Add item to Firestore Section
if (form) {
 form.addEventListener("submit", async (e) => { e.preventDefault(); 
  
    const itemName = document.getElementById("itemName").value; 
    const itemCategory = document.getElementById("itemCategory").value;
    const itemDescription = document.getElementById("itemDescription").value;
    const itemLocation = document.getElementById("itemLocation").value;
    const itemDateTime = document.getElementById("itemDateTime").value;

    const imageFile = document.getElementById("itemImage").files[0];

    let imageUrl = "";

    //Upload image to Firebase Storage if it exists
    if(imageFile) {
      const imageRef = ref(storage, `items/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }
  
  //Save item data to Firestore
    await addDoc(collection(db, "items"), {
  
     name: itemName,
     category:itemCategory,
     description: itemDescription,
     location: itemLocation,
     dateTime: itemDateTime,
     imageUrl: imageUrl,
     status: "approved",  
     createdAt: new Date()
     });

form.reset();
alert("Item submitted successfully!"); 
}); 
}

// Load items from Firestore Section
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

querySnapshot.forEach((docSnap) => {

const li = document.createElement("li"); 
const data = docSnap.data();

li.innerHTML = `
<strong>${data.name}</strong> (${data.category}) <br>
${data.description} <br>
${data.location} <br>
${data.dateTime} <br>
${data.imageUrl ? `<img src="${data.imageUrl}" width="150px">` : ""}
<hr>
`;

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
  
// Delete Button for the items
const deleteButton = document.createElement("button");

deleteButton.textContent = "Delete";
deleteButton.style.marginTop = "5px"

deleteButton.addEventListener("click", async () => {
  await deleteDoc(doc(db, "items", docSnap.id));
  li.remove();//removes the item from the list immediately after deletion without needing to reload the page

});

li.appendChild(deleteButton);
li.style.marginBottom = "20px";

itemList.appendChild(li); 
}); 
}
});