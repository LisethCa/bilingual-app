// components/Games/DialogueSimulation.tsx
import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type DialogueOption = string | { text: string; correct?: boolean; feedback?: string };

function getOptionText(option: DialogueOption): string {
  return typeof option === "string" ? option : option.text;
}

interface DialogueSimulationProps {
  config: {
    scenario: string;
    dialogues?: Array<{
      character: string;
      text: string;
      options?: DialogueOption[];
    }>;
    phrases?: {
      [role: string]: string[];
    };
  };
  onComplete: (success: boolean) => void;
  isCompleted?: boolean;
}

const DialogueSimulation: React.FC<DialogueSimulationProps> = ({
  config,
  onComplete,
  isCompleted = false,
}) => {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  const [currentStep, setCurrentStep] = useState(0);
  const [isExerciseCompleted, setIsExerciseCompleted] = useState(isCompleted);
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedDialogueHistory, setCompletedDialogueHistory] = useState<
    Array<{ speaker: string; text: string }>
  >([]);
  const [dialogueHistory, setDialogueHistory] = useState<
    Array<{ speaker: string; text: string }>
  >([]);
  const [currentSpeaker, setCurrentSpeaker] = useState("Waiter");
  const [wrongFeedback, setWrongFeedback] = useState<string | null>(null);

  // Sincronizar cuando isCompleted cambia a true
  useEffect(() => {
    if (isCompleted) {
      setIsExerciseCompleted(true);
      // Si completedDialogueHistory tiene contenido, restaurar el historial
      if (completedDialogueHistory.length > 0) {
        setDialogueHistory(completedDialogueHistory);
      }
    }
  }, [isCompleted]);

  // Mostrar CompletionMessage cuando se completa (solo una vez)
  useEffect(() => {
    if (
      isExerciseCompleted &&
      !showCompletion &&
      completedDialogueHistory.length > 0
    ) {
      setShowCompletion(true);
    }
  }, [isExerciseCompleted, completedDialogueHistory]);

  // Inicializar el primer diálogo del NPC cuando carga el componente
  // Solo si NO está completado y el historial está vacío
  useEffect(() => {
    if (
      config.dialogues &&
      dialogueHistory.length === 0 &&
      !isExerciseCompleted
    ) {
      const firstDialogue = config.dialogues[0];
      if (firstDialogue && firstDialogue.character !== "user") {
        setDialogueHistory([
          {
            speaker: firstDialogue.character,
            text: firstDialogue.text,
          },
        ]);
      }
    }
  }, [config.dialogues, isExerciseCompleted]);

  const useDialoguesStructure = !!config.dialogues;

  if (useDialoguesStructure) {
    const currentDialogue = config.dialogues?.[currentStep];
    const userOptions = currentDialogue?.options || [];

    const handleOptionSelect = (option: DialogueOption) => {
      if (isExerciseCompleted) return;

      // Si el paso marca una opción como correcta, solo esa permite avanzar.
      // Los diálogos antiguos (opciones sin marcar) siguen aceptando cualquiera.
      const hasCorrectOption = userOptions.some(
        (o) => typeof o !== "string" && o.correct,
      );
      if (hasCorrectOption && (typeof option === "string" || !option.correct)) {
        feedbackWrong();
        setWrongFeedback(
          (typeof option !== "string" && option.feedback) ||
            "Esa respuesta no encaja. Intenta de nuevo.",
        );
        return;
      }
      setWrongFeedback(null);
      if (hasCorrectOption) feedbackCorrect();

      const optionText = getOptionText(option);
      const userEntry = { speaker: "Tú", text: optionText };
      const newHistory = [...dialogueHistory, userEntry];

      if (currentStep < (config.dialogues?.length || 0) - 1) {
        const nextDialogue = config.dialogues?.[currentStep + 1];
        if (nextDialogue) {
          const npcEntry = {
            speaker:
              nextDialogue.character === "user" ? "Tú" : nextDialogue.character,
            text: nextDialogue.text,
          };
          newHistory.push(npcEntry);
        }
      }

      if (currentStep >= (config.dialogues?.length || 0) - 1) {
        // Guardar el historial completo antes de marcar como completado
        const finalHistory = newHistory;
        setDialogueHistory(finalHistory);
        setCompletedDialogueHistory(finalHistory);
        setIsExerciseCompleted(true);
        setShowCompletion(true);
        onComplete(true);
      } else {
        setDialogueHistory(newHistory);
        setCurrentStep(currentStep + 1);
      }
    };

    return (
      <View style={styles.container}>
        <Text style={styles.scenarioText}>Situación: {config.scenario}</Text>

        <ScrollView
          style={styles.dialogueBox}
          ref={(ref) => ref?.scrollToEnd({ animated: true })} // Auto-scroll al final
        >
          {dialogueHistory.map((item, index) => (
            <View
              key={index}
              style={[
                styles.bubble,
                item.speaker === "Tú" ? styles.userBubble : styles.npcBubble,
              ]}
            >
              <Text
                style={[
                  styles.speakerText,
                  item.speaker === "Tú" && styles.userText,
                ]}
              >
                {item.speaker}:
              </Text>
              <Text
                style={[
                  styles.bubbleText,
                  item.speaker === "Tú" && styles.userText,
                ]}
              >
                {item.text}
              </Text>
            </View>
          ))}

          {/* Solo mostramos el diálogo pendiente si NO hemos terminado y existe */}
          {!isExerciseCompleted &&
            currentDialogue &&
            currentDialogue.character !== "user" &&
            !dialogueHistory.some(
              (item) =>
                item.text === currentDialogue.text &&
                item.speaker === currentDialogue.character
            ) && (
              <View style={[styles.bubble, styles.npcBubble]}>
                <Text style={styles.speakerText}>
                  {currentDialogue.character}:
                </Text>
                <Text style={styles.bubbleText}>{currentDialogue.text}</Text>
              </View>
            )}
        </ScrollView>

        {/* 3. Ocultar opciones si ya está completado */}
        {!isExerciseCompleted && userOptions.length > 0 && (
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Elige tu respuesta:</Text>
            {wrongFeedback && (
              <Text style={styles.wrongFeedbackText}>{wrongFeedback}</Text>
            )}
            {userOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleOptionSelect(option)}
              >
                <Text style={styles.optionText}>{getOptionText(option)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Botón de estado final */}
        {isExerciseCompleted && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedBannerText}>
              ✓ Simulación finalizada
            </Text>
          </View>
        )}

        {/* Botón Continuar (solo si no hay opciones y no se ha completado) */}
        {!isExerciseCompleted &&
          currentStep >= (config.dialogues?.length || 0) - 1 &&
          userOptions.length === 0 && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => {
                setIsExerciseCompleted(true);
                setCompletedDialogueHistory(dialogueHistory);
                setShowCompletion(true);
                onComplete(true);
              }}
            >
              <Text style={styles.completeButtonText}>Finalizar</Text>
            </TouchableOpacity>
          )}

        <CompletionMessage
          visible={showCompletion}
          type="success"
          duration={1200}
          onHide={() => setShowCompletion(false)}
        />
      </View>
    );
  }

  const handleOptionSelectOld = (option: string) => {
    const newHistory = [
      ...dialogueHistory,
      { speaker: "Tú", text: option },
      {
        speaker: currentSpeaker,
        text:
          config.phrases?.[currentSpeaker]?.[currentStep + 1] || "¡Gracias!",
      },
    ];

    setDialogueHistory(newHistory);

    if (currentStep >= (config.phrases?.[currentSpeaker]?.length || 0) - 1) {
      onComplete(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.scenarioText}>Situación: {config.scenario}</Text>

      <View style={styles.dialogueBox}>
        {dialogueHistory.map((item, index) => (
          <View
            key={index}
            style={[
              styles.bubble,
              item.speaker === "Tú" ? styles.userBubble : styles.npcBubble,
            ]}
          >
            <Text style={styles.speakerText}>{item.speaker}:</Text>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        ))}
      </View>

      {currentStep < (config.phrases?.[currentSpeaker]?.length || 0) && (
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Elige tu respuesta:</Text>
          {(config.phrases?.["UserOptions"] || []).map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => handleOptionSelectOld(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Estilos mejorados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scenarioText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  dialogueBox: {
    flex: 1,
    marginBottom: 20,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  npcBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
  },
  speakerText: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bubbleText: {
    fontSize: 16,
  },
  userText: {
    color: "white",
  },
  optionsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingTop: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  optionButton: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  optionText: {
    fontSize: 16,
    textAlign: "center",
  },
  wrongFeedbackText: {
    color: "#C62828",
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    textAlign: "center",
  },
  completeButton: {
    backgroundColor: "#34C759",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  completedButtonStyle: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  completedBanner: {
    backgroundColor: "#EBFBEE",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#D3F9D8",
    alignItems: "center",
  },
  completedBannerText: {
    color: "#2B8A3E",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DialogueSimulation;
