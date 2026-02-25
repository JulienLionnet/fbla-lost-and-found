import { db } from "./firebase-config.js"; 
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; 

document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("itemForm"); 
const itemList = document.getElementById("itemList");

 // Add item to Firestore Section
 form.addEventListener("submit", async (e) => { e.preventDefault(); 
    const itemName = document.getElementById("itemName").value; 
    const itemCategory = document.getElementById("itemCategory").value;
    const itemDescription = document.getElementById("itemDescription").value;
    await addDoc(collection(db, "items"), {
     name: itemName,
     category:itemCategory,
     description: itemDescription,
     createdAt: new Date()
     }); 
    document.getElementById("itemName").value = ""; 
    document.getElementById("itemCategory").value = "";
    document.getElementById("itemDescription").value = "";
    loadItems(); 
}); 

// Load items from Firestore Section
async function loadItems() { itemList.innerHTML = ""; 
const querySnapshot = await getDocs(collection(db, "items")); 
querySnapshot.forEach((doc) => { const li = document.createElement("li"); 
const data = doc.data();
li.textContent = `${data.name} (${data.category || "No category"}) - ${data.description || "No description"}`;
itemList.appendChild(li); 
}); 
} loadItems();
});
