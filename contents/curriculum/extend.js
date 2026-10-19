// Agrega ejercicios nuevos a lecciones que YA están en Firestore, sin tocar lo que tienen.
// Los ejercicios salen de contents/curriculum/extend/<nivel>/*.js ({ idLección: [ejercicios] }).
// Genera contents/curriculum/out/<nivel>-extend.json para apply.js --extend. No escribe en Firestore.
//
//   node contents/curriculum/extend.js A2 [ruta-al-volcado.json]
//
// A diferencia de build.js se puede volver a correr después de aplicar: cada ejercicio nuevo
// tiene id fijo (x1_tipo, x2_tipo...) y si la lección ya lo tiene, no se vuelve a agregar.

const fs = require("fs");
const path = require("path");
const { latestDump, buildable } = require("./helpers");

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

for (const [id, list] of Object.entries(extensions)) {
  const existing = dump.lessons[id];
  if (!existing) {
    errors.push(`${id}: no existe en Firestore`);
    continue;
  }
  if (!visible.includes(id)) errors.push(`${id}: no se muestra en la app (no está en modules/${MODULE_ID})`);

  const lesson = JSON.parse(JSON.stringify(existing));
  const exercises = lesson.content.exercises;
  const before = exercises.length;
  const ids = new Set(exercises.map((e) => e.id));
  const titles = new Set(exercises.map((e) => e.title));
  let added = 0;

  list.forEach((e, i) => {
    const exId = `x${i + 1}_${e.type}`;
    const where = `${id} ${exId} "${e.title}"`;
    validate(where, e);
    if (ids.has(exId)) return; // ya aplicado antes
    if (titles.has(e.title)) errors.push(`${where}: ya hay un ejercicio con ese título`);
    titles.add(e.title);
    exercises.push({ id: exId, ...e });
    added++;
  });

  report.push(`${id.padEnd(36)} ej ${String(before).padStart(2)} -> ${String(exercises.length).padStart(2)}${added ? "" : "   (ya aplicado)"}`);
  if (added) out.lessons[id] = { title: lesson.title, metadata: lesson.metadata, objectives: lesson.objectives || [], content: lesson.content };
}

const short = visible.filter((id) => {
  const n = (out.lessons[id] || dump.lessons[id])?.content?.exercises?.length || 0;
  return n < MIN_EX;
});

fs.writeFileSync(path.join(__dirname, "out", `${LEVEL.toLowerCase()}-extend.json`), JSON.stringify(out, null, 1));

console.log(report.join("\n"));
console.log(`\nLecciones a actualizar: ${Object.keys(out.lessons).length}`);
if (short.length) console.log(`Visibles con menos de ${MIN_EX} ejercicios (${short.length}): ${short.join(", ")}`);
console.log(errors.length ? `\nERRORES (${errors.length}):\n` + errors.join("\n") : "\nSin errores de validación.");
process.exit(errors.length ? 1 : 0);
