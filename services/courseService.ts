import { Lesson, UserProgress } from "@/types/types";
import { initializeApp } from "firebase/app";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { firebaseConfig } from "../lib/firebaseConfig"; 

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define los tipos para mejor TypeScript
type Module = {
  id: string;
  title: string;
  description: string;
  icon: string;
  units: Unit[];
};

type Unit = {
  id: string;
  title: string;
  lessons: string[];
  requiredXP: number;
  rewardXP: number;
};

export const getUserProgress = async (
  userId: string
): Promise<UserProgress> => {
  try {
    const userProgressRef = doc(db, "userProgress", userId);
    const snapshot = await getDoc(userProgressRef);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        xp: data.xp || 0,
        completedMissions: data.completedMissions || {},
        levels: data.levels || {},
        completedUnits: data.completedUnits || [],
        totalXP: data.totalXP || 0,
        lastActive: data.lastActive || Timestamp.now(),
      };
    } else {
      const newProgress: UserProgress = {
        xp: 0,
        completedMissions: {},
        levels: {},
        completedUnits: [],
        totalXP: 0,
        lastActive: Timestamp.now(),
      };

      await setDoc(userProgressRef, newProgress);
      return newProgress;
    }
  } catch (error) {
    console.error("Error getting user progress:", error);
    throw error;
  }
};


export const getModules = async (): Promise<Module[]> => {
  try {
    const modulesCollection = collection(db, "modules");
    const snapshot = await getDocs(modulesCollection);

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Module)
    );
  } catch (error) {
    console.error("Error fetching modules:", error);
    return [];
  }
};

export const getUnitById = async (unitId: string): Promise<Unit | null> => {
  try {
    const unitDoc = doc(db, "units", unitId);
    const unitSnapshot = await getDoc(unitDoc);

    if (unitSnapshot.exists()) {
      return {
        id: unitSnapshot.id,
        ...unitSnapshot.data(),
      } as Unit;
    }
    return null;
  } catch (error) {
    console.error("Error fetching unit:", error);
    return null;
  }
};

export const completeUnit = async (
  userId: string,
  unitId: string,
  xpReward: number
): Promise<void> => {
  try {
    const userProgressRef = doc(db, "userProgress", userId);

    await updateDoc(userProgressRef, {
      completedUnits: arrayUnion(unitId),
      totalXP: increment(xpReward),
    });
  } catch (error) {
    console.error("Error completing unit:", error);
    throw error;
  }
};

export const getLessonById = async (lessonId: string): Promise<Lesson> => {
  const docSnap = await getDoc(doc(db, "lessons", lessonId));
  return docSnap.data() as Lesson;
};

export const completeLesson = async (
  userId: string,
  lessonId: string,
  xpReward: number,
  unitData: { id: string; insignia?: string }
) => {
  try {
    const progressRef = doc(db, "userProgress", userId);

    let levelKey = "A1";
    if (lessonId.includes("A2")) levelKey = "A2";
    else if (lessonId.includes("B1")) levelKey = "B1";

    // 2. Obtener datos actuales del progreso y la unidad
    const [progressSnap, unitSnap] = await Promise.all([
      getDoc(progressRef),
      getDoc(doc(db, "units", unitData.id)),
    ]);

    if (!progressSnap.exists() || !unitSnap.exists()) {
      throw new Error("Documento no encontrado");
    }

    const progressData = progressSnap.data();
    const unit = unitSnap.data();

    // 3. Actualizar progreso básico (operación atómica)
    const updateData: any = {
      xp: increment(xpReward),
      [`completedLessons.${lessonId}`]: true,
      [`levels.${levelKey}.completed`]: increment(1),
      lastCompleted: serverTimestamp(),
    };

    // 4. Verificar si se completó toda la unidad
    const allLessonsCompleted = unit.lessons.every(
      (id: string) => progressData.completedLessons?.[id] || id === lessonId
    );

    // 5. Si se completó la unidad y tiene insignia, añadirla
    if (allLessonsCompleted && unitData.insignia) {
      updateData[`earnedBadges.${unitData.id}`] = {
        unitId: unitData.id,
        unitTitle: unit.title,
        insigniaUrl: unitData.insignia,
        earnedAt: serverTimestamp(),
      };
    }

    // 6. Ejecutar la actualización
    await updateDoc(progressRef, updateData);

    console.log(
      `Lección ${lessonId} completada. Unidad completa: ${allLessonsCompleted}`
    );
    // unitCompleted: esta lección fue la última de la unidad (vale para
    // cualquier nivel, se calcula con las lecciones de la unidad)
    return { ok: true, unitCompleted: !!allLessonsCompleted };
  } catch (error) {
    console.error("Error completing lesson:", error);
    return { ok: false, unitCompleted: false };
  }
};

export const unlockNextUnit = async (
  userId: string,
  moduleId: string,
  currentUnitId: string
) => {
  const moduleDoc = await getDoc(doc(db, "modules", moduleId));
  const units = moduleDoc.data()?.units;
  const unitIds = Object.keys(units);
  const currentIndex = unitIds.indexOf(currentUnitId);
  
  if (currentIndex < unitIds.length - 1) {
    const nextUnitId = unitIds[currentIndex + 1];
    const userRef = doc(db, "userProgress", userId);
    
    await updateDoc(userRef, {
      unlockedUnits: arrayUnion(nextUnitId)
    });
  }
};

export const getProgress = async (userId: string) => {
  const docSnap = await getDoc(doc(db, "userProgress", userId));
  return docSnap.exists() ? docSnap.data() : null;
};

export const getUnitProgress = async (userId: string, unitId: string) => {
  const docSnap = await getDoc(doc(db, "userProgress", userId));
  return docSnap.exists() ? docSnap.data().completedLessons || {} : {};
};

export const calculateUnitProgress = async (
  userId: string,
  unitId: string
): Promise<number> => {
  try {
    // 1. Obtener la unidad para saber cuántas lecciones tiene
    const unitDoc = await getDoc(doc(db, "units", unitId));
    if (!unitDoc.exists()) return 0;

    const unit = unitDoc.data();
    const totalLessons = unit.lessons.length;
    if (totalLessons === 0) return 0;

    // 2. Obtener el progreso del usuario
    const userProgressDoc = await getDoc(doc(db, "userProgress", userId));
    if (!userProgressDoc.exists()) return 0;

    const completedLessons = userProgressDoc.data().completedLessons || {};

    // 3. Contar lecciones completadas en esta unidad
    const completedInUnit = unit.lessons.filter(
      (lessonId: string) => completedLessons[lessonId]
    ).length;

    // 4. Calcular porcentaje de completado
    return completedInUnit / totalLessons;
  } catch (error) {
    console.error("Error calculating unit progress:", error);
    return 0;
  }
};

