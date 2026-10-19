const { fill, build, drag, dialog } = require("../../helpers");

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
      "Does your brother ___ swimming? | like | likes, liking",
      "___ you like dancing? | Do | Does, Are",
      "My dad enjoys ___ the newspaper. | reading | read, reads",
      "They hate ___ early. | getting up | get up, gets up",
    ]),
    build("Practica: gustos", "🎵 A mi hermana le encanta escuchar música", "My sister loves listening to music", ["love", "likes"]),
    drag(
      "Practica: ¿cuánto te gusta?",
      ["😍 = I love it", "🙂 = I like it", "😐 = It's OK", "🙁 = I don't like it", "😡 = I hate it"],
      "Arrastra cada cara hasta la frase que le corresponde.",
    ),
  ],

  A1_family_2: [
    fill("Practica: pronombres reflexivos", [
      "He cut ___ with a knife. | himself | herself, myself",
      "We cooked dinner ___. | ourselves | themselves, yourselves",
      "My cousins taught ___ English. | themselves | ourselves, himself",
      "Be careful! Don't burn ___. | yourself | himself, itself",
      "The cat is cleaning ___. | itself | himself, herself",
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
    build("Practica: ella misma", "🍰 Mi suegra hizo la torta ella misma", "My mother-in-law made the cake herself", ["himself", "makes"]),
  ],

  A1_weather_and_seasons: [
    fill("Practica: el clima y los comparativos", [
      "Take an umbrella. It's ___ today. | rainy | sunny, hot",
      "Autumn is ___ than summer. | cooler | more cool, coolest",
      "My hat flew away! It's ___ than yesterday. | windier | windyer, more windy",
      "In ___, the leaves fall from the trees. | autumn | summer, spring",
      "It's ___ and I can't see the sun. | cloudy | sunny, hot",
      "Snowy days are ___ than rainy days. (frío) | colder | coldest, more cold",
    ]),
    build("Practica: comparar el clima", "🌧️ Abril es más lluvioso que marzo", "April is rainier than March", ["more", "rainy"]),
    dialog("Practica: ¿Qué tiempo hace?", "Hablas con un amigo antes de salir.", [
      ["Friend", "What's the weather like today?", "It's cloudy and cold.", "It's cloud and cold.", "Usa el adjetivo: 'cloudy'."],
      ["Friend", "Is it colder than yesterday?", "Yes, it's much colder.", "Yes, it's much more cold.", "'Cold' es corto: 'colder'."],
      ["Friend", "Do I need an umbrella?", "Yes, it's going to rain.", "No, it's going to rain.", "Si va a llover, sí necesitas paraguas."],
    ]),
  ],
};
