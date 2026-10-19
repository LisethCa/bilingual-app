const { fill, build } = require("../../helpers");

// Ampliación a 13 ejercicios por lección (pedido del cliente, octubre 2026).
module.exports = {
  A2_free_time_hobbies: [
    fill("Practica: verbos que no van en -ing", [
      "I ___ the answer to this question. | know | am knowing, knowing",
      "She ___ tea to coffee. | prefers | is preferring, prefer",
      "They ___ a small boat. | own | are owning, owns",
      "I ___ what you mean. | understand | am understanding, understands",
      "He ___ in ghosts. | doesn't believe | isn't believing, don't believe",
    ]),
    fill("Practica: tiempo libre", [
      "My favorite ___ is playing the guitar. | hobby | leisure, own",
      "In my ___ time, I read and walk. | leisure | hobby, prefer",
      "I ___ watching movies at home. | enjoy | own, believe",
      "I ___ cold weather. I love summer! | hate | prefer, own",
      "Do you ___ a car or do you take the bus? | own | enjoy, believe",
    ]),
    build("Practica: preferencias", "🎸 Prefiero leer antes que ver televisión", "I prefer reading to watching TV", ["than", "am"]),
  ],

  A2_fashion_style: [
    fill("Practica: comparar estilos", [
      "This dress is ___ than that one. | prettier | prettyer, more pretty",
      "She is the most ___ person in the office. | elegant | elegantest, more elegant",
      "These shoes are ___ than my old ones. | more comfortable | comfortabler, most comfortable",
      "This is the ___ outfit in the store. | best | better, goodest",
      "Jeans are ___ than a suit. | more casual | casualer, most casual",
    ]),
    fill("Practica: moda", [
      "I need a new ___ for the wedding. | outfit | accessory, trendy",
      "A belt is a nice ___. | accessory | outfit, casual",
      "Those glasses are very ___ now. Everyone wears them. | trendy | old-fashioned, elegant",
      "My grandpa's hat is ___. Nobody wears that now. | old-fashioned | trendy, casual",
      "On weekends I wear ___ clothes: jeans and a T-shirt. | casual | elegant, old-fashioned",
    ]),
    build("Practica: el más elegante", "👗 Este es el vestido más elegante de la tienda", "This is the most elegant dress in the store", ["more", "of"]),
  ],

  A2_daily_conversations: [
    fill("Practica: he / she en presente", [
      "She ___ in a bank. | works | work, working",
      "My brother ___ TV every night. | watches | watchs, watch",
      "___ your sister speak English? | Does | Do, Is",
      "He ___ have a car. | doesn't | don't, isn't",
      "The baby ___ a lot. | cries | crys, cry",
    ]),
    fill("Practica: frases de todos los días", [
      "Hi Tom! How's it ___? | going | doing, go",
      "___ me, where is the bathroom? | Excuse | Sorry, Never",
      "I'm ___ I'm late. | sorry | excuse, mind",
      "Bye! See you ___! | soon | mind, going",
      "'I forgot the keys.' '___ mind, I have mine.' | Never | Excuse, Sorry",
    ]),
    build("Practica: preguntar el trabajo", "💼 ¿A qué te dedicas?", "What do you do?", ["does", "are"]),
  ],

  A2_travel_vacations: [
    fill("Practica: experiencias de viaje", [
      "I have ___ to Paris twice. | been | went, go",
      "___ you ever visited Mexico? | Have | Did, Has",
      "She has never ___ a plane. | taken | took, take",
      "We ___ to Spain last year. | went | have gone, have been",
      "They have ___ many countries. | seen | saw, see",
    ]),
    fill("Practica: de viaje", [
      "Don't forget your ___! You need it to travel abroad. | passport | suitcase, souvenir",
      "I bought a small ___ for my mom in Rome. | souvenir | passport, suitcase",
      "My ___ is too heavy. | suitcase | souvenir, sightseeing",
      "We went ___ and visited the old town. | sightseeing | abroad, souvenir",
      "I want to live ___ for a year. | abroad | sightseeing, suitcase",
    ]),
    build("Practica: ¿alguna vez?", "✈️ ¿Alguna vez has estado en Brasil?", "Have you ever been to Brazil?", ["did", "went"]),
  ],

  A2_transportation: [
    fill("Practica: can y could", [
      "When I was ten, I ___ ride a bike. | could | can, may",
      "You ___ take the subway. It's faster. | could | couldn't, can't",
      "___ you drive me to the airport, please? | Could | Must, Should",
      "I ___ drive. I don't have a license. | can't | could, can",
      "We ___ take the ferry because of the storm. | couldn't | could, can",
    ]),
    fill("Practica: medios de transporte", [
      "The ___ goes under the city. | subway | ferry, motorcycle",
      "We crossed the lake by ___. | ferry | subway, train",
      "He rides his ___ to work. It has two wheels. | motorcycle | bus, ferry",
      "The ___ leaves from platform 3. | train | ferry, motorcycle",
      "Can I ___ my bike here? | ride | drive, fly",
    ]),
    build("Practica: un pedido amable", "🚕 ¿Podrías llamarme un taxi, por favor?", "Could you call me a taxi, please?", ["must", "calling"]),
  ],

  A2_public_transportation: [
    fill("Practica: horarios y verbos de estado", [
      "The train ___ at 8:15 every morning. | leaves | is leaving, leave",
      "How much ___ a ticket cost? | does | do, is",
      "This bag ___ to me. | belongs | is belonging, belong",
      "What time ___ the bus arrive? | does | do, is",
      "I ___ a ticket for the subway. | need | am needing, needs",
    ]),
    fill("Practica: en la estación", [
      "Wait at the bus ___. | stop | station, platform",
      "The train to Boston leaves from ___ 4. | platform | fare, ticket",
      "The ___ is $2.50 for adults. | fare | platform, departure",
      "Check the ___ time on the screen: 10:40. | departure | fare, platform",
      "Our ___ in London is at 6 p.m. | arrival | fare, stop",
    ]),
    build("Practica: la parada", "🚏 El autobús para en la esquina", "The bus stops at the corner", ["stop", "does"]),
  ],

  A2_food_restaurants: [
    fill("Practica: should, must, mustn't", [
      "You ___ try the fish here. It's delicious. | should | shouldn't, mustn't",
      "You ___ smoke in the restaurant. It's not allowed. | mustn't | should, must",
      "What ___ I order? | should | must to, shoulds",
      "This cake is amazing. You ___ taste it! | must | mustn't, shouldn't",
      "You shouldn't ___ so much salt. | eat | to eat, eating",
    ]),
    fill("Practica: en el restaurante", [
      "I'd like to make a ___ for two people. | reservation | appetizer, main course",
      "For the ___, I'll have the steak. | main course | appetizer, reservation",
      "This soup is very ___. It has a lot of chili. | spicy | vegetarian, sweet",
      "I don't eat meat. I'm ___. | vegetarian | spicy, appetizer",
      "What do you ___? The pasta or the fish? | recommend | reservation, spicy",
    ]),
    build("Practica: pedir una recomendación", "🍽️ ¿Qué me recomienda?", "What do you recommend?", ["does", "recommends"]),
  ],

  A2_culture_traditions: [
    fill("Practica: pasado simple y continuo", [
      "We ___ dinner when the fireworks started. | were having | was having, are having",
      "While they ___, it started to rain. | were dancing | was dancing, dancing",
      "I ___ the festival three times last year. | visited | was visiting, visit",
      "The ceremony ___ at 7 p.m. and ended at 9. | started | was starting, starts",
      "What ___ you doing at midnight on New Year's Eve? | were | was, did",
    ]),
    fill("Practica: tradiciones", [
      "In my town there is a big music ___ every summer. | festival | custom, costume",
      "Giving gifts at Christmas is a ___ in many countries. | custom | parade, ceremony",
      "The wedding ___ was in a beautiful church. | ceremony | costume, parade",
      "Children wear a ___ on Halloween. | costume | ceremony, custom",
      "We watched the ___ go down the main street. | parade | custom, costume",
    ]),
    build("Practica: una interrupción", "🎆 Estábamos celebrando cuando llegó mi tío", "We were celebrating when my uncle arrived", ["was", "arriving"]),
  ],

  A2_music_concerts: [
    fill("Practica: listen, hear, sound", [
      "Shh! I ___ to the radio. | am listening | am hearing, listen",
      "Can you ___ that noise? | hear | listen, listening",
      "This song ___ great! | sounds | is sounding, sound",
      "I'm ___ a concert on TV. | watching | seeing, watch",
      "I ___ music every morning. | listen to | hear to, listen",
    ]),
    fill("Practica: el concierto", [
      "The ___ came out on the stage at 9 p.m. | band | genre, ticket",
      "Rock is my favorite ___ of music. | genre | stage, band",
      "The ___ has a beautiful voice. | singer | stage, genre",
      "I bought a ___ for the concert online. | ticket | stage, genre",
      "The musicians are on the ___. | stage | ticket, genre",
    ]),
    build("Practica: escuchar", "🎧 Estoy escuchando mi canción favorita", "I am listening to my favorite song", ["hearing", "listen"]),
  ],

  A2_art_creativity: [
    fill("Practica: pasado de verbos irregulares", [
      "She ___ a beautiful portrait last year. | painted | paints, paint",
      "He ___ a picture of his dog. | drew | drawed, draws",
      "___ you go to the museum yesterday? | Did | Do, Were",
      "We didn't ___ the exhibition. | see | saw, seen",
      "I ___ a sculpture at school. | made | maked, make",
    ]),
    fill("Practica: el mundo del arte", [
      "The Mona Lisa is a ___. | masterpiece | sculptor, exhibition",
      "A ___ makes statues. | sculptor | painter, museum",
      "There is a new ___ of photos at the museum. | exhibition | masterpiece, painter",
      "Picasso was a famous ___. | painter | museum, exhibition",
      "Art classes help children develop ___. | creativity | masterpiece, sculptor",
    ]),
    build("Practica: una exposición", "🖼️ Ayer fuimos a una exposición", "We went to an exhibition yesterday", ["go", "did"]),
  ],
};
