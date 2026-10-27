// Agrega a cada lección su video (y miniatura) subidos a Cloudinary desde videos/compressed/.
// Guarda en el documento de la lección: content.video = { url, poster }
//
//   node contents/curriculum/videos.js            -> simulación: muestra qué escribiría
//   node contents/curriculum/videos.js --write    -> escribe en Firestore (antes guarda un backup)
//
// Cloudinary agrega un sufijo al subir (family-and-relationship.mp4 -> family-and-relationship_g8rq02),
// así que lista la cuenta (solo lectura, API de Admin) y busca "<slug>" o "<slug>_sufijo".
// Si hay 0 o más de 1 candidato, esa lección no se toca.
//
// Credenciales como en cloudinary-fix.js: CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET
// en variables de entorno o en ../bilingual-back/.env.

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");

// slug (nombre del archivo en videos/compressed/) -> id de la lección
const LESSON_FOR = {
  counting: "A1_numbers",
  "countries-and-nationalities": "A1_nationalities",
  "meeting-people": "A1_meeting_people",
  "time-and-daily-routine": "A1_time_expressions",
  "describing-people": "A2_describing_people",
  "family-and-relationship": "A2_family_relationships",
  fashion: "A2_fashion_style",
  "means-of-transport": "A2_transportation",
};

const backEnv = (() => {
  const file = path.join(__dirname, "../../../bilingual-back/.env");
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_]+=/.test(l))
      .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).replace(/^"|"$/g, "").trim()]),
  );
})();
const env = (name, fallback) => process.env[name] || backEnv[name] || fallback;

const CLOUD = env("CLOUDINARY_CLOUD_NAME", "ddowwkgy0");
const KEY = env("CLOUDINARY_API_KEY");
const SECRET = env("CLOUDINARY_API_SECRET");
if (!KEY || !SECRET) {
  console.error("Faltan CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET (en bilingual-back/.env o como variables de entorno).");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(require("../../service-account-key.json")) });
const db = admin.firestore();

const listAccount = async (type) => {
  const all = [];
  let cursor = null;
  do {
    const qs = new URLSearchParams({ max_results: "500", ...(cursor ? { next_cursor: cursor } : {}) });
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/resources/${type}/upload?${qs}`, {
      headers: { Authorization: "Basic " + Buffer.from(`${KEY}:${SECRET}`).toString("base64") },
    });
    if (res.status === 401) throw new Error("Cloudinary rechazó las credenciales (401). Revisar API key/secret y cloud name.");
    if (!res.ok) throw new Error(`Cloudinary ${res.status}: ${await res.text()}`);
    const data = await res.json();
    all.push(...data.resources);
    cursor = data.next_cursor;
  } while (cursor);
  return all;
};

const findOne = (resources, slug, format) => {
  const pattern = new RegExp(`^${slug}(_[a-z0-9]{6})?$`, "i");
  const found = resources.filter((r) => r.format === format && pattern.test(r.public_id.split("/").pop()));
  return found.length === 1 ? found[0].secure_url : found.length ? `AMBIGUO: ${found.map((r) => r.public_id).join(", ")}` : null;
};

(async () => {
  const videos = await listAccount("video");
  const images = await listAccount("image");

  const plan = [];
  const problems = [];
  for (const [slug, lessonId] of Object.entries(LESSON_FOR)) {
    const url = findOne(videos, slug, "mp4");
    const poster = findOne(images, slug, "webp");
    const ref = db.collection("lessons").doc(lessonId);
    const snap = await ref.get();

    if (!snap.exists) problems.push(`${slug}: no existe la lección ${lessonId}`);
    else if (!url || url.startsWith("AMBIGUO")) problems.push(`${slug}: video ${url || "no encontrado en Cloudinary"}`);
    else {
      if (!poster || poster.startsWith("AMBIGUO")) problems.push(`${slug}: miniatura ${poster || "no encontrada"} (se guarda sin poster)`);
      const video = { url, ...(poster && !poster.startsWith("AMBIGUO") ? { poster } : {}) };
      plan.push({ ref, lessonId, title: snap.data().title, before: snap.data().content?.video ?? null, video });
    }
  }

  for (const p of plan) {
    console.log(`\n${p.lessonId} (${p.title})`);
    if (p.before) console.log(`  antes:  ${JSON.stringify(p.before)}`);
    console.log(`  video:  ${p.video.url}`);
    console.log(`  poster: ${p.video.poster || "-"}`);
  }
  if (problems.length) console.log(`\nProblemas:\n  ${problems.join("\n  ")}`);

  if (!WRITE) {
    console.log(`\nSimulación: ${plan.length} lecciones para actualizar. Correr con --write para escribir.`);
    process.exit(0);
  }

  const backupFile = path.join(__dirname, `../backups/videos-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(Object.fromEntries(plan.map((p) => [p.lessonId, p.before])), null, 1));
  console.log(`\nBackup (content.video anterior) en ${backupFile}`);

  const batch = db.batch();
  plan.forEach((p) => batch.update(p.ref, { "content.video": p.video, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
  await batch.commit();
  console.log(`Escritas ${plan.length} lecciones.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
