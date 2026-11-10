// Historial de niveles: cuándo se compró cada uno y cuándo llegó al 100 %.
//  - userProgress.purchasedAt.<nivel>: lo escribe el backend al pagar o canjear cupón.
//  - userProgress.levelCompletedAt.<nivel>: lo escribe la app la primera vez que
//    detecta el nivel completo. Las lecciones no guardan fecha, así que para
//    niveles terminados antes de esto la fecha es la del primer ingreso posterior.
import { db } from "@/lib/firebaseConfig";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { LEVELS, LevelId, XpSummary } from "./xpService";

export type LevelDates = Partial<Record<LevelId, { toDate: () => Date } | Date>>;

export const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as any).toDate === "function") return (value as any).toDate();
  return null;
};

export const isLevelComplete = (xp: XpSummary, level: LevelId) => {
  const s = xp.byLevel[level];
  return s.lessonsTotal > 0 && s.progress >= 1;
};

/**
 * Guarda levelCompletedAt para los niveles comprados que llegaron al 100 % y
 * todavía no tienen fecha. Devuelve los niveles marcados ahora.
 */
export async function recordLevelCompletions(
  userId: string,
  xp: XpSummary,
  purchasedLevels: Record<string, boolean> = {},
  levelCompletedAt: Record<string, unknown> = {},
): Promise<LevelId[]> {
  const newlyCompleted = LEVELS.filter(
    (level) =>
      purchasedLevels[level] &&
      !levelCompletedAt[level] &&
      isLevelComplete(xp, level),
  );
  if (newlyCompleted.length === 0) return [];

  try {
    await updateDoc(
      doc(db, "userProgress", userId),
      Object.fromEntries(
        newlyCompleted.map((level) => [
          `levelCompletedAt.${level}`,
          serverTimestamp(),
        ]),
      ),
    );
  } catch (error) {
    // nunca debe romper la pantalla
    console.error("Error guardando nivel completado:", error);
    return [];
  }
  return newlyCompleted;
}
