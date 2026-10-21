import { CompletionMessage } from "@/components/ui/CompletionMessage";
import { API_ENDPOINTS } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PronunciationGameProps {
  config: {
    phrase: string;
    audioUrl?: string;
    translation?: string;
  };
  onComplete: () => void;
  isCompleted: boolean;
}

const MAX_RECORDING_MS = 8000;
const MIN_MATCH = 0.75;

// expo-av graba en web con audio/webm, que Safari (iPhone/Mac) no soporta:
// se elige el primer formato que el navegador sí pueda grabar.
const recordingOptions = (): Audio.RecordingOptions => {
  const preset = Audio.RecordingOptionsPresets.HIGH_QUALITY;
  if (Platform.OS !== "web" || typeof MediaRecorder === "undefined") return preset;
  const mimeType = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) =>
    MediaRecorder.isTypeSupported?.(t),
  );
  return { ...preset, web: mimeType ? { mimeType, bitsPerSecond: 128000 } : {} };
};

const extensionFor = (mimeType: string) =>
  mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("ogg")
    ? "ogg"
    : mimeType.includes("wav")
    ? "wav"
    : "m4a";

const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\bi'm\b/g, "i am")
    .replace(/\b(he|she|it|that|what|there)'s\b/g, "$1 is")
    .replace(/\b(you|we|they)'re\b/g, "$1 are")
    .replace(/\b(i|you|we|they)'ve\b/g, "$1 have")
    .replace(/\b(i|you|he|she|we|they)'ll\b/g, "$1 will")
    .replace(/\b(i|you|he|she|we|they)'d\b/g, "$1 would")
    .replace(/\bcan't\b/g, "cannot")
    .replace(/\bwon't\b/g, "will not")
    .replace(/n't\b/g, " not")
    .replace(/\bcan not\b/g, "cannot")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\d+/g, (n) => numberToWords(Number(n)))
    .split(/\s+/)
    .filter(Boolean);

// Whisper suele escribir los números con dígitos ("25") aunque la frase diga "twenty-five"
const ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split(" ");
const TENS = "  twenty thirty forty fifty sixty seventy eighty ninety".split(" ");
const numberToWords = (n: number): string => {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
  if (n < 1000)
    return `${ONES[Math.floor(n / 100)]} hundred` + (n % 100 ? ` ${numberToWords(n % 100)}` : "");
  return String(n);
};

// cantidad de palabras de `a` que aparecen en `b` en el mismo orden (LCS)
const commonInOrder = (a: string[], b: string[]) => {
  const row = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[b.length];
};

export const PronunciationGame = (
{
  config,
  onComplete,
  isCompleted,
}: PronunciationGameProps) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(isCompleted);
  const [showCompletion, setShowCompletion] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // --- LÓGICA DE REPRODUCCIÓN DE AUDIO ---
  const playAudio = async () => {
    if (!config.audioUrl) {
      setError("No hay audio disponible para este ejercicio");
      return;
    }

    try {
      setIsPlayingAudio(true);
      setError(null);

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: config.audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
        }
      });
    } catch (err) {
      setError("No se pudo reproducir el audio");
      console.error("Error playing audio:", err);
      setIsPlayingAudio(false);
    }
  };

  // --- LIMPIAR AUDIO AL DESMONTAR ---
  React.useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // --- LÓGICA DE GRABACIÓN ---
  // Se toca una vez para empezar y otra para terminar (con mantener presionado,
  // si el usuario soltaba antes de que el micrófono arrancara, o mientras salía
  // el aviso de permiso, la grabación quedaba encendida para siempre).
  // Se usan refs porque los handlers pueden correr antes del re-render.
  const recordingRef = useRef<Audio.Recording | null>(null);
  const startingRef = useRef(false);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoStopRef.current) clearTimeout(autoStopRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    };
  }, []);

  async function startRecording() {
    if (isCompleted || startingRef.current || recordingRef.current) return;
    startingRef.current = true;
    setError(null);
    setLastTranscript("");
    setShowSuccess(false);

    try {
      if (sound) await sound.stopAsync().catch(() => {});

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError(
          "Necesitamos permiso para usar el micrófono. Actívalo en la configuración del navegador o del teléfono y vuelve a intentar.",
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions(),
      );
      recordingRef.current = newRecording;
      setRecording(newRecording);
      autoStopRef.current = setTimeout(stopRecordingAndSend, MAX_RECORDING_MS);
    } catch (err) {
      console.error("Failed to start recording", err);
      setError(
        "No se pudo encender el micrófono. Revisa que ninguna otra app lo esté usando y que hayas dado permiso.",
      );
    } finally {
      startingRef.current = false;
    }
  }

  async function stopRecordingAndSend() {
    const current = recordingRef.current;
    if (!current) return;
    recordingRef.current = null;
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current);
      autoStopRef.current = null;
    }

    try {
      setIsProcessing(true);
      setRecording(null);
      await current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(
        () => {},
      );
      const uri = current.getURI();
      if (!uri) throw new Error("La grabación no tiene archivo");

      const formData = new FormData();
      if (Platform.OS === "web") {
        const audioBlob = await (await fetch(uri)).blob();
        const mimeType = audioBlob.type || "audio/webm";
        formData.append("audio", audioBlob, `pronunciation.${extensionFor(mimeType)}`);
      } else {
        const ext = uri.split(".").pop()?.toLowerCase() || "m4a";
        formData.append("audio", {
          uri,
          name: `pronunciation.${ext}`,
          type: ext === "3gp" ? "audio/3gpp" : `audio/${ext}`,
        } as any);
      }

      const response = await fetch(API_ENDPOINTS.TRANSCRIBE, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.details || "Error del servidor");

      const text = (data.text || "").trim();
      if (!text) {
        setError("No te escuché. Toca el micrófono y habla un poco más fuerte.");
        return;
      }
      setLastTranscript(text);
      checkPronunciation(text);
    } catch (err) {
      setError("No se pudo procesar el audio. Revisa tu conexión e intenta de nuevo.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  const toggleRecording = () =>
    recordingRef.current ? stopRecordingAndSend() : startRecording();

  // --- LÓGICA DE COMPROBACIÓN ---
  // Se acepta si el usuario dijo la mayoría de las palabras de la frase en orden
  // (Whisper a veces cambia una palabra o la puntuación a quien recién aprende).
  const checkPronunciation = (transcript: string) => {
    const target = words(config.phrase);
    const spoken = words(transcript);
    const matched = commonInOrder(target, spoken);
    const ok =
      target.length > 0 &&
      matched / target.length >= MIN_MATCH &&
      spoken.length <= target.length * 2 + 2;

    if (ok) {
      setShowSuccess(true);
      setShowCompletion(true);
      setTimeout(() => onComplete(), 1500);
    } else {
      setError(`Dijiste "${transcript}". Intenta de nuevo.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.phraseCard}>
        <TouchableOpacity
          style={styles.listenIconButton}
          onPress={playAudio}
          disabled={isPlayingAudio}
        >
          <Ionicons
            name={isPlayingAudio ? "pause" : "volume-high"}
            size={32}
            color={isPlayingAudio ? "#FF9500" : "#4A90E2"}
          />
          <Text style={styles.listenText}>
            {isPlayingAudio ? "Reproduciendo..." : "Escuchar ejemplo"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.phraseText}>{config.phrase}</Text>
        {config.translation && (
          <Text style={styles.translationText}>{config.translation}</Text>
        )}
      </View>

      <View style={styles.micSection}>
        <TouchableOpacity
          onPress={toggleRecording}
          style={[
            styles.micButton,
            recording && styles.micActive,
            (isCompleted || showSuccess) && styles.micSuccess,
          ]}
          disabled={isCompleted || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" size="large" />
          ) : (
            <Ionicons
              name={
                isCompleted || showSuccess
                  ? "checkmark"
                  : recording
                  ? "mic"
                  : "mic-outline"
              }
              size={45}
              color="white"
            />
          )}
        </TouchableOpacity>

        <Text style={[styles.status, showSuccess && styles.successText]}>
          {isProcessing
            ? "Analizando..."
            : recording
            ? "Escuchando... toca para terminar"
            : showSuccess
            ? "¡Perfecto!"
            : "Toca el micrófono y di la frase"}
        </Text>
      </View>

      {lastTranscript !== "" && !showSuccess && (
        <View style={styles.feedbackBox}>
          <Text style={styles.transcript}>Entendí: "{lastTranscript}"</Text>
        </View>
      )}

      {error && !showSuccess && <Text style={styles.errorText}>{error}</Text>}

      <CompletionMessage
        visible={showCompletion}
        type="perfect"
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
    alignItems: "center",
    justifyContent: "center",
  },
  phraseCard: {
    backgroundColor: "#F8F9FA",
    width: "100%",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E9ECEF",
  },
  phraseText: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginTop: 15,
  },
  translationText: {
    fontSize: 14,
    textAlign: "center",
    color: "#6C757D",
    marginTop: 8,
    fontStyle: "italic",
  },
  listenText: { marginLeft: 8, color: "#4A90E2", fontWeight: "600" },
  micSection: { marginTop: 40, alignItems: "center" },
  micButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  micActive: { backgroundColor: "#EF4444", transform: [{ scale: 1.1 }] },
  micSuccess: { backgroundColor: "#4CAF50" },
  status: { marginTop: 15, fontSize: 16, color: "#6C757D", fontWeight: "600" },
  successText: { color: "#4CAF50" },
  feedbackBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#E9ECEF",
    borderRadius: 10,
  },
  listenIconButton: { flexDirection: "row", alignItems: "center" },
  transcript: { color: "#495057", fontStyle: "italic" },
  errorText: { marginTop: 15, color: "#DC3545", fontWeight: "500" },
});
