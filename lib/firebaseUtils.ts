// firebaseUtils.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Importa db directamente

export async function getMissionsByLevel(levelId: string) {
  const docRef = doc(db, "missions", "levels"); // ✅ apunta al documento 'levels'
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data && data[levelId] && Array.isArray(data[levelId].missions)) {
      return data[levelId].missions;
    } else {
      throw new Error(`No missions found for level ${levelId}`);
    }
  } else {
    throw new Error("Document 'levels' not found in 'missions' collection");
  }
}
