// Sube a Firestore los emojis generados por emojis.js (out/vocab-emojis.json).
//
//   node contents/curriculum/emojis-apply.js                         -> simulación, no escribe nada
//   node contents/curriculum/emojis-apply.js --lesson A1_greetings   -> solo esa lección (simulación)
//   node contents/curriculum/emojis-apply.js --write                 -> escribe (antes guarda un backup)
//
// Solo agrega el campo `emoji` a cada palabra de content.vocabulary. Una palabra se omite si:
//   - en Firestore ya no está en esa posición (alguien editó el vocabulario después del volcado)
//   - ya tiene imagen propia o ya tiene emoji (no se pisa nada)

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");
const lessonArg = process.argv.indexOf("--lesson");
const ONLY_LESSON = lessonArg > -1 ? process.argv[lessonArg + 1] : null;

const generated = JSON.parse(fs.readFileSync(path.join(__dirname, "out/vocab-emojis.json"), "utf8"));

admin.initializeApp({ credential: admin.credential.cert(require("../../service-account-key.json")) });
const db = admin.firestore();

(async () => {
  const backup = {};
  const writes = [];
  const skipped = [];
  let added = 0;

  for (const [id, { items }] of Object.entries(generated.lessons)) {
    if (ONLY_LESSON && id !== ONLY_LESSON) continue;

    const ref = db.collection("lessons").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      skipped.push(`${id}: ya no existe`);
      continue;
    }
    const vocabulary = snap.data().content?.vocabulary || [];
    const updated = vocabulary.map((v) => ({ ...v }));
    let changes = 0;

    for (const it of items) {
      const live = updated[it.index];
      if (!it.emoji) continue;
      if (!live || live.word !== it.word) {
        skipped.push(`${id} #${it.index} "${it.word}": cambió en Firestore`);
        continue;
      }
      if (live.image || live.media?.image || live.emoji) continue;
      live.emoji = it.emoji;
      changes++;
    }

    if (!changes) continue;
    backup[id] = vocabulary;
    added += changes;
    writes.push([id, changes, () => ref.update({ "content.vocabulary": updated, updatedAt: admin.firestore.FieldValue.serverTimestamp() })]);
  }

  console.log(`${writes.length} lecciones, ${added} palabras con emoji nuevo`);
  writes.forEach(([id, n]) => console.log(`  ${id}: +${n}`));
  if (skipped.length) {
    console.log(`\nOmitidas (${skipped.length}):`);
    skipped.forEach((s) => console.log(`  ${s}`));
  }

  if (!WRITE) {
    console.log("\nSimulación: no se escribió nada. Agregar --write para aplicar.");
    process.exit(0);
  }

  const backupFile = path.join(__dirname, `../backups/emojis-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1));
  console.log(`\nBackup del vocabulario anterior: ${backupFile}`);

  for (const [id, , write] of writes) {
    await write();
    console.log(`  ✔ ${id}`);
  }
  console.log("Listo.");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
