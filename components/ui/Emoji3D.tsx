import { Image } from "expo-image";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

// Fluent Emoji 3D de Microsoft (licencia MIT), empaquetados por @lobehub como
// WebP (~4 KB) nombrados por código Unicode. Versión fija para que las URLs no cambien.
const FLUENT_3D_BASE =
  "https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets";

/** "👋" -> "1f44b", "☀️" -> "2600-fe0f", "#️⃣" -> "0023-fe0f-20e3" */
export const emojiToCodepoints = (emoji: string) =>
  Array.from(emoji)
    .map((char) => char.codePointAt(0)!.toString(16).padStart(4, "0"))
    .join("-");

export const fluentEmojiUrl = (emoji: string) =>
  `${FLUENT_3D_BASE}/${emojiToCodepoints(emoji)}.webp`;

type Emoji3DProps = {
  emoji: string;
  size?: number;
};

/** Emoji en 3D; si la imagen no carga muestra el emoji de texto del sistema. */
export default function Emoji3D({ emoji, size = 56 }: Emoji3DProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 0.75 }}>{emoji}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: fluentEmojiUrl(emoji) }}
      style={{ width: size, height: size }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={150}
      accessibilityLabel={emoji}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
