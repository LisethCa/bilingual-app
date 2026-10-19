import { db } from "@/lib/firebaseConfig";
import { isFinalExam } from "@/services/xpService";
import { doc, getDoc, increment, updateDoc } from "firebase/firestore";

export const DEFAULT_PASSING_SCORE = 70;

export type ExamConfig = { passingScore: number };

/** Configuración de examen de la lección, o null si es una lección normal. */
export const getExamConfig = (lesson: any): ExamConfig | null => {
  const exam = lesson?.settings?.exam;
  if (exam) return { passingScore: exam.passingScore ?? DEFAULT_PASSING_SCORE };
  return lesson && isFinalExam(lesson.id) ? { passingScore: DEFAULT_PASSING_SCORE } : null;
};

/** Cuántas respuestas tiene un ejercicio (cada error descuenta 1/ítems). */
export const exerciseItemCount = (exercise: any): number => {
  const c = exercise?.config || {};
  const n = (() => {
    switch (exercise?.type) {
      case "fill_in_blank":
        return c.questions?.length;
      case "matching":
      case "drag_drop":
      case "memory_game":
        return (c.pairs || exercise.pairs)?.length;
      case "vocabulary":
        return c.items?.length;
      case "dialogue_simulation":
        return c.dialogues?.length;
      case "conjugation":
        return (c.pronouns?.length || 1) * (c.tenses?.length || 1);
      default:
        return 1;
    }
  })();
  // Mínimo 2: en un ejercicio de una sola respuesta, un error vale medio punto
  return Math.max(n || 1, 2);
};

/** Puntaje de 0 a 1 de un ejercicio según sus errores. */
export const exerciseScore = (exercise: any, mistakes: number) =>
  Math.max(0, 1 - mistakes / exerciseItemCount(exercise));

export type ExamSectionResult = { name: string; score: number; total: number };

export type ExamResult = {
  percent: number;
  points: number; // con un decimal
  total: number;
  passed: boolean;
  sections: ExamSectionResult[];
};

export const computeExamResult = (
  exercises: any[],
  mistakes: Record<number, number>,
  passingScore: number,
): ExamResult => {
  const scores = exercises.map((ex, i) => exerciseScore(ex, mistakes[i] || 0));
  const points = scores.reduce((a, b) => a + b, 0);
  const percent = exercises.length ? Math.round((points / exercises.length) * 100) : 0;

  const sections: ExamSectionResult[] = [];
  exercises.forEach((ex, i) => {
    const name = ex.section || "General";
    let section = sections.find((s) => s.name === name);
    if (!section) {
      section = { name, score: 0, total: 0 };
      sections.push(section);
    }
    section.score += scores[i];
    section.total += 1;
  });

  return {
    percent,
    points: Math.round(points * 10) / 10,
    total: exercises.length,
    passed: percent >= passingScore,
    sections,
  };
};

export type StoredExamResult = {
  bestScore: number;
  lastScore: number;
  passed: boolean;
  attempts: number;
};

export const getStoredExamResult = async (
  userId: string,
  lessonId: string,
): Promise<StoredExamResult | null> => {
  const snap = await getDoc(doc(db, "userProgress", userId));
  return snap.data()?.examResults?.[lessonId] ?? null;
};

/** Guarda el intento en userProgress.examResults.<lessonId>. */
export const saveExamAttempt = async (
  userId: string,
  lessonId: string,
  result: ExamResult,
  previous: StoredExamResult | null,
) => {
  const base = `examResults.${lessonId}`;
  await updateDoc(doc(db, "userProgress", userId), {
    [`${base}.lastScore`]: result.percent,
    [`${base}.bestScore`]: Math.max(result.percent, previous?.bestScore ?? 0),
    [`${base}.passed`]: result.passed || !!previous?.passed,
    [`${base}.attempts`]: increment(1),
    [`${base}.lastAttemptAt`]: new Date(),
  });
};
