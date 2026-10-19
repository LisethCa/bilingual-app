// Respuesta sensorial al contestar un ejercicio: vibración + sonido corto.
// Silencioso ante cualquier error (sin audio, web sin vibración, etc.):
// nunca debe interrumpir el ejercicio.
//
// Los sonidos se precargan al abrir la lección (preloadAnswerSounds) para que
// la reproducción ocurra durante el toque del usuario: Safari de iOS bloquea
// el audio que arranca después de una espera.
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { createContext, useContext, useMemo } from "react";
import { Platform } from "react-native";

const SOURCES = {
  correct: require("../assets/audio/correct.wav"),
  wrong: require("../assets/audio/wrong.wav"),
};

type Kind = keyof typeof SOURCES;

const sounds: Partial<Record<Kind, Audio.Sound>> = {};
const loading: Partial<Record<Kind, Promise<void>>> = {};

const load = (kind: Kind) => {
  if (!loading[kind]) {
    loading[kind] = Audio.Sound.createAsync(SOURCES[kind], { volume: 0.5 })
      .then(({ sound }) => {
        sounds[kind] = sound;
      })
      .catch(() => {
        delete loading[kind]; // reintentar la próxima vez
      });
  }
  return loading[kind]!;
};

export const preloadAnswerSounds = () => {
  load("correct");
  load("wrong");
};

const play = (kind: Kind) => {
  const sound = sounds[kind];
  if (sound) {
    sound.replayAsync().catch(() => {});
    return;
  }
  // todavía no cargado: se reproduce cuando esté (en iOS web puede no sonar esta vez)
  load(kind).then(() => sounds[kind]?.replayAsync().catch(() => {}));
};

const vibrate = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(type).catch(() => {});
};

export const feedbackCorrect = () => {
  vibrate(Haptics.NotificationFeedbackType.Success);
  play("correct");
};

export const feedbackWrong = () => {
  vibrate(Haptics.NotificationFeedbackType.Error);
  play("wrong");
};

// ===== Registro de errores por ejercicio (para la nota de los exámenes) =====
// LessonContent envuelve cada ejercicio en este contexto; fuera de un examen
// onMistake no está definido y el hook se comporta igual que las funciones sueltas.
export const ExerciseAttemptContext = createContext<{
  onMistake?: () => void;
}>({});

/** feedbackCorrect / feedbackWrong que además informan el error al examen. */
export const useAnswerFeedback = () => {
  const { onMistake } = useContext(ExerciseAttemptContext);
  return useMemo(
    () => ({
      feedbackCorrect,
      feedbackWrong: () => {
        feedbackWrong();
        onMistake?.();
      },
    }),
    [onMistake],
  );
};
