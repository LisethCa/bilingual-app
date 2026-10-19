// Agrega ejercicios nuevos a lecciones que YA están en Firestore, sin tocar lo que tienen.
// Los ejercicios salen de contents/curriculum/extend/<nivel>/*.js ({ idLección: [ejercicios] }).
// Genera contents/curriculum/out/<nivel>-extend.json para apply.js --extend. No escribe en Firestore.
//
//   node contents/curriculum/extend.js A2 [ruta-al-volcado.json]
//
// A diferencia de build.js se puede volver a correr después de aplicar: cada ejercicio nuevo
// tiene id fijo (x1_tipo, x2_tipo...) y si la lección ya lo tiene, no se vuelve a agregar
// (si se corrigió en extend/, se reemplaza). También aplica las correcciones de fixes/<nivel>.js
// a ejercicios que ya existían. Da error si una oración se repite dentro de una lección
// o entre los ejercicios nuevos del nivel.

const fs = require("fs");
const path = require("path");
const { latestDump, buildable, norm, stableStringify } = require("./helpers");

const LEVEL = (process.argv[2] || "A1").toUpperCase();
const MODULE_ID = { A1: "basics", A2: "basics_a2" }[LEVEL];
if (!MODULE_ID) throw new Error(`Nivel desconocido: ${LEVEL}`);

const dumpPath = process.argv[3] ? path.resolve(process.argv[3]) : latestDump();
const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));

const MIN_EX = 13;

const extensions = {};
const dir = path.join(__dirname, "extend", LEVEL.toLowerCase());
fs.readdirSync(dir)
  .filter((f) => f.endsWith(".js"))
  .sort()
  .forEach((f) => {
    for (const [id, list] of Object.entries(require(path.join(dir, f)))) {
      if (extensions[id]) throw new Error(`${id} aparece en más de un archivo de extend/`);
      extensions[id] = list;
    }
  });

// lecciones que muestra la app (según modules/<módulo>)
const visible = [];
Object.values(dump.modules[MODULE_ID].units).forEach((u) =>
  (u.lessons || []).forEach((id) => !visible.includes(id) && visible.push(id)),
);

const errors = [];
const report = [];
const out = { lessons: {}, newLessons: {}, units: {}, level: LEVEL, moduleId: MODULE_ID, dumpPath };

const validate = (where, e) => {
  const c = e.config || {};
  switch (e.type) {
    case "fill_in_blank":
      if (!(c.questions || []).length) errors.push(`${where}: sin preguntas`);
      (c.questions || []).forEach((q) => {
        if ((q.sentence.match(/___/g) || []).length !== 1) errors.push(`${where}: debe haber un solo hueco en "${q.sentence}"`);
        if (!q.options.includes(q.answer)) errors.push(`${where}: respuesta fuera de opciones "${q.sentence}"`);
        if (new Set(q.options).size !== q.options.length) errors.push(`${where}: opciones repetidas "${q.sentence}"`);
        if (q.options.length < 3) errors.push(`${where}: menos de 3 opciones "${q.sentence}"`);
      });
      break;
    case "sentence_formation":
      (c.correctAnswers || []).forEach((a) => {
        if (!buildable(a, c.wordBank || [])) errors.push(`${where}: no se puede armar "${a}"`);
      });
      if (!c.question) errors.push(`${where}: sin consigna`);
      break;
    case "drag_drop":
    case "matching": {
      const prs = c.pairs || [];
      if (prs.length < 3) errors.push(`${where}: menos de 3 pares`);
      const froms = new Set(prs.map((x) => x.from));
      const tos = new Set(prs.map((x) => x.to));
      if (froms.size !== prs.length || tos.size !== prs.length) errors.push(`${where}: pares repetidos`);
      break;
    }
    case "dialogue_simulation":
      (c.dialogues || []).forEach((d, j) => {
        if (d.options.filter((o) => o.correct).length !== 1) errors.push(`${where}: paso ${j + 1} sin una única correcta`);
      });
      break;
  }
};

// Correcciones de ejercicios que ya estaban en la lección: fixes/<nivel>.js
// ({ idLección: { idEjercicio: [[textoViejo, textoNuevo], ...] | (ejercicio) => ejercicio } })
const fixesPath = path.join(__dirname, "fixes", `${LEVEL.toLowerCase()}.js`);
const fixes = fs.existsSync(fixesPath) ? require(fixesPath) : {};

// reemplaza cada valor de texto igual a `from` (no fragmentos); devuelve cuántos cambió
const replaceExact = (x, from, to) => {
  let n = 0;
  for (const k of Object.keys(x)) {
    if (x[k] === from) {
      x[k] = to;
      n++;
    } else if (x[k] && typeof x[k] === "object") n += replaceExact(x[k], from, to);
  }
  return n;
};
const containsExact = (x, s) =>
  x === s || (!!x && typeof x === "object" && Object.values(x).some((v) => containsExact(v, s)));

const applyFix = (where, exercise, fix) => {
  if (typeof fix === "function") return fix(JSON.parse(JSON.stringify(exercise)));
  const copy = JSON.parse(JSON.stringify(exercise));
  for (const [from, to] of fix) {
    // si ya no está el texto viejo pero sí el nuevo, la corrección ya se aplicó antes
    if (!replaceExact(copy, from, to) && !containsExact(copy, to)) errors.push(`${where}: no se encontró "${from}"`);
  }
  return copy;
};

// Frases para detectar repeticiones dentro de una lección: oraciones de completar (con el hueco
// y completas), respuestas de ordenar palabras y de escuchar, y líneas de los diálogos
const phrasesOf = (e) => {
  const c = e.config || {};
  const list = [
    ...(c.questions || []).filter((q) => q.sentence).flatMap((q) => [q.sentence, q.sentence.replace("___", q.answer)]),
    ...(c.correctAnswers || []),
    c.correctSentence,
    ...(c.dialogues || []).flatMap((d) => [d.text, ...(d.options || []).filter((o) => o.correct).map((o) => o.text)]),
  ];
  return [...new Set(list.filter((s) => typeof s === "string").map(norm))].filter((s) => s.split(" ").length >= 4);
};
const levelPhrases = new Map();

for (const id of new Set([...Object.keys(extensions), ...Object.keys(fixes)])) {
  const existing = dump.lessons[id];
  if (!existing) {
    errors.push(`${id}: no existe en Firestore`);
    continue;
  }
  if (!visible.includes(id)) errors.push(`${id}: no se muestra en la app (no está en modules/${MODULE_ID})`);

  const lesson = JSON.parse(JSON.stringify(existing));
  const exercises = lesson.content.exercises;
  const before = exercises.length;
  const titles = new Set(exercises.filter((e) => !/^x\d+_/.test(e.id)).map((e) => e.title));
  let added = 0;
  let updated = 0;

  for (const [exId, fix] of Object.entries(fixes[id] || {})) {
    const at = exercises.findIndex((x) => x.id === exId);
    if (at === -1) {
      errors.push(`${id} ${exId}: no existe (corrección)`);
      continue;
    }
    const fixed = applyFix(`${id} ${exId}`, exercises[at], fix);
    validate(`${id} ${exId}`, fixed);
    if (stableStringify(fixed) !== stableStringify(exercises[at])) {
      exercises[at] = fixed;
      updated++;
    }
  }

  (extensions[id] || []).forEach((e, i) => {
    const exId = `x${i + 1}_${e.type}`;
    const where = `${id} ${exId} "${e.title}"`;
    validate(where, e);
    phrasesOf(e).forEach((p) => {
      if (levelPhrases.has(p)) errors.push(`${where}: "${p}" se repite en ${levelPhrases.get(p)}`);
      levelPhrases.set(p, `${id} ${exId}`);
    });
    if (titles.has(e.title)) errors.push(`${where}: ya hay un ejercicio con ese título`);
    titles.add(e.title);

    const item = { id: exId, ...e };
    const at = exercises.findIndex((x) => x.id === exId);
    if (at === -1) {
      exercises.push(item);
      added++;
    } else if (stableStringify(exercises[at]) !== stableStringify(item)) {
      exercises[at] = item; // ya aplicado, pero se corrigió en extend/
      updated++;
    }
  });

  const changes = [added && `+${added}`, updated && `${updated} corregidos`].filter(Boolean).join(", ");
  report.push(`${id.padEnd(36)} ej ${String(before).padStart(2)} -> ${String(exercises.length).padStart(2)}   ${changes || "(sin cambios)"}`);
  if (changes) out.lessons[id] = { title: lesson.title, metadata: lesson.metadata, objectives: lesson.objectives || [], content: lesson.content };
}

// la misma oración en dos ejercicios de una lección visible (con las correcciones y agregados ya aplicados)
for (const id of visible) {
  const exercises = (out.lessons[id] || dump.lessons[id])?.content?.exercises || [];
  const seen = new Map();
  for (const e of exercises)
    for (const p of phrasesOf(e)) {
      if (seen.has(p)) errors.push(`${id}: "${p}" se repite en ${seen.get(p)} y ${e.id}`);
      else seen.set(p, e.id);
    }
}

// cuenta ids distintos: un ejercicio duplicado no suma (ver dedupe.js)
const short = visible.filter((id) => {
  const exercises = (out.lessons[id] || dump.lessons[id])?.content?.exercises || [];
  return new Set(exercises.map((e) => e.id)).size < MIN_EX;
});

fs.writeFileSync(path.join(__dirname, "out", `${LEVEL.toLowerCase()}-extend.json`), JSON.stringify(out, null, 1));

console.log(report.join("\n"));
console.log(`\nLecciones a actualizar: ${Object.keys(out.lessons).length}`);
if (short.length) console.log(`Visibles con menos de ${MIN_EX} ejercicios (${short.length}): ${short.join(", ")}`);
console.log(errors.length ? `\nERRORES (${errors.length}):\n` + errors.join("\n") : "\nSin errores de validación.");
process.exit(errors.length ? 1 : 0);
