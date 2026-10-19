import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { useAnswerFeedback } from "@/lib/answerFeedback";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ListeningExercise({
  config,
  onComplete,
}: {
  config: any;
  onComplete: () => void;
}) {
  const { feedbackCorrect, feedbackWrong } = useAnswerFeedback();
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [shuffledBank, setShuffledBank] = useState<string[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    setShuffledBank([...config.wordBank].sort(() => Math.random() - 0.5));
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [config]);

  // Sin audio grabado se usa la voz del dispositivo con la oración correcta
  const useVoice = !config.audioUrl;

  async function playAudio(isSlow = false) {
    if (useVoice) {
      // sin await antes de hablar: Safari de iOS exige que ocurra durante el toque
      Speech.stop();
      Speech.speak(config.correctSentence, {
        language: "en-US",
        rate: isSlow ? 0.55 : 0.85,
      });
      return;
    }

    if (sound) await sound.unloadAsync();
    const { sound: newSound } = await Audio.Sound.createAsync({
      uri: isSlow ? config.slowAudioUrl || config.audioUrl : config.audioUrl,
    });
    if (isSlow) {
      await newSound.setRateAsync(0.6, true);
    }
    setSound(newSound);
    await newSound.playAsync();
  }

  useEffect(() => () => {
    Speech.stop();
  }, []);

  const toggleWord = (word: string, index: number, isFromBank: boolean) => {
    if (isFromBank) {
      setSelectedWords([...selectedWords, word]);
      setShuffledBank(shuffledBank.filter((_, i) => i !== index));
    } else {
      setShuffledBank([...shuffledBank, word]);
      setSelectedWords(selectedWords.filter((_, i) => i !== index));
    }
  };

  const checkAnswer = () => {
    // ignorar mayúsculas y puntuación ("It is 8." == "it is 8")
    const normalize = (s: string) =>
      s.toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();
    if (normalize(selectedWords.join(" ")) === normalize(config.correctSentence)) {
      feedbackCorrect();
      setShowCompletion(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } else {
      feedbackWrong();
      alert("Inténtalo de nuevo");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Escucha y ordena la frase</Text>

      {/* Controles de Audio */}
      <View style={styles.audioRow}>
        <TouchableOpacity
          style={styles.audioBtn}
          onPress={() => playAudio(false)}
        >
          <Ionicons name="volume-high" size={32} color="white" />
        </TouchableOpacity>
        {(config.slowAudioUrl || useVoice) && (
          <TouchableOpacity
            style={[styles.audioBtn, styles.slowBtn]}
            onPress={() => playAudio(true)}
          >
            <Text style={styles.slowIcon}>🐢</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Área de construcción de frase */}
      <View style={styles.sentenceArea}>
        {selectedWords.map((word, i) => (
          <TouchableOpacity
            key={i}
            style={styles.wordChip}
            onPress={() => toggleWord(word, i, false)}
          >
            <Text style={styles.wordText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Banco de palabras */}
      <View style={styles.bankArea}>
        {shuffledBank.map((word, i) => (
          <TouchableOpacity
            key={i}
            style={styles.bankChip}
            onPress={() => toggleWord(word, i, true)}
          >
            <Text style={styles.wordText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.checkBtn,
          selectedWords.length === 0 && styles.disabledBtn,
        ]}
        onPress={checkAnswer}
        disabled={selectedWords.length === 0}
      >
        <Text style={styles.checkBtnText}>COMPROBAR</Text>
      </TouchableOpacity>

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
  container: { padding: 15, alignItems: "center" },
  instruction: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  audioRow: { flexDirection: "row", gap: 15, marginBottom: 30 },
  audioBtn: { backgroundColor: "#1CB0F6", padding: 15, borderRadius: 50 },
  slowIcon: { fontSize: 24 },
  slowBtn: { backgroundColor: "#FFC800", padding: 15 },
  sentenceArea: {
    width: "100%",
    minHeight: 100,
    borderBottomWidth: 2,
    borderColor: "#E5E5E5",
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  bankArea: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 30,
  },
  wordChip: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    padding: 10,
    borderRadius: 10,
  },
  bankChip: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    padding: 10,
    borderRadius: 10,
    elevation: 2,
  },
  wordText: { fontSize: 16 },
  checkBtn: {
    backgroundColor: "#58CC02",
    width: "100%",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  checkBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  disabledBtn: { backgroundColor: "#E5E5E5" },
});
