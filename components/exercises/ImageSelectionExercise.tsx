import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Option = {
  image: string;
  correct: boolean; // Cambiado de isCorrect a correct para coincidir con el JSON
  feedback?: string; // Opcional para mensajes específicos
};

type ImageSelectionExerciseProps = {
  config: {
    question: string;
    options: Option[];
    multipleSelection?: boolean;
  };
  onComplete: () => void;
  isCompleted?: boolean;
  completedIndex?: number | null;
};

export default function ImageSelectionExercise({
  config = {
    question: "",
    options: [],
    multipleSelection: false,
  },
  onComplete,
  isCompleted = false,
  completedIndex = null,
}: ImageSelectionExerciseProps) {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  const [selected, setSelected] = useState<number | null>(null);
  const [completed, setCompleted] = useState(isCompleted);
  const [showCompletion, setShowCompletion] = useState(false);

  // Sincronizar el estado local con la prop isCompleted / completedIndex
  useEffect(() => {
    setCompleted(isCompleted);
    if (isCompleted) {
      setShowCompletion(true);
      if (typeof completedIndex === "number") {
        setSelected(completedIndex);
      }
    }
  }, [isCompleted, completedIndex]);

  // Asegurarnos de que siempre tenemos un array válido
  const safeOptions = config?.options || [];

  const handleSelect = (index: number) => {
    if (completed) return;

    setSelected(index);

    if (!safeOptions[index]?.correct) {
      feedbackWrong();
    } else {
      feedbackCorrect();
      setCompleted(true);
      setShowCompletion(true);
      // Mantener la selección y notificar al padre después de la animación
      setTimeout(() => {
        onComplete();
      }, 1200);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{config.question}</Text>

      {safeOptions.length > 0 ? (
        <View style={styles.optionsContainer}>
          {safeOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSelect(index)}
              disabled={completed}
              style={[
                styles.option,
                selected === index && styles.selected,
                selected !== null && option.correct && styles.correct,
                selected !== null &&
                  selected === index &&
                  !option.correct &&
                  styles.incorrect,
              ]}
            >
              <Image
                source={{ uri: option.image }}
                style={styles.image}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.errorText}>No hay opciones disponibles</Text>
      )}

      {/* Mostrar feedback específico y CompletionMessage cuando se complete */}
      {completed && selected !== null && (
        <Text style={styles.successText}>
          {safeOptions[selected]?.feedback || "¡Correcto!"}
        </Text>
      )}

      <CompletionMessage
        visible={showCompletion}
        type={safeOptions[selected ?? 0]?.correct ? "perfect" : "success"}
        duration={1200}
        onHide={() => setShowCompletion(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  question: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  option: {
    width: "48%",
    marginBottom: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 120,
  },
  selected: {
    borderWidth: 3,
    borderColor: "#2196F3",
  },
  correct: {
    borderWidth: 3,
    borderColor: "#4CAF50",
  },
  incorrect: {
    borderWidth: 3,
    borderColor: "#F44336",
  },
  successText: {
    color: "#4CAF50",
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginVertical: 20,
  },
});
