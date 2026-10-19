// Mazo de flashcards para el vocabulario de una lección.
// Frente: emoji/imagen + palabra en inglés. Al tocar gira y muestra traducción y ejemplos.
// Se pasa de tarjeta deslizando o con las flechas.
import Emoji3D from "@/components/ui/Emoji3D";
import SpeakButton from "@/components/ui/SpeakButton";
import { stopSpeaking } from "@/lib/speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CARD_HEIGHT = 340;
const SWIPE_DISTANCE = 50;

function Flashcard({ item }: { item: any }) {
  const flip = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  const imageUrl = item.image || item.media?.image;
  const audioUrl = item.audio || item.media?.audio;
  const emoji = !imageUrl && item.emoji;

  const toggle = () => {
    Animated.spring(flip, {
      toValue: flipped ? 0 : 1,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  const frontRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={
        flipped
          ? `${item.translation}. Toca para volver`
          : `${item.word}. Toca para ver la traducción`
      }
      style={styles.cardArea}
    >
      {/* Frente */}
      <Animated.View
        style={[
          styles.face,
          styles.front,
          { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
        ]}
        pointerEvents={flipped ? "none" : "auto"}
      >
        {emoji ? (
          <Emoji3D emoji={emoji} size={110} />
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl, cache: "force-cache" }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.placeholder}>🔤</Text>
        )}
        <Text style={styles.word}>{item.word}</Text>
        <SpeakButton text={item.word} audioUrl={audioUrl} />
        <Text style={styles.tapHint}>
          Toca la tarjeta para ver la traducción
        </Text>
      </Animated.View>

      {/* Reverso */}
      <Animated.View
        style={[
          styles.face,
          styles.back,
          { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
        ]}
        pointerEvents={flipped ? "auto" : "none"}
      >
        <Text style={styles.backWord}>{item.word}</Text>
        <Text style={styles.translation}>{item.translation}</Text>
        {item.examples?.length > 0 && (
          <View style={styles.examples}>
            {item.examples.slice(0, 2).map((ex: string, i: number) => (
              <View key={i} style={styles.exampleRow}>
                <SpeakButton text={ex} size="small" />
                <Text style={styles.example}>{`"${ex}"`}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={styles.tapHintBack}>Toca para volver</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Flashcards({ items }: { items: any[] }) {
  const [index, setIndex] = useState(0);
  const total = items.length;

  // Referencia actualizada para el PanResponder (se crea una sola vez)
  const indexRef = useRef(index);
  indexRef.current = index;

  const goTo = (next: number) => {
    if (next < 0 || next >= total) return;
    stopSpeaking();
    setIndex(next);
  };
  const goToRef = useRef(goTo);
  goToRef.current = goTo;

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  const pan = useRef(
    PanResponder.create({
      // solo gestos horizontales claros, así los toques siguen girando la tarjeta
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 15 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx <= -SWIPE_DISTANCE) goToRef.current(indexRef.current + 1);
        else if (g.dx >= SWIPE_DISTANCE) goToRef.current(indexRef.current - 1);
      },
    }),
  ).current;

  if (!total) return null;
  const item = items[Math.min(index, total - 1)];

  return (
    <View>
      <View {...pan.panHandlers}>
        {/* key: al cambiar de palabra la tarjeta nueva arranca del frente */}
        <Flashcard key={item.id || index} item={item} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => goTo(index - 1)}
          disabled={index === 0}
          style={[styles.arrow, index === 0 && styles.arrowDisabled]}
          accessibilityLabel="Palabra anterior"
        >
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {index + 1} / {total}
          </Text>
          {total <= 15 && (
            <View style={styles.dots}>
              {items.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => goTo(index + 1)}
          disabled={index === total - 1}
          style={[styles.arrow, index === total - 1 && styles.arrowDisabled]}
          accessibilityLabel="Palabra siguiente"
        >
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardArea: {
    height: CARD_HEIGHT,
  },
  face: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backfaceVisibility: "hidden",
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  front: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E4DAFF",
    gap: 12,
  },
  back: {
    backgroundColor: "#9365FF",
  },
  image: {
    width: "100%",
    height: 130,
  },
  placeholder: {
    fontSize: 64,
  },
  word: {
    fontSize: 30,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
  },
  tapHint: {
    position: "absolute",
    bottom: 14,
    fontSize: 12,
    color: "#999",
  },
  backWord: {
    fontSize: 16,
    color: "#E9E1FF",
    marginBottom: 4,
  },
  translation: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  examples: {
    marginTop: 18,
    alignSelf: "stretch",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  exampleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  example: {
    flex: 1,
    fontStyle: "italic",
    color: "#555",
  },
  tapHintBack: {
    position: "absolute",
    bottom: 14,
    fontSize: 12,
    color: "#E9E1FF",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  arrow: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#9365FF",
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: {
    backgroundColor: "#D9CCFF",
  },
  arrowText: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
  },
  counter: {
    alignItems: "center",
    flex: 1,
  },
  counterText: {
    fontWeight: "700",
    color: "#4C1D95",
    fontSize: 15,
  },
  dots: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#DDD3FF",
  },
  dotActive: {
    backgroundColor: "#9365FF",
    width: 16,
  },
});
