import { useAuth } from "@/contexts/AuthContext";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_MAX_LENGTH,
  FeedbackCategory,
  submitFeedback,
} from "@/services/feedbackService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const RATING_LABELS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];

export default function FeedbackScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>("suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!user && rating > 0 && message.trim().length >= 5 && !sending;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSending(true);
    setError(null);
    try {
      await submitFeedback(user, { rating, category, message });
      setSent(true);
    } catch (e) {
      console.error("❌ Error enviando opinión:", e);
      setError("No se pudo enviar tu opinión. Intenta nuevamente.");
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Tu opinión</Text>
          <Text style={styles.subtitle}>
            Inicia sesión para enviarnos tus comentarios.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push("/login")}>
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.thanksEmoji}>🙌</Text>
          <Text style={styles.title}>¡Gracias por tu opinión!</Text>
          <Text style={styles.subtitle}>
            La leemos para decidir qué mejorar y qué contenido agregar.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Tu opinión</Text>
        <Text style={styles.subtitle}>
          Ayúdanos a mejorar la app: cuéntanos qué te gusta, qué falta o qué
          no funciona.
        </Text>

        <Text style={styles.label}>¿Cómo calificarías la app?</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => setRating(value)}
              accessibilityLabel={`${value} estrellas`}
            >
              <Text style={[styles.star, value <= rating && styles.starActive]}>
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>

        <Text style={styles.label}>¿Sobre qué es tu comentario?</Text>
        <View style={styles.chipsRow}>
          {FEEDBACK_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.chip, category === c.id && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, category === c.id && styles.chipTextActive]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tu comentario</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Ej: Me gustaría más ejercicios de pronunciación..."
          placeholderTextColor="#999"
          multiline
          maxLength={FEEDBACK_MAX_LENGTH}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>
          {message.length}/{FEEDBACK_MAX_LENGTH}
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {sending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Enviar opinión</Text>
          )}
        </TouchableOpacity>

        {rating === 0 && (
          <Text style={styles.hint}>Elige una calificación para poder enviar.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#9365FF",
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4C1D95",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4C1D95",
    marginTop: 12,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  star: {
    fontSize: 38,
    color: "#DDD",
  },
  starActive: {
    color: "#FF9500",
  },
  ratingLabel: {
    textAlign: "center",
    color: "#666",
    minHeight: 18,
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#D8C8FF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F7F3FF",
  },
  chipActive: {
    backgroundColor: "#9365FF",
    borderColor: "#9365FF",
  },
  chipText: {
    color: "#4C1D95",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D8C8FF",
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    fontSize: 15,
    color: "#333",
    backgroundColor: "#FAFAFF",
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  error: {
    color: "#FF5A5F",
    textAlign: "center",
    marginTop: 8,
  },
  button: {
    backgroundColor: "#D82989",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  thanksEmoji: {
    fontSize: 48,
    textAlign: "center",
    marginBottom: 8,
  },
});
