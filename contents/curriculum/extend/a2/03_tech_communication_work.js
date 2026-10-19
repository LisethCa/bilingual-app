const { fill, build } = require("../../helpers");

// Ampliación a 13 ejercicios por lección (pedido del cliente, octubre 2026).
module.exports = {
  A2_events_celebrations: [
    fill("Practica: escenas y hechos", [
      "While I ___ the room, the phone rang. | was decorating | were decorating, decorating",
      "They ___ married in 2015. | got | were getting, get",
      "We ___ dancing when the music stopped. | were | was, are",
      "Who ___ you to the wedding? | invited | was inviting, invites",
      "When I arrived, my friends ___ in the garden. | were waiting | was waiting, waiting",
    ]),
    fill("Practica: celebraciones", [
      "We celebrated their 25th wedding ___. | anniversary | graduation, invite",
      "After the ___ ceremony, she got her diploma. | graduation | anniversary, wedding",
      "Did you ___ Ana to the party? | invite | celebrate, arrive",
      "Shh! It's a ___ party. He doesn't know! | surprise | wedding, graduation",
      "The bride wore a white dress at the ___. | wedding | graduation, anniversary",
    ]),
    build("Practica: cuando llegó", "🎉 Estábamos bailando cuando llegó la torta", "We were dancing when the cake arrived", ["was", "arrives"]),
  ],

  A2_technology_social_media: [
    fill("Practica: hábitos digitales", [
      "I ___ check my phone in the morning. (100%) | always | never, rarely",
      "She is ___ online. She loves social media. | always | never, rarely",
      "How ___ do you post photos? | often | much, many",
      "He posts a video ___ a week. | once | one, first",
      "I ___ turn off my phone. Maybe once a year. | rarely | usually, often",
    ]),
    fill("Practica: redes sociales", [
      "Can I have the ___ password? | Wi-Fi | follower, post",
      "10,000 people follow her. She has 10,000 ___. | followers | notifications, Wi-Fi",
      "I got a ___: someone liked my photo. | notification | follower, Wi-Fi",
      "___ this video with your friends! | Share | Follower, Notification",
      "My ___ battery is dead. | smartphone | follower, notification",
    ]),
    build("Practica: compartir", "📸 A menudo comparto fotos con mi familia", "I often share photos with my family", ["shares", "always"]),
  ],

  A2_advanced_technology: [
    fill("Practica: had + participio", [
      "When I arrived, the meeting ___ already started. | had | has, was",
      "She had ___ the app before the update. | used | use, using",
      "By the time we bought it, they ___ a new model. | had created | have created, create",
      "I ___ never seen a robot before that day. | had | have, was",
      "The program crashed because nobody ___ it. | had updated | has updated, updates",
    ]),
    fill("Practica: tecnología", [
      "This ___ can clean the house by itself. | robot | algorithm, update",
      "Your phone needs an ___. | update | innovation, invent",
      "Edison helped ___ the light bulb. | invent | update, device",
      "An ___ decides which videos you see. | algorithm | device, robot",
      "A tablet is a small electronic ___. | device | algorithm, innovation",
    ]),
    build("Practica: nunca antes", "🤖 Nunca había usado una computadora antes", "I had never used a computer before", ["have", "use"]),
  ],

  A2_communication_skills: [
    fill("Practica: can y could con idiomas", [
      "She ___ speak three languages. | can | cans, can to",
      "When I was a child, I ___ speak French. | could | can, may",
      "___ you repeat that, please? | Could | Must, Should",
      "Sorry, I ___ understand you. The music was loud. | couldn't | can't to, can",
      "Can you speak more ___? | slowly | slow, slowness",
    ]),
    fill("Practica: aprender idiomas", [
      "He speaks English perfectly. He's ___. | fluent | accent, slowly",
      "Your ___ is very good. I understand every word. | pronunciation | fluent, translate",
      "She has a British ___. | accent | fluent, repeat",
      "Can you ___ this text into Spanish? | translate | repeat, accent",
      "Sorry, can you ___ the question? | repeat | fluent, accent",
    ]),
    build("Practica: de niño", "🌍 De niño no podía hablar inglés", "As a child I couldn't speak English", ["can't", "speaking"]),
  ],

  A2_effective_communication: [
    fill("Practica: imperativos y pedidos", [
      "Please ___ me. I'm talking. | don't interrupt | not interrupt, no interrupt",
      "Could you ___ that again? | explain | explaining, to explain",
      "Would you mind ___ the door? | closing | close, to close",
      "___ me help you with that. | Let | Make, Do",
      "___ your message clear and short. | Make | Making, Do",
    ]),
    fill("Practica: comunicarse bien", [
      "Thanks for your ___. It helps me improve. | feedback | misunderstanding, interrupt",
      "There was a ___. I thought the meeting was on Monday. | misunderstanding | feedback, clarify",
      "Can you ___ what you mean? | clarify | interrupt, polite",
      "It's ___ to say 'please' and 'thank you'. | polite | rude, clarify",
      "Active ___ means paying attention to the other person. | listening | message, feedback",
    ]),
    build("Practica: would you mind", "🙏 ¿Te molestaría repetir eso?", "Would you mind repeating that?", ["repeat", "to"]),
  ],

  A2_communication_styles: [
    fill("Practica: formal o informal", [
      "Formal: 'I would like a coffee.' Informal: 'I ___ a coffee.' | want | would, wants",
      "Formal: 'Good morning.' Informal: '___!' | Hi | Dear, Sir",
      "Formal: 'Could you help me?' Informal: '___ you help me?' | Can | May, Shall",
      "In an email to your boss: '___ regards, Ana.' | Best | Cool, See ya",
      "With friends: '___ you later!' | See | Regards, Dear",
    ]),
    fill("Practica: estilos", [
      "Saying 'Give me that!' to a stranger is ___. | rude | polite, formal",
      "A ___ is how you say hello. | greeting | request, suggestion",
      "'Could you send me the file?' is a ___. | request | greeting, suggestion",
      "'Why don't we meet on Friday?' is a ___. | suggestion | greeting, request",
      "Use a ___ tone in a job interview. | formal | rude, informal",
    ]),
    build("Practica: una pregunta formal", "📧 Quisiera hacer una pregunta", "I would like to ask a question", ["want", "asking"]),
  ],

  A2_education_studies: [
    fill("Practica: should y ought to", [
      "You ___ study every day. | should | shouldn't, should to",
      "You ought ___ practice more. | to | at, for",
      "You ___ copy in the exam. | shouldn't | should, ought",
      "___ I take notes in class? | Should | Ought, Do should",
      "Students ought to ___ their homework. | do | doing, to do",
    ]),
    fill("Practica: en la escuela", [
      "I have a math ___ tomorrow. | exam | grade, subject",
      "My favorite ___ is history. | subject | exam, grade",
      "I got a good ___ in English: an A! | grade | subject, homework",
      "Did you ___ the exam? | pass | grade, subject",
      "I didn't study, so I ___ the test. | failed | passed, graded",
    ]),
    build("Practica: un consejo de estudio", "📚 Deberías hacer tu tarea antes de cenar", "You should do your homework before dinner", ["make", "to"]),
  ],

  A2_work_professions: [
    fill("Practica: ahora o siempre", [
      "Right now she ___ a meeting. | is having | has, having",
      "I usually ___ at 9 a.m. | start | am starting, starts",
      "This month he ___ from home. | is working | works, work",
      "My mom ___ an engineer. | is | is being, are",
      "What ___ you working on these days? | are | do, is",
    ]),
    fill("Practica: profesiones", [
      "A ___ teaches children. | teacher | manager, engineer",
      "An ___ designs bridges and machines. | engineer | office, salary",
      "My ___ is $3,000 a month. | salary | manager, office",
      "The ___ is responsible for the team. | manager | salary, office",
      "I work ___: 40 hours a week. | full-time | salary, manager",
    ]),
    build("Practica: un proyecto", "💻 Este mes estoy trabajando en un proyecto nuevo", "This month I am working on a new project", ["work", "in"]),
  ],

  A2_workplace_communication: [
    fill("Practica: planes acordados", [
      "I ___ the client at 3 p.m. tomorrow. | am meeting | meeting, met",
      "___ you presenting at the meeting on Friday? | Are | Do, Is",
      "She ___ flying to Madrid next week. | is | does, are",
      "We are ___ the budget tomorrow morning. | discussing | discuss, discussed",
      "What ___ you doing on Monday? | are | do, does",
    ]),
    fill("Practica: en la oficina", [
      "My ___ helps me with the reports. | colleague | deadline, email",
      "The ___ is Friday at noon. | deadline | colleague, team",
      "I'll ___ you back in ten minutes. | call | email, schedule",
      "Please send me an ___ with the details. | email | team, deadline",
      "Our ___ has five people. | team | email, deadline",
    ]),
    build("Practica: agendar", "📅 ¿Podemos agendar una reunión para el jueves?", "Can we schedule a meeting for Thursday?", ["scheduling", "in"]),
  ],

  A2_professional_relationships: [
    fill("Practica: hábitos y proyectos", [
      "Our team ___ every Monday. | meets | is meeting, meet",
      "This month we ___ with a new partner. | are collaborating | collaborate, collaborates",
      "I ___ my mentor. She is very wise. | trust | am trusting, trusts",
      "___ we start the meeting? | Shall | Do, Are",
      "He usually ___ me good advice. | gives | is giving, give",
    ]),
    fill("Practica: relaciones laborales", [
      "My ___ gives me advice about my career. | mentor | partner, teamwork",
      "Good ___ is important in a company. | teamwork | mentor, advice",
      "I need some ___. What should I do? | advice | trust, partner",
      "___ events help you meet new people. | Networking | Advice, Trust",
      "Thank you for your ___. I couldn't do it alone. | support | networking, partner",
    ]),
    build("Practica: colaborar", "🤝 Estos días estamos colaborando con otra empresa", "We are collaborating with another company these days", ["collaborate", "is"]),
  ],
};
