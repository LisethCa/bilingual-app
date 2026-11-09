import { useAuth } from "@/contexts/AuthContext";
import {
  completeReading,
  getCompletedReadings,
  getReadingById,
  Reading,
  ReadingResult,
} from "@/services/readingService";
import { XP } from "@/services/xpService";
import {
  AVATAR_SAFE_SPACE,
  BillaAvatar,
  Character,
} from "@/components/characters/Characters";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ReadingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [reading, setReading] = useState<Reading | null>(null);
  const [previous, setPrevious] = useState<ReadingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [showGlossary, setShowGlossary] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const speechSession = useRef(0);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getReadingById(id as string);
        setReading(data);
        setAnswers(Array(data?.questions.length || 0).fill(null));
        if (user && data) {
          const done = await getCompletedReadings(user.uid);
          setPrevious(done[data.id] || null);
        }
      } catch (error) {
        console.error("Error loading reading:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      speechSession.current++;
      Speech.stop();
    };
  }, [id, user]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;
  if (!reading) return <Text style={{ padding: 16 }}>Lectura no encontrada</Text>;

  const score = answers.filter((a, i) => a === reading.questions[i].answer).length;
  const allAnswered = answers.every((a) => a !== null);

  // Speak one paragraph per utterance: Chrome cuts long utterances after ~15s.
  const toggleSpeech = () => {
    if (speaking) {
      speechSession.current++;
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const session = ++speechSession.current;
    const parts = [reading.title, ...reading.text].filter((p) => p.trim());
    const speakPart = (i: number) => {
      if (session !== speechSession.current) return;
      if (i >= parts.length) {
        setSpeaking(false);
        return;
      }
      Speech.speak(parts[i], {
        language: "en-US",
        rate: 0.85,
        onDone: () => speakPart(i + 1),
        onStopped: () => {
          if (session === speechSession.current) setSpeaking(false);
        },
        onError: () => {
          if (session === speechSession.current) setSpeaking(false);
        },
      });
    };
    setSpeaking(true);
    speakPart(0);
  };

  const handleCheck = async () => {
    setChecked(true);
    if (!user) {
      setMessage("Inicia sesión para guardar tu progreso.");
      return;
    }
    try {
      const { firstTime } = await completeReading(user.uid, reading, score);
      setMessage(
        firstTime
          ? `¡Lectura completada! +${XP.reading} XP`
          : "Ya habías completado esta lectura (no obtienes XP adicional).",
      );
      setPrevious({ score: Math.max(score, previous?.score || 0), total: reading.questions.length });
    } catch (error) {
      console.error("Error saving reading:", error);
      setMessage("No se pudo guardar tu progreso.");
    }
  };

  const retry = () => {
    setAnswers(Array(reading.questions.length).fill(null));
    setChecked(false);
    setMessage("");
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.unit}>
        {reading.level} · {reading.unitTitle}
      </Text>
      <Text style={styles.title}>{reading.title}</Text>
      <Text style={styles.subtitle}>{reading.titleEs}</Text>
      {previous && (
        <Text style={styles.previous}>
          Mejor resultado: {previous.score}/{previous.total}
        </Text>
      )}

      <View style={styles.textCard}>
        <TouchableOpacity style={styles.listenButton} onPress={toggleSpeech}>
          <Text style={styles.listenText}>{speaking ? "⏹ Detener" : "🔊 Escuchar lectura"}</Text>
        </TouchableOpacity>
        {reading.text.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>

      {reading.glossary.length > 0 && (
        <View style={styles.glossaryCard}>
          <TouchableOpacity onPress={() => setShowGlossary(!showGlossary)}>
            <Text style={styles.sectionTitle}>
              {showGlossary ? "▾" : "▸"} Palabras clave ({reading.glossary.length})
            </Text>
          </TouchableOpacity>
          {showGlossary &&
            reading.glossary.map((g) => (
              <Text key={g.word} style={styles.glossaryItem}>
                <Text style={{ fontWeight: "bold" }}>{g.word}</Text> — {g.translation}
              </Text>
            ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Preguntas de comprensión</Text>
      {reading.questions.map((q, qi) => (
        <View key={qi} style={styles.questionCard}>
          <Text style={styles.question}>
            {qi + 1}. {q.question}
          </Text>
          {q.options.map((option, oi) => {
            const selected = answers[qi] === oi;
            const isCorrect = oi === q.answer;
            let style: any = styles.option;
            if (checked && isCorrect) style = [styles.option, styles.optionCorrect];
            else if (checked && selected) style = [styles.option, styles.optionWrong];
            else if (selected) style = [styles.option, styles.optionSelected];
            return (
              <TouchableOpacity
                key={oi}
                style={style}
                disabled={checked}
                onPress={() => setAnswers(answers.map((a, i) => (i === qi ? oi : a)))}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
          {checked && q.explanation && answers[qi] !== q.answer && (
            <Text style={styles.explanation}>{q.explanation}</Text>
          )}
        </View>
      ))}

      {!checked ? (
        <TouchableOpacity
          style={[styles.button, !allAnswered && styles.buttonDisabled]}
          disabled={!allAnswered}
          onPress={handleCheck}
        >
          <Text style={styles.buttonText}>Comprobar respuestas</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.resultCard}>
          {/* Billy aprueba la lectura completada */}
          <Character name="billyApproval" height={140} style={{ alignSelf: "center" }} />
          <Text style={styles.resultScore}>
            {score}/{reading.questions.length} correctas
          </Text>
          {!!message && <Text style={styles.resultMessage}>{message}</Text>}
          <View style={styles.resultButtons}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={retry}>
              <Text style={[styles.buttonText, { color: "#9365FF" }]}>Intentar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
    <BillaAvatar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: AVATAR_SAFE_SPACE, backgroundColor: "#fff", flexGrow: 1 },
  unit: { color: "#9365FF", fontWeight: "600", marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "bold", color: "#1E1B4B" },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 8, fontStyle: "italic" },
  previous: { color: "#4CAF50", fontWeight: "600", marginBottom: 8 },
  textCard: {
    backgroundColor: "#F3EFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  listenButton: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  listenText: { color: "#9365FF", fontWeight: "600" },
  paragraph: { fontSize: 17, lineHeight: 27, color: "#333", marginBottom: 12 },
  glossaryCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  glossaryItem: { fontSize: 15, color: "#444", marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8 },
  questionCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  question: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 10 },
  option: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  optionSelected: { borderColor: "#9365FF", backgroundColor: "#F3EFFF" },
  optionCorrect: { borderColor: "#4CAF50", backgroundColor: "#E8F5E9" },
  optionWrong: { borderColor: "#D16587", backgroundColor: "#FCEAF1" },
  optionText: { fontSize: 15, color: "#333" },
  explanation: { color: "#555", fontStyle: "italic", marginTop: 4 },
  button: {
    backgroundColor: "#9365FF",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: 8,
    flexGrow: 1,
  },
  buttonDisabled: { backgroundColor: "#ccc" },
  secondaryButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#9365FF" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  resultCard: { backgroundColor: "#E8F5E9", borderRadius: 12, padding: 16, marginTop: 8 },
  resultScore: { fontSize: 20, fontWeight: "bold", color: "#2E7D32", textAlign: "center" },
  resultMessage: { color: "#2E7D32", textAlign: "center", marginTop: 6 },
  resultButtons: { flexDirection: "row", gap: 10, marginTop: 8 },
});
