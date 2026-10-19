// Quita ejercicios y palabras de vocabulario repetidos dentro de cada lección.
// Origen: el 2026-10-06 se aplicó A1 dos veces y build.js volvió a sumar sus agregados
// sobre lecciones que ya los tenían, así que quedaron duplicados (mismo id, mismo contenido).
// Genera contents/curriculum/out/<nivel>-dedupe.json para apply.js --dedupe. No escribe en Firestore.
//
//   node contents/curriculum/dedupe.js A1 [ruta-al-volcado.json]
//
// Solo quita una copia si es idéntica a la primera; si dos ejercicios comparten id pero
// difieren, lo informa como error y no toca esa lección.

const fs = require("fs");
const path = require("path");
const { latestDump, stableStringify } = require("./helpers");

const LEVEL = (process.argv[2] || "A1").toUpperCase();
const MODULE_ID = { A1: "basics", A2: "basics_a2" }[LEVEL];
if (!MODULE_ID) throw new Error(`Nivel desconocido: ${LEVEL}`);

const dumpPath = process.argv[3] ? path.resolve(process.argv[3]) : latestDump();
const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));

const errors = [];
const report = [];
const out = { lessons: {}, newLessons: {}, units: {}, level: LEVEL, moduleId: MODULE_ID, dumpPath };

// los scripts de emojis e imágenes (2026-10-14) a veces tocaron solo una de las copias
const MEDIA_KEYS = ["emoji", "image", "media"];
const withoutMedia = (item) => {
  const copy = { ...item };
  MEDIA_KEYS.forEach((k) => delete copy[k]);
  return stableStringify(copy);
};
const mediaCount = (item) => MEDIA_KEYS.filter((k) => item[k]).length;

// devuelve la lista sin copias repetidas (conserva la que tiene más emoji/imagen),
// o null si hay claves repetidas con contenido distinto
const dedupe = (where, list, keyOf) => {
  const indexByKey = new Map();
  const kept = [];
  for (const item of list) {
    const key = keyOf(item);
    if (!indexByKey.has(key)) {
      indexByKey.set(key, kept.length);
      kept.push(item);
      continue;
    }
    const i = indexByKey.get(key);
    if (withoutMedia(kept[i]) !== withoutMedia(item)) {
      errors.push(`${where}: "${key}" aparece dos veces con contenido distinto`);
      return null;
    }
    if (mediaCount(item) > mediaCount(kept[i])) kept[i] = item;
  }
  return kept;
};

for (const [id, lesson] of Object.entries(dump.lessons)) {
  if (!id.startsWith(`${LEVEL}_`) || !lesson.content) continue;
  const exercises = dedupe(`${id} ejercicios`, lesson.content.exercises || [], (e) => e.id);
  const vocabulary = dedupe(`${id} vocabulario`, lesson.content.vocabulary || [], (v) =>
    String(v.word || v.id).toLowerCase(),
  );
  if (!exercises || !vocabulary) continue;

  const exBefore = (lesson.content.exercises || []).length;
  const vocBefore = (lesson.content.vocabulary || []).length;
  if (exercises.length === exBefore && vocabulary.length === vocBefore) continue;

  report.push(
    `${id.padEnd(36)} ej ${String(exBefore).padStart(2)} -> ${String(exercises.length).padStart(2)}` +
      `   voc ${String(vocBefore).padStart(2)} -> ${String(vocabulary.length).padStart(2)}`,
  );
  out.lessons[id] = {
    title: lesson.title,
    metadata: lesson.metadata,
    objectives: lesson.objectives || [],
    content: { ...lesson.content, exercises, vocabulary },
  };
}

fs.writeFileSync(path.join(__dirname, "out", `${LEVEL.toLowerCase()}-dedupe.json`), JSON.stringify(out, null, 1));

console.log(report.join("\n"));
console.log(`\nLecciones a limpiar: ${Object.keys(out.lessons).length}`);
console.log(errors.length ? `\nERRORES (${errors.length}):\n` + errors.join("\n") : "\nSin errores.");
process.exit(errors.length ? 1 : 0);
