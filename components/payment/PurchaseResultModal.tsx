import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export type PurchaseResult =
  | { type: "success"; levelId: string }
  | { type: "error"; message: string };

interface PurchaseResultModalProps {
  result: PurchaseResult | null;
  onDismiss: () => void;
}

const useNativeDriver = Platform.OS !== "web";

const CONFETTI_COLORS = ["#D82989", "#9365FF", "#FFD700", "#4CAF50", "#FF9500"];
const CONFETTI_COUNT = 14;

// Pieza de confeti que sale disparada desde el centro del ícono
const ConfettiPiece = ({ index, progress }: { index: number; progress: Animated.Value }) => {
  const angle = (index / CONFETTI_COUNT) * 2 * Math.PI;
  const distance = 70 + (index % 3) * 18;

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
          opacity: progress.interpolate({
            inputRange: [0, 0.2, 0.8, 1],
            outputRange: [0, 1, 1, 0],
          }),
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(angle) * distance],
              }),
            },
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(angle) * distance + 20],
              }),
            },
            {
              rotate: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", `${index % 2 ? 260 : -260}deg`],
              }),
            },
          ],
        },
      ]}
    />
  );
};

export default function PurchaseResultModal({
  result,
  onDismiss,
}: PurchaseResultModalProps) {
  const card = useRef(new Animated.Value(0)).current;
  const icon = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  const isSuccess = result?.type === "success";

  useEffect(() => {
    if (!result) return;

    card.setValue(0);
    icon.setValue(0);
    burst.setValue(0);
    shake.setValue(0);

    const entrance = Animated.parallel([
      Animated.timing(card, {
        toValue: 1,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.spring(icon, {
          toValue: 1,
          friction: 4,
          tension: 90,
          useNativeDriver,
        }),
      ]),
    ]);

    const followUp =
      result.type === "success"
        ? Animated.timing(burst, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver,
          })
        : Animated.sequence(
            [10, -10, 7, -7, 0].map((toValue) =>
              Animated.timing(shake, { toValue, duration: 60, useNativeDriver }),
            ),
          );

    Animated.sequence([entrance, followUp]).start();
  }, [result, card, icon, burst, shake]);

  if (!result) return null;

  const accent = isSuccess ? "#4CAF50" : "#FF5A5F";

  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: card }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [
                {
                  translateY: card.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
                { translateX: shake },
              ],
            },
          ]}
        >
          <View style={styles.iconArea}>
            {isSuccess &&
              Array.from({ length: CONFETTI_COUNT }, (_, i) => (
                <ConfettiPiece key={i} index={i} progress={burst} />
              ))}
            <Animated.View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: accent,
                  transform: [
                    { scale: icon },
                    {
                      rotate: icon.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["-90deg", "0deg"],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={isSuccess ? "checkmark" : "close"}
                size={52}
                color="#FFFFFF"
              />
            </Animated.View>
          </View>

          <Text style={styles.title}>
            {isSuccess ? "¡Nivel desbloqueado!" : "No se pudo completar"}
          </Text>
          <Text style={styles.message}>
            {result.type === "success"
              ? `Ya tienes acceso completo al nivel ${result.levelId}. ¡A aprender!`
              : result.message}
          </Text>

          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: isSuccess ? "#D82989" : "#4C1D95" },
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              {isSuccess ? "Empezar" : "Entendido"}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(30, 27, 75, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  iconArea: {
    width: 96,
    height: 96,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  confetti: {
    position: "absolute",
    width: 8,
    height: 12,
    borderRadius: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1E1B4B",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  button: {
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
