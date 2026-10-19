import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function FillBlankExercise({
  questions,
  onComplete,
}: {
  questions: any[];
  onComplete: () => void;
}) {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  if (!questions || questions.length === 0 || !questions[currentIndex]) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No hay preguntas disponibles.</Text>
      </View>
    );
  }

  const q = questions[currentIndex];
  const correctAnswer: string = q.correct ?? q.answer ?? "";
  const options: string[] =
    q.options ??
    [
      ...new Set(
        questions.map((item: any) => item.correct ?? item.answer ?? ""),
      ),
    ].filter(Boolean);

  const progress = currentIndex / questions.length;

  const handleAnswer = (option: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(option);

    const isCorrect = option === correctAnswer;
    if (isCorrect) feedbackCorrect();
    else feedbackWrong();

    setTimeout(() => {
      const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
      const isLast = currentIndex === questions.length - 1;

      if (isLast) {
        setShowCompletion(true);
        setTimeout(() => onComplete(), 1200);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        if (isCorrect) setCorrectCount(newCorrectCount);
      }
    }, 1000);
  };

  const getOptionStyle = (option: string) => {
    if (selectedOption === null) return styles.option;
    if (option === correctAnswer) return [styles.option, styles.optionCorrect];
    if (option === selectedOption) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDisabled];
  };

  const getOptionTextStyle = (option: string) => {
    if (selectedOption === null) return styles.optionText;
    if (option === correctAnswer || option === selectedOption)
      return [styles.optionText, styles.optionTextSelected];
    return styles.optionText;
  };

  // Split sentence to highlight the blank
  const parts = (q.sentence ?? "").split("___");

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      <Text style={styles.counter}>
        {currentIndex + 1} / {questions.length}
      </Text>

      {/* Sentence with blank highlighted */}
      <View style={styles.sentenceCard}>
        <View style={styles.sentenceRow}>
          <Text style={styles.sentenceText}>{parts[0]}</Text>
          <View style={styles.blankBox}>
            <Text style={styles.blankAnswer}>
              {selectedOption !== null ? selectedOption : "___"}
            </Text>
          </View>
          {parts[1] ? <Text style={styles.sentenceText}>{parts[1]}</Text> : null}
        </View>
      </View>

      {/* Feedback */}
      {selectedOption !== null && q.feedback && (
        <View
          style={[
            styles.feedbackBox,
            selectedOption === correctAnswer
              ? styles.feedbackCorrect
              : styles.feedbackWrong,
          ]}
        >
          <Text style={styles.feedbackText}>
            {selectedOption === correctAnswer
              ? q.feedback
              : `❌ La respuesta correcta es "${correctAnswer}"`}
          </Text>
        </View>
      )}

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={getOptionStyle(option)}
            onPress={() => handleAnswer(option)}
            disabled={selectedOption !== null}
          >
            <Text style={getOptionTextStyle(option)}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <CompletionMessage
        visible={showCompletion}
        type="success"
        duration={1200}
        onHide={() => setShowCompletion(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#9e9e9e",
    fontSize: 16,
    marginTop: 40,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#58CC02",
    borderRadius: 4,
  },
  counter: {
    textAlign: "right",
    fontSize: 13,
    color: "#9e9e9e",
    marginBottom: 24,
  },
  sentenceCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E9ECEF",
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  sentenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sentenceText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  blankBox: {
    borderBottomWidth: 2,
    borderColor: "#9365FF",
    minWidth: 60,
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 2,
  },
  blankAnswer: {
    fontSize: 22,
    fontWeight: "700",
    color: "#9365FF",
  },
  feedbackBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  feedbackCorrect: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  feedbackWrong: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  feedbackText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  optionCorrect: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  optionWrong: {
    backgroundColor: "#FFEBEE",
    borderColor: "#e74c3c",
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  optionTextSelected: {
    color: "#333",
  },
});
