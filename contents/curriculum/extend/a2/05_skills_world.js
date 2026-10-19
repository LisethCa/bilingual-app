const { fill, build } = require("../../helpers");

// Ampliación a 13 ejercicios por lección (pedido del cliente, octubre 2026).
module.exports = {
  A2_skills_talents: [
    fill("Practica: can, could, may", [
      "She ___ play the violin. She learned as a child. | can | cans, can to",
      "When he was young, he ___ sing very well. | could | can, may",
      "I ___ learn Japanese next year. I'm not sure. | may | could to, must",
      "___ I use your piano? (permiso, formal) | May | Must, Am",
      "My son can ___ the guitar. | play | plays, playing",
    ]),
    fill("Practica: talentos", [
      "She has a ___ for drawing. | talent | perform, achieve",
      "He's a very ___ student. He learns very fast. | gifted | talent, perform",
      "The piano is my favorite musical ___. | instrument | talent, gifted",
      "The band will ___ at the theater tonight. | perform | achieve, gifted",
      "If you work hard, you can ___ your goals. | achieve | perform, talent",
    ]),
    build("Practica: quizás", "🎻 Puede que aprenda a tocar el violín", "I may learn to play the violin", ["can", "playing"]),
  ],

  A2_changes_transformations: [
    fill("Practica: cambios en progreso", [
      "My English ___ better and better. | is getting | gets, get",
      "Ice ___ when it gets warm. | melts | is melting, melt",
      "Look! It ___ dark. Let's go home. | is getting | gets, get",
      "He ___ a father last year. | became | is becoming, becomes",
      "Technology ___ very fast nowadays. | is changing | change, are changing",
    ]),
    fill("Practica: transformaciones", [
      "Caterpillars ___ into butterflies. | transform | improve, better",
      "My city is very ___ from 20 years ago. | different | change, grow",
      "Exercise can ___ your health. | improve | different, become",
      "Children ___ very fast. | grow | different, become",
      "My hometown ___ a lot. Now it has a big mall. | changed | different, become",
    ]),
    build("Practica: mejorando", "📈 Mi inglés está mejorando", "My English is getting better", ["gets", "more"]),
  ],

  A2_multiple_choice: [
    fill("Practica: comparativos y superlativos", [
      "Which is ___, a cat or a dog? | bigger | biggest, more big",
      "The Nile is the ___ river in Africa. | longest | longer, most long",
      "This book is ___ than the movie. | more interesting | interestinger, most interesting",
      "My cold is ___ today than yesterday. | worse | badder, worst",
      "It's the ___ expensive hotel in the city. | most | more, much",
    ]),
    fill("Practica: concurso de preguntas", [
      "The ___ planet in our solar system is Jupiter. | largest | larger, most large",
      "Which ___ is correct: A, B or C? | option | best, better",
      "A mouse is ___ than an elephant. | smaller | smallest, more small",
      "Gold is ___ than silver. | more expensive | expensiver, most expensive",
      "Is a cheetah ___ than a horse? | faster | fastest, more fast",
    ]),
    build("Practica: ¿cuál es más alto?", "🗼 ¿Cuál es más alta, la Torre Eiffel o el Big Ben?", "Which is taller, the Eiffel Tower or Big Ben?", ["tallest", "more"]),
  ],

  A2_past_simple_regular: [
    fill("Practica: ortografía y preguntas", [
      "I ___ my room yesterday. | cleaned | cleanned, clean",
      "She ___ for the exam all night. | studied | studyed, study",
      "The bus ___ in front of the school. | stopped | stoped, stop",
      "We didn't ___ the movie. | watch | watched, watching",
      "___ they play football last Sunday? | Did | Do, Were",
    ]),
    fill(
      "Practica: el sonido de -ed",
      [
        "'Walked' ends with the sound ___. | /t/ | /d/, /ɪd/",
        "'Played' ends with the sound ___. | /d/ | /t/, /ɪd/",
        "'Visited' ends with the sound ___. | /ɪd/ | /t/, /d/",
        "'Watched' ends with the sound ___. | /t/ | /d/, /ɪd/",
        "'Needed' ends with the sound ___. | /ɪd/ | /t/, /d/",
      ],
      "Elige cómo suena la terminación -ed en cada verbo.",
    ),
    build("Practica: una pregunta", "🧹 ¿Limpiaste la cocina?", "Did you clean the kitchen?", ["cleaned", "do"]),
  ],

  A2_past_simple_irregular: [
    fill("Practica: formas irregulares", [
      "I ___ to the beach last weekend. | went | goed, go",
      "We ___ pizza for dinner. | ate | eated, eat",
      "She ___ a strange noise. | heard | heared, hear",
      "They ___ a new car last year. | bought | buyed, buy",
      "He didn't ___ anything. | say | said, says",
    ]),
    fill("Practica: más verbos irregulares", [
      "I ___ my homework after school. | did | done, do",
      "She ___ a cake for my birthday. | made | maked, make",
      "We ___ a great time at the party. | had | haved, have",
      "I ___ a letter from my friend. | got | getted, get",
      "Did you ___ the news yesterday? | hear | heard, hears",
    ]),
    build("Practica: en negativo", "🍕 No comimos pizza anoche", "We didn't eat pizza last night", ["ate", "weren't"]),
  ],

  A2_places_directions: [
    fill("Practica: preposiciones de lugar", [
      "The bank is ___ the pharmacy and the bakery. | between | next, opposite of",
      "The cafe is ___ the park. You can see it from the park entrance. | opposite | opposite of, between",
      "Turn ___ at the corner. | left | to left, the left",
      "The school is ___ to the hospital. | next | between, behind",
      "Go straight ___ two blocks. | for | to, at",
    ]),
    fill("Practica: en la ciudad", [
      "There's a car park ___ the supermarket, at the back. | behind | opposite, between",
      "The hotel is on the ___ of Main Street and 5th Avenue. | corner | block, between",
      "Walk two ___ and turn right. | blocks | corners, banks",
      "Stop at the ___ and wait for the green light. | crossroads | block, bank",
      "I need to get money from the ___. | bank | corner, block",
    ]),
    build("Practica: preguntar el camino", "🏦 ¿Cómo llego al banco?", "How do I get to the bank?", ["does", "in"]),
  ],

  A2_weather_seasons: [
    fill("Practica: ahora o en general", [
      "Take an umbrella. It ___ now. | is raining | rains, rain",
      "It ___ a lot in London in winter. | rains | is raining, rain",
      "It ___ very cold in Canada in January. | is | is being, are",
      "What's the weather ___ today? | like | as, likes",
      "Look! It ___. Everything is white. | is snowing | snows, snow",
    ]),
    fill("Practica: el tiempo", [
      "The ___ says it will rain tomorrow. | forecast | storm, foggy",
      "It's ___. I can't see the road. | foggy | freezing, humid",
      "It's ___! The temperature is -10°C. | freezing | humid, sunny",
      "There was a big ___ with thunder and lightning. | storm | forecast, fog",
      "It's hot and ___ in the jungle. | humid | freezing, foggy",
    ]),
    build("Practica: ahora mismo", "🌧️ Está lloviendo mucho ahora", "It is raining a lot now", ["rains", "much"]),
  ],

  A2_nature_environment: [
    fill("Practica: reglas para el planeta", [
      "We ___ recycle plastic. It's the law. | must | mustn't, don't have to",
      "You ___ throw garbage in the river. | mustn't | must, have to",
      "She ___ to take the bus. Her car is broken. | has | have, must",
      "You ___ bring bags. The store gives them for free. | don't have to | must, mustn't",
      "We have ___ turn off the lights when we leave. | to | for, at",
    ]),
    fill("Practica: medio ambiente", [
      "Air ___ is a big problem in big cities. | pollution | recycling, planet",
      "Put the bottles in the ___ bin. | recycling | pollution, waste",
      "We must ___ the animals and the forests. | protect | waste, plastic",
      "Don't ___ water when you brush your teeth. | waste | protect, recycle",
      "Earth is our only ___. | planet | plastic, waste",
    ]),
    build("Practica: reciclar", "♻️ Tenemos que reciclar más plástico", "We have to recycle more plastic", ["has", "recycling"]),
  ],

  A2_urban_rural_life: [
    fill("Practica: consejos y comparaciones", [
      "You ___ move to the countryside. It's peaceful. | should | shouldn't, should to",
      "You ought ___ live closer to your work. | to | for, at",
      "You ___ drive in the city center. There's too much traffic. | shouldn't | should, ought",
      "The city is ___ than the countryside. | noisier | noisyer, more noisy",
      "The countryside is ___ than the city. | more peaceful | peacefuller, most peaceful",
    ]),
    fill("Practica: ciudad y campo", [
      "There is a lot of ___ in the city at 6 p.m. | traffic | farm, countryside",
      "My grandparents live on a ___ with cows and chickens. | farm | metropolis, traffic",
      "Tokyo is a huge ___. | metropolis | farm, countryside",
      "I love the ___: trees, rivers and fresh air. | countryside | metropolis, traffic",
      "My street is very ___. There are cars all night. | noisy | peaceful, farm",
    ]),
    build("Practica: un consejo", "🌳 Deberías vivir en el campo", "You should live in the countryside", ["to", "city"]),
  ],

  A2_environment_sustainability: [
    fill("Practica: hábitos sostenibles", [
      "We ___ take shorter showers. | should | shouldn't, should to",
      "You ought to ___ your bags. | reuse | reusing, reused",
      "People ___ waste so much food. | shouldn't | should, ought",
      "___ we install solar panels? | Should | Ought, Do should",
      "We ought to ___ water and energy. | conserve | conserving, conserves",
    ]),
    fill("Practica: sostenibilidad", [
      "___ panels turn sunlight into electricity. | Solar | Renewable, Eco-friendly",
      "Wind and sun are ___ energy. | renewable | solar, reuse",
      "This bag is ___. It's made of recycled paper. | eco-friendly | renewable, solar",
      "___ means using a glass bottle many times. | Reuse | Reduce, Solar",
      "___ means using less plastic and energy. | Reduce | Reuse, Renewable",
    ]),
    build("Practica: energía solar", "🌞 Deberíamos usar más energía solar", "We should use more solar energy", ["shouldn't", "renewable"]),
  ],
};
