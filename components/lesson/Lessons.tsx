import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebaseConfig";
import {
  completeLesson,
  getProgress,
  unlockNextUnit,
} from "@/services/courseService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import LessonContent from "@/app/lesson/LessonContent";

// Definición de tipos para TypeScript
type VocabularyItem = {
  word: string;
  translation: string;
  image?: string;
  examples?: string[];
};

type GrammarRule = {
  rule: string;
  examples: string[];
};

type Exercise = {
  type: string;
  [key: string]: any;
};

type LessonContent = {
  vocabulary?: VocabularyItem[];
  grammarRules?: GrammarRule[];
  exercises?: Exercise[];
};

type LessonProps = {
  lesson: {
    id: string;
    title: string;
    content: LessonContent;
    type?: string;
    xpReward: number;
    objectives?: string[];
  };
  onComplete: () => void;
  currentLevel: string;
  isTestMode?: boolean;
  onPress?: () => void;
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const loadLesson = async () => {
      const lessonDoc = await getDoc(doc(db, "lessons", id as string));
      setLesson(lessonDoc.data());
      setLoading(false);
    };

    loadLesson();
  }, [id]);

  const handleComplete = async () => {
    if (!user || !lesson) return;

    try {
      await completeLesson(user.uid, lesson.id, lesson.xpReward);

      // Verificar si se completó la unidad
      const userProgress = await getProgress(user.uid);
      const allLessonsCompleted = "";

      if (allLessonsCompleted) {
        // Desbloquear siguiente unidad
        await unlockNextUnit(user.uid, lesson.module, lesson.unit);
      }

      router.back();
    } catch (error) {
      console.error("Error completing lesson:", error);
    }
  };

  if (loading || !lesson) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={styles.container}>
      <LessonContent lesson={lesson} onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#444",
  },
  objectivesContainer: {
    marginBottom: 15,
  },
  objective: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
  },
  vocabularyItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  word: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  translation: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 5,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 10,
    alignSelf: "center",
  },
  examplesContainer: {
    marginTop: 8,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#34495e",
  },
  example: {
    fontSize: 13,
    color: "#555",
    marginLeft: 5,
    marginTop: 3,
  },
  grammarRule: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
  },
  ruleText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2980b9",
  },
  completeButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  xpReward: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: "rgba(46, 204, 113, 0.9)",
    padding: 20,
    borderRadius: 10,
    zIndex: 100,
  },
  xpText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  testControls: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#fff8e6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
});
