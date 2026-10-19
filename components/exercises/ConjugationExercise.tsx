import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ConjugationExerciseProps = {
  config: {
    verb?: string;
    tenses?: string[];
    pronouns: string[];
    correct?: {
      [key: string]: {
        [pronoun: string]: string;
      };
    };
    hints?: {
      showInfinitive?: boolean;
      highlightIrregular?: boolean;
    };
    // Nuevas propiedades para soportar otros tipos de ejercicios
    exerciseType?: "verb" | "reflexive" | "other";
    title?: string;
  };
  onComplete: () => void;
  isCompleted?: boolean;
};

const ConjugationExercise: React.FC<ConjugationExerciseProps> = ({
  config,
  onComplete,
  isCompleted,
}) => {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  const getCorrectAnswer = (tense: string, pronoun: string): string => {
    const answer = config.correct?.[tense]?.[pronoun];
    return typeof answer === "string" ? answer : "";
  };

  const tenses = config.tenses || ["Presente"];
  const [answers, setAnswers] = useState<
    Record<string, Record<string, string>>
  >({});
  const [currentTense, setCurrentTense] = useState(tenses[0]);
  const [activePronoun, setActivePronoun] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showFeedback, setShowFeedback] = useState(isCompleted);
  const [showCompletion, setShowCompletion] = useState(false);
  const [isCorrect, setIsCorrect] = useState(isCompleted);

  useEffect(() => {
    const initialAnswers: Record<string, Record<string, string>> = {};

    tenses.forEach((tense) => {
      initialAnswers[tense] = {};
      config.pronouns.forEach((pronoun) => {
        // SI ya está completado, llenamos con la respuesta correcta, si no, vacío
        initialAnswers[tense][pronoun] = isCompleted
          ? getCorrectAnswer(tense, pronoun)
          : "";
      });
    });

    setAnswers(initialAnswers);
    if (isCompleted) {
      setIsCorrect(true);
      setShowFeedback(true);
    }
  }, [config, isCompleted]); // Reacciona si cambia la config o el estado de completado

  const handleConjugate = (tense: string, pronoun: string, answer: string) => {
    if (isCompleted) return; // Bloqueo de seguridad

    const newAnswers = {
      ...answers,
      [tense]: {
        ...answers[tense],
        [pronoun]: answer.trim(),
      },
    };

    setAnswers(newAnswers);
    checkCompletion(newAnswers);
  };

  const checkCompletion = (currentAnswers: typeof answers) => {
    const allTensesComplete = tenses.every((tense) =>
      config.pronouns.every((pronoun) =>
        currentAnswers[tense]?.[pronoun]?.trim(),
      ),
    );

    if (!allTensesComplete) return;

    const allCorrect = tenses.every((tense) => {
      return config.pronouns.every((pronoun) => {
        const correctAnswer = getCorrectAnswer(tense, pronoun)
          .toLowerCase()
          .trim();
        const userAnswer = currentAnswers[tense]?.[pronoun]
          ?.toLowerCase()
          .trim();
        return correctAnswer === userAnswer;
      });
    });

    setShowFeedback(true);
    setIsCorrect(allCorrect);
    if (allCorrect) feedbackCorrect();
    else feedbackWrong();

    if (allCorrect) {
      setShowCompletion(true);
      setTimeout(() => onComplete(), 1500);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conjuga el verbo "{config.verb}"</Text>

      <View style={styles.tensesTab}>
        {tenses.map((tense) => (
          <TouchableOpacity
            key={tense}
            style={[
              styles.tenseTab,
              currentTense === tense && styles.activeTenseTab,
            ]}
            onPress={() => setCurrentTense(tense)}
          >
            <Text style={styles.tenseText}>{tense}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.conjugationTable}>
        {config.pronouns.map((pronoun) => (
          <View key={pronoun} style={styles.conjugationRow}>
            <Text style={styles.pronoun}>{pronoun}</Text>

            <TouchableOpacity
              style={[
                styles.inputField,
                // Lógica de estilos de colores (verde si es correcto)
                answers[currentTense]?.[pronoun] &&
                answers[currentTense][pronoun].toLowerCase() ===
                  getCorrectAnswer(currentTense, pronoun).toLowerCase()
                  ? styles.correctInput
                  : answers[currentTense]?.[pronoun]
                    ? styles.incorrectInput
                    : null,
                isCompleted && styles.correctInput, // Forzar verde si ya está completo
              ]}
              onPress={() => {
                if (!isCompleted) {
                  setActivePronoun(pronoun);
                  setInputValue(answers[currentTense]?.[pronoun] || "");
                }
              }}
              disabled={isCompleted} // Deshabilitar el botón
            >
              <Text style={styles.inputText}>
                {answers[currentTense]?.[pronoun] || "________"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {config.hints?.showInfinitive && (
        <Text style={styles.hint}>Infinitivo: {config.verb}</Text>
      )}

      <Modal
        visible={activePronoun !== null}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {activePronoun} ({currentTense})
            </Text>

            <TextInput
              style={styles.modalInput}
              autoFocus
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={`Conjugación para ${activePronoun}`}
              onSubmitEditing={() => {
                if (activePronoun) {
                  handleConjugate(currentTense, activePronoun, inputValue);
                  setActivePronoun(null);
                }
              }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setActivePronoun(null)}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => {
                  if (activePronoun) {
                    handleConjugate(currentTense, activePronoun, inputValue);
                    setActivePronoun(null);
                  }
                }}
              >
                <Text>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showFeedback && (
        <View
          style={[
            styles.feedback,
            isCorrect ? styles.correctFeedback : styles.incorrectFeedback,
          ]}
        >
          <Text style={styles.feedbackText}>
            {isCorrect
              ? "¡Perfecto! Todas las conjugaciones son correctas"
              : "Revisa las respuestas incorrectas"}
          </Text>
        </View>
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
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  tensesTab: {
    flexDirection: "row",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tenseTab: {
    padding: 10,
    marginRight: 5,
  },
  activeTenseTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#2196F3",
  },
  tenseText: {
    fontSize: 16,
  },
  conjugationTable: {
    marginBottom: 20,
  },
  conjugationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  pronoun: {
    width: 80,
    fontSize: 16,
    fontWeight: "500",
  },
  inputField: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#bdbdbd",
    borderRadius: 5,
  },
  inputText: {
    fontSize: 16,
  },
  correctInput: {
    backgroundColor: "#e8f5e9",
    borderColor: "#a5d6a7",
  },
  incorrectInput: {
    backgroundColor: "#ffebee",
    borderColor: "#ef9a9a",
  },
  hint: {
    fontStyle: "italic",
    color: "#757575",
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#bdbdbd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
  },
  submitButton: {
    backgroundColor: "#e3f2fd",
  },
  feedback: {
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
  },
  correctFeedback: {
    backgroundColor: "#e8f5e9",
  },
  incorrectFeedback: {
    backgroundColor: "#ffebee",
  },
  feedbackText: {
    textAlign: "center",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    margin: 20,
  },
});

export default ConjugationExercise;
