const { fill, build, drag } = require("../../helpers");

// Ampliación a 13 ejercicios por lección (pedido del cliente, octubre 2026).
module.exports = {
  A2_housing_places: [
    fill("Practica: this, that, these, those", [
      "___ chairs here are very comfortable. | These | This, That",
      "Look at ___ house over there! | that | these, those",
      "___ apartment I'm in now is small. | This | Those, These",
      "Do you see ___ buildings over there? | those | this, these",
      "I don't like this sofa. I prefer that ___. | one | ones, it",
    ]),
    fill("Practica: vivienda", [
      "The ___ is $800 a month. | rent | landlord, furniture",
      "I need to call the ___ because the heater is broken. | landlord | rent, building",
      "Our ___ has a park and two supermarkets. | neighborhood | furniture, rent",
      "We bought new ___ for the living room. | furniture | landlord, neighborhood",
      "My apartment is on the tenth floor of a tall ___. | building | rent, landlord",
    ]),
    build("Practica: lejos y plural", "🏠 Esas casas de allá son caras", "Those houses over there are expensive", ["these", "is"]),
  ],

  A2_money_finances: [
    fill("Practica: must, have to, mustn't", [
      "You ___ pay your bills on time. | must | mustn't, don't have to",
      "She ___ to pay the rent tomorrow. | has | have, must",
      "It's free. You ___ pay. | don't have to | must, has to",
      "You ___ spend all your savings. It's dangerous. | mustn't | must, have to",
      "Last month I ___ pay a big bill. | had to | must, have to",
    ]),
    fill("Practica: dinero", [
      "I ___ $2,000 a month at my job. | earn | spend, save",
      "We need a ___ to control our expenses. | budget | loan, bill",
      "The bank gave me a ___ to buy a car. | loan | budget, savings",
      "The electricity ___ arrived today. | bill | loan, savings",
      "Don't ___ all your money on clothes! | spend | earn, save",
    ]),
    drag(
      "Practica: ¿qué significa?",
      ["Must = Es obligatorio", "Don't have to = No es necesario", "Mustn't = Está prohibido", "Had to = Tuve que"],
      "Arrastra cada expresión hasta su significado.",
    ),
  ],

  A2_shopping_prices: [
    fill("Practica: pedir en la tienda", [
      "___ I help you? (vendedor, formal) | May | Must, Should",
      "___ you give me a bag, please? (amable) | Could | Must, May",
      "Can I ___ by credit card? | pay | paying, to pay",
      "Could I ___ these shoes on? | try | trying, tried",
      "Yes, of course you ___. | can | could, may to",
    ]),
    fill("Practica: de compras", [
      "Can I try this on? Where is the ___? | fitting room | receipt, discount",
      "Keep the ___ in case you want a refund. | receipt | size, cash",
      "These jeans are ___: 50% off! | on sale | refund, customer",
      "Sorry, we only accept ___, not cards. | cash | receipt, size",
      "What ___ do you wear? Medium or large? | size | discount, cash",
    ]),
    build("Practica: un reembolso", "🔄 Quisiera un reembolso, por favor", "I would like a refund, please", ["want", "receipt"]),
  ],

  A2_health_symptoms: [
    fill("Practica: should / shouldn't", [
      "You have a fever. You ___ stay in bed. | should | shouldn't, should to",
      "You ___ eat so much sugar. | shouldn't | should, don't should",
      "What ___ I do for a sore throat? | should | shouldn't, do should",
      "He should ___ more water. | drink | drinks, to drink",
      "___ I see a doctor? | Should | Do should, Shoulds",
    ]),
    fill("Practica: síntomas", [
      "I have a ___. My head hurts a lot. | headache | cough, allergy",
      "Take this ___ twice a day. | medicine | fever, headache",
      "My temperature is 39°C. I have a ___. | fever | cough, allergy",
      "I can't eat peanuts. I have an ___. | allergy | headache, fever",
      "It hurts when I swallow. I have a ___. | sore throat | headache, allergy",
    ]),
    build("Practica: un consejo", "💊 Deberías tomar esta medicina", "You should take this medicine", ["shouldn't", "to"]),
  ],

  A2_mental_health_wellbeing: [
    fill("Practica: can, could, may", [
      "You look tired. You ___ take a break. | could | can't, mustn't",
      "Meditation ___ help you feel calm. | can | cans, can to",
      "I ___ feel nervous before the exam, I'm not sure. | may | must, mustn't",
      "___ I leave early today? (pedir permiso, formal) | May | Am, Does",
      "You could ___ for ten minutes. | relax | relaxing, to relax",
    ]),
    fill("Practica: bienestar", [
      "I have too much ___ at work. | stress | calm, wellbeing",
      "Breathe slowly and stay ___. | calm | anxious, stress",
      "She feels ___ before important meetings. | anxious | calm, break",
      "Let's take a short ___ and drink some tea. | break | stress, anxious",
      "Sleeping well is important for your ___. | wellbeing | anxious, break",
    ]),
    build("Practica: una sugerencia", "🧘 Podrías meditar antes de dormir", "You could meditate before bed", ["meditating", "to"]),
  ],

  A2_problems_solutions: [
    fill("Practica: have to, must, had to", [
      "My phone is broken. I ___ to fix it. | have | must, has",
      "She ___ to call the bank. Her card is lost. | has | have, must",
      "You ___ worry. I can fix it. | don't have to | must, has to",
      "Yesterday we ___ call a plumber. | had to | must, have to",
      "This is urgent. You ___ call the police now! | must | don't have to, mustn't",
    ]),
    fill("Practica: problemas", [
      "I made a ___ in the report. | mistake | solution, fix",
      "My laptop is ___. It doesn't turn on. | broken | lost, mistake",
      "I can't find my keys. They're ___. | lost | broken, fixed",
      "Don't worry, there is a ___ for every problem. | solution | mistake, broken",
      "Can you ___ my bike? | fix | lost, broken",
    ]),
    drag(
      "Practica: ¿qué hago?",
      [
        "My phone is broken = Take it to a repair shop",
        "I lost my keys = Call a locksmith",
        "I made a mistake = Say sorry and correct it",
        "The internet is not working = Restart the router",
      ],
      "Arrastra cada problema hasta su solución.",
    ),
  ],

  A2_time_planning: [
    fill("Practica: already, yet, still", [
      "I have ___ finished my homework. | already | yet, still",
      "I haven't called the doctor ___. | yet | already, still",
      "She is ___ working. She hasn't stopped. | still | yet, already",
      "The train left at 9:00 exactly. It was ___ time. | on | at, by",
      "I'm sorry, I'm ___. The bus didn't come. | late | early, soon",
    ]),
    fill("Practica: organizar el tiempo", [
      "I have a doctor's ___ at 4 p.m. | appointment | deadline, calendar",
      "The ___ for the project is Friday. | deadline | appointment, calendar",
      "We have to ___ the meeting until next week. | postpone | schedule, appointment",
      "I write all my plans in my ___. | calendar | deadline, postpone",
      "What's your ___ for tomorrow? Are you busy? | schedule | deadline, postpone",
    ]),
    build("Practica: todavía no", "⏰ Todavía no he terminado el informe", "I haven't finished the report yet", ["already", "still"]),
  ],

  A2_describing_people: [
    fill("Practica: his, her, its, their", [
      "Maria is tall. ___ hair is curly. | Her | His, Its",
      "My brothers are friendly. ___ friends are nice too. | Their | There, They're",
      "The dog is happy. ___ tail is moving. | Its | It's, His",
      "What ___ your boss like? | is | does, do",
      "What does she look ___? | like | as, likes",
    ]),
    fill("Practica: personalidad", [
      "He talks to everybody. He's very ___. | outgoing | shy, lazy",
      "She doesn't talk much with new people. She's ___. | shy | outgoing, generous",
      "He works ten hours a day. He's ___. | hardworking | lazy, shy",
      "She always shares her things. She's ___. | generous | lazy, shy",
      "He never helps at home. He's ___. | lazy | hardworking, generous",
    ]),
    drag(
      "Practica: pregunta → respuesta",
      [
        "What is he like? = He's very friendly",
        "What does he look like? = He's tall with curly hair",
        "How old is he? = He's thirty",
        "What does he do? = He's an engineer",
      ],
      "Arrastra cada pregunta hasta su respuesta.",
    ),
  ],

  A2_family_relationships: [
    fill("Practica: ¿con qué frecuencia?", [
      "I ___ visit my grandparents on Sundays. (100%) | always | never, rarely",
      "She is ___ late. She's very punctual. | never | always, often",
      "How ___ do you call your parents? | often | many, much",
      "We see our cousins ___ a year. | twice | two, second",
      "My brother ___ calls me. Maybe once a year. | rarely | often, always",
    ]),
    fill("Practica: la familia", [
      "I have two ___: a brother and a sister. | siblings | relatives, grandchildren",
      "I get along ___ my sister. We never fight. | with | to, at",
      "My grandparents have five ___. | grandchildren | siblings, relatives",
      "They were ___ in 2010, but now they are divorced. | married | relatives, siblings",
      "All my ___ come to the house at Christmas. | relatives | married, divorced",
    ]),
    build("Practica: a menudo", "📞 A menudo llamo a mi mamá los domingos", "I often call my mom on Sundays", ["always", "calls"]),
  ],

  A2_activities_hobbies: [
    fill("Practica: presente continuo", [
      "Look! My dad ___ in the garden. | is working | works, working",
      "I ___ a great book these days. | am reading | read, reading",
      "They ___ chess right now. | are playing | play, is playing",
      "She is ___ dinner. | making | makeing, make",
      "We are ___ in the mountains. | hiking | hikeing, hike",
    ]),
    fill("Practica: pasatiempos", [
      "My grandma loves ___. She grows tomatoes and flowers. | gardening | painting, knitting",
      "He takes beautiful pictures. His hobby is ___. | photography | gardening, chess",
      "She is ___ a scarf for winter. | knitting | painting, hiking",
      "We go ___ in the mountains every weekend. | hiking | knitting, gardening",
      "I use watercolors for ___. | painting | hiking, chess",
    ]),
    build("Practica: estos días", "📷 Estos días estoy aprendiendo fotografía", "I am learning photography these days", ["learn", "is"]),
  ],
};
