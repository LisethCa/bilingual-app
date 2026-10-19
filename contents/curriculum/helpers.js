// Constructores compactos para escribir contenido de lecciones.
// Cada uno devuelve un ejercicio con la misma forma que ya existe en Firestore.
// El id lo asigna build.js (o se conserva el original al reemplazar).

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const base = (type, title, instructions, config, extra = {}) => ({
  type,
  title,
  instructions: instructions || "",
  question: "",
  config,
  feedback: {},
  scoring: { pointsPerCorrect: 1 },
  ...extra,
});

// "Hello = Hola" -> ["Hello", "Hola"]
const pair = (p) => (Array.isArray(p) ? p : p.split(" = ").map((s) => s.trim()));

const tokens = (sentence) =>
  sentence
    .replace(/[.,!?;:]/g, "")
    .split(/\s+/)
    .filter(Boolean);

/** Palabra de vocabulario: v("Hello", "Hola", "Hello, how are you?") */
const v = (word, translation, ...examples) => ({
  id: "voc_" + slug(word),
  word,
  translation,
  examples,
  conjugations: null,
  tags: [],
});

/** Explicación de gramática: g(título, explicación, [regla, ejemplo, ejemplo...], ...) */
const g = (title, explanation, ...rules) => ({
  title,
  explanation,
  rules: rules.map(([rule, ...examples]) => ({ rule, examples })),
});

const match = (title, pairs, instr = "Une cada elemento con su pareja.") =>
  base("matching", title, instr, {
    pairs: pairs.map(pair).map(([from, to]) => ({ from, to })),
  });

const memory = (title, pairs, instr = "Encuentra las parejas.") => {
  const p = pairs.map(pair).map(([front, back]) => ({ front, back }));
  return base("memory_game", title, instr, { pairs: p }, { pairs: p });
};

/** fill(título, ["I ___ a student. | am | is, are", ...]) -> oración | respuesta | distractores */
const fill = (title, questions, instr = "Elige la opción correcta para completar cada oración.") =>
  base("fill_in_blank", title, instr, {
    questions: questions.map((q, i) => {
      const [sentence, answer, rest] = q.split(" | ").map((s) => s.trim());
      const options = rest.split(",").map((s) => s.trim());
      // la respuesta correcta rota de posición para que no quede siempre primera
      options.splice(i % (options.length + 1), 0, answer);
      return { sentence, options, answer };
    }),
  });

/** build(título, pista, respuesta(s), distractores) -> ordenar palabras */
const build = (title, question, answers, distractors = [], instr = "Ordena las palabras para formar la oración.") => {
  const correctAnswers = Array.isArray(answers) ? answers : [answers];
  return base(
    "sentence_formation",
    title,
    instr,
    {
      wordBank: [...tokens(correctAnswers[0]), ...distractors],
      correctAnswers,
      requiredWords: [],
      timeLimit: 0,
      showStartButton: false,
      title,
      question,
    },
    { question },
  );
};

const drag = (title, pairs, instr = "Arrastra cada elemento hasta su pareja.") =>
  base(
    "drag_drop",
    title,
    instr,
    {
      pairs: pairs.map(pair).map(([from, to], i) => ({ id: `p${i + 1}`, from, to })),
      question: instr,
    },
    { dragItems: [], dropZones: [] },
  );

const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#E91E63"];

/** cat(título, [["Nombre categoría", ["item", "item"]], ...]) -> clasificar */
const cat = (title, categories, instr = "Clasifica cada palabra en su categoría.") => {
  const items = [];
  const cats = categories.map(([name, list], ci) => {
    const id = slug(name) || `cat${ci}`;
    list.forEach((text) => items.push({ category: id, text }));
    return { id, name, color: COLORS[ci % COLORS.length] };
  });
  // intercalar para que no queden agrupados por categoría
  const mixed = [];
  const queues = cats.map((c) => items.filter((it) => it.category === c.id));
  while (queues.some((q) => q.length)) queues.forEach((q) => q.length && mixed.push(q.shift()));
  return base("vocabulary", title, instr, {
    categories: cats,
    items: mixed.map((it, i) => ({ id: `item${i + 1}`, ...it })),
  });
};

/** conj(título, verbo, tiempo, { I: "am", You: "are" }) -> escribir la forma correcta */
const conj = (title, verb, tense, correct, instr = "Escribe la forma correcta para cada pronombre.") =>
  base("conjugation", title, instr, {
    verb,
    tenses: [tense],
    pronouns: Object.keys(correct),
    correct: { [tense]: correct },
  });

/**
 * dialog(título, situación, [[personaje, frase, respuestaCorrecta, respuestaIncorrecta, pista?], ...])
 * Cada paso: habla el personaje y el alumno elige la respuesta correcta.
 */
const dialog = (title, scenario, steps, instr = "Elige la respuesta correcta para continuar la conversación.") =>
  base("dialogue_simulation", title, instr, {
    scenario,
    dialogues: steps.map(([character, text, right, wrong, hint], i) => {
      const options = [
        { text: right, correct: true, feedback: "✅ ¡Correcto!" },
        { text: wrong, correct: false, feedback: hint ? `❌ ${hint}` : "❌ Esa respuesta no encaja. Intenta de nuevo." },
      ];
      return { character, text, options: i % 2 ? options.reverse() : options };
    }),
  });

const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[.,!?;:¿¡"]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// ¿se puede armar la oración usando cada ficha del banco una sola vez?
const buildable = (sentence, wordBank) => {
  const bank = wordBank.map(norm);
  const used = new Array(bank.length).fill(false);
  const rec = (rest) => {
    if (rest === "") return true;
    for (let k = 0; k < bank.length; k++) {
      if (used[k] || !bank[k]) continue;
      if (rest === bank[k] || rest.startsWith(bank[k] + " ")) {
        used[k] = true;
        if (rec(rest.slice(bank[k].length).trim())) return true;
        used[k] = false;
      }
    }
    return false;
  };
  return rec(norm(sentence));
};

// volcado más reciente de Firestore (contents/backups/firestore-dump-AAAA-MM-DD[-HHMMSS].json), generado por dump.js
const latestDump = () => {
  const fs = require("fs");
  const path = require("path");
  const dir = path.join(__dirname, "../backups");
  const name = fs
    .readdirSync(dir)
    .filter((f) => /^firestore-dump-\d{4}-\d{2}-\d{2}(-\d{6})?\.json$/.test(f))
    .sort((a, b) => a.replace(".json", "").localeCompare(b.replace(".json", ""))) // sin hora < con hora
    .pop();
  if (!name) throw new Error("No hay volcado: correr node contents/curriculum/dump.js");
  return path.join(dir, name);
};

// JSON con las claves ordenadas: Firestore no conserva el orden de las claves al reescribir un documento
const stableStringify = (x) =>
  Array.isArray(x)
    ? `[${x.map(stableStringify).join(",")}]`
    : x && typeof x === "object"
      ? `{${Object.keys(x)
          .sort()
          .map((k) => `${JSON.stringify(k)}:${stableStringify(x[k])}`)
          .join(",")}}`
      : JSON.stringify(x);

module.exports = { v, g, match, memory, fill, build, drag, cat, conj, dialog, tokens, slug, latestDump, stableStringify, norm, buildable };
