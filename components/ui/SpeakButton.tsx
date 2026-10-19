import { speakEnglish, stopSpeaking } from "@/lib/speech";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

type SpeakButtonProps = {
  text: string;
  audioUrl?: string;
  size?: "small" | "normal";
  style?: ViewStyle;
};

/** Botón 🔊 que pronuncia una palabra o frase en inglés. */
export default function SpeakButton({
  text,
  audioUrl,
  size = "normal",
  style,
}: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const handlePress = async () => {
    if (speaking) {
      await stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    await speakEnglish(text, audioUrl);
    if (mounted.current) setSpeaking(false);
  };

  const small = size === "small";

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityLabel={`Escuchar: ${text}`}
      hitSlop={8}
      style={[
        styles.button,
        small && styles.buttonSmall,
        speaking && styles.buttonActive,
        style,
      ]}
    >
      <Text style={small ? styles.iconSmall : styles.icon}>
        {speaking ? "⏹" : "🔊"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  buttonActive: {
    backgroundColor: "#D8C8FF",
  },
  icon: { fontSize: 18 },
  iconSmall: { fontSize: 13 },
});
