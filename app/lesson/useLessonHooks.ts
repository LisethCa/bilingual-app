import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { completeLesson } from "@/services/courseService";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

// Tiempo que se ve la celebración de Billa antes de volver a la unidad
const LESSON_CELEBRATION_MS = 3000;
const UNIT_CELEBRATION_MS = 6000;

export type Celebration = { kind: "lesson" | "unit"; xp: number } | null;

/**
 * Hook para manejar el estado de completitud de ejercicios
 */
export const useExerciseCompletion = (totalExercises: number) => {
  const [completedExercises, setCompletedExercises] = useState<boolean[]>([]);
  const [exerciseData, setExerciseData] = useState<Record<number, any>>({});

  useEffect(() => {
    setCompletedExercises(Array(totalExercises).fill(false));
  }, [totalExercises]);

  const handleExerciseComplete = (exerciseIndex: number) => {
    setCompletedExercises((prev) => {
      const newCompleted = [...prev];
      newCompleted[exerciseIndex] = true;
      return newCompleted;
    });
  };

  const handleExerciseData = (exerciseIndex: number, data: any) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseIndex]: data,
    }));
  };

  const allCompleted =
    completedExercises.length > 0 &&
    completedExercises.every((completed) => completed);

  // Volver a empezar (repetir un examen)
  const resetCompletion = () => {
    setCompletedExercises(Array(totalExercises).fill(false));
    setExerciseData({});
  };

  return {
    completedExercises,
    exerciseData,
    handleExerciseComplete,
    handleExerciseData,
    allCompleted,
    resetCompletion,
  };
};

/**
 * Hook para manejar la lógica de completitud de la lección
 */
export const useLessonCompletion = (
  lesson: any,
  onComplete?: (xp: number) => void,
) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showXpReward, setShowXpReward] = useState(false);
  const [celebration, setCelebration] = useState<Celebration>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitRef = useRef<(() => void) | null>(null);

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    [],
  );

  /** Sale de la celebración hacia la unidad (botón «Continuar» o automático). */
  const continueAfterCelebration = () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
    const exit = exitRef.current;
    exitRef.current = null;
    exit?.();
  };

  // Verificar si la lección ya fue completada
  useEffect(() => {
    const checkIfCompleted = async () => {
      if (!user || !lesson) return;

      try {
        const progressDoc = await getDoc(doc(db, "userProgress", user.uid));
        if (progressDoc.exists()) {
          const completed = progressDoc.data().completedLessons || {};
          const alreadyCompleted = !!completed[lesson.id];
          setIsAlreadyCompleted(alreadyCompleted);
          if (alreadyCompleted) {
            setCompletionMessage(
              "Ya completaste esta lección (no obtendrás XP adicional)",
            );
          }
        }
      } catch (error) {
        console.error("Error checking lesson completion:", error);
      }
    };

    checkIfCompleted();
  }, [user, lesson]);

  const handleCompleteLesson = async (
    unitId: string | string[] | undefined,
    allExercisesCompleted: boolean,
    xpReward: number,
  ) => {
    if (!user || !lesson || !allExercisesCompleted || isAlreadyCompleted) {
      return false;
    }

    try {
      setShowXpReward(true);
      setIsAnimating(true);
      setCompletionMessage(`¡Lección completada! +${xpReward} XP`);
      setIsAlreadyCompleted(true);

      // Obtener información de la unidad
      const unitsQuery = await getDocs(collection(db, "modules"));
      let unitInfo = null;

      unitsQuery.forEach((moduleDoc) => {
        Object.entries(moduleDoc.data().units || {}).forEach(
          ([unitIdKey, unit]: [string, any]) => {
            if (unit.lessons.includes(lesson.id)) {
              unitInfo = {
                id: unitIdKey,
                insignia: unit.insignia,
              };
            }
          },
        );
      });

      // Completar la lección
      const result = await completeLesson(
        user.uid,
        lesson.id,
        xpReward,
        unitInfo || { id: "" },
      );
      if (!result.ok) throw new Error("No se pudo guardar el progreso");
      onComplete?.(xpReward);

      // Billa celebra: lección completada, o la celebración mayor si con
      // esta lección se terminó la unidad (funciona igual en cualquier nivel)
      setShowXpReward(false);
      setCelebration({
        kind: result.unitCompleted ? "unit" : "lesson",
        xp: xpReward,
      });

      exitRef.current = () => {
        if (unitId) {
          router.replace({
            pathname: "/unit/[id]",
            params: { id: Array.isArray(unitId) ? unitId[0] : unitId },
          });
        } else {
          router.replace("/");
        }
      };
      redirectTimer.current = setTimeout(
        continueAfterCelebration,
        result.unitCompleted ? UNIT_CELEBRATION_MS : LESSON_CELEBRATION_MS,
      );

      return true;
    } catch (error) {
      console.error("Error completing lesson:", error);
      setIsAlreadyCompleted(false);
      setCompletionMessage("Error al completar la lección");
      setShowXpReward(false);
      setIsAnimating(false);
      setCelebration(null);
      return false;
    }
  };

  return {
    isAlreadyCompleted,
    completionMessage,
    isAnimating,
    showXpReward,
    handleCompleteLesson,
    setShowXpReward,
    setIsAnimating,
    celebration,
    continueAfterCelebration,
  };
};
