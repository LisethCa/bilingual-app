// Personajes de la marca (Billa la nutria y Billy el delfín).
//
// Los ejercicios avisan aciertos y errores con showCharacterCorrect /
// showCharacterWrong (o a través de feedbackCorrect / feedbackWrong en
// lib/answerFeedback). <CharacterReactions /> escucha y muestra:
//  - acierto: Billa aplaudiendo, o al azar Billy con el pulgar arriba
//  - error: Billy con la pizarra, que muestra la respuesta correcta o el tip
//    gramatical del ejercicio (datos que vienen de la lección en Firestore)
//
// No depende del nivel: cualquier ejercicio nuevo (B1, B2...) que use estas
// funciones tiene los personajes automáticamente.

export const CHARACTER_IMAGES = {
  billaCorrect: require("../assets/characters/billa_ejercicio_correcto.svg"),
  billaLesson: require("../assets/characters/billa_leccion_completada.svg"),
  billaUnit: require("../assets/characters/billa_unidad_completada.svg"),
  billaAvatar: require("../assets/characters/billa_avatar_fijo.svg"),
  billyWelcome: require("../assets/characters/billy_bienvenida.svg"),
  billyApproval: require("../assets/characters/billy_aprobacion.svg"),
  billyBoard: require("../assets/characters/billy_correccion_pizarra.svg"),
};

// ancho / alto de cada imagen (viewBox recortado)
export const CHARACTER_RATIO = {
  billaCorrect: 626 / 900,
  billaLesson: 646 / 884,
  billaUnit: 728 / 1050,
  billaAvatar: 692 / 903,
  billyWelcome: 698 / 742,
  billyApproval: 728 / 740,
  billyBoard: 834 / 836,
};

// Zona blanca de la pizarra dentro de billy_correccion_pizarra.svg,
// en fracciones del ancho/alto de la imagen. Está girada.
export const BOARD_AREA = {
  centerX: 0.2298,
  centerY: 0.5369,
  width: 0.33,
  height: 0.1928,
  rotateDeg: -13.84,
};

/** Color de marca (capa de Billa) para reemplazar los fondos rojos de error. */
export const BRAND_FUCHSIA = "#D16587";
export const BRAND_FUCHSIA_SOFT = "#FCEAF1";
export const BRAND_FUCHSIA_DARK = "#9C2F5B";

export type WrongInfo = {
  /** respuesta correcta del ejercicio */
  answer?: string;
  /** tip gramatical; si existe se muestra en lugar de la respuesta */
  tip?: string;
  /** no mostrar a Billy (p. ej. pares que no coinciden en el memory) */
  quiet?: boolean;
};

export type CharacterEvent =
  | { kind: "correct"; who: "billa" | "billy" }
  | { kind: "wrong"; text?: string; label?: string }
  | { kind: "approval" };

type Listener = (event: CharacterEvent) => void;
const listeners = new Set<Listener>();

export const subscribeCharacters = (fn: Listener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const emit = (event: CharacterEvent) => {
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      // un personaje nunca debe romper un ejercicio
    }
  });
};

/** Probabilidad de que el acierto lo celebre Billy en lugar de Billa. */
const BILLY_SHARE = 0.35;

export const showCharacterCorrect = () =>
  emit({
    kind: "correct",
    who: Math.random() < BILLY_SHARE ? "billy" : "billa",
  });

/** Billy aprobando de forma fija (lectura completada, etc.). */
export const showCharacterApproval = () => emit({ kind: "approval" });

const clean = (s?: unknown) =>
  typeof s === "string" && s.trim() ? s.trim() : undefined;

export const showCharacterWrong = (info: WrongInfo = {}) => {
  if (info.quiet) return;
  const tip = clean(info.tip);
  const answer = clean(info.answer);
  emit({
    kind: "wrong",
    text: tip ?? answer,
    label: tip ? "Tip" : answer ? "Respuesta correcta" : undefined,
  });
};

/** Tip gramatical opcional de un ejercicio o pregunta (si el contenido lo trae). */
export const tipOf = (...sources: any[]): string | undefined => {
  for (const s of sources) {
    const tip = clean(s?.tip) ?? clean(s?.grammarTip) ?? clean(s?.explanation);
    if (tip) return tip;
  }
  return undefined;
};
