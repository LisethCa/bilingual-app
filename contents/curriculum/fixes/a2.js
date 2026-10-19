// Correcciones a ejercicios que ya estaban en Firestore (las aplica extend.js).
// Octubre 2026: la misma oración aparecía en dos ejercicios de la misma lección.
//
//   [["texto viejo", "texto nuevo"], ...]  reemplaza valores de texto completos dentro del ejercicio

module.exports = {
  A2_health_symptoms: {
    ex2_health_advice: [["You ___ drink more water.", "You ___ drink tea with honey."]],
  },
  A2_education_studies: {
    ex2_study_advice: [["You ___ study every day.", "You ___ review your notes after class."]],
  },
  A2_remote_work_skills: {
    add1_fill_in_blank: [["Can you ___ your screen, please?", "Can you ___ the presentation with us?"]],
  },
  A2_recent_past: {
    ex2_present_vs_past: [
      ["She ___ to Paris last year.", "She ___ to the dentist last week."],
      ["They have already ___ that movie.", "They have already ___ the new museum."],
    ],
  },
  A2_skills_talents: {
    ex4_talents_conversation: [
      ["I can play the guitar very well.", "I can play the piano very well."],
      ["I can plays the guitar very well.", "I can plays the piano very well."],
    ],
  },
  A2_changes_transformations: {
    ex2_change_verbs: [["My English ___ better every day.", "The weather ___ warmer every day."]],
  },
  A2_environment_sustainability: {
    ex2_environmental_advice: [["We ___ recycle more.", "We ___ plant more trees."]],
  },
};
