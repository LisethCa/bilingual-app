const { fill, build } = require("../../helpers");

// Ampliación a 13 ejercicios por lección (pedido del cliente, octubre 2026).
module.exports = {
  A2_business_meetings: [
    fill("Practica: proponer ideas", [
      "___ start the meeting now. | Let's | Why don't, How about",
      "Why don't we ___ a break? | take | taking, to take",
      "How about ___ the meeting to Friday? | moving | move, to move",
      "What about ___ a new supplier? | finding | find, found",
      "I ___ with you. It's a good idea. | agree | am agree, agreeing",
    ]),
    fill("Practica: reuniones", [
      "Let's look at the ___: we have three topics today. | agenda | minutes, decision",
      "Who is writing the ___ of the meeting? | minutes | agenda, suggest",
      "I'm sorry, I ___. I think it's too expensive. | disagree | agree, suggest",
      "We need to make a ___ today. | decision | minutes, agenda",
      "I ___ we meet again next week. | suggest | decision, minutes",
    ]),
    build("Practica: why don't we", "📊 ¿Por qué no revisamos el presupuesto?", "Why don't we check the budget?", ["checking", "doesn't"]),
  ],

  A2_client_interactions: [
    fill("Practica: ofrecer y pedir", [
      "The phone is ringing. I'll ___ it. | answer | answering, to answer",
      "___ I send you the contract? | Shall | Am, Does",
      "Would you ___ a coffee? | like | likes, liking",
      "Could you ___ the form, please? | sign | signing, to sign",
      "Don't worry, I ___ call you tomorrow. | will | shall to, am",
    ]),
    fill("Practica: con clientes", [
      "The ___ has ten pages and we both have to sign it. | contract | client, customer service",
      "Can you send me a ___ for 100 chairs? I want to know the price. | quote | contract, deal",
      "Our ___ is happy with the product. | client | offer, quote",
      "It's a good ___: two for the price of one. | deal | client, contract",
      "Call ___ if you have a problem with your order. | customer service | contract, deal",
    ]),
    build("Practica: shall I", "📞 ¿Quiere que le envíe la cotización?", "Shall I send you the quote?", ["Will", "sending"]),
  ],

  A2_professional_presentations: [
    fill("Practica: conectores", [
      "Good morning. ___, let me introduce myself. | First | Finally, To sum up",
      "___, thank you for listening. | Finally | First, Next",
      "Today I'm ___ to talk about our new product. | going | will, go",
      "Does anyone have any ___? | questions | ask, asking",
      "To ___ up, our sales grew 20% this year. | sum | summary, close",
    ]),
    fill("Practica: presentaciones", [
      "The ___ asked many questions. | audience | chart, conclusion",
      "This ___ shows our sales in 2025. | chart | audience, introduction",
      "In the ___, I say who I am and what I will talk about. | introduction | conclusion, audience",
      "In the ___, I summarize the main ideas. | conclusion | introduction, chart",
      "I'm ___ a presentation for Monday. | preparing | audience, chart",
    ]),
    build("Practica: anunciar el tema", "🎤 Hoy voy a hablar de nuestro nuevo producto", "Today I am going to talk about our new product", ["will", "talking"]),
  ],

  A2_remote_work_skills: [
    fill("Practica: tendencias y pedidos", [
      "Nowadays more people ___ from home. | are working | is working, works",
      "Can you ___ your screen, please? | share | sharing, to share",
      "Please ___ your microphone. There is noise. | mute | muting, to mute",
      "Right now I ___ a video call. | am hosting | host, hosts",
      "These days companies ___ more virtual teams. | are using | is using, uses",
    ]),
    fill("Practica: trabajo remoto", [
      "My internet ___ is very slow today. | connection | video call, mute",
      "We have a ___ every morning at 9. | video call | connection, share screen",
      "Our ___ has people in five countries. | virtual team | connection, mute",
      "I love ___ work. I don't need to commute. | remote | mute, connection",
      "Can you hear me? I think you're on ___. | mute | connection, team",
    ]),
    build("Practica: compartir pantalla", "🖥️ ¿Puedes compartir tu pantalla?", "Can you share your screen?", ["sharing", "screens"]),
  ],

  A2_work_life_balance: [
    fill("Practica: too much, too many, enough", [
      "I have too ___ work this week. | much | many, enough",
      "There are too ___ meetings. | many | much, enough",
      "I don't have ___ time for my family. | enough | too, many",
      "He isn't old ___ to drive. | enough | too, much",
      "You work too ___ hours. | many | much, enough",
    ]),
    fill("Practica: equilibrio", [
      "I work a lot of ___: 10 extra hours every week. | overtime | day off, balance",
      "Tomorrow is my ___. I'm going to the beach. | day off | workload, burnout",
      "My ___ is too big. I can't finish everything. | workload | day off, balance",
      "She worked too much and now she has ___. | burnout | balance, day off",
      "It's important to find a ___ between work and family. | balance | burnout, overtime",
    ]),
    build("Practica: no alcanza", "⚖️ No tengo suficiente tiempo para descansar", "I don't have enough time to rest", ["too", "much"]),
  ],

  A2_future_plans: [
    fill("Practica: going to o will", [
      "I've decided. I ___ study medicine. | am going to | will, going",
      "Look at those clouds! It's ___ rain. | going to | will, go to",
      "The phone is ringing. I ___ answer it. | will | am going to, going",
      "I think she ___ win the race. | will | is going, goes",
      "Don't worry, I ___ tell anyone. I promise. | won't | am not going, don't will",
    ]),
    fill("Practica: planes", [
      "My ___ is to travel around the world. | plan | predict, decide",
      "It will ___ rain tomorrow. The sky is gray. | probably | plan, decide",
      "I can't ___ between the blue car and the red car. | decide | predict, plan",
      "Experts ___ that prices will go up. | predict | decide, intention",
      "I have the ___ of learning Italian. | intention | probably, predict",
    ]),
    build("Practica: un plan decidido", "🎓 Voy a graduarme el próximo año", "I am going to graduate next year", ["will", "graduating"]),
  ],

  A2_past_events: [
    fill("Practica: lo que pasó antes", [
      "When I got to the station, the train ___ left. | had already | has already, already had",
      "By the time we arrived, the movie ___ started. | had | has, was",
      "I ___ never seen snow before I went to Canada. | had | have, was",
      "She realized she ___ her keys at home. | had left | has left, leaves",
      "After he ___ dinner, he went to bed. | had eaten | has eaten, eats",
    ]),
    fill("Practica: expresiones de tiempo", [
      "I ___ that I had forgotten my phone. | realized | before, already",
      "___ the time I got home, everyone was asleep. | By | Before, After",
      "I had ___ finished when she called. | already | before, after",
      "I had never been on a plane ___. | before | after, already",
      "We went for a walk ___ we had eaten. | after | by, already",
    ]),
    build("Practica: ya se había ido", "🚉 Cuando llegué, el tren ya se había ido", "When I arrived, the train had already left.", ["has", "leave"]),
  ],

  A2_past_experiences: [
    fill("Practica: pasado de verbos regulares", [
      "We ___ in a nice hotel last summer. | stayed | staied, stay",
      "She ___ the museum two days ago. | visited | visitted, visit",
      "They ___ sushi for the first time. | tried | tryed, try",
      "I ___ my trip very carefully. | planned | planed, plan",
      "___ you enjoy the trip? | Did | Do, Were",
    ]),
    fill("Practica: ¿cuándo pasó?", [
      "I arrived three days ___. | ago | last, yesterday",
      "We traveled to Peru ___ year. | last | ago, yesterday",
      "She called me ___ morning. | yesterday | last, ago",
      "I visited my aunt ___ Sunday. | on | in, at",
      "They stayed in Rome ___ 2022. | in | on, at",
    ]),
    build("Practica: en negativo", "🏖️ No disfrutamos el viaje", "We didn't enjoy the trip", ["enjoyed", "weren't"]),
  ],

  A2_recent_past: [
    fill("Practica: presente perfecto o pasado", [
      "I have ___ finished my lunch. | just | yet, ago",
      "She ___ to the cinema yesterday. | went | has gone, has been",
      "We have lived here ___ 2018. | since | for, ago",
      "They have worked together ___ five years. | for | since, ago",
      "___ you ever eaten Thai food? | Have | Did, Do",
    ]),
    fill("Practica: expresiones de tiempo", [
      "I saw that movie last ___. | week | ago, recently",
      "Have you seen any good movies ___? | recently | last week, ago",
      "I've known her ___ we were children. | since | for, ago",
      "She went to Paris two years ___. | ago | since, for",
      "Have you ___ been to Japan? | ever | since, ago",
    ]),
    build("Practica: ya lo leí", "📖 Ya he leído ese libro", "I have already read that book", ["yet", "did"]),
  ],

  A2_abilities_skills: [
    fill("Practica: can, could, be able to", [
      "I ___ swim when I was five. | could | can, will be able to",
      "Next year I ___ speak English well. | will be able to | can, could",
      "She ___ play the piano now. | can | could, will able to",
      "He ___ come to the party yesterday. He was sick. | couldn't | can't, won't be able to",
      "Will you be able ___ help me? | to | at, for",
    ]),
    fill("Practica: habilidades", [
      "Cooking is a useful ___. | skill | learn, improve",
      "I want to ___ my English. | improve | skill, able",
      "It's never too late to ___ something new. | learn | skill, able",
      "I'm not ___ to come tomorrow. | able | skill, improve",
      "Practice every day and your skills will ___. | improve | learn, able",
    ]),
    build("Practica: en el futuro", "🏊 El año que viene podré nadar", "Next year I will be able to swim", ["can", "could"]),
  ],
};
