// Componentes de los personajes Billa y Billy. Ver lib/characters.ts.
import {
  BOARD_AREA,
  BRAND_FUCHSIA,
  BRAND_FUCHSIA_DARK,
  BRAND_FUCHSIA_SOFT,
  CHARACTER_IMAGES,
  CHARACTER_RATIO,
  CharacterEvent,
  subscribeCharacters,
} from "@/lib/characters";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

export type CharacterName = keyof typeof CHARACTER_IMAGES;

/** Imagen de un personaje con su proporción real. Se le da ancho O alto. */
export const Character = ({
  name,
  width,
  height,
  style,
}: {
  name: CharacterName;
  width?: number;
  height?: number;
  style?: any;
}) => {
  const ratio = CHARACTER_RATIO[name];
  const w = width ?? (height ?? 120) * ratio;
  const h = height ?? w / ratio;
  return (
    <Image
      source={CHARACTER_IMAGES[name]}
      style={[{ width: w, height: h }, style]}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
};

// ===================== Avatar fijo =====================

/**
 * Cara de Billa fija en la esquina inferior derecha de las pantallas de
 * lecciones y ejercicios. No captura toques (pointerEvents none), así nunca
 * tapa botones ni respuestas.
 */
export const BillaAvatar = ({ style }: { style?: ViewStyle }) => (
  <View pointerEvents="none" style={[styles.avatar, style]}>
    <Character name="billaAvatar" height={84} style={{ marginBottom: -14 }} />
  </View>
);

/** Espacio que conviene dejar al final de un ScrollView con BillaAvatar. */
export const AVATAR_SAFE_SPACE = 96;

// ===================== Pizarra de Billy =====================

const boardFontSize = (text: string, boardWidth: number) => {
  const len = text.length;
  const base = boardWidth / 6; // ~15px con pizarra de 92px
  if (len <= 10) return Math.min(18, base);
  if (len <= 22) return Math.min(15, base * 0.85);
  if (len <= 40) return Math.min(12, base * 0.72);
  return Math.min(10.5, base * 0.62);
};

// Más largo que esto no entra legible en la pizarra: se muestra debajo
const BOARD_MAX_CHARS = 60;

/**
 * Billy sosteniendo la pizarra con un texto encima.
 * `visibleHeight` (0..1) recorta la parte de abajo (la cola) para ahorrar alto.
 */
export const BillyBoard = ({
  text,
  width,
  visibleHeight = 1,
}: {
  text?: string;
  width: number;
  visibleHeight?: number;
}) => {
  const height = width / CHARACTER_RATIO.billyBoard;
  const bw = BOARD_AREA.width * width;
  const bh = BOARD_AREA.height * height;
  const fits = !!text && text.length <= BOARD_MAX_CHARS;

  return (
    <View style={{ width, height: height * visibleHeight, overflow: "hidden" }}>
      <Character name="billyBoard" width={width} />
      <View
        pointerEvents="none"
        style={[
          styles.boardText,
          {
            left: BOARD_AREA.centerX * width - bw / 2,
            top: BOARD_AREA.centerY * height - bh / 2,
            width: bw,
            height: bh,
            transform: [{ rotate: `${BOARD_AREA.rotateDeg}deg` }],
          },
        ]}
      >
        <Text
          style={[
            styles.boardTextInner,
            { fontSize: fits ? boardFontSize(text!, bw) : 22 },
          ]}
          numberOfLines={4}
          adjustsFontSizeToFit
        >
          {fits ? text : text ? "👇" : "🤔"}
        </Text>
      </View>
    </View>
  );
};

// ===================== Reacciones a aciertos / errores =====================

const CORRECT_PHRASES = [
  "¡Muy bien!",
  "¡Excelente!",
  "¡Así se hace!",
  "¡Genial!",
  "¡Correcto!",
];

const WRONG_HIDE_MS = 6000;
const CORRECT_HIDE_MS = 1400;

type Shown =
  | { kind: "correct"; who: "billa" | "billy"; phrase: string; id: number }
  | { kind: "wrong"; text?: string; label?: string; id: number };

/**
 * Capa que muestra a los personajes cuando un ejercicio avisa un acierto o
 * un error. Se monta una vez por pantalla (lección, lectura).
 * `bottomOffset`: alto de la barra de botones que no hay que tapar.
 */
export const CharacterReactions = ({
  bottomOffset = 0,
}: {
  bottomOffset?: number;
}) => {
  const [shown, setShown] = useState<Shown | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const counter = useRef(0);
  const { width: screenW } = useWindowDimensions();

  const hide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setShown(null));
  };

  useEffect(() => {
    const unsubscribe = subscribeCharacters((event: CharacterEvent) => {
      const id = ++counter.current;
      let next: Shown;
      if (event.kind === "wrong") {
        next = { kind: "wrong", text: event.text, label: event.label, id };
      } else {
        next = {
          kind: "correct",
          who: event.kind === "approval" ? "billy" : event.who,
          phrase:
            event.kind === "approval"
              ? "¡Bien hecho!"
              : CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)],
          id,
        };
      }
      setShown(next);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(
        hide,
        next.kind === "wrong" ? WRONG_HIDE_MS : CORRECT_HIDE_MS,
      );
    });
    return () => {
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!shown) return null;

  const pop = {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [40, 0],
        }),
      },
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }),
      },
    ],
  };

  if (shown.kind === "correct") {
    return (
      <View
        pointerEvents="none"
        style={[styles.layer, { bottom: bottomOffset + 8 }]}
      >
        <Animated.View style={[styles.correctWrap, pop]}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{shown.phrase}</Text>
          </View>
          <Character
            name={shown.who === "billa" ? "billaCorrect" : "billyApproval"}
            height={130}
          />
        </Animated.View>
      </View>
    );
  }

  const boardWidth = Math.min(290, screenW - 48);
  const longText =
    shown.text && shown.text.length > BOARD_MAX_CHARS ? shown.text : null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.layer, { bottom: bottomOffset + 8 }]}
    >
      <Animated.View style={[styles.wrongCard, pop]}>
        <Pressable onPress={hide} style={styles.wrongInner}>
          <Text style={styles.wrongTitle}>
            {shown.label ? `¡Casi! ${shown.label}:` : "¡Casi! Intenta de nuevo"}
          </Text>
          <BillyBoard text={shown.text} width={boardWidth} visibleHeight={0.76} />
          {longText && <Text style={styles.longText}>{longText}</Text>}
          <Text style={styles.closeHint}>Toca para cerrar</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
};

// ===================== Pantallas de celebración =====================

/**
 * Billa celebrando al completar una lección (con el XP sumado) o una unidad
 * completa. Ocupa toda la pantalla.
 */
export const CelebrationOverlay = ({
  kind,
  xp,
  bonusXp,
  onContinue,
}: {
  kind: "lesson" | "unit";
  xp: number;
  bonusXp?: number;
  onContinue?: () => void;
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const { height: screenH } = useWindowDimensions();

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const unit = kind === "unit";
  const charHeight = Math.min(unit ? 300 : 260, screenH * 0.42);

  return (
    <View style={styles.celebration}>
      <Animated.View
        style={[
          styles.celebrationCard,
          {
            opacity: anim,
            transform: [
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.7, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Character
          name={unit ? "billaUnit" : "billaLesson"}
          height={charHeight}
        />
        <Text style={styles.celebrationTitle}>
          {unit ? "¡Unidad completada!" : "¡Lección completada!"}
        </Text>
        <Text style={styles.celebrationXp}>+{xp} XP</Text>
        {unit && !!bonusXp && (
          <Text style={styles.celebrationBonus}>
            🏅 Bonus de unidad +{bonusXp} XP
          </Text>
        )}
        {onContinue && (
          <Pressable onPress={onContinue} style={styles.celebrationButton}>
            <Text style={styles.celebrationButtonText}>Continuar</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    position: "absolute",
    bottom: 10,
    right: 10,
    zIndex: 900,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: BRAND_FUCHSIA,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 6,
  },
  boardText: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  boardTextInner: {
    color: "#3F3F3F",
    fontWeight: "700",
    textAlign: "center",
  },
  layer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 950,
  },
  correctWrap: {
    alignItems: "center",
  },
  bubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: -4,
    borderWidth: 2,
    borderColor: "#4169E1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  bubbleText: {
    color: "#1F45FC",
    fontWeight: "800",
    fontSize: 16,
  },
  wrongCard: {
    marginHorizontal: 12,
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: BRAND_FUCHSIA_SOFT,
    borderColor: BRAND_FUCHSIA,
    borderWidth: 2,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  wrongInner: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },
  wrongTitle: {
    color: BRAND_FUCHSIA_DARK,
    fontWeight: "800",
    fontSize: 16,
    textAlign: "center",
    marginBottom: -6,
  },
  longText: {
    color: "#3F3F3F",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: -8,
  },
  closeHint: {
    color: BRAND_FUCHSIA_DARK,
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  celebration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: "rgba(40, 20, 80, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  celebrationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: "center",
    maxWidth: 380,
    width: "100%",
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4C1D95",
    marginTop: 10,
    textAlign: "center",
  },
  celebrationXp: {
    fontSize: 30,
    fontWeight: "900",
    color: "#D82989",
    marginTop: 4,
  },
  celebrationBonus: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND_FUCHSIA_DARK,
    marginTop: 4,
  },
  celebrationButton: {
    marginTop: 16,
    backgroundColor: "#9365FF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  celebrationButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});
