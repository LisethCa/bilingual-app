const { fill, build, drag } = require("../../helpers");

// Ampliación a 13+ ejercicios por lección (pedido del cliente, octubre 2026).
// Solo las lecciones de A1 que tenían menos de 13.
module.exports = {
  A1_daily_routine: [
    fill("Practica: rutina con he / she", [
      "She ___ up at seven every day. | wakes | wake, waking",
      "My brother ___ a shower in the morning. | takes | take, taking",
      "We ___ breakfast at eight. | have | has, having",
      "He ___ to bed at eleven. | goes | go, going",
      "They ___ work at five. | finish | finishes, finishing",
    ]),
    fill("Practica: preguntas y negativos", [
      "___ you watch TV at night? | Do | Does, Are",
      "___ she have lunch at home? | Does | Do, Is",
      "What time ___ they go to work? | do | does, are",
      "He ___ exercise on Sundays. | doesn't | don't, isn't",
      "I ___ have breakfast on weekdays. | don't | doesn't, am not",
    ]),
    build("Practica: frecuencia", "🛏️ Ella nunca se va a dormir tarde", "She never goes to bed late", ["go", "always"]),
  ],

  A1_likes_dislikes: [
    fill("Practica: like + -ing", [
      "I love ___ in the kitchen. | cooking | cook, cooks",
      "She ___ like horror movies. | doesn't | don't, isn't",
      "___ you like dancing? | Do | Does, Are",
      "My dad enjoys ___ the newspaper. | reading | read, reads",
      "They hate ___ early. | getting up | get up, gets up",
    ]),
    build("Practica: gustos", "🎵 A mi hermana le encanta escuchar música", "My sister loves listening to music", ["love", "likes"]),
  ],

  A1_family_2: [
    fill("Practica: pronombres reflexivos", [
      "She looked at ___ in the mirror. | herself | himself, myself",
      "I made this cake ___. | myself | yourself, itself",
      "The children enjoyed ___ at the party. | themselves | ourselves, himself",
      "We painted the house ___. | ourselves | themselves, yourselves",
      "Did you hurt ___? | yourself | himself, itself",
    ]),
    drag(
      "Practica: ¿quién es?",
      [
        "Nephew = The son of my brother",
        "Niece = The daughter of my sister",
        "Mother-in-law = The mother of my wife",
        "Stepsister = The daughter of my stepfather",
      ],
      "Arrastra cada palabra hasta su definición.",
    ),
  ],

  A1_weather_and_seasons: [
    fill("Practica: el clima y los comparativos", [
      "Take an umbrella. It's ___ today. | rainy | sunny, hot",
      "Summer is ___ than winter. | hotter | hoter, more hot",
      "Today is ___ than yesterday. | windier | windyer, more windy",
      "In ___, the leaves fall from the trees. | autumn | summer, spring",
      "It's ___ and I can't see the sun. | cloudy | sunny, hot",
      "Spring is ___ than winter. | warmer | more warm, warmest",
    ]),
    build("Practica: comparar el clima", "☀️ Hoy está más soleado que ayer", "Today is sunnier than yesterday", ["more", "sunny"]),
  ],
};
