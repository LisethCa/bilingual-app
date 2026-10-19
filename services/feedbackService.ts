import { db } from "@/lib/firebaseConfig";
import type { User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Platform } from "react-native";

export type FeedbackCategory = "suggestion" | "bug" | "content" | "other";

export const FEEDBACK_CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: "suggestion", label: "💡 Sugerencia" },
  { id: "content", label: "📚 Contenido nuevo" },
  { id: "bug", label: "🐞 Algo no funciona" },
  { id: "other", label: "💬 Otro" },
];

export const FEEDBACK_MAX_LENGTH = 1000;

export type FeedbackInput = {
  rating: number; // 1 a 5
  category: FeedbackCategory;
  message: string;
};

/**
 * Guarda una opinión en la colección "feedback".
 * Las reglas de Firestore solo permiten crear (no leer ni editar) y exigen
 * que userId coincida con el usuario autenticado.
 */
export const submitFeedback = async (user: User, input: FeedbackInput) => {
  await addDoc(collection(db, "feedback"), {
    userId: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    rating: input.rating,
    category: input.category,
    message: input.message.trim().slice(0, FEEDBACK_MAX_LENGTH),
    platform: Platform.OS,
    createdAt: serverTimestamp(),
  });
};
