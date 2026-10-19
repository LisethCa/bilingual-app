// Aplica los parches de contents/curriculum/lessons/<nivel>/*.js sobre el volcado de Firestore
// y genera contents/curriculum/out/<nivel>-lessons.json + un reporte. No escribe en Firestore.
//
//   node contents/curriculum/build.js A1 [ruta-al-volcado.json]
//   node contents/curriculum/build.js A2
//
// Sin ruta usa el volcado más reciente de contents/backups (ver dump.js).

const fs = require("fs");
const path = require("path");
const { tokens, latestDump, norm, buildable } = require("./helpers");

const LEVEL = (process.argv[2] || "A1").toUpperCase();
const MODULE_ID = { A1: "basics", A2: "basics_a2" }[LEVEL];
if (!MODULE_ID) throw new Error(`Nivel desconocido: ${LEVEL}`);

const dumpPath = process.argv[3] ? path.resolve(process.argv[3]) : latestDump();
const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));

const MIN_EX = 10;
const MIN_VOCAB = 8;

// agrega al banco las fichas que falten para poder armar la oración
const completeBank = (sentence, wordBank) => {
  const bank = [...wordBank];
  if (buildable(sentence, bank)) return bank;
  // las fichas pueden ser de varias palabras ("wake up"): se cuentan palabra por palabra
  const have = {};
  bank.forEach((w) => tokens(w).forEach((t) => (have[norm(t)] = (have[norm(t)] || 0) + 1)));
  tokens(sentence).forEach((t) => {
    const k = norm(t);
    if (have[k] > 0) have[k]--;
    else bank.push(t);
  });
  return bank;
};

// ---------- cargar parches ----------
const patches = {};
const lessonsDir = path.join(__dirname, "lessons", LEVEL.toLowerCase());
fs.readdirSync(lessonsDir)
  .filter((f) => f.endsWith(".js"))
  .sort()
  .forEach((f) => Object.assign(patches, require(path.join(lessonsDir, f))));

// unidad -> lecciones (según modules/<módulo>, que es lo que muestra la app)
const moduleUnits = JSON.parse(JSON.stringify(dump.modules[MODULE_ID].units));
const unitOf = {};
Object.values(moduleUnits).forEach((u) =>
  (u.lessons || []).forEach((id) => {
    if (!unitOf[id]) unitOf[id] = u.id; // si está repetida, cuenta la primera unidad
  }),
);

// lecciones que figuran en más de una unidad: se dejan solo en la indicada por 'onlyInUnit'
for (const [id, p] of Object.entries(patches)) {
  if (!p.onlyInUnit) continue;
  unitOf[id] = p.onlyInUnit;
  Object.values(moduleUnits).forEach((u) => {
    if (u.id !== p.onlyInUnit && (u.lessons || []).includes(id)) u.lessons = u.lessons.filter((l) => l !== id);
  });
}

const out = { lessons: {}, newLessons: {}, units: {} };
const errors = [];
const report = [];

for (const [id, p] of Object.entries(patches)) {
  const existing = dump.lessons[id];
  if (!existing && !p.create) {
    errors.push(`${id}: no existe en Firestore y el parche no trae 'create'`);
    continue;
  }

  let lesson;
  if (existing) {
    lesson = JSON.parse(JSON.stringify(existing));
  } else {
    const c = p.create;
    lesson = {
      id,
      title: c.title,
      metadata: {
        level: LEVEL,
        module: MODULE_ID,
        unit: c.unit,
        xpReward: c.xp || 100,
        estimatedDuration: 25,
        tags: c.tags || [],
      },
      objectives: [],
      content: { vocabulary: [], exercises: [] },
      settings: { unlockCondition: null, retryLimit: 3, accessibility: {} },
    };
    const unit = moduleUnits[c.unit];
    if (!unit) errors.push(`${id}: unidad desconocida ${c.unit}`);
    else {
      const at = c.after ? unit.lessons.indexOf(c.after) + 1 : unit.lessons.length;
      unit.lessons.splice(at, 0, id);
      unitOf[id] = c.unit;
      out.units[c.unit] = unit.lessons;
    }
  }

  const content = lesson.content;
  content.vocabulary = content.vocabulary || [];
  content.exercises = content.exercises || [];
  const before = { ex: content.exercises.length, vocab: content.vocabulary.length };

  // --- correcciones automáticas ---
  if (unitOf[id]) lesson.metadata.unit = unitOf[id];
  content.exercises.forEach((e) => {
    if (e.title === e.type) {
      e.title = e.type === "sentence_formation" ? "Forma la oración" : `Conjuga el verbo "${e.config?.verb}"`;
      if (e.config?.title === e.type) e.config.title = e.title;
    }
    if (e.type === "listening_transcription" && e.config?.wordBank && e.config.correctSentence) {
      e.config.wordBank = completeBank(e.config.correctSentence, e.config.wordBank);
    }
  });

  // --- correcciones de la lección ---
  if (p.objectives && !(lesson.objectives || []).length) lesson.objectives = p.objectives;
  if (p.grammar) content.grammar = p.grammar;
  if (p.fixVocab) p.fixVocab(content.vocabulary);
  (p.remove || []).forEach((exId) => {
    const i = content.exercises.findIndex((e) => e.id === exId);
    if (i < 0) errors.push(`${id}: remove -> no existe el ejercicio ${exId}`);
    else content.exercises.splice(i, 1);
  });
  for (const [exId, replacement] of Object.entries(p.replace || {})) {
    const i = content.exercises.findIndex((e) => e.id === exId);
    if (i < 0) errors.push(`${id}: replace -> no existe el ejercicio ${exId}`);
    else content.exercises[i] = { id: exId, ...replacement };
  }
  if (p.fix) p.fix(content.exercises, lesson);

  // --- contenido nuevo ---
  const words = new Set(content.vocabulary.map((w) => norm(w.word)));
  (p.vocab || []).forEach((w) => {
    if (words.has(norm(w.word))) errors.push(`${id}: vocabulario repetido "${w.word}"`);
    words.add(norm(w.word));
    content.vocabulary.push(w);
  });
  (p.add || []).forEach((e, i) => content.exercises.push({ id: `add${i + 1}_${e.type}`, ...e }));

  // --- validación ---
  const seen = new Set();
  content.exercises.forEach((e, i) => {
    const where = `${id} #${i + 1} ${e.type} (${e.id})`;
    const c = e.config || {};
    if (!e.id) errors.push(`${where}: sin id`);
    if (seen.has(e.id)) errors.push(`${where}: id repetido`);
    seen.add(e.id);
    switch (e.type) {
      case "sentence_formation":
        if (!(c.correctAnswers || []).length) errors.push(`${where}: sin respuestas`);
        (c.correctAnswers || []).forEach((a) => {
          if (!buildable(a, c.wordBank || [])) errors.push(`${where}: no se puede armar "${a}"`);
        });
        break;
      case "listening_transcription":
        if (c.wordBank && !buildable(c.correctSentence, c.wordBank)) errors.push(`${where}: banco incompleto`);
        break;
      case "dialogue_simulation":
        (c.dialogues || []).forEach((d, j) => {
          const o = d.options || [];
          if (o.length && o.filter((x) => typeof x === "object" && x.correct).length !== 1)
            errors.push(`${where}: paso ${j + 1} debe tener exactamente una opción correcta`);
        });
        if (c.dialogues?.[0]?.character === "user") errors.push(`${where}: el primer turno no puede ser del alumno`);
        break;
      case "drag_drop": {
        const tos = new Set();
        (c.pairs || []).forEach((x) => {
          if (!x.id) errors.push(`${where}: par sin id`);
          if (tos.has(x.to)) errors.push(`${where}: destino repetido "${x.to}"`);
          tos.add(x.to);
        });
        if ((c.pairs || []).length < 3) errors.push(`${where}: menos de 3 pares`);
        break;
      }
      case "fill_in_blank":
        (c.questions || []).forEach((q) => {
          if (!q.sentence?.includes("___")) errors.push(`${where}: falta el hueco en "${q.sentence}"`);
          if (!q.options || !q.options.includes(q.answer)) errors.push(`${where}: respuesta fuera de opciones "${q.sentence}"`);
          if (new Set(q.options || []).size !== (q.options || []).length) errors.push(`${where}: opciones repetidas "${q.sentence}"`);
        });
        if (!(c.questions || []).length) errors.push(`${where}: sin preguntas`);
        break;
      case "matching":
      case "memory_game": {
        const prs = c.pairs || e.pairs || [];
        // los pares con imagen dependen de recursos ya subidos: no se pueden ampliar desde acá
        const withMedia = prs.some((x) => String(x.back || x.left || "").startsWith("http"));
        if (prs.length < 3 && !withMedia) errors.push(`${where}: solo ${prs.length} pares`);
        const side = new Set();
        prs.forEach((x) => {
          if (e.type === "matching" && !(x.from && x.to) && !(x.left && x.right))
            errors.push(`${where}: par incompleto ${JSON.stringify(x)}`);
          const k = x.to ?? x.back;
          if (k && side.has(k) && e.type === "memory_game") errors.push(`${where}: par repetido "${k}"`);
          side.add(k);
        });
        break;
      }
      case "audio_matching":
        [...(c.items || []), ...(c.pairs || [])].forEach((x) => {
          if (x.audio && !String(x.audio).startsWith("http")) errors.push(`${where}: audio inexistente "${x.audio}"`);
        });
        break;
      case "vocabulary": {
        const ids = new Set((c.categories || []).map((x) => x.id));
        (c.items || []).forEach((it) => {
          if (!ids.has(it.category)) errors.push(`${where}: categoría inválida en "${it.text}"`);
        });
        break;
      }
      case "conjugation": {
        const t = (c.tenses || [])[0];
        const table = t && c.correct?.[t] ? c.correct[t] : c.correct || {};
        (c.pronouns || []).forEach((pr) => {
          if (typeof table[pr] !== "string") errors.push(`${where}: falta respuesta para "${pr}"`);
        });
        break;
      }
    }
  });

  const nEx = content.exercises.length;
  const nVocab = content.vocabulary.length;
  if (nEx < MIN_EX) errors.push(`${id}: ${nEx} ejercicios (mínimo ${MIN_EX})`);
  if (nVocab < MIN_VOCAB) errors.push(`${id}: ${nVocab} palabras (mínimo ${MIN_VOCAB})`);
  if (!content.grammar) errors.push(`${id}: sin explicación de gramática`);

  report.push(
    `${existing ? " " : "+"} ${id.padEnd(34)} ej ${String(before.ex).padStart(2)} -> ${String(nEx).padStart(2)}   vocab ${String(before.vocab).padStart(2)} -> ${String(nVocab).padStart(2)}   ${content.grammar ? "gramática ✓" : "SIN GRAMÁTICA"}`,
  );

  const payload = { title: lesson.title, metadata: lesson.metadata, objectives: lesson.objectives || [], content };
  if (existing) out.lessons[id] = payload;
  else out.newLessons[id] = { ...payload, id, settings: lesson.settings };
}

// unidades cuya lista de lecciones cambió (lecciones nuevas o quitadas por estar repetidas)
Object.values(moduleUnits).forEach((u) => {
  if (JSON.stringify(u.lessons) !== JSON.stringify(dump.modules[MODULE_ID].units[u.id].lessons)) out.units[u.id] = u.lessons;
});
out.level = LEVEL;
out.moduleId = MODULE_ID;
out.dumpPath = dumpPath; // apply.js compara contra este mismo volcado

// lecciones visibles en la app que todavía no tienen parche
const pending = Object.keys(unitOf).filter((id) => !patches[id]);

const outDir = path.join(__dirname, "out");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${LEVEL.toLowerCase()}-lessons.json`), JSON.stringify(out, null, 1));

console.log(report.join("\n"));
console.log(`\nLecciones con parche: ${report.length}  (nuevas: ${Object.keys(out.newLessons).length})`);
if (pending.length) console.log(`Sin parche todavía (${pending.length}): ${pending.join(", ")}`);
console.log(errors.length ? `\nERRORES (${errors.length}):\n` + errors.join("\n") : "\nSin errores de validación.");
process.exit(errors.length ? 1 : 0);
