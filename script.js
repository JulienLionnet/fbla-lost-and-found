import 
{ db }
 from "./firebase-config.js"; 

 import 
 { collection, addDoc, getDocs, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; 

import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
const storage = getStorage();

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
     createdAt: new Date()
     });

form.reset();
alert("Item submitted successfully!");
    document.getElementById("itemName").value = ""; 
    document.getElementById("itemCategory").value = "";
    document.getElementById("itemDescription").value = "";
    loadItems(); 
}); 
}

// Load items from Firestore Section
if (itemList) {
  loadItems();}
async function loadItems() {
itemList.innerHTML = ""; 
const querySnapshot = await getDocs(collection(db, "items")); 
querySnapshot.forEach((doc) => {
const li = document.createElement("li"); 
const data = doc.data();
li.innerHTML = `
<strong>${data.name}</strong> (${data.category}) <br>
${data.description} <br>
${data.location} <br>
${data.dateTime} <br>
${data.imageUrl ? `<img src="${data.imageUrl}" width="150px">` : ""}
<hr>
`;

itemList.appendChild(li);

// Delete Button for the items
const deleteButton = document.createElement("button");

deleteButton.textContent = "Delete";
deleteButton.addEventListener("click", async () => {
  await deleteDoc(doc(db, "items", itemDoc.id));
  loadItems();
});

li.appendChild(deleteButton);
itemList.appendChild(li); 
}); 
} loadItems();
});