// Sube a Firestore el resultado de build.js (contents/curriculum/out/<nivel>-lessons.json).
//
//   node contents/curriculum/apply.js A1            -> simulación: muestra qué cambiaría, no escribe nada
//   node contents/curriculum/apply.js A1 --write    -> escribe en Firestore (antes guarda un backup)
//   node contents/curriculum/apply.js A2 --extend [--write] -> lo mismo con el resultado de extend.js
//   node contents/curriculum/apply.js A1 --dedupe [--write] -> lo mismo con el resultado de dedupe.js
//
// Antes de escribir compara cada lección con el volcado usado por build.js:
// si alguien la editó en Firestore después del volcado, se omite para no pisar ese cambio.

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");
const LEVEL = (process.argv.find((a) => /^a\d$/i.test(a)) || "A1").toUpperCase();
const { stableStringify } = require("./helpers");
// --extend sube el resultado de extend.js (ejercicios agregados), --dedupe el de dedupe.js
// (duplicados quitados); sin ninguno de los dos, el de build.js
const SOURCE = ["extend", "dedupe"].find((s) => process.argv.includes(`--${s}`)) || "lessons";
const out = JSON.parse(fs.readFileSync(path.join(__dirname, `out/${LEVEL.toLowerCase()}-${SOURCE}.json`), "utf8"));
if (!out.dumpPath)
  throw new Error(`Volver a correr: node contents/curriculum/${SOURCE === "lessons" ? "build" : SOURCE}.js ${LEVEL}`);
const dump = JSON.parse(fs.readFileSync(out.dumpPath, "utf8"));

admin.initializeApp({ credential: admin.credential.cert(require("../../service-account-key.json")) });
const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();

(async () => {
  const backup = { lessons: {}, moduleUnits: null, units: {} };
  const skipped = [];
  const writes = [];

  for (const [id, lesson] of Object.entries(out.lessons)) {
    const snap = await db.collection("lessons").doc(id).get();
    if (!snap.exists) {
      skipped.push(`${id}: ya no existe en Firestore`);
      continue;
    }
    const live = snap.data();
    backup.lessons[id] = live;
    if (stableStringify(live.content) !== stableStringify(dump.lessons[id].content)) {
      skipped.push(`${id}: cambió en Firestore después del volcado (volver a volcar y a correr build.js)`);
      continue;
    }
    writes.push([
      `lessons/${id}`,
      () =>
        snap.ref.update({
          content: lesson.content,
          objectives: lesson.objectives,
          "metadata.unit": lesson.metadata.unit,
          updatedAt: now,
        }),
    ]);
  }

  for (const [id, lesson] of Object.entries(out.newLessons)) {
    const ref = db.collection("lessons").doc(id);
    if ((await ref.get()).exists) {
      skipped.push(`${id}: ya existe, no se vuelve a crear`);
      continue;
    }
    writes.push([`lessons/${id} (nueva)`, () => ref.set({ ...lesson, createdAt: now, updatedAt: now })]);
  }

  // cambios de unidades (lecciones nuevas o quitadas), tanto en modules/<módulo> como en units/{id}
  const moduleRef = db.collection("modules").doc(out.moduleId);
  const liveModule = (await moduleRef.get()).data();
  backup.moduleUnits = liveModule.units;
  for (const [unitId, lessons] of Object.entries(out.units)) {
    const liveLessons = liveModule.units?.[unitId]?.lessons || [];
    if (JSON.stringify(liveLessons) !== JSON.stringify(dump.modules[out.moduleId].units[unitId].lessons)) {
      skipped.push(`unidad ${unitId}: su lista de lecciones cambió después del volcado`);
      continue;
    }
    writes.push([`modules/${out.moduleId} units.${unitId}.lessons`, () => moduleRef.update({ [`units.${unitId}.lessons`]: lessons })]);

    const unitRef = db.collection("units").doc(unitId);
    const unitSnap = await unitRef.get();
    if (unitSnap.exists) {
      backup.units[unitId] = unitSnap.data();
      writes.push([`units/${unitId} lessons`, () => unitRef.update({ lessons })]);
    }
  }

  console.log(`${WRITE ? "ESCRIBIENDO" : "SIMULACIÓN"}: ${writes.length} operaciones`);
  writes.forEach(([label]) => console.log("  " + label));
  if (skipped.length) console.log(`\nOmitidas (${skipped.length}):\n  ` + skipped.join("\n  "));

  if (!WRITE) {
    console.log(`\nNo se escribió nada. Para aplicar: node contents/curriculum/apply.js ${LEVEL}${SOURCE === "lessons" ? "" : ` --${SOURCE}`} --write`);
    process.exit(0);
  }

  const backupPath = path.join(__dirname, `../backups/before-${LEVEL.toLowerCase()}-${SOURCE === "lessons" ? "apply" : SOURCE}-${Date.now()}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 1));
  console.log(`\nBackup guardado en ${backupPath}`);

  for (const [label, run] of writes) {
    await run();
    console.log("✓ " + label);
  }
  console.log("\nListo.");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
