// Asigna un emoji a cada palabra del vocabulario usando IA (Groq).
// Solo LEE Firestore (a través del volcado más reciente) y escribe archivos locales:
//   contents/curriculum/out/vocab-emojis.json          -> lo que después sube emojis-apply.js
//   contents/curriculum/out/vocab-emojis-preview.html  -> para revisar visualmente
//
//   node contents/curriculum/emojis.js                     -> todas las lecciones visibles
//   node contents/curriculum/emojis.js --lesson A1_greetings
//   node contents/curriculum/emojis.js --redo              -> vuelve a pedir también las ya generadas
//
// Necesita GROQ_API_KEY (variable de entorno o ../bilingual-back/.env).
// Las palabras que ya tienen imagen propia (Cloudinary) se omiten: la app muestra esa imagen.
// El emoji solo se acepta si existe en Fluent Emoji 3D (el mismo paquete que usa la app).

const fs = require("fs");
const path = require("path");
const { latestDump } = require("./helpers");

const MODEL = "openai/gpt-oss-120b";
const FLUENT_VERSION = "1.1.0";
const OUT = path.join(__dirname, "out/vocab-emojis.json");
const PREVIEW = path.join(__dirname, "out/vocab-emojis-preview.html");

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
};
const ONLY_LESSON = arg("--lesson");
const REDO = process.argv.includes("--redo");

const groqKey = () => {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  const envFile = path.join(__dirname, "../../../bilingual-back/.env");
  const line = fs.existsSync(envFile) && fs.readFileSync(envFile, "utf8").split(/\r?\n/).find((l) => l.startsWith("GROQ_API_KEY="));
  if (!line) throw new Error("Falta GROQ_API_KEY");
  return line.slice("GROQ_API_KEY=".length).replace(/^"|"$/g, "").trim();
};

const codepoints = (emoji) => Array.from(emoji).map((c) => c.codePointAt(0).toString(16).padStart(4, "0")).join("-");

// Lista de emojis disponibles en el paquete 3D
const loadFluentSet = async () => {
  const res = await fetch(`https://data.jsdelivr.com/v1/packages/npm/@lobehub/fluent-emoji-3d@${FLUENT_VERSION}?structure=flat`);
  if (!res.ok) throw new Error(`No se pudo leer la lista de Fluent Emoji (${res.status})`);
  const { files } = await res.json();
  return new Set(files.filter((f) => f.name.startsWith("/assets/")).map((f) => f.name.slice(8).replace(/\.webp$/, "")));
};

// El modelo a veces omite o agrega el selector de variación FE0F: se prueba con y sin él
const normalizeEmoji = (emoji, fluent) => {
  if (!emoji) return "";
  const chars = Array.from(emoji.trim());
  const base = chars.filter((c) => c !== "️");
  const candidates = [chars.join(""), base.join(""), base[0] + "️" + base.slice(1).join("")];
  return candidates.find((c) => c && fluent.has(codepoints(c))) || "";
};

const askGroq = async (key, lesson, items) => {
  const list = items.map((it) => `${it.index} | ${it.word} | ${it.translation}`).join("\n");
  const body = {
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You choose ONE emoji that visually represents an English vocabulary item for Spanish-speaking learners. " +
          "Prefer concrete, unambiguous emojis (objects, animals, food, places, actions, faces). " +
          "For greetings or expressions pick the gesture or situation (e.g. 'Goodbye' -> 👋, 'Thank you' -> 🙏, 'Good night' -> 🌙). " +
          "Avoid flags unless the word is a country or nationality. Avoid skin-tone modifiers. " +
          "If no emoji clearly helps understand the meaning (e.g. grammar words like 'the', 'which', 'although'), return an empty string. " +
          'Reply ONLY with JSON: {"items":[{"index":0,"emoji":"🍎"}]}',
      },
      {
        role: "user",
        content: `Lesson: ${lesson.title || lesson.id}\nItems (index | english | spanish):\n${list}`,
      },
    ],
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after")) || 10 * attempt;
      console.log(`   límite de Groq, espero ${wait}s...`);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const data = await res.json();
    try {
      return JSON.parse(data.choices[0].message.content).items || [];
    } catch {
      if (attempt === 3) throw new Error("Respuesta de Groq no es JSON válido");
    }
  }
  return [];
};

const escapeHtml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const writePreview = (result) => {
  const rows = Object.entries(result.lessons)
    .map(([id, l]) => {
      const cards = l.items
        .map((it) => {
          const img = it.emoji
            ? `<img src="https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@${FLUENT_VERSION}/assets/${codepoints(it.emoji)}.webp" alt="${escapeHtml(it.emoji)}">`
            : `<div class="none">sin emoji</div>`;
          return `<div class="card">${img}<b>${escapeHtml(it.word)}</b><span>${escapeHtml(it.translation)}</span></div>`;
        })
        .join("");
      return `<h2>${escapeHtml(l.title)} <small>${escapeHtml(id)}</small></h2><div class="grid">${cards}</div>`;
    })
    .join("\n");
  fs.writeFileSync(
    PREVIEW,
    `<!doctype html><meta charset="utf-8"><title>Emojis del vocabulario</title>
<style>body{font-family:system-ui,sans-serif;margin:24px;background:#f6f3ff;color:#333}h2{color:#4C1D95;margin-top:32px}small{color:#999;font-weight:normal;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}.card{background:#fff;border-radius:12px;padding:10px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:4px;box-shadow:0 2px 6px #0001}
.card img{width:56px;height:56px}.card span{color:#777;font-size:13px}.none{width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#bbb;border:1px dashed #ddd;border-radius:8px}</style>
<h1>Emojis del vocabulario</h1><p>${result.stats.withEmoji} con emoji · ${result.stats.withoutEmoji} sin emoji · generado ${escapeHtml(result.generatedAt)}</p>
${rows}`,
  );
};

(async () => {
  const dumpPath = latestDump();
  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
  console.log(`Volcado: ${path.basename(dumpPath)}`);

  // lecciones visibles en la app (las que están en modules/*/units/*/lessons)
  const visible = [];
  for (const mod of Object.values(dump.modules)) {
    for (const unit of Object.values(mod.units || {})) visible.push(...(unit.lessons || []));
  }
  const lessonIds = [...new Set(visible)].filter((id) => dump.lessons[id] && (!ONLY_LESSON || id === ONLY_LESSON));
  if (!lessonIds.length) throw new Error(ONLY_LESSON ? `No existe la lección ${ONLY_LESSON}` : "No hay lecciones");

  const previous = !REDO && fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  const result = { generatedAt: new Date().toISOString(), dumpPath, model: MODEL, lessons: { ...(previous?.lessons || {}) } };

  const fluent = await loadFluentSet();
  const key = groqKey();

  for (const id of lessonIds) {
    const lesson = dump.lessons[id];
    const vocab = lesson.content?.vocabulary || [];
    const items = vocab
      .map((v, index) => ({ index, id: v.id, word: v.word, translation: v.translation, hasImage: !!(v.image || v.media?.image) }))
      .filter((it) => it.word && !it.hasImage);
    if (!items.length) continue;

    // reutilizar lo ya generado si el vocabulario no cambió
    const prev = result.lessons[id];
    if (prev && prev.items.length === items.length && prev.items.every((p, i) => p.word === items[i].word && p.index === items[i].index)) {
      continue;
    }

    process.stdout.write(`${id} (${items.length})... `);
    const answer = await askGroq(key, { id, title: lesson.title }, items);
    const byIndex = new Map(answer.map((a) => [Number(a.index), a.emoji]));
    result.lessons[id] = {
      title: lesson.title || id,
      items: items.map(({ hasImage, ...it }) => ({ ...it, emoji: normalizeEmoji(byIndex.get(it.index), fluent) })),
    };
    console.log(result.lessons[id].items.map((it) => it.emoji || "·").join(""));
  }

  // solo lecciones que siguen visibles
  const all = Object.values(result.lessons).flatMap((l) => l.items);
  result.stats = { lessons: Object.keys(result.lessons).length, withEmoji: all.filter((i) => i.emoji).length, withoutEmoji: all.filter((i) => !i.emoji).length };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
  writePreview(result);
  console.log(`\n${result.stats.withEmoji} con emoji, ${result.stats.withoutEmoji} sin emoji, ${result.stats.lessons} lecciones`);
  console.log(`Revisar: ${PREVIEW}`);
  console.log(`Subir:   node contents/curriculum/emojis-apply.js            (simulación)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
