
import { getLessonsByLevel } from "@/services/firestoreService";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
} from "react-native";
import LessonContent from "../lesson/LessonContent";

  export default function LevelPage() {
    const { level: levelId } = useLocalSearchParams();
    const [lessons, setLessons] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const router = useRouter();

    useEffect(() => {
      const loadLessons = async () => {
        const lessons = await getLessonsByLevel(levelId as string);
        setLessons(lessons);
      };
      loadLessons();
    }, [levelId]);

    if (lessons.length === 0) return <ActivityIndicator />;

    console.log(`Mostrando lección ${currentIndex + 1}/${lessons.length}`);

    return (
      <View style={{ flex: 1 }}>
        <LessonContent
          key={lessons[currentIndex].id}
          lesson={lessons[currentIndex]}
          onComplete={() => {
            if (currentIndex < lessons.length - 1) {
              setCurrentIndex(currentIndex + 1);
            } else {
              router.back();
            }
          }}
        />
      </View>
    );
  }