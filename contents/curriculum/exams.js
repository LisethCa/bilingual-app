// Exámenes finales A1 y A2 con la misma estructura: 15 ejercicios en 5 secciones
//   Vocabulario (3) · Gramática (4) · Comprensión auditiva (3) · Escritura (3) · Conversación (2)
// La app calcula la nota con los errores de cada ejercicio y aprueba con settings.exam.passingScore.
//
//   node contents/curriculum/exams.js            -> simulación: valida y muestra qué cambiaría
//   node contents/curriculum/exams.js --write    -> escribe en Firestore (antes guarda un backup)
//
// Solo reemplaza title, objectives, content.exercises, settings.exam y metadata de las dos lecciones.
// El vocabulario (con sus emojis/imágenes) y el resumen de gramática se conservan.
// Si una lección cambió en Firestore después del último volcado (dump.js), se omite.

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { match, fill, build, drag, cat, dialog, tokens, latestDump, stableStringify } = require("./helpers");

const WRITE = process.argv.includes("--write");
const PASSING_SCORE = 70;

/** Escuchar y ordenar. Sin audioUrl la app usa la voz del dispositivo. */
const listen = (title, sentence, distractors = [], audioUrl) => ({
  type: "listening_transcription",
  title,
  instructions: "Escucha y ordena la frase.",
  question: "",
  config: {
    correctSentence: sentence,
    wordBank: [...tokens(sentence), ...distractors],
    ...(audioUrl ? { audioUrl } : {}),
  },
  feedback: {},
  scoring: { pointsPerCorrect: 1 },
});

const section = (name, exercises) => exercises.map((ex) => ({ ...ex, section: name }));

const CLD = "https://res.cloudinary.com/ddowwkgy0/video/upload";

const EXAMS = {
  A1_MEGA_FINAL_EXAM: {
    level: "A1",
    title: "Examen final A1",
    exercises: [
      ...section("Vocabulario", [
        cat("Clasifica las palabras", [
          ["Familia", ["mother", "brother", "grandfather"]],
          ["Profesiones", ["doctor", "teacher", "engineer"]],
          ["Ropa", ["shirt", "shoes", "jacket"]],
        ]),
        match("Une cada palabra con su traducción", [
          "Tired = Cansado/a",
          "Hungry = Con hambre",
          "Kitchen = Cocina",
          "Weather = Clima",
          "Ticket = Boleto",
          "Headache = Dolor de cabeza",
        ]),
        fill("Vocabulario en contexto", [
          "I drink ___ every morning. | coffee | chairs, shoes",
          "My mother's brother is my ___. | uncle | cousin, nephew",
          "It's cold. Take your ___. | jacket | sandals, sunglasses",
          "A ___ works in a hospital. | nurse | pilot, farmer",
        ]),
      ]),
      ...section("Gramática", [
        fill("Verbo to be y presente simple", [
          "She ___ from Mexico. | is | are, am",
          "They ___ students. | are | is, am",
          "He ___ to work by bus every day. | goes | go, going",
          "I ___ coffee in the morning. | usually drink | drink usually, usually drinks",
        ]),
        fill("Presente continuo y pasado simple", [
          "Look! The children ___ in the park. | are playing | play, is playing",
          "Right now I ___ dinner. | am cooking | cook, cooked",
          "Yesterday I ___ to the cinema. | went | go, goed",
          "We ___ pizza last night. | ate | eat, eated",
        ]),
        fill("Futuro, comparativos y can", [
          "Next year I ___ study in London. | am going to | going to, am go to",
          "Don't worry, I ___ help you. | will | am, did",
          "Summer is ___ than winter. | hotter | hot, more hot",
          "I ___ swim, but I can't ski. | can | can't, does",
        ]),
        drag("Une cada pregunta con su respuesta", [
          "How much is this shirt? = It's twenty dollars.",
          "Where is the bank? = It's next to the park.",
          "What time is it? = It's quarter past eight.",
          "How are you? = I'm fine, thanks.",
          "What do you do? = I'm a teacher.",
        ]),
      ]),
      ...section("Comprensión auditiva", [
        listen(
          "La familia",
          "I have two brothers and one sister",
          ["has", "am"],
          `${CLD}/v1790867457/two_brothers_and_one_sister_g0ss5e_fh2jct.mp3`,
        ),
        listen(
          "De viaje",
          "I am taking the bus to the airport",
          ["train", "plane"],
          `${CLD}/v1790867438/I_am_taking_the_bus_to_the_airport_f9hgva_u2jipu.mp3`,
        ),
        listen(
          "El verano pasado",
          "I went to Paris last summer",
          ["go", "gone", "did"],
          `${CLD}/v1790867440/I_went_to_Paris_last_summer_keapmz_pe5z2z.mp3`,
        ),
      ]),
      ...section("Escritura", [
        build("Rutina", "🏃 ¿Qué haces los sábados por la mañana?", "I usually play football on Saturday morning", ["plays", "in"]),
        build("Ubicación", "📍 ¿Dónde está la farmacia?", "The pharmacy is next to the supermarket", ["between", "are"]),
        build("Planes", "✈️ ¿Qué vas a hacer el próximo verano?", "I am going to visit my grandparents", ["will", "went"]),
      ]),
      ...section("Conversación", [
        dialog("En el restaurante", "Estás en un restaurante y el mesero te atiende.", [
          ["Waiter", "Good evening! Are you ready to order?", "Yes, I would like the chicken, please.", "Yes, I like chicken every day.", "Para pedir con amabilidad usa 'I would like...'."],
          ["Waiter", "Would you like something to drink?", "A glass of orange juice, please.", "I am drinking juice now.", "Responde qué quieres tomar."],
          ["Waiter", "Here you are. Anything else?", "No, thank you. Can I have the bill, please?", "No, I don't have.", "Para pedir la cuenta: 'Can I have the bill, please?'"],
        ]),
        dialog("En el médico", "Te sientes mal y vas al médico.", [
          ["Doctor", "Hello. What's the matter?", "I have a headache and a fever.", "I am a doctor.", "Describe tus síntomas con 'I have...'."],
          ["Doctor", "When did it start?", "It started yesterday.", "It starts tomorrow.", "Pregunta en pasado: responde con 'started'."],
          ["Doctor", "You should rest and drink a lot of water.", "OK. Thank you, doctor.", "Yes, I am rest.", "Agradece el consejo."],
        ]),
      ]),
    ],
  },

  A2_general_review: {
    level: "A2",
    title: "Examen final A2",
    exercises: [
      ...section("Vocabulario", [
        cat("Clasifica las palabras", [
          ["Trabajo", ["meeting", "salary", "colleague"]],
          ["Viajes", ["luggage", "passport", "delay"]],
          ["Salud", ["headache", "appointment", "medicine"]],
        ]),
        match("Une cada palabra con su traducción", [
          "Savings = Ahorros",
          "Rent = Alquiler",
          "Neighborhood = Barrio",
          "Skill = Habilidad",
          "Deadline = Fecha límite",
          "Environment = Medio ambiente",
        ]),
        fill("Vocabulario en contexto", [
          "I can't buy it. It's too ___. | expensive | cheap, free",
          "My flight had a two-hour ___. | delay | luggage, boarding",
          "She is very ___: she always tells the truth. | honest | lazy, rude",
          "We have to ___ energy: turn off the lights. | save | spend, waste",
        ]),
      ]),
      ...section("Gramática", [
        fill("Presente y pasado", [
          "I usually ___ English at night. | study | am studying, studied",
          "Right now she ___ a book. | is reading | reads, read",
          "I ___ TV when you called me. | was watching | watched, am watching",
          "They ___ to Rome in 2019. | traveled | have traveled, travel",
        ]),
        fill("Presente perfecto y futuro", [
          "I have never ___ to Japan. | been | went, go",
          "Have you ever ___ sushi? | eaten | ate, eat",
          "Look at those clouds! It ___ rain. | is going to | will to, goes to",
          "I'm tired. I think I ___ go to bed early. | will | am, did",
        ]),
        fill("Modales, comparativos y cantidades", [
          "You look sick. You ___ see a doctor. | should | must to, can to",
          "You ___ wear a seatbelt. It's the law. | must | could, may",
          "This is the ___ restaurant in town. | best | better, most good",
          "I can't sleep. I drink too ___ coffee. | much | many, enough",
        ]),
        drag("Une cada tiempo verbal con su ejemplo", [
          "Present perfect = I have seen that movie",
          "Past continuous = I was reading when you called",
          "Going to = I am going to travel next month",
          "Past simple = I visited my aunt yesterday",
          "Present continuous = She is working right now",
        ]),
      ]),
      ...section("Comprensión auditiva", [
        listen("Vivir en la ciudad", "She has lived in this city for five years", ["since", "lives"]),
        listen("Una interrupción", "We were having dinner when the phone rang", ["rings", "are"]),
        listen("Un consejo", "You should take an umbrella today", ["must", "yesterday"]),
      ]),
      ...section("Escritura", [
        build("Experiencias", "✈️ ¿Alguna vez viajaste en avión?", "I have traveled by plane many times", ["travel", "was"]),
        build("Comparaciones", "🏙️ Compara la ciudad con el campo.", "The city is noisier than the countryside", ["more", "most"]),
        build("Consejos", "😥 Un amigo está estresado. Dale un consejo.", "You should take a break and relax", ["must", "relaxing"]),
      ]),
      ...section("Conversación", [
        dialog("Entrevista de trabajo", "Tienes una entrevista para un trabajo en una empresa.", [
          ["Interviewer", "Tell me about your experience.", "I have worked as a sales assistant for two years.", "I am working as a sales assistant since two years.", "Usa el presente perfecto: 'I have worked... for...'."],
          ["Interviewer", "Why do you want this job?", "Because I want to improve my skills and grow professionally.", "Because yesterday I want a job.", "Explica tu motivo en presente."],
          ["Interviewer", "Can you work on weekends?", "Yes, I can work on Saturdays if necessary.", "Yes, I could worked on Saturdays.", "Después de 'can' va el verbo en su forma base."],
        ]),
        dialog("Planeando las vacaciones", "Hablas con un amigo sobre las vacaciones.", [
          ["Friend", "Have you ever been to Cartagena?", "No, I haven't, but I would love to go.", "No, I didn't been there.", "A 'Have you ever...?' se responde con 'I have' / 'I haven't'."],
          ["Friend", "What are you going to do this summer?", "I'm going to visit my cousins in Medellín.", "I visited my cousins next summer.", "Para planes usa 'going to'."],
          ["Friend", "Which is better: the beach or the mountains?", "The beach is better because it's warmer.", "The beach is more good than the mountains.", "El comparativo de 'good' es 'better'."],
        ]),
      ]),
    ],
  },
};

// ===== Validación: cada ejercicio debe poder resolverse =====
const norm = (s) => tokens(s.toLowerCase()).join(" ");
const validate = (id, exercises) => {
  const errors = [];
  const bagHas = (bank, sentence) => {
    const pool = bank.map((w) => w.toLowerCase());
    return tokens(sentence.toLowerCase()).every((w) => {
      const i = pool.indexOf(w);
      if (i === -1) return false;
      pool.splice(i, 1);
      return true;
    });
  };
  exercises.forEach((ex, i) => {
    const c = ex.config;
    const where = `${id} #${i + 1} ${ex.type} "${ex.title}"`;
    if (ex.type === "fill_in_blank")
      c.questions.forEach((q) => {
        if (!q.options.includes(q.answer)) errors.push(`${where}: respuesta fuera de las opciones`);
        if (new Set(q.options).size !== q.options.length) errors.push(`${where}: opciones repetidas`);
      });
    if (ex.type === "sentence_formation" && !c.correctAnswers.every((a) => bagHas(c.wordBank, a)))
      errors.push(`${where}: la respuesta no se puede armar con las fichas`);
    if (ex.type === "listening_transcription" && !bagHas(c.wordBank, c.correctSentence))
      errors.push(`${where}: la oración no se puede armar con las fichas`);
    if (ex.type === "dialogue_simulation")
      c.dialogues.forEach((d) => {
        if (d.options.filter((o) => o.correct).length !== 1) errors.push(`${where}: cada paso necesita una sola respuesta correcta`);
      });
    if (["matching", "drag_drop"].includes(ex.type) && new Set(c.pairs.map((p) => norm(p.to))).size !== c.pairs.length)
      errors.push(`${where}: parejas repetidas`);
  });
  if (exercises.length !== 15) errors.push(`${id}: tiene ${exercises.length} ejercicios, se esperaban 15`);
  return errors;
};

admin.initializeApp({ credential: admin.credential.cert(require("../../service-account-key.json")) });
const db = admin.firestore();

(async () => {
  const dumpPath = latestDump();
  const dump = JSON.parse(fs.readFileSync(dumpPath, "utf8"));
  console.log(`Volcado: ${path.basename(dumpPath)}\n`);

  const allErrors = [];
  const writes = [];
  const backup = {};

  for (const [id, exam] of Object.entries(EXAMS)) {
    const exercises = exam.exercises.map((ex, i) => ({ ...ex, id: `exam_${String(i + 1).padStart(2, "0")}_${ex.type}` }));
    allErrors.push(...validate(id, exercises));

    const ref = db.collection("lessons").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      allErrors.push(`${id}: no existe en Firestore`);
      continue;
    }
    const live = snap.data();
    if (stableStringify(live) !== stableStringify(dump.lessons[id])) {
      allErrors.push(`${id}: cambió en Firestore después del volcado (volver a correr dump.js)`);
      continue;
    }

    const update = {
      title: exam.title,
      objectives: [
        `Demostrar lo aprendido en todo el nivel ${exam.level}`,
        "Vocabulario, gramática, comprensión auditiva, escritura y conversación",
        `Aprobar con ${PASSING_SCORE}% o más para completar el nivel`,
      ],
      "content.exercises": exercises,
      "settings.exam": { passingScore: PASSING_SCORE },
      metadata: {
        ...live.metadata,
        level: exam.level,
        module: "final_exam",
        xpReward: 300, // informativo: la app usa XP.finalExam (services/xpService.ts)
        estimatedDuration: 1200,
        tags: ["final_exam", exam.level],
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    backup[id] = live;
    writes.push([id, () => ref.update(update)]);

    const bySection = {};
    exercises.forEach((ex) => (bySection[ex.section] = [...(bySection[ex.section] || []), ex.type]));
    console.log(`${id}: "${live.title}" -> "${exam.title}"`);
    console.log(`  ejercicios: ${live.content.exercises.length} -> ${exercises.length}`);
    Object.entries(bySection).forEach(([name, types]) => console.log(`  ${name}: ${types.join(", ")}`));
    console.log();
  }

  if (allErrors.length) {
    console.log("❌ Problemas (no se escribe nada):");
    allErrors.forEach((e) => console.log(`  ${e}`));
    process.exit(1);
  }
  console.log("✅ Validación OK: todos los ejercicios se pueden resolver.");

  if (!WRITE) {
    console.log("Simulación: no se escribió nada. Agregar --write para aplicar.");
    process.exit(0);
  }

  const backupFile = path.join(__dirname, `../backups/exams-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 1));
  console.log(`Backup: ${backupFile}`);
  for (const [id, write] of writes) {
    await write();
    console.log(`  ✔ ${id}`);
  }
  console.log("Listo.");
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
