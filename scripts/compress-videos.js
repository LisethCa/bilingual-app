// Comprime los videos de las lecciones y sus miniaturas para servirlos en web.
//
// Uso:
//   node scripts/compress-videos.js           -> comprime lo que falte en videos/compressed/
//   node scripts/compress-videos.js --force   -> vuelve a comprimir todo
//
// Entrada: cualquier .mp4 dentro de videos/ (fuera de videos/compressed/) y las
// miniaturas en videos/thumbnails/. Salida por video, en videos/compressed/:
//   <slug>.mp4   H.264 720p (vertical 720x1280), CRF 26, AAC 96k, faststart
//   <slug>.webp  miniatura 720px de ancho (si no hay miniatura asignada, se usa un frame del video)
//
// Necesita ffmpeg (winget install Gyan.FFmpeg). Si no está en el PATH, definir FFMPEG
// con la ruta al ejecutable.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const FORCE = process.argv.includes("--force");
const ROOT = path.join(__dirname, "../videos");
const OUT = path.join(ROOT, "compressed");
const THUMBS = path.join(ROOT, "thumbnails");

// slug del video -> archivo en videos/thumbnails/ (null = tomar un frame del video)
const THUMBNAIL_FOR = {
  "countries-and-nationalities": "Countries and Nationalities Adventure.png",
  counting: "Learn Colours and Numbers 1–10.png",
  "describing-people": "Describing People_ A Colourful Character Poster.png",
  "family-and-relationship": "Family Relationships Poster.png",
  fashion: "Fashion and Style Boutique Kids.png",
  "meeting-people": "Meeting People_ A Cheerful Welcome.png",
  "means-of-transport": null,
  "time-and-daily-routine": null,
};

const findFfmpeg = () => {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return "ffmpeg";
  // winget instala acá y el PATH nuevo no llega a shells ya abiertos
  const pkgs = path.join(process.env.LOCALAPPDATA || "", "Microsoft/WinGet/Packages");
  if (fs.existsSync(pkgs)) {
    for (const dir of fs.readdirSync(pkgs).filter((d) => d.startsWith("Gyan.FFmpeg"))) {
      for (const build of fs.readdirSync(path.join(pkgs, dir))) {
        const exe = path.join(pkgs, dir, build, "bin/ffmpeg.exe");
        if (fs.existsSync(exe)) return exe;
      }
    }
  }
  console.error("No se encontró ffmpeg. Instalar con: winget install Gyan.FFmpeg (o definir FFMPEG).");
  process.exit(1);
};
const FFMPEG = findFfmpeg();

const slugify = (name) =>
  name
    .replace(/\.mp4$/i, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const findVideos = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return full === OUT ? [] : findVideos(full);
    return /\.mp4$/i.test(e.name) ? [full] : [];
  });

const run = (args) => {
  const res = spawnSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-stats", "-y", ...args], {
    stdio: "inherit",
  });
  if (res.status !== 0) throw new Error(`ffmpeg falló (código ${res.status})`);
};

const mb = (file) => (fs.statSync(file).size / 1024 / 1024).toFixed(1);

fs.mkdirSync(OUT, { recursive: true });
const videos = findVideos(ROOT);
if (!videos.length) {
  console.error("No hay .mp4 en videos/.");
  process.exit(1);
}

let before = 0;
let after = 0;
for (const src of videos) {
  const slug = slugify(path.basename(src));
  const dest = path.join(OUT, `${slug}.mp4`);
  const thumb = path.join(OUT, `${slug}.webp`);
  console.log(`\n== ${path.basename(src)} -> ${slug}`);

  if (FORCE || !fs.existsSync(dest)) {
    // -2 mantiene la proporción con dimensión par; sirve para verticales y horizontales
    const scale = "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),720,-2)'";
    run([
      "-i", src,
      "-vf", scale,
      "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "96k",
      "-movflags", "+faststart",
      dest,
    ]);
  } else {
    console.log("ya existe, se saltea (usar --force para rehacer)");
  }

  if (FORCE || !fs.existsSync(thumb)) {
    const assigned = THUMBNAIL_FOR[slug];
    const thumbSrc = assigned && path.join(THUMBS, assigned);
    if (thumbSrc && fs.existsSync(thumbSrc)) {
      run(["-i", thumbSrc, "-vf", "scale=720:-2", "-quality", "80", thumb]);
    } else {
      console.log(`sin miniatura asignada${assigned ? ` (no existe ${assigned})` : ""}: se usa un frame del segundo 3`);
      run(["-ss", "3", "-i", src, "-frames:v", "1", "-vf", "scale=720:-2", "-quality", "80", thumb]);
    }
  }

  before += fs.statSync(src).size;
  after += fs.statSync(dest).size;
  console.log(`${mb(src)} MB -> ${mb(dest)} MB, miniatura ${mb(thumb)} MB`);
}

const unused = fs.existsSync(THUMBS)
  ? fs.readdirSync(THUMBS).filter((f) => !Object.values(THUMBNAIL_FOR).includes(f))
  : [];
console.log(`\nTotal: ${(before / 1024 / 1024).toFixed(0)} MB -> ${(after / 1024 / 1024).toFixed(0)} MB`);
if (unused.length) console.log(`Miniaturas sin usar: ${unused.join(", ")}`);
