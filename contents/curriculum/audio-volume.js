// Sube el volumen de los audios de las lecciones que se grabaron muy bajos.
// No re-sube archivos: agrega a la URL de Cloudinary la transformación e_volume:<porcentaje>,
// calculada para cada audio de modo que su pico quede cerca de -1 dB.
// (e_volume con "dB" distorsiona; en porcentaje es lineal: 100 = x2, 400 = x5, que es el máximo.)
//
//   node contents/curriculum/audio-volume.js            -> simulación: mide y muestra qué cambiaría
//   node contents/curriculum/audio-volume.js --write    -> escribe en Firestore (antes guarda un backup)
//
// Necesita ffmpeg en el PATH. Es idempotente: las URLs que ya tienen e_volume se saltean.

const admin = require("firebase-admin");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const WRITE = process.argv.includes("--write");
const TARGET_PEAK_DB = -1;
const MIN_BOOST_DB = 3; // por debajo de esto no vale la pena tocar el audio
const MAX_PERCENT = 400;

admin.initializeApp({ credential: admin.credential.cert(require("../../service-account-key.json")) });
const db = admin.firestore();

const isAudio = (s) => /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/.+\.(mp3|m4a|wav|ogg)$/i.test(s);

const collect = (value, out) => {
  if (typeof value === "string") isAudio(value) && out.add(value);
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collect(v, out));
  return out;
};

const replaceDeep = (value, map) => {
  if (typeof value === "string") return map.get(value) ?? value;
  if (Array.isArray(value)) return value.map((v) => replaceDeep(v, map));
  if (value && typeof value === "object" && !(value instanceof admin.firestore.Timestamp))
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceDeep(v, map)]));
  return value;
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "audio-volume-"));

const peakDb = async (url) => {
  const res = await fetch(url);
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const file = path.join(tmp, `${Math.random().toString(36).slice(2)}${path.extname(url)}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const out = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  fs.unlinkSync(file);
  const m = /max_volume: (-?[\d.]+) dB/.exec(out.stderr || "");
  return m ? { peak: Number(m[1]) } : { error: "ffmpeg no pudo medirlo" };
};

(async () => {
  const snap = await db.collection("lessons").get();
  const lessons = snap.docs.map((d) => ({ ref: d.ref, id: d.id, data: d.data() }));

  const urls = new Set();
  lessons.forEach((l) => collect(l.data.content, urls));

  const map = new Map();
  const problems = [];
  for (const url of [...urls].filter((u) => !u.includes("/e_volume:"))) {
    const { peak, error } = await peakDb(url);
    if (error) {
      problems.push(`${error}: ${url}`);
      continue;
    }
    const boost = TARGET_PEAK_DB - peak;
    if (boost < MIN_BOOST_DB) continue;
    const percent = Math.min(MAX_PERCENT, Math.round((10 ** (boost / 20) - 1) * 100));
    map.set(url, url.replace("/video/upload/", `/video/upload/e_volume:${percent}/`));
    console.log(`${peak.toFixed(1).padStart(6)} dB  +${percent}%  ${url.split("/").pop()}`);
  }

  const plan = lessons
    .map((l) => ({ ...l, content: replaceDeep(l.data.content, map) }))
    .filter((l) => JSON.stringify(l.content) !== JSON.stringify(l.data.content));

  console.log(`\n${urls.size} audios en total, ${map.size} para subir de volumen, en ${plan.length} lecciones:`);
  plan.forEach((p) => console.log(`  ${p.id} (${p.data.title})`));
  if (problems.length) console.log(`\nNo se pudieron medir (revisar a mano):\n  ${problems.join("\n  ")}`);

  if (!WRITE) {
    console.log(`\nSimulación. Correr con --write para escribir.`);
    process.exit(0);
  }

  const backupFile = path.join(__dirname, `../backups/audio-volume-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(Object.fromEntries(plan.map((p) => [p.id, p.data.content])), null, 1));
  console.log(`\nBackup (content anterior) en ${backupFile}`);

  const batch = db.batch();
  plan.forEach((p) => batch.update(p.ref, { content: p.content, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
  await batch.commit();
  console.log(`Escritas ${plan.length} lecciones.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
