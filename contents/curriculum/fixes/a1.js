const { tokens } = require("../helpers");

// Correcciones a ejercicios que ya estaban en Firestore (las aplica extend.js).
// Octubre 2026: la misma oración aparecía en dos ejercicios de la misma lección
// (por lo general un completar y un ordenar palabras). Se cambia una de las dos.
//
//   [["texto viejo", "texto nuevo"], ...]  reemplaza valores de texto completos dentro del ejercicio
//   rebuild(pista, respuesta, distractores) cambia la oración de un ejercicio de ordenar palabras

const rebuild = (question, answer, distractors = []) => (ex) => {
  ex.question = question;
  Object.assign(ex.config, {
    question,
    correctAnswers: [answer],
    wordBank: [...tokens(answer), ...distractors],
    requiredWords: [],
  });
  return ex;
};

module.exports = {
  A1_colors: {
    add1_fill_in_blank: [["The sky is ___.", "The sea is ___."]],
  },
  A1_nationalities: {
    ex5_sentence_formation_2: rebuild("🇦🇷 Say where he is from (Argentina)", "He is from Argentina"),
  },
  A1_greetings_and_nations: {
    add2_fill_in_blank: [
      ["I am ___ Spain.", "My teacher is ___ Mexico."],
      ["Where ___ you from?", "Where ___ your parents from?"],
    ],
  },
  A1_food_basics: {
    add1_fill_in_blank: [["I want ___ apple.", "There is ___ apple on the table."]],
  },
  A1_simple_present: {
    add2_fill_in_blank: [
      ["She ___ in a hospital.", "She ___ in a supermarket."],
      ["He ___ English every day.", "He ___ math at the university."],
    ],
  },
  A1_meeting_people: {
    add2_fill_in_blank: [["Pleased to ___ you.", "Where did you ___ your best friend?"]],
  },
  A1_meeting_people_formal: {
    add2_fill_in_blank: [["This ___ my colleague, Ms. Garcia.", "This ___ my manager, Mr. Brown."]],
  },
  A1_future_plans: {
    add1_fill_in_blank: [["I ___ going to travel next summer.", "I ___ going to paint my room next weekend."]],
  },
  A1_future_plans_will: {
    add2_fill_in_blank: [["She will ___ English.", "She will ___ medicine at the university."]],
  },
  A1_goals: {
    add8_dialogue_simulation: [
      ["I am going to learn English.", "I am going to learn to drive."],
      ["I am going learn English.", "I am going learn to drive."],
    ],
  },
  A1_intentions_decisions: {
    add2_fill_in_blank: [
      ["I promise I ___ be late.", "I promise I ___ forget your birthday."],
      ["Don't worry, I ___ help you.", "Don't worry, I ___ fix your bike."],
    ],
    add4_sentence_formation: rebuild("🤫 Prometo que no se lo diré a nadie", "I promise I won't tell anyone", ["don't", "am"]),
  },
  A1_greetings_basic: {
    ex4_basic_introduction: [["I am fine, thank you.", "I am very well, thanks."]],
  },
  A1_introducing_yourself: {
    add1_fill_in_blank: [["Nice to ___ you.", "It's nice to ___ new people."]],
  },
  A1_asking_names: {
    ex3_questions_with_to_be: [["What ___ your name?", "What ___ your phone number?"]],
  },
  A1_personal_pronouns: {
    add1_fill_in_blank: [["___ am a student.", "___ am from Ecuador."]],
  },
  A1_greetings: {
    add5_fill_in_blank: [
      ["Hello, my name ___ John.", "Hello, my name ___ Lucy."],
      ["___, see you tomorrow!", "___! Have a nice weekend!"],
    ],
    add9_dialogue_simulation: [["Good afternoon, Mr. Smith. Nice to meet you.", "Good afternoon, Mr. Smith. Pleased to meet you."]],
  },
  A1_restaurant_phrases: {
    add2_fill_in_blank: [["A table ___ two, please.", "A table ___ six people, please."]],
    add3_sentence_formation: rebuild("🍽️ Una mesa cerca de la ventana, por favor", "A table near the window, please", ["of", "menu"]),
  },
  A1_ordering_food: {
    add2_fill_in_blank: [["___ you like some fries?", "___ you like some ketchup?"]],
  },
  A1_paying_the_bill: {
    add2_fill_in_blank: [
      ["Can I ___ the bill, please?", "Can I ___ a glass of water, please?"],
      ["Can I pay ___ card?", "We want to pay ___ card."],
      ["How ___ is it?", "How ___ is the dessert?"],
    ],
    add5_dialogue_simulation: [["Can I pay by card?", "Can I pay by credit card?"]],
  },
  A1_technology_devices: {
    add3_fill_in_blank: [["You ___ use a strong password.", "You ___ change your password every year."]],
  },
  // Antes, cada oración de ordenar repetía la de un ejercicio de escuchar
  A1_sports_activities: {
    ex15_sentence_1: rebuild("⚽ Mi hermano está jugando al fútbol con sus amigos", "My brother is playing soccer with his friends"),
    ex16_sentence_2: rebuild("🏃 La niña está corriendo a la escuela", "The girl is running to school"),
    ex17_sentence_3: rebuild("🏊 Mis padres están nadando en el mar", "My parents are swimming in the sea"),
    ex19_sentence_5: rebuild("🚴 Estamos andando en bicicleta por las montañas", "We are cycling in the mountains"),
    ex20_sentence_6: rebuild("🎾 Mi hermana está jugando al tenis con su entrenador", "My sister is playing tennis with her coach"),
    ex21_sentence_7: rebuild("🤸 Los niños están saltando en el jardín", "The children are jumping in the garden"),
    ex22_sentence_8: rebuild("💃 Ellos están bailando en la sala", "They are dancing in the living room"),
  },
  A1_health_symptoms: {
    add2_fill_in_blank: [
      ["I ___ a headache.", "I ___ a toothache."],
      ["She ___ a fever.", "My dad ___ a backache."],
      ["Do you ___ a cough?", "Do you ___ a sore throat?"],
    ],
  },
  A1_medical_vocabulary: {
    add2_fill_in_blank: [["I ___ to see a doctor.", "I ___ to stay in bed today."]],
  },
  A1_feeling_sick: {
    add4_sentence_formation: rebuild("❓ ¿Te sientes mejor?", "Do you feel better", ["are", "does"]),
  },
  A1_travel_and_transport: {
    add1_fill_in_blank: [["She is ___ at the bus stop.", "My friends are ___ at the train station."]],
  },
  A1_directions: {
    add3_fill_in_blank: [["Turn ___ at the corner.", "Turn ___ at the second street."]],
  },
  A1_nature_environment: {
    add4_fill_in_blank: [["Plants ___ water and sun.", "Animals ___ food and water."]],
  },
  A1_past_experiences: {
    add2_fill_in_blank: [["I ___ a movie yesterday.", "I ___ a documentary on TV."]],
  },
  A1_past_experiences_2: {
    add2_fill_in_blank: [["We ___ pizza yesterday.", "We ___ tacos at the market."]],
    add4_fill_in_blank: [["___ you see the movie?", "___ you see your cousins last week?"]],
  },
  A1_events_celebrations: {
    add4_fill_in_blank: [["We ___ a party last Saturday.", "We ___ a barbecue in the garden."]],
  },
};

// Octubre 2026: consignas que pidió la clienta para ejercicios que no se entendían
// (varias estaban en inglés). { idLección: { idEjercicio: [consignaVieja, consignaNueva] } }
const INSTRUCTIONS = {
  A1_personal_info: {
    ex4_verb_to_be_conjugation_1: [
      "Match the subject with the correct form of 'to be'.",
      "Une cada pronombre personal con la forma correspondiente del verbo to be en presente.",
    ],
  },
  A1_greetings: {
    add5_fill_in_blank: [
      "Elige la opción correcta para completar cada oración.",
      "Elige una de las tres (3) formas de saludo para completar la oración.",
    ],
  },
  A1_family_2: {
    ex1_in_laws_matching: [
      "Match each family member with the correct translation.",
      "Une cada miembro de la familia con su traducción.",
    ],
    ex2_step_family_matching: [
      "Match each family member with the correct translation.",
      "Une cada miembro de la familia con su traducción.",
    ],
    ex3_extended_family: [
      "Match each family member with the correct translation.",
      "Une cada miembro de la familia con su traducción.",
    ],
    ex4_reflexive_pronouns: [
      "Select the correct reflexive pronoun for each subject.",
      "Elige el pronombre reflexivo que corresponde a cada sujeto.",
    ],
    ex7_fill_blank_reflexives: [
      "Select the correct reflexive pronoun for each sentence.",
      "Elige uno de los tres (3) pronombres reflexivos y completa la oración.",
    ],
    ex8_possessive_vs_reflexive: [
      "Match each sentence with the correct pronoun type.",
      "Toca una oración de la columna izquierda y elige en la columna derecha si tiene un pronombre posesivo o un pronombre reflexivo.",
    ],
  },
  A1_descriptions: {
    add1_fill_in_blank: [
      "Elige la opción correcta para completar cada oración.",
      "Elige una de las tres (3) formas verbales y completa la oración de forma correcta.",
    ],
  },
  A1_clothes: {
    add4_fill_in_blank: [
      "Elige la opción correcta para completar cada oración.",
      "Elige uno de los tres (3) pronombres posesivos y completa la oración de forma correcta.",
    ],
    add5_fill_in_blank: [
      "Elige la opción correcta para completar cada oración.",
      "Elige la forma verbal que corresponda para completar la oración.",
    ],
  },
  A1_housing: {
    add1_fill_in_blank: [
      "Elige la opción correcta para completar cada oración.",
      "Elige de los tres (3) pronombres demostrativos el que corresponda en la oración.",
    ],
  },
  A1_daily_routine: {
    ex1_daily_actions: [
      "Select the correct verb phrase to complete each sentence.",
      "Elige una de las rutinas para completar la oración de forma correcta.",
    ],
    ex5_frequency_adverbs: [
      "Select the correct frequency adverb (always, usually, sometimes, never).",
      "Ubica sobre la línea la frecuencia que corresponde en la oración (always, usually, sometimes, never).",
    ],
  },
  A1_simple_present: {
    add2_fill_in_blank: [
      "Elige la opción correcta para completar cada oración.",
      "Ubica sobre la línea la forma verbal que corresponde en la oración.",
    ],
    add3_fill_in_blank: [
      "Elige la opción correcta para completar cada oración.",
      "Ubica sobre la línea la forma de negación que corresponde en la oración.",
    ],
  },
};

for (const [lessonId, byExercise] of Object.entries(INSTRUCTIONS)) {
  const lesson = (module.exports[lessonId] ??= {});
  for (const [exId, pair] of Object.entries(byExercise)) {
    if (typeof lesson[exId] === "function") throw new Error(`${lessonId} ${exId}: ya tiene una corrección con función`);
    lesson[exId] = [...(lesson[exId] || []), pair];
  }
}
