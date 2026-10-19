import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebaseConfig";
import { completeLesson } from "@/services/courseService";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

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
      await completeLesson(
        user.uid,
        lesson.id,
        xpReward,
        unitInfo || { id: "" },
      );
      onComplete?.(xpReward);

      // Redirigir después de 1 segundo
      setTimeout(() => {
        if (unitId) {
          router.replace({
            pathname: "/unit/[id]",
            params: { id: Array.isArray(unitId) ? unitId[0] : unitId },
          });
        } else {
          router.replace("/");
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error("Error completing lesson:", error);
      setIsAlreadyCompleted(false);
      setCompletionMessage("Error al completar la lección");
      setShowXpReward(false);
      setIsAnimating(false);
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
  };
};
