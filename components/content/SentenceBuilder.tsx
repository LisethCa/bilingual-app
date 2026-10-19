import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import React, { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SentenceBuilderProps {
  config: {
    wordBank: string[];
    correctAnswers: string[];
    requiredWords?: string[];
    timeLimit?: number;
    title?: string;
    showStartButton?: boolean;
  };
  onComplete: () => void;
  isCompleted?: boolean;
  completedWords?: string[];
  onExerciseData?: (data: any) => void;
  question?: string; // Prop opcional a nivel de ejercicio
}

const normalizeSentence = (sentence: string) =>
  sentence
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:¿¡"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  config,
  onComplete,
  isCompleted = false,
  completedWords = [],
  onExerciseData,
  question, // <--- Debemos extraerlo de las props aquí
}) => {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  // Valores por defecto seguros
  const safeConfig = {
    wordBank: config?.wordBank || [],
    correctAnswers: config?.correctAnswers || [],
    requiredWords: config?.requiredWords || [],
    timeLimit: config?.timeLimit || 0,
    title: config?.title || "Forma una oración",
    showStartButton: config?.showStartButton ?? true,
    // Prioriza la prop directa 'question', luego busca en config, si no, vacío
    question: question || (config as any)?.question || "",
  };

  const maxCorrectAnswerLength = Math.max(
    ...safeConfig.correctAnswers.map((a) => a.trim().split(/\s+/).length),
  );
  const isFreeForm = safeConfig.wordBank.length > maxCorrectAnswerLength;
  const allWordsRequired = !isFreeForm &&
    safeConfig.correctAnswers.every(
      (answer) => answer.trim().split(/\s+/).length === safeConfig.wordBank.length,
    );

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(safeConfig.timeLimit);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [hasStarted, setHasStarted] = useState(!safeConfig.showStartButton);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(isCompleted);
  const [completedSentence, setCompletedSentence] = useState<string>("");

  // Inicializar palabras
  useEffect(() => {
    const shuffled = [...safeConfig.wordBank].sort(() => Math.random() - 0.5);
    setRemainingWords(shuffled);
  }, [safeConfig.wordBank]);

  // Sincronizar estado completado
  useEffect(() => {
    setIsExerciseCompleted(isCompleted);
    if (isCompleted) {
      setShowSuccess(true);
      setHasStarted(true);
      // Si tenemos palabras completadas desde props, restaurarlas
      if (completedWords.length > 0) {
        setSelectedWords(completedWords);
        const remaining = safeConfig.wordBank.filter(
          (word) => !completedWords.includes(word),
        );
        setRemainingWords(remaining);
      }
      // Si no hay completedWords pero hay selectedWords locales, mantenerlas
    }
  }, [isCompleted, completedWords, safeConfig.wordBank]);

  // Temporizador
  useEffect(() => {
    if (!hasStarted || safeConfig.timeLimit <= 0 || isExerciseCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, safeConfig.timeLimit, isExerciseCompleted]);

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleSelectWord = (word: string, index: number) => {
    if (isExerciseCompleted) return;
    const newRemaining = [...remainingWords];
    newRemaining.splice(index, 1);
    setRemainingWords(newRemaining);
    const newSelected = [...selectedWords, word];
    setSelectedWords(newSelected);
  };

  const handleDeselectWord = (word: string, index: number) => {
    if (isExerciseCompleted) return;
    const newSelected = [...selectedWords];
    newSelected.splice(index, 1);
    setSelectedWords(newSelected);
    setRemainingWords([...remainingWords, word]);
  };

  const checkSentence = () => {
    const userSentence = selectedWords.join(" ");

    // La oración debe coincidir con una de las respuestas listadas,
    // ignorando mayúsculas y puntuación
    const isCorrect = safeConfig.correctAnswers.some(
      (correct) => normalizeSentence(correct) === normalizeSentence(userSentence),
    );

    if (isCorrect) {
      feedbackCorrect();
      setShowSuccess(true);
      setIsExerciseCompleted(true);
      setCompletedSentence(userSentence);
      setShowCompletion(true);
      // Guardar las palabras seleccionadas en ejerciseData
      if (onExerciseData) {
        onExerciseData({
          selectedWords: selectedWords,
          completedSentence: userSentence,
        });
      }
      // Llamar a onComplete para que el padre actualice su estado
      // Esto es importante para mantener el estado completado cuando el componente se re-renderiza
      onComplete();
    } else {
      feedbackWrong();
      // Animación de error
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Guardar las palabras seleccionadas cuando se completa
  useEffect(() => {
    if (isExerciseCompleted && selectedWords.length > 0) {
      // Este efecto solo ejecuta cuando isExerciseCompleted cambia a true
      // Mantiene las palabras en el estado local
    }
  }, [isExerciseCompleted]);

  // Renderizado de la pregunta (Solo si existe)
  const renderQuestionHint = () => {
    if (!safeConfig.question) return null;

    return (
      <View style={styles.goalContainer}>
        <View style={styles.goalBubble}>
          <Text style={styles.goalText}>{safeConfig.question}</Text>
        </View>
        <View style={styles.bubbleTriangle} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{safeConfig.title}</Text>

      {safeConfig.timeLimit > 0 && (
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>
            {hasStarted ? `⏱️ ${timeLeft}s` : "Tiempo no iniciado"}
          </Text>
        </View>
      )}

      {/* Renderizamos la pista visual si existe */}
      {renderQuestionHint()}

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {allWordsRequired
            ? "Usa todas las palabras para formar la oración:"
            : "Forma una oración usando algunas de las palabras:"}
        </Text>
      </View>

      <Animated.View
        style={[
          styles.sentenceArea,
          { transform: [{ translateX: shakeAnim }] },
          !hasStarted && styles.disabledArea,
        ]}
      >
        {selectedWords.length > 0 ? (
          <View style={styles.sentenceWords}>
            {selectedWords.map((word, index) => (
              <TouchableOpacity
                key={`selected-${index}`}
                style={[
                  styles.wordChip,
                  isExerciseCompleted && styles.wordChipCompleted,
                ]}
                onPress={() =>
                  !isExerciseCompleted &&
                  !isTimeUp &&
                  handleDeselectWord(word, index)
                }
                disabled={isExerciseCompleted || isTimeUp}
              >
                <Text style={styles.wordText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.placeholder}>
            {!hasStarted
              ? "Presiona 'Comenzar' para empezar"
              : "Toca las palabras para comenzar"}
          </Text>
        )}
      </Animated.View>

      <View style={styles.wordBankContainer}>
        <Text style={styles.wordBankTitle}>Palabras disponibles:</Text>
        <View style={[styles.wordBank, !hasStarted && styles.disabledArea]}>
          {remainingWords.map((word, index) => (
            <TouchableOpacity
              key={`bank-${index}`}
              style={[
                styles.wordButton,
                (isExerciseCompleted || isTimeUp || !hasStarted) &&
                  styles.disabledButton,
              ]}
              onPress={() => handleSelectWord(word, index)}
              disabled={isTimeUp || !hasStarted || isExerciseCompleted}
            >
              <Text style={styles.wordText}>{word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {safeConfig.showStartButton && !hasStarted ? (
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.buttonText}>Comenzar Ejercicio</Text>
        </TouchableOpacity>
      ) : (
        <>
          {/* Solo renderizamos el botón si NO está completado */}
          {!isExerciseCompleted && (
            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedWords.length === 0 && styles.disabledButton,
              ]}
              onPress={checkSentence}
              disabled={selectedWords.length === 0 || isTimeUp || !hasStarted}
            >
              <Text style={styles.buttonText}>
                {isTimeUp ? "Tiempo terminado" : "Verificar"}
              </Text>
            </TouchableOpacity>
          )}

          {isExerciseCompleted && (
            <View style={styles.completionBanner}>
              <Text style={styles.completionText}>
                ✓ ¡Completado correctamente!
              </Text>
            </View>
          )}

          {isTimeUp && (
            <View style={styles.solution}>
              <Text>Respuestas posibles:</Text>
              {safeConfig.correctAnswers.map((answer, i) => (
                <Text key={i} style={styles.solutionText}>
                  {answer}
                </Text>
              ))}
            </View>
          )}
        </>
      )}

      <CompletionMessage
        visible={showCompletion}
        type="success"
        duration={1200}
        onHide={() => setShowCompletion(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  timer: {
    textAlign: "center",
    fontSize: 16,
    color: "#e53935",
    marginBottom: 10,
  },
  sentenceArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#bdbdbd",
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  placeholder: {
    color: "#9e9e9e",
    fontStyle: "italic",
  },
  wordBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  wordButton: {
    padding: 10,
    margin: 5,
    backgroundColor: "#e3f2fd",
    borderRadius: 20,
  },
  wordChip: {
    padding: 10,
    margin: 5,
    backgroundColor: "#bbdefb",
    borderRadius: 20,
  },
  wordChipCompleted: {
    backgroundColor: "#4CAF50",
    opacity: 0.8,
  },
  wordText: {
    fontSize: 16,
  },
  submitButton: {
    padding: 15,
    backgroundColor: "#2196F3",
    borderRadius: 8,
    alignItems: "center",
  },
  completedButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  solution: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  solutionText: {
    marginTop: 5,
    fontStyle: "italic",
  },

  instructions: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sentenceWords: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  wordBankContainer: {},
  wordBankTitle: {},
  timerContainer: {},
  startButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  disabledButton: {
    backgroundColor: "#e0e0e0",
  },
  disabledArea: {
    opacity: 0.6,
  },
  completionBanner: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  completionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  goalContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  goalBubble: {
    backgroundColor: "#F0F0F0",
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    maxWidth: "90%",
  },
  goalText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4B4B4B",
    textAlign: "center",
    fontStyle: "italic",
  },
  bubbleTriangle: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#E0E0E0",
    transform: [{ rotate: "180deg" }], // Apunta hacia abajo a las palabras
    marginBottom: -2,
    zIndex: 1,
  },
  instructionText:{},
});

export default SentenceBuilder;
