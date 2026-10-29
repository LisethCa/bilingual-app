// Deja todas las consignas de los ejercicios en español y de acuerdo con lo que el ejercicio pide hacer.
//  - Traduce las consignas que estaban en inglés (TRANSLATIONS, texto exacto).
//  - Los ejercicios de escuchar siempre se resuelven ordenando palabras: se les pone la misma consigna.
//  - A los que no tenían consigna les pone la de su tipo (DEFAULTS).
// Se guarda en exercise.instructions, que es lo que muestra la app arriba de cada ejercicio.
//
//   node contents/curriculum/instructions.js            -> simulación: muestra qué cambiaría
//   node contents/curriculum/instructions.js --write    -> escribe en Firestore (antes guarda un backup)
//
// Correrlo después de apply.js --extend --write (apply.js no escribe si las lecciones cambiaron
// después del volcado). Es idempotente.

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const WRITE = process.argv.includes("--write");

const LISTENING = "Escucha el audio y ordena las palabras para formar la frase.";

const DEFAULTS = {
  sentence_formation: "Ordena las palabras para formar la oración.",
  fill_in_blank: "Elige la opción correcta para completar cada oración.",
  fill_blank: "Elige la opción correcta para completar cada oración.",
  matching: "Une cada elemento de la izquierda con su pareja de la derecha.",
  memory_game: "Voltea las tarjetas y encuentra las parejas.",
  vocabulary: "Clasifica cada palabra en su categoría.",
  conjugation: "Escribe la forma correcta del verbo para cada pronombre.",
  pronunciation: "Escucha el ejemplo y di la frase en voz alta.",
  image_selection: "Elige la imagen correcta.",
  audio_matching: "Escucha el audio y elige la opción correcta.",
  drag_drop: "Arrastra cada elemento hasta su pareja.",
  dialogue_simulation: "Elige la respuesta correcta para continuar la conversación.",
  map_interactive: "Mira el mapa y elige, paso a paso, la dirección para llegar al destino.",
  calendar_planner: "Asigna al menos 3 actividades por día para completar tu horario.",
};

const TRANSLATIONS = {
  // ordenar palabras
  "Order the words to make a correct sentence.": "Ordena las palabras para formar la oración.",
  "Order the words to form a sentence.": "Ordena las palabras para formar la oración.",
  "Order the words to make a correct sentence with 'to be'.": "Ordena las palabras para formar una oración con el verbo to be.",
  "Order the words to make a correct question.": "Ordena las palabras para formar la pregunta.",
  "Order the words to make a correct past simple sentence.": "Ordena las palabras para formar una oración en pasado simple.",
  "Order the words to make a correct negative sentence.": "Ordena las palabras para formar una oración negativa.",
  "Order the words to make a correct sentence with 'have/has'.": "Ordena las palabras para formar una oración con have / has.",
  "You can make two different correct sentences. Try one!": "Ordena las palabras para formar la oración. Hay dos oraciones correctas posibles: arma una.",
  "Form a polite sentence to order.": "Ordena las palabras para pedir algo de forma amable.",
  "Form the sentence to order water.": "Ordena las palabras para pedir agua.",
  "What does the waiter say?": "Ordena las palabras para formar lo que dice el mesero.",
  "Order a burger and fries.": "Ordena las palabras para pedir una hamburguesa con papas fritas.",
  "Order the words to make a correct sentence about waking up.": "Ordena las palabras para formar una oración sobre levantarse.",
  "Order the words to make a correct sentence about breakfast.": "Ordena las palabras para formar una oración sobre el desayuno.",
  "Order the words to make a correct sentence about dinner.": "Ordena las palabras para formar una oración sobre la cena.",
  "Order the words to make a sentence using sequence words.": "Ordena las palabras para formar una oración con palabras de secuencia (first, then, after that...).",
  "Order the words to ask for the bill politely.": "Ordena las palabras para pedir la cuenta de forma amable.",
  "Order the words to ask about the price of a jacket.": "Ordena las palabras para preguntar el precio de una chaqueta.",
  "Order the words to ask about the shoes (plural).": "Ordena las palabras para preguntar por los zapatos (plural).",
  "Order the words to ask for the bill.": "Ordena las palabras para pedir la cuenta.",
  "Order the words to make a correct sentence with a reflexive pronoun.": "Ordena las palabras para formar una oración con un pronombre reflexivo.",
  "Order the words to describe someone.": "Ordena las palabras para describir a una persona.",
  "Form the sentence about friends.": "Ordena las palabras para formar una oración sobre amigos.",
  "Form a sentence to describe a room.": "Ordena las palabras para describir una habitación.",
  "Order the words to form a travel plan.": "Ordena las palabras para formar un plan de viaje.",
  "Order the words to make correct weather sentences.": "Ordena las palabras para formar una oración sobre el clima.",
  "Order the words to ask about the weather.": "Ordena las palabras para preguntar por el clima.",
  "Order the words to talk about temperature.": "Ordena las palabras para hablar de la temperatura.",
  "Order the words to make a correct negative sentence in past simple.": "Ordena las palabras para formar una oración negativa en pasado simple.",
  "Order the words to make a correct question in past simple.": "Ordena las palabras para formar una pregunta en pasado simple.",
  "Order the words to make a correct past simple sentence with an irregular verb.": "Ordena las palabras para formar una oración en pasado simple con un verbo irregular.",

  // emparejar (tocar izquierda y derecha)
  "Match each family member with the correct translation.": "Une cada miembro de la familia con su traducción.",
  "Match each family member with its correct translation.": "Une cada miembro de la familia con su traducción.",
  "Match each country with its correct description or flag.": "Une cada país con su descripción o su bandera.",
  "Match the country with the correct nationality ending pattern.": "Une cada país con la terminación de su nacionalidad.",
  "Match the image with the correct family word.": "Une cada imagen con el familiar que corresponde.",
  "Match the subject pronoun with the correct possessive adjective.": "Une cada pronombre personal con su adjetivo posesivo.",
  "Match the subject with the correct form of 'to be'.": "Une cada pronombre personal con la forma correspondiente del verbo to be en presente.",
  "Match the subject with the correct form of 'to have'.": "Une cada pronombre personal con la forma correspondiente del verbo to have.",
  "Match each job with its Spanish translation.": "Une cada profesión con su traducción.",
  "Match each sentence with 'some' or 'any'.": "Une cada oración con some o any, según corresponda.",
  "Match the sentence with 'much' or 'many'.": "Une cada oración con much o many, según corresponda.",
  "Match each sentence with the correct pronoun type.": "Toca una oración de la columna izquierda y elige en la columna derecha si tiene un pronombre posesivo o un pronombre reflexivo.",
  "Match each sport with its correct name.": "Une cada deporte con su nombre.",
  "Match each action verb with its Spanish translation.": "Une cada verbo de acción con su traducción.",
  "Match each season with its characteristic.": "Une cada estación del año con su característica.",
  "Match the weather with the appropriate clothing.": "Une cada clima con la ropa adecuada.",
  "Match the sentence with the correct comparative form.": "Une cada oración con la forma comparativa correcta.",
  "Match the English phrase with its communicative function.": "Une cada frase en inglés con su función (para qué se usa).",
  "Match each present tense verb with its past simple form.": "Une cada verbo en presente con su forma en pasado simple.",
  "Match the verb with its correct -ed pronunciation.": "Une cada verbo con la pronunciación de su terminación -ed.",
  "Match the verb with its correct past form rule.": "Une cada verbo con la regla que sigue para formar el pasado.",
  "Match each present tense irregular verb with its past simple form.": "Une cada verbo irregular en presente con su forma en pasado simple.",
  "Match each verb with its pattern group.": "Une cada verbo con su grupo según cómo cambia.",

  // memoria (voltear tarjetas)
  "Match the English word with its Spanish translation.": "Voltea las tarjetas y encuentra las parejas: cada palabra en inglés con su traducción.",
  "Match each country with its correct nationality.": "Voltea las tarjetas y encuentra las parejas: cada país con su nacionalidad.",
  "Match the job with its Spanish translation.": "Voltea las tarjetas y encuentra las parejas: cada profesión con su traducción.",
  "Match the icons with the words.": "Voltea las tarjetas y encuentra las parejas: cada ícono con su palabra.",
  "Match the English job with its Spanish translation.": "Voltea las tarjetas y encuentra las parejas: cada profesión con su traducción.",
  "Match the sport with its picture/translation.": "Voltea las tarjetas y encuentra las parejas: cada deporte con su imagen o traducción.",
  "Match the English verb with its Spanish translation.": "Voltea las tarjetas y encuentra las parejas: cada verbo con su traducción.",
  "Match transport words with translations.": "Voltea las tarjetas y encuentra las parejas: cada medio de transporte con su traducción.",
  "Match the English weather word with its Spanish translation.": "Voltea las tarjetas y encuentra las parejas: cada palabra del clima con su traducción.",

  // arrastrar
  "Drag and drop the correct word to complete each sentence.": "Arrastra la palabra correcta para completar cada oración.",
  "Drag and drop the correct nationality to complete each sentence.": "Arrastra la nacionalidad correcta para completar cada oración.",
  "Match the container with the correct food item.": "Arrastra cada recipiente hasta el alimento que corresponde.",
  "Drag and drop to complete the daily routine in order.": "Arrastra cada actividad para completar la rutina diaria en orden.",
  "Match the English word with its Spanish meaning.": "Arrastra cada palabra en inglés hasta su traducción.",
  "Match the English word to its Spanish translation.": "Arrastra cada palabra en inglés hasta su traducción.",
  "Match the words with their Spanish meaning.": "Arrastra cada palabra hasta su traducción.",
  "Match the professional with their workplace.": "Arrastra cada profesional hasta su lugar de trabajo.",
  "Drag the word to its Spanish translation": "Arrastra cada palabra hasta su traducción.",
  "Match the pronoun with the distance and number.": "Arrastra cada pronombre demostrativo hasta su distancia y número (cerca / lejos, uno / varios).",
  "Match the object to the place.": "Arrastra cada objeto hasta el lugar que corresponde.",

  // completar
  "Select the correct verb phrase to complete each sentence.": "Elige una de las rutinas para completar la oración de forma correcta.",
  "Select the correct frequency adverb (always, usually, sometimes, never).": "Ubica sobre la línea la frecuencia que corresponde en la oración (always, usually, sometimes, never).",
  "Select the correct reflexive pronoun for each subject.": "Elige el pronombre reflexivo que corresponde a cada sujeto.",
  "Select the correct reflexive pronoun for each sentence.": "Elige uno de los tres (3) pronombres reflexivos y completa la oración.",

  // escribir (conjugación)
  "Use 'a' for consonants and 'an' for vowels.": "Escribe a o an: a antes de sonido de consonante y an antes de sonido de vocal.",
  "Complete with 'some' for positive and 'any' for negative.": "Escribe some en las oraciones afirmativas y any en las negativas.",
  "Write the plural form only if possible (otherwise write the same word).": "Escribe el plural de cada palabra. Si no tiene plural, escribe la misma palabra.",
  "Conjugate the future with 'going to' for all pronouns.": "Escribe el futuro con going to para cada pronombre.",
  "Choose the correct article for each profession.": "Escribe el artículo correcto (a / an) para cada profesión.",
  "Complete with the correct possessive adjective (My, Your, His, Her)": "Escribe el adjetivo posesivo correcto (my, your, his, her).",
  "Complete the sentences with 'in', 'on', or 'at'.": "Escribe in, on o at para completar cada oración.",

  // imágenes
  "Select the fruit.": "Elige la imagen de la fruta.",
  "Choose the correct image": "Elige la imagen correcta.",
  "Which one is a credit card?": "Elige la imagen de la tarjeta de crédito.",
  "Who designs buildings?": "Elige la imagen de la persona que diseña edificios.",
  "Look at the image and choose.": "Mira las imágenes y elige la correcta.",
  "Look at the images and select the correct room.": "Mira las imágenes y elige la habitación correcta.",
  "Look at the description and select the correct sport.": "Lee la descripción y elige el deporte correcto.",
  "Look at the pictures and select the correct action.": "Mira las imágenes y elige la acción correcta.",
  "Identify the transport.": "Elige la imagen del medio de transporte.",
  "Identify the correct item.": "Elige la imagen correcta.",

  // escuchar y elegir
  "Identify the food by sound.": "Escucha el audio y elige el alimento que oyes.",
  "Listen and select the correct time of day": "Escucha el audio y elige el momento del día que oyes.",
  "Listen and select the correct personality trait": "Escucha el audio y elige la característica de personalidad que oyes.",

  // otros
  "Classify the items into Countable or Uncountable.": "Clasifica cada palabra en contable o incontable.",
  "Listen and repeat the sentence about your daily routine.": "Escucha el ejemplo y di en voz alta la frase sobre la rutina diaria.",
  "Listen and repeat the sentence about sports.": "Escucha el ejemplo y di en voz alta la frase sobre deportes.",
  "Assign at least 3 activities per day to complete your schedule.": DEFAULTS.calendar_planner,
};

const instructionFor = (e) => {
  const current = (e.instructions || e.config?.instructions || "").trim();
  if (e.type === "listening_transcription") return LISTENING;
  if (TRANSLATIONS[current]) return TRANSLATIONS[current];
  if (current) return current;
  // drag_drop sin consigna ya muestra su pregunta (en español) como consigna
  if (e.type === "drag_drop" && e.config?.question) return e.config.question.replace(/([^.!?])$/, "$1.");
  return DEFAULTS[e.type] || current;
};

admin.initializeApp({ credential: admin.credential.cert(require("../../service-account-key.json")) });
const db = admin.firestore();

(async () => {
  const snap = await db.collection("lessons").get();
  const plan = [];
  const stillEnglish = new Set();
  const changes = {};

  for (const doc of snap.docs) {
    const content = doc.data().content;
    if (!content) continue;
    const before = JSON.stringify(content);
    const after = JSON.parse(before);
    for (const e of [...(after.exercises || []), ...(after.game ? [after.game] : [])]) {
      const next = instructionFor(e);
      if (next && next !== e.instructions) {
        const key = `${e.instructions || "(sin consigna)"}  ->  ${next}`;
        changes[key] = (changes[key] || 0) + 1;
        e.instructions = next;
      }
      if (e.instructions && !/[áéíóúñ¿¡]|^(Elige|Escucha|Completa|Ordena|Une|Arrastra|Toca|Lee|Escribe|Clasifica|Encuentra|Voltea|Mira|Ubica|Asigna|Relaciona|Selecciona|Empareja|Di|Responde|Forma)\b/.test(e.instructions))
        stillEnglish.add(`${doc.id}: ${e.instructions}`);
    }
    if (JSON.stringify(after) !== before) plan.push({ ref: doc.ref, id: doc.id, before: content, after });
  }

  Object.entries(changes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, n]) => console.log(`${String(n).padStart(4)}  ${k}`));
  console.log(`\n${plan.length} lecciones para actualizar.`);
  if (stillEnglish.size) console.log(`\nRevisar (¿siguen en inglés?):\n  ${[...stillEnglish].join("\n  ")}`);

  if (!WRITE) {
    console.log(`\nSimulación. Correr con --write para escribir.`);
    process.exit(0);
  }

  const backupFile = path.join(__dirname, `../backups/instructions-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(Object.fromEntries(plan.map((p) => [p.id, p.before])), null, 1));
  console.log(`\nBackup (content anterior) en ${backupFile}`);

  for (let i = 0; i < plan.length; i += 400) {
    const batch = db.batch();
    plan.slice(i, i + 400).forEach((p) => batch.update(p.ref, { content: p.after, updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
    await batch.commit();
  }
  console.log(`Escritas ${plan.length} lecciones.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
