import { useAuth } from "@/contexts/AuthContext";
import { useLocalSearchParams } from "expo-router";
import Lottie from "lottie-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ExerciseComponentRenderer } from "./ExerciseComponentRenderer";
import { normalizeExerciseConfig } from "./exerciseConfig";
import { useExerciseCompletion, useLessonCompletion } from "./useLessonHooks";
import { lessonXp } from "@/services/xpService";
import { stopSpeaking } from "@/lib/speech";
import {
  ExerciseAttemptContext,
  preloadAnswerSounds,
} from "@/lib/answerFeedback";
import { ExamIntro, ExamResultCard } from "@/components/lesson/ExamPanels";
import Flashcards from "@/components/lesson/Flashcards";
import {
  buildLessonSteps,
  GrammarCard,
  LessonStep,
  StepProgress,
  VocabularyCards,
} from "@/components/lesson/LessonSteps";
import {
  computeExamResult,
  getExamConfig,
  getStoredExamResult,
  saveExamAttempt,
  StoredExamResult,
} from "@/services/examService";

const LessonContent = ({
  lesson,
  onComplete,
}: {
  lesson: any;
  onComplete?: (xpGained: number) => void;
}) => {
  const { unitId } = useLocalSearchParams();
  const { user } = useAuth();

  const allExercises = useMemo(
    () => [
      ...(lesson?.content?.exercises || []),
      ...(lesson?.content?.game
        ? [
            {
              ...lesson.content.game,
              id: "game-" + (lesson.content.game.id || "0"),
            },
          ]
        : []),
    ],
    [lesson],
  );

  const {
    completedExercises,
    exerciseData,
    handleExerciseComplete,
    handleExerciseData,
    allCompleted,
    resetCompletion,
  } = useExerciseCompletion(allExercises.length);

  const {
    isAlreadyCompleted,
    completionMessage,
    showXpReward,
    handleCompleteLesson: executeCompleteLesson,
    setShowXpReward,
  } = useLessonCompletion(lesson, onComplete);

  // ===== Pasos =====
  const steps = useMemo(
    () => buildLessonSteps(lesson, allExercises.length),
    [lesson, allExercises.length],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [vocabAsList, setVocabAsList] = useState(false);
  const step: LessonStep = steps[Math.min(stepIndex, steps.length - 1)];
  const firstExerciseStep = steps.findIndex((s) => s.kind === "exercise");

  const goTo = (index: number) => {
    stopSpeaking();
    setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
  };

  // Precargar sonidos de acierto/error y cortar cualquier pronunciación al salir
  useEffect(() => {
    preloadAnswerSounds();
    return () => stopSpeaking();
  }, []);

  const xpReward = lesson ? lessonXp(lesson.id) : 0;

  // ===== Examen final con nota =====
  const exam = getExamConfig(lesson);
  const [attempt, setAttempt] = useState(0); // al repetir, los ejercicios se vuelven a montar
  const [mistakes, setMistakes] = useState<Record<number, number>>({});
  const [storedExam, setStoredExam] = useState<StoredExamResult | null>(null);
  const savedAttempt = useRef(-1);

  // Los errores en un ejercicio ya terminado (al volver a verlo) no cuentan
  const completedRef = useRef(completedExercises);
  completedRef.current = completedExercises;

  // Una función por ejercicio para sumar sus errores
  const mistakeHandlers = useMemo(
    () =>
      allExercises.map((_, i) => () => {
        if (completedRef.current[i]) return;
        setMistakes((prev) => ({ ...prev, [i]: (prev[i] || 0) + 1 }));
      }),
    [allExercises],
  );

  const examResult = useMemo(
    () =>
      exam && allCompleted
        ? computeExamResult(allExercises, mistakes, exam.passingScore)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allCompleted, mistakes, allExercises, exam?.passingScore],
  );

  useEffect(() => {
    if (exam && user && lesson) {
      getStoredExamResult(user.uid, lesson.id)
        .then(setStoredExam)
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, lesson?.id]);

  // Al terminar un intento: guardar la nota
  useEffect(() => {
    if (!examResult || !user || !lesson || savedAttempt.current === attempt) {
      return;
    }
    savedAttempt.current = attempt;
    const previous = storedExam;
    setStoredExam({
      bestScore: Math.max(examResult.percent, previous?.bestScore ?? 0),
      lastScore: examResult.percent,
      passed: examResult.passed || !!previous?.passed,
      attempts: (previous?.attempts ?? 0) + 1,
    });
    saveExamAttempt(user.uid, lesson.id, examResult, previous).catch((e) =>
      console.error("Error guardando el examen:", e),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examResult]);

  const retryExam = () => {
    setMistakes({});
    resetCompletion();
    setAttempt((a) => a + 1);
    goTo(firstExerciseStep > -1 ? firstExerciseStep : 0);
  };

  const completedCount = completedExercises.filter(Boolean).length;
  const pending = allExercises
    .map((_, i) => i)
    .filter((i) => !completedExercises[i]);

  const handleCompleteLesson = async () => {
    await executeCompleteLesson(unitId, allCompleted, xpReward);
  };

  if (!lesson) {
    return lesson === undefined ? (
      <ActivityIndicator size="large" style={styles.loader} />
    ) : (
      <View style={styles.notFoundContainer}>
        <Text>No se encontró la lección</Text>
      </View>
    );
  }

  // ===== Contenido de cada paso =====
  const stepLabel = (() => {
    switch (step.kind) {
      case "intro":
        return exam ? "Examen final" : "Introducción";
      case "vocabulary":
        return `Vocabulario · ${step.items.length} palabras`;
      case "grammar":
        return `Gramática${step.parts > 1 ? ` ${step.part}/${step.parts}` : ""}`;
      case "exercise": {
        const n = `Ejercicio ${step.index + 1} de ${allExercises.length}`;
        const section = exam && allExercises[step.index]?.section;
        return section ? `${section} · ${n}` : n;
      }
      case "finish":
        return exam ? "Resultado" : "¡Último paso!";
    }
  })();

  const renderExercise = (index: number) => {
    const exercise = allExercises[index];
    if (!exercise) return null;
    const normalizedExercise = normalizeExerciseConfig(
      exercise,
      lesson?.content,
    );

    return (
      <View style={styles.exerciseContainer}>
        <ExerciseAttemptContext.Provider
          value={{ onMistake: exam ? mistakeHandlers[index] : undefined }}
        >
          <ExerciseComponentRenderer
            exercise={normalizedExercise}
            index={index}
            lessonContent={lesson?.content}
            exerciseData={exerciseData}
            onExerciseData={handleExerciseData}
            onComplete={() => handleExerciseComplete(index)}
            isCompleted={completedExercises[index] || false}
            key={`ex-${attempt}-${exercise.id || index}`}
          />
        </ExerciseAttemptContext.Provider>
      </View>
    );
  };

  const renderPending = () =>
    pending.length > 0 && (
      <View style={styles.pendingBox}>
        <Text style={styles.pendingTitle}>
          Te{" "}
          {pending.length === 1
            ? "falta 1 ejercicio"
            : `faltan ${pending.length} ejercicios`}
        </Text>
        <View style={styles.pendingList}>
          {pending.map((i) => (
            <TouchableOpacity
              key={i}
              style={styles.pendingChip}
              onPress={() => goTo(firstExerciseStep + i)}
            >
              <Text style={styles.pendingChipText}>Ejercicio {i + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );

  const renderStep = () => {
    switch (step.kind) {
      case "intro":
        return (
          <>
            <Text style={styles.title}>{lesson.title}</Text>
            {exam && (
              <ExamIntro
                total={allExercises.length}
                passingScore={exam.passingScore}
                stored={storedExam}
              />
            )}
            {lesson.objectives?.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🎯 En esta lección vas a</Text>
                {lesson.objectives.map((obj: string, i: number) => (
                  <Text key={i} style={styles.objective}>
                    • {obj}
                  </Text>
                ))}
              </View>
            )}
            <Text style={styles.introHint}>
              {steps.length - 2} pasos · toca «Continuar» para empezar
            </Text>
          </>
        );

      case "vocabulary":
        return (
          <>
            <View style={styles.vocabHeader}>
              <Text style={styles.stepTitle}>📚 Vocabulario</Text>
              <TouchableOpacity
                onPress={() => setVocabAsList((v) => !v)}
                style={styles.viewToggle}
              >
                <Text style={styles.viewToggleText}>
                  {vocabAsList ? "🃏 Ver tarjetas" : "☰ Ver como lista"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.stepHint}>
              {vocabAsList
                ? "Toca 🔊 para escuchar cada palabra."
                : "Toca la tarjeta para darla vuelta. Desliza o usa las flechas para pasar."}
            </Text>
            {vocabAsList ? (
              <VocabularyCards items={step.items} />
            ) : (
              <Flashcards items={step.items} />
            )}
          </>
        );

      case "grammar":
        return (
          <>
            <Text style={styles.stepTitle}>✏️ Gramática</Text>
            <GrammarCard
              grammar={lesson.content.grammar}
              rules={step.rules}
              showExplanation={step.showExplanation}
            />
          </>
        );

      case "exercise":
        return renderExercise(step.index);

      case "finish":
        if (exam) {
          return (
            <>
              <Text style={styles.stepTitle}>📝 {lesson.title}</Text>
              {examResult ? (
                <ExamResultCard
                  result={examResult}
                  passingScore={exam.passingScore}
                />
              ) : (
                <Text style={styles.stepHint}>
                  Respondiste {completedCount} de {allExercises.length}{" "}
                  ejercicios. Completa todos para ver tu nota.
                </Text>
              )}
              {renderPending()}
            </>
          );
        }
        return (
          <>
            <Text style={styles.finishEmoji}>{allCompleted ? "🎉" : "💪"}</Text>
            <Text style={styles.finishTitle}>
              {allCompleted ? "¡Terminaste la lección!" : "¡Casi terminas!"}
            </Text>
            <Text style={styles.finishText}>
              {completedCount} de {allExercises.length} ejercicios completados
            </Text>
            {renderPending()}
            {completionMessage ? (
              <View
                style={[
                  styles.messageContainer,
                  isAlreadyCompleted
                    ? styles.infoMessage
                    : styles.successMessage,
                ]}
              >
                <Text style={styles.messageText}>{completionMessage}</Text>
              </View>
            ) : null}
          </>
        );
    }
  };

  // ===== Botones de abajo =====
  const isLast = step.kind === "finish";
  const exerciseDone =
    step.kind === "exercise" && completedExercises[step.index];

  const renderPrimaryButton = () => {
    if (!isLast) {
      const skipping = step.kind === "exercise" && !exerciseDone;
      return (
        <TouchableOpacity
          onPress={() => goTo(stepIndex + 1)}
          style={[
            styles.navButton,
            skipping ? styles.skipButton : styles.nextButton,
          ]}
        >
          <Text style={skipping ? styles.skipText : styles.navText}>
            {skipping
              ? "Saltar por ahora"
              : exerciseDone
                ? "Continuar ✓"
                : "Continuar"}
          </Text>
        </TouchableOpacity>
      );
    }

    if (exam) {
      if (examResult && (!examResult.passed || isAlreadyCompleted)) {
        return (
          <TouchableOpacity
            onPress={retryExam}
            style={[styles.navButton, styles.nextButton]}
          >
            <Text style={styles.navText}>🔁 Repetir examen</Text>
          </TouchableOpacity>
        );
      }
      return (
        <TouchableOpacity
          onPress={handleCompleteLesson}
          disabled={!examResult}
          style={[
            styles.navButton,
            examResult ? styles.finishButton : styles.disabledButton,
          ]}
        >
          <Text style={styles.navText}>
            {examResult
              ? `Finalizar examen (+${xpReward} XP)`
              : `Faltan ejercicios (${completedCount}/${allExercises.length})`}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={handleCompleteLesson}
        disabled={!allCompleted || isAlreadyCompleted}
        style={[
          styles.navButton,
          isAlreadyCompleted
            ? styles.completedButton
            : allCompleted
              ? styles.finishButton
              : styles.disabledButton,
        ]}
      >
        <Text style={styles.navText}>
          {isAlreadyCompleted
            ? "Lección completada"
            : allCompleted
              ? `Completar lección (+${xpReward} XP)`
              : "Completa todos los ejercicios"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <StepProgress
        current={stepIndex}
        total={steps.length}
        label={stepLabel}
      />

      <ScrollView
        key={`step-${stepIndex}-${attempt}`}
        contentContainerStyle={styles.container}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.navBar}>
        {stepIndex > 0 && (
          <TouchableOpacity
            onPress={() => goTo(stepIndex - 1)}
            style={[styles.navButton, styles.backButton]}
          >
            <Text style={styles.backText}>← Atrás</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>{renderPrimaryButton()}</View>
      </View>

      {/* Animación de XP */}
      {showXpReward && (
        <View style={styles.animationContainer}>
          <Lottie
            source={require("@/assets/animations/xp-reward.json")}
            autoPlay
            loop={false}
            style={styles.lottieAnimation}
            speed={1.5}
            onAnimationFinish={() => {
              setShowXpReward(false);
            }}
          />
          <Text style={styles.xpText}>+{xpReward} XP</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FAF8FF",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  loader: {
    marginTop: 20,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEE8FF",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4C1D95",
    marginBottom: 8,
  },
  objective: {
    color: "#555",
    fontSize: 15,
    marginBottom: 4,
  },
  introHint: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  vocabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  viewToggle: {
    backgroundColor: "#F1EBFF",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewToggleText: {
    color: "#4C1D95",
    fontWeight: "600",
    fontSize: 13,
  },
  stepHint: {
    color: "#777",
    marginBottom: 14,
  },
  exerciseContainer: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEE8FF",
  },
  finishEmoji: {
    fontSize: 56,
    textAlign: "center",
    marginTop: 24,
  },
  finishTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginTop: 8,
  },
  finishText: {
    textAlign: "center",
    color: "#666",
    marginTop: 6,
    marginBottom: 16,
  },
  pendingBox: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  pendingTitle: {
    fontWeight: "700",
    color: "#8A5A00",
    marginBottom: 10,
  },
  pendingList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pendingChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FF9800",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  pendingChipText: {
    color: "#8A5A00",
    fontWeight: "600",
  },
  navBar: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    backgroundColor: "#9365FF",
  },
  finishButton: {
    backgroundColor: "#4CAF50",
  },
  skipButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCC",
  },
  backButton: {
    backgroundColor: "#F1EBFF",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  completedButton: {
    backgroundColor: "#BDBDBD",
  },
  navText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  skipText: {
    color: "#777",
    fontWeight: "600",
    fontSize: 15,
  },
  backText: {
    color: "#4C1D95",
    fontWeight: "600",
    fontSize: 15,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  successMessage: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  infoMessage: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
    borderWidth: 1,
  },
  messageText: {
    color: "#2E7D32",
  },
  animationContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  lottieAnimation: {
    width: 300,
    height: 300,
  },
  xpText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default LessonContent;
