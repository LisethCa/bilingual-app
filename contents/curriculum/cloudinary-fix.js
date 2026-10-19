// Reemplaza en Firestore las URLs de la cuenta vieja de Cloudinary (dltwwat1r, ya borrada)
// por las del mismo archivo en la cuenta de la clienta (ddowwkgy0).
//
//   node contents/curriculum/cloudinary-fix.js            -> simulación: busca reemplazos, no escribe nada
//   node contents/curriculum/cloudinary-fix.js --write    -> escribe en Firestore (antes guarda un backup)
//
// Cómo encuentra el archivo nuevo: al migrar, Cloudinary le agregó un sufijo al nombre
//   dltwwat1r/.../Hello_rtwlob.png  ->  ddowwkgy0/.../Hello_rtwlob_zkh7og.png
// Lista todos los archivos de la cuenta nueva (solo lectura, API de Admin) y busca uno
// cuyo nombre sea igual al viejo o igual + "_sufijo". Si hay 0 o más de 1 candidato,
// no toca nada y lo deja en el reporte para resolver a mano.
//
// Credenciales (Cloudinary -> Settings -> API Keys), en variables de entorno o en
// ../bilingual-back/.env: CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
// (opcional CLOUDINARY_CLOUD_NAME, por defecto ddowwkgy0).

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");
const OLD_CLOUD = "dltwwat1r";
const REPORT = path.join(__dirname, "out/cloudinary-fix-report.json");

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

// "https://res.cloudinary.com/dltwwat1r/video/upload/v123/carpeta/Hello_ab12cd.mp3"
//   -> { type: "video", publicId: "carpeta/Hello_ab12cd", name: "Hello_ab12cd" }
const parseUrl = (url) => {
  const m = url.match(/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
  if (!m) return null;
  const publicId = decodeURIComponent(m[2]);
  return { type: m[1], publicId, name: publicId.split("/").pop() };
};

// Todos los archivos de la cuenta nueva, por tipo (paginado de a 500)
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

// Recorre un valor y devuelve una copia con las URLs reemplazadas (y cuántas cambió)
const replaceDeep = (value, map) => {
  let count = 0;
  const walk = (v) => {
    if (typeof v === "string") {
      if (map.has(v)) {
        count++;
        return map.get(v);
      }
      return v;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object" && !(v instanceof admin.firestore.Timestamp) && !(v instanceof admin.firestore.DocumentReference)) {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    }
    return v;
  };
  return { value: walk(value), count };
};

const collectOldUrls = (value, found) => {
  if (typeof value === "string") {
    if (value.includes(`res.cloudinary.com/${OLD_CLOUD}/`)) found.add(value);
  } else if (Array.isArray(value)) value.forEach((x) => collectOldUrls(x, found));
  else if (value && typeof value === "object" && !(value instanceof admin.firestore.Timestamp)) {
    Object.values(value).forEach((x) => collectOldUrls(x, found));
  }
};

(async () => {
  // 1. Documentos de Firestore que usan la cuenta vieja
  const docs = [];
  const oldUrls = new Set();
  for (const col of await db.listCollections()) {
    const snap = await col.get();
    snap.forEach((doc) => {
      const found = new Set();
      collectOldUrls(doc.data(), found);
      if (found.size) {
        docs.push({ ref: doc.ref, data: doc.data(), urls: [...found] });
        found.forEach((u) => oldUrls.add(u));
      }
    });
  }
  console.log(`${oldUrls.size} URLs viejas en ${docs.length} documentos`);

  // 2. Archivos de la cuenta nueva
  const byType = {};
  for (const type of new Set([...oldUrls].map((u) => parseUrl(u)?.type).filter(Boolean))) {
    byType[type] = await listAccount(type);
    console.log(`Cuenta ${CLOUD}: ${byType[type].length} archivos de tipo ${type}`);
  }

  // 3. Emparejar
  const map = new Map();
  const unresolved = [];
  for (const url of oldUrls) {
    const old = parseUrl(url);
    if (!old) {
      unresolved.push({ url, reason: "URL no reconocida" });
      continue;
    }
    const escaped = old.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${escaped}(_[a-z0-9]{6})?$`, "i");
    const candidates = (byType[old.type] || []).filter((r) => pattern.test(r.public_id.split("/").pop()));
    if (candidates.length === 1) {
      map.set(url, candidates[0].secure_url);
    } else {
      unresolved.push({
        url,
        reason: candidates.length ? `${candidates.length} candidatos` : "no está en la cuenta nueva",
        candidates: candidates.map((c) => c.secure_url),
      });
    }
  }

  // 4. Cambios por documento (solo los campos de primer nivel que cambian)
  const writes = [];
  const backup = {};
  for (const { ref, data } of docs) {
    const update = {};
    let count = 0;
    for (const [field, value] of Object.entries(data)) {
      const r = replaceDeep(value, map);
      if (r.count) {
        update[field] = r.value;
        count += r.count;
      }
    }
    if (!count) continue;
    backup[ref.path] = data;
    writes.push({ ref, update, count });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    cloud: CLOUD,
    replaced: Object.fromEntries(map),
    unresolved,
    documents: writes.map((w) => ({ path: w.ref.path, urls: w.count })),
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 1));

  console.log(`\nCon reemplazo: ${map.size} · Sin resolver: ${unresolved.length}`);
  writes.forEach((w) => console.log(`  ${w.ref.path}: ${w.count} URL(s)`));
  if (unresolved.length) {
    console.log("\nSin resolver:");
    unresolved.forEach((u) => console.log(`  [${u.reason}] ${u.url}`));
  }
  console.log(`\nReporte: ${REPORT}`);

  if (!WRITE) {
    console.log("Simulación: no se escribió nada. Agregar --write para aplicar.");
    process.exit(0);
  }

  const backupFile = path.join(__dirname, `../backups/cloudinary-fix-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1));
  console.log(`Backup: ${backupFile}`);

  for (const { ref, update } of writes) {
    // Volver a leer: si el documento cambió desde el escaneo, se omite
    const fresh = (await ref.get()).data();
    if (JSON.stringify(fresh) !== JSON.stringify(backup[ref.path])) {
      console.log(`  ⚠ ${ref.path}: cambió durante la ejecución, se omite`);
      continue;
    }
    await ref.update(update);
    console.log(`  ✔ ${ref.path}`);
  }
  console.log("Listo.");
  process.exit(0);
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
