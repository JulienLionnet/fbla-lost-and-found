import { db } from "./firebase-config.js"; 
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; 

const form = document.getElementById("itemForm"); 
const itemList = document.getElementById("itemList");

 // Add item to Firestore Section
 form.addEventListener("submit", async (e) => { e.preventDefault(); 
    const itemName = document.getElementById("itemName").value; 
    const itemCategory = document.getElementById("itemCategory").value;
    await addDoc(collection(db, "items"), {
     name: itemName,
     category:itemCategory,
     createdAt: new Date()
     }); 
    document.getElementById("itemName").value = ""; 
    document.getElementById("itemCategory").value = "";
    loadItems(); 
}); 

// Load items from Firestore Section
async function loadItems() { itemList.innerHTML = ""; 
const querySnapshot = await getDocs(collection(db, "items")); 
querySnapshot.forEach((doc) => { const li = document.createElement("li"); 
li.textContent = `${doc.data().name} (${doc.data().category || "No category"})`;
itemList.appendChild(li); 
}); 
} loadItems();
