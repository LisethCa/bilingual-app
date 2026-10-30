const { fill, build, drag, match, cat, dialog } = require("../../helpers");

// Ampliación a 13 ejercicios por lección (pedido del cliente, octubre 2026), segunda parte:
// lecciones que quedaron con 10-12 después de quitar los duplicados (ver dedupe.js).
module.exports = {
  // ---------- Unidad: primeros pasos ----------
  A1_greetings_basic: [
    fill("Practica: saludos del día", [
      "Good ___! It's eight in the morning. | morning | night, evening",
      "___ are you? I'm fine. | How | What, Who",
      "We ___ friends. | are | is, am",
      "Bye! See you ___! | tomorrow | yesterday, ago",
      "Thank you! — You're ___. | welcome | welcomes, well",
    ]),
    build("Practica: despedirse", "🌙 Buenas noches, ¡hasta mañana!", "Good night, see you tomorrow!", ["morning", "are"]),
    dialog("Practica: En la escuela", "Llegas a clase por la mañana.", [
      ["Teacher", "Good morning, class!", "Good morning, teacher!", "Good night, teacher!", "Por la mañana se dice 'Good morning'."],
      ["Teacher", "How are you today?", "We are fine, thank you.", "We is fine, thank you.", "Con 'we' se usa 'are'."],
      ["Teacher", "Here is your book.", "Thank you!", "You're welcome!", "Cuando te dan algo, agradeces."],
    ]),
  ],

  A1_greetings_and_nations: [
    fill("Practica: países y nacionalidades", [
      "He is from Canada. He is ___. | Canadian | Canada, Canadese",
      "They ___ from Peru. | are | is, am",
      "Is she ___ Spain? | from | of, to",
      "I am Argentinian. I am from ___. | Argentina | Argentinian, Argentinians",
      "___ do they live? In Bogotá. | Where | What, Who",
    ]),
    build("Practica: nacionalidad", "🇨🇴 Ella es colombiana", "She is Colombian", ["are", "Colombians"]),
    drag(
      "Practica: país y nacionalidad",
      ["Brazil = Brazilian", "Argentina = Argentinian", "Chile = Chilean", "Italy = Italian", "France = French"],
      "Arrastra cada país hasta su nacionalidad.",
    ),
  ],

  A1_introducing_yourself: [
    fill("Practica: hablar de ti", [
      "Hi, I ___ Marco. | am | is, are",
      "I am a ___. I teach English. | teacher | student, country",
      "This is my ___ Lisa. We go to school together. | friend | country, teacher",
      "My ___ is Brazil. | country | name, friend",
      "I am twenty-two years ___. | old | olds, year",
    ]),
    build("Practica: edad y ocupación", "🎓 Soy estudiante y tengo diecinueve años", "I am a student and I am nineteen years old", ["have", "is"]),
    cat("Practica: ¿qué dice de ti?", [
      ["Nombre", ["My name is Leo", "I am Leo"]],
      ["País", ["I am from Chile", "I live in Chile"]],
      ["Profesión", ["I am a doctor", "I work in a school"]],
    ]),
  ],

  A1_asking_names: [
    fill("Practica: preguntar nombres", [
      "What is ___ name? (de él) | his | he, him",
      "How do you ___ your name? | spell | spells, spelling",
      "My ___ is Bea, but my full name is Beatriz. | nickname | last name, first names",
      "Is Smith your ___ name? | last | full, nick",
      "___ is your teacher's name? | What | How, Who",
    ]),
    build("Practica: deletrear", "🔤 ¿Puedes deletrear tu apellido?", "Can you spell your last name?", ["spelling", "my"]),
    dialog("Practica: En la recepción", "Llegas a un hotel y la recepcionista te pide tus datos.", [
      ["Receptionist", "Good morning. What is your full name?", "My full name is Ana Lucia Torres.", "My nickname is Ani.", "Te pide el nombre completo."],
      ["Receptionist", "Can you spell it, please?", "T-O-R-R-E-S.", "Torres is my last name.", "Te pide que lo deletrees."],
      ["Receptionist", "Thank you. Is Ana your first name?", "Yes, it is.", "Yes, I am.", "La pregunta es con 'is': 'Yes, it is'."],
    ]),
  ],

  A1_personal_pronouns: [
    fill("Practica: ¿quién?", [
      "The table is big. ___ is brown. | It | He, She",
      "My mother is a nurse. ___ works at night. | She | He, It",
      "Ben and I play soccer. ___ play on Saturdays. | We | They, I",
      "Is ___ your brother? | he | she, it",
      "Lucas and Sara are cousins. ___ live in Quito. | They | We, He",
    ], "Completa la oración con el pronombre personal que reemplaza al nombre o sustantivo."),
    build("Practica: ellas", "👭 Ellas son mis hermanas", "They are my sisters", ["She", "is"]),
    dialog("Practica: Una foto", "Tu amiga Ana mira una foto de tu familia.", [
      ["Ana", "Who is that boy?", "He is my cousin.", "She is my cousin.", "Para un chico se usa 'he'."],
      ["Ana", "Are you and your cousin from Peru?", "Yes, we are from Lima.", "Yes, they are from Lima.", "Hablas de ti y de tu primo: 'we'."],
      ["Ana", "And your parents?", "They are from Cusco.", "We are from Cusco.", "Tus padres: 'they'."],
    ]),
  ],

  A1_introductions_names: [
    fill("Practica: posesivos", [
      "Hello, ___ name is Sofia. | my | I, me",
      "Is ___ name Peter? (tú) | your | you, you're",
      "This is Mrs. Lee. ___ first name is Anna. | Her | His, She",
      "Mr. Brown is my teacher. ___ first name is David. | His | Her, He",
      "___ is your best friend's name? | What | Who, Where",
    ]),
    build("Practica: el nombre de él", "❓ ¿Cuál es su nombre (de él)?", "What is his name?", ["her", "are"]),
    dialog("Practica: El primer día", "Es tu primer día de clase.", [
      ["Teacher", "Good morning! What is your name?", "My name is Diego.", "Your name is Diego.", "Hablas de ti: 'My name'."],
      ["Teacher", "And who is the girl next to you?", "She is my friend. Her name is Paula.", "She is my friend. His name is Paula.", "Para una mujer se usa 'her'."],
      ["Teacher", "Nice to meet you, Diego.", "Nice to meet you too.", "You're welcome.", "Responde al saludo."],
    ]),
  ],

  A1_meeting_people: [
    fill("Practica: presentar a otros", [
      "Hi Tom, ___ is my sister Lucy. | this | these, those",
      "These are my ___, Ana and Luis. | classmates | classmate, colleague",
      "Let me ___ my friend Paul. | introduce | introduces, introducing",
      "Tom and Kate are my ___. They live next door. | neighbors | colleagues, classmates",
      "Mr. Smith is my ___ at work. | colleague | neighbor, classmate",
    ]),
    build("Practica: permíteme presentarte", "🤝 Permíteme presentarte a mi colega Sam", "Let me introduce my colleague Sam", ["introduces", "these"]),
    dialog("Practica: En una fiesta", "Estás en una fiesta con tu amiga Lucy.", [
      ["Lucy", "Hi! Who are these people?", "These are my neighbors, Tom and Kate.", "This is my neighbors, Tom and Kate.", "Para varias personas: 'These are'."],
      ["Tom", "Nice to meet you, Lucy.", "Nice to meet you too, Tom.", "Goodbye, Tom.", "Responde al saludo."],
      ["Lucy", "And who is that man?", "He is my classmate, Pedro.", "She is my classmate, Pedro.", "Para un hombre se usa 'he'."],
    ]),
  ],

  A1_meeting_people_formal: [
    fill("Practica: situaciones formales", [
      "Good ___, Mrs. Taylor. (a las 8 de la noche, al llegar) | evening | night, morning",
      "___ me, is this your seat? | Excuse | Sorry to, Pardon to",
      "This is ___ Smith, our new manager. | Mr. | Mister John, Sir",
      "How do you do, ___? (a una mujer) | madam | sir, mister",
      "I am very well, thank ___. | you | your, yours",
    ]),
    build("Practica: buenas noches", "🌙 Buenas noches, señora. Encantado de conocerla", "Good evening, madam. Pleased to meet you.", ["night", "sir"]),
    drag(
      "Practica: ¿qué respondes?",
      [
        "Good afternoon, sir. = Good afternoon.",
        "Thank you very much. = You're welcome.",
        "Excuse me, are you Mr. Lee? = Yes, I am.",
        "Pleased to meet you. = Pleased to meet you too.",
      ],
      "Arrastra cada frase hasta su respuesta.",
    ),
  ],

  // ---------- Unidad: números, colores, familia ----------
  A1_numbers: [
    fill("Practica: cuántos hay", [
      "A week has ___ days. | seven | six, eight",
      "There are ___ months in a year. | twelve | eleven, twenty",
      "My little brother is six years ___. | old | age, olds",
      "Nine + nine = ___. | eighteen | eighty, nineteen",
      "How ___ are you? I'm fourteen. | old | many, much",
    ]),
    build("Practica: ¿cuántos?", "🍎 ¿Cuántas manzanas tienes?", "How many apples do you have?", ["much", "has"]),
    drag(
      "Practica: cifra y palabra",
      ["12 = Twelve", "14 = Fourteen", "16 = Sixteen", "17 = Seventeen", "19 = Nineteen"],
      "Arrastra cada número hasta su nombre en inglés.",
    ),
  ],

  A1_colors: [
    fill("Practica: colores y cosas", [
      "Strawberries are ___. | red | blue, purple",
      "Clouds are usually ___. | white | green, orange",
      "Blue + yellow = ___. | green | pink, brown",
      "My shoes ___ black. | are | is, am",
      "She has a ___ bag. (rosa) | pink | pinks, purple",
    ]),
    build("Practica: ¿de qué color?", "🚲 ¿De qué color es tu bicicleta?", "What color is your bicycle?", ["are", "colors"]),
    dialog("Practica: Tu color favorito", "Hablas de colores con un amigo.", [
      ["Friend", "What is your favorite color?", "My favorite color is purple.", "I am purple.", "Usa 'My favorite color is...'."],
      ["Friend", "Do you have a purple T-shirt?", "Yes, I have two purple T-shirts.", "Yes, I have two T-shirts purples.", "El color va antes del sustantivo y no lleva plural."],
      ["Friend", "What color are your eyes?", "They are brown.", "It is brown.", "'Eyes' es plural: 'They are'."],
    ]),
  ],

  A1_family: [
    fill("Practica: de quién es", [
      "This is ___ car. (de Pedro) | Pedro's | Pedros, Pedro",
      "My ___ name is Rosa. (de mi madre) | mother's | mothers, mother",
      "This is my brother. ___ name is Leo. | His | Her, He",
      "My grandparents ___ in a small town. | live | lives, living",
      "I have one sister and two ___. | brothers | brother, brother's",
    ], "Elige de las tres (3) palabras la que corresponde en la oración."),
    fill("Practica: preguntas sobre la familia", [
      "How many brothers ___ you have? | do | does, are",
      "___ is your aunt's name? | What | Who, How",
      "Is Tom ___ cousin? | your | you, you're",
      "My aunt ___ two children. | has | have, is",
      "___ is that woman? She's my grandmother. | Who | What, How",
    ], "Elige de las tres (3) palabras la que corresponde en la oración."),
    build("Practica: el auto de mi padre", "🚗 Este es el auto de mi padre", "This is my father's car", ["fathers", "are"]),
  ],

  A1_personal_info_have: [
    fill("Practica: have y has", [
      "My parents ___ three children. | have | has, are",
      "___ she have a pet? | Does | Do, Is",
      "We don't ___ a car. | have | has, having",
      "How many cousins ___ they have? | do | does, are",
      "My dog ___ two years old. | is | has, have",
    ]),
    build("Practica: sin mascota", "🐱 Mi hermana no tiene mascota", "My sister doesn't have a pet", ["has", "don't"]),
    match("Practica: ¿qué significa?", [
      "I have a cat = Tengo un gato",
      "How old is she? = ¿Cuántos años tiene ella?",
      "She has no brothers = Ella no tiene hermanos",
      "We have a big family = Tenemos una familia grande",
    ]),
  ],

  A1_descriptions: [
    fill("Practica: describir personas", [
      "My grandfather ___ white hair. | has | is, have",
      "She is very ___. She always helps people. | kind | short, small",
      "He isn't tall. He is ___. | short | blonde, kind",
      "Your sister is ___. She tells great jokes. | funny | small, tall",
      "Paula has ___ hair. (rubio) | blonde | blondes, brown",
    ], "Elige una de las tres (3) formas verbales y completa la oración de forma correcta."),
    build("Practica: ojos y pelo", "👩 Mi madre tiene ojos verdes y pelo corto", "My mother has green eyes and short hair", ["is", "greens"]),
    drag(
      "Practica: ¿cómo es?",
      [
        "He is two meters tall = Tall",
        "She is one meter fifty = Short",
        "He makes everyone laugh = Funny",
        "She always helps her friends = Kind",
        "He has yellow hair = Blonde",
      ],
      "Arrastra cada descripción hasta el adjetivo.",
    ),
  ],

  // ---------- Unidad: comida y restaurantes ----------
  A1_food_basics: [
    fill("Practica: comida y cantidades", [
      "There is ___ cheese in the fridge. | some | a, an",
      "I'd like ___ orange, please. | an | a, some",
      "He has ___ sandwich for lunch. | a | an, some",
      "We have ___ bread for dinner. | some | a, an",
      "Do you want ___ eggs? | some | a, an",
    ], "Elige y ubica en la línea el cuantificador de cantidad que corresponde."),
    build("Practica: el almuerzo", "🥪 Como un sándwich y una manzana", "I eat a sandwich and an apple", ["some", "eats"]),
    cat("Practica: ¿a, an o some?", [
      ["a", ["banana", "sandwich", "cookie"]],
      ["an", ["apple", "egg", "orange"]],
      ["some", ["rice", "milk", "bread"]],
    ]),
  ],

  A1_food: [
    fill("Practica: comida saludable", [
      "Carrots and apples ___ healthy. | are | is, be",
      "I don't eat ___ meat. | much | many, a",
      "How ___ eggs do you eat in a week? | many | much, some",
      "How ___ water do you drink? | much | many, a",
      "Fish ___ good for your brain. | is | are, am",
    ]),
    build("Practica: una comida sana", "🍗 El pollo con arroz es una comida sana", "Chicken with rice is a healthy meal", ["are", "healthier"]),
    dialog("Practica: Las compras de la semana", "Haces la lista del supermercado con tu mamá.", [
      ["Mom", "What do we need for the week?", "We need some milk and three carrots.", "We need a milk and three carrot.", "'Milk' es incontable y 'carrots' va en plural."],
      ["Mom", "How many apples do we need?", "We need five apples.", "We need much apples.", "Responde con un número."],
      ["Mom", "Do we need any cheese?", "Yes, we need some cheese.", "Yes, we need a cheeses.", "'Cheese' es incontable: 'some cheese'."],
    ]),
  ],

  A1_drinks_beverages: [
    fill("Practica: pedir bebidas", [
      "I'd like a ___ of soda. (lata) | can | cup, bottle",
      "Would you like some ___? It's hot. (té) | tea | juice, soda",
      "I ___ like a hot chocolate, please. | would | will, am",
      "My son drinks a glass ___ milk every morning. | of | with, for",
      "Lemonade is a ___ drink. | cold | hot, warm",
    ]),
    build("Practica: una botella de agua", "💧 Quisiera una botella de agua, por favor", "I would like a bottle of water, please", ["cup", "an"]),
    drag(
      "Practica: ¿qué pides?",
      ["I'm cold = A hot chocolate", "I'm thirsty = A glass of water", "I'm tired = A cup of coffee", "It's a hot day = A cold lemonade"],
      "Arrastra cada situación hasta la bebida ideal.",
    ),
  ],

  A1_restaurant_phrases: [
    fill("Practica: en el restaurante", [
      "Can I have a glass of water, ___? | please | thanks, sorry",
      "I'd like to make a ___ for Friday. | reservation | menu, bill",
      "What would you like for ___? Ice cream? | dessert | bill, table",
      "The ___ brings the food to the table. | waiter | menu, dessert",
      "Can we see the dessert ___, please? | menu | bill, waiter",
    ]),
    build("Practica: reservar", "📞 Quisiera reservar una mesa para cuatro", "I would like to reserve a table for four", ["reservation", "is"]),
    match("Practica: frases del mesero", [
      "Ready to order? = ¿Listos para pedir?",
      "Anything else? = ¿Algo más?",
      "Enjoy your meal! = ¡Buen provecho!",
      "Keep the change = Quédese con el vuelto",
    ]),
  ],

  A1_ordering_food: [
    fill("Practica: pedir la comida", [
      "I'd like the soup as a ___. | starter | dessert, bill",
      "___ you like a drink? | Would | Do want, Are",
      "He would like ___ hamburger. | a | an, some",
      "We'd like two ___ courses. | main | mains, big",
      "I'd like fries ___ my hamburger. | with | and, of",
    ]),
    build("Practica: el plato principal", "🍔 De plato principal quisiera una hamburguesa", "For the main course I would like a hamburger", ["an", "likes"]),
    drag(
      "Practica: pregunta y respuesta",
      [
        "What would you like? = I'd like the chicken, please.",
        "Would you like a drink? = Yes, an orange juice, please.",
        "Anything for dessert? = No, thank you. I'm full.",
        "Is everything OK? = Yes, it's delicious.",
      ],
      "Arrastra cada pregunta del mesero hasta tu respuesta.",
    ),
  ],

  A1_paying_the_bill: [
    fill("Practica: al pagar", [
      "I'll pay ___ cash. | in | by, on",
      "Here is a ___ for you. Thank you! | tip | bill, price",
      "Can I have a ___? I need it for work. | receipt | tip, change",
      "You paid $50 and the bill is $40. Your ___ is $10. | change | tip, price",
      "Can we ___ separately? | pay | paying, pays",
    ]),
    build("Practica: en efectivo", "💵 Voy a pagar en efectivo", "I will pay in cash", ["by", "card"]),
    dialog("Practica: Dividir la cuenta", "Terminaste de cenar con una amiga.", [
      ["Waiter", "Here is your bill.", "Thank you. Can we pay separately?", "Thank you. Can we eat separately?", "Quieres pagar por separado."],
      ["Waiter", "Sure. Cash or card?", "Card, please.", "Yes, please.", "Te da dos opciones: elige una."],
      ["Waiter", "Here is your receipt.", "Thank you. This is for you.", "You're welcome.", "Te dan algo: agradece."],
    ]),
  ],

  // ---------- Unidad: rutinas y presente ----------
  A1_simple_present: [
    fill("Practica: preguntas con do / does", [
      "___ you speak English? | Do | Does, Are",
      "___ he live in Lima? | Does | Do, Is",
      "Does she ___ in a bank? | work | works, working",
      "Where ___ they study? | do | does, are",
      "What ___ your sister drink in the morning? | does | do, is",
    ], "Ubica sobre la línea la forma verbal correcta para hacer la pregunta."),
    build("Practica: una pregunta", "📖 ¿Tu hermano lee mucho?", "Does your brother read a lot?", ["reads", "Do"]),
    dialog("Practica: Un compañero nuevo", "Conoces a Tom, un compañero nuevo.", [
      ["Tom", "Hi! Where do you live?", "I live near the school.", "I lives near the school.", "Con 'I' el verbo va sin -s."],
      ["Tom", "Do you work?", "No, I don't. I study at the university.", "No, I doesn't. I study at the university.", "Con 'I' se usa 'don't'."],
      ["Tom", "What does your sister do?", "She works in a bank.", "She work in a bank.", "Con 'she' el verbo lleva -s."],
    ]),
  ],

  A1_present_simple_vs_continuous: [
    build("Practica: ahora mismo", "🎮 Mi hermano está jugando videojuegos ahora", "My brother is playing video games now", ["plays", "play"]),
  ],

  A1_abilities: [
    fill("Practica: lo que se puede", [
      "Penguins can't ___. | fly | swim, walk",
      "Can your sister ___? Yes, she draws very well. | draw | draws, drawing",
      "I can run, but I ___ run fast. | can't | can, don't can",
      "Fish can ___, but they can't walk. | swim | swims, swimming",
      "___ your dog swim? | Can | Do, Is",
    ]),
    build("Practica: sí y no", "🎨 Mi hermano no sabe dibujar, pero sabe bailar", "My brother can't draw, but he can dance", ["cans", "dances"]),
    match("Practica: ¿quién puede?", [
      "A fish = can swim",
      "A bird = can fly",
      "A chef = can cook",
      "A singer = can sing",
      "A bus driver = can drive a bus",
    ]),
  ],

  A1_jobs_and_professions: [
    fill("Practica: trabajos", [
      "A ___ cooks in a restaurant. | chef | pilot, nurse",
      "My uncle ___ in an office. | works | work, working",
      "Where ___ your sister work? | does | do, is",
      "Is your brother ___ engineer? | an | a, the",
      "My father is a ___. He serves food in a café. | waiter | pilot, doctor",
    ]),
    build("Practica: ¿a qué se dedica?", "❓ ¿A qué se dedica tu madre?", "What does your mother do?", ["is", "does"]),
    match("Practica: ¿qué hacen?", [
      "A nurse = helps sick people",
      "A teacher = teaches students",
      "An office worker = works with a computer",
      "A pilot = flies planes",
      "An artist = paints pictures",
    ]),
  ],

  A1_technology_devices: [
    fill("Practica: dispositivos", [
      "My laptop has a big ___. | screen | keyboard, password",
      "I write with the ___. | keyboard | screen, app",
      "You ___ turn off your phone in class. It's the rule. | must | mustn't, can't",
      "Can I ___ the internet here? | use | uses, using",
      "I have a lot of ___ on my phone. | apps | app, keyboards",
    ]),
    build("Practica: un correo", "📧 ¿Puedes enviarme un correo electrónico?", "Can you send me an email?", ["a", "sends"]),
  ],

  // ---------- Unidad: futuro ----------
  A1_future_plans: [
    fill("Practica: planes", [
      "Tonight I am going ___ cook pasta. | to | for, at",
      "My parents ___ going to buy a new car. | are | is, am",
      "Is he going to ___ the guitar? | play | plays, playing",
      "We aren't going to ___ out tonight. | go | going, goes",
      "___ is she going to visit? Her aunt. | Who | What, Where",
    ]),
    build("Practica: el sábado", "🛒 El sábado vamos a hacer las compras", "On Saturday we are going to buy groceries", ["will", "goes"]),
    drag(
      "Practica: ¿qué vas a hacer?",
      [
        "My bag is ready = I am going to travel",
        "I have a ball = I am going to play soccer",
        "The house is dirty = I am going to clean it",
        "I have a new book = I am going to read it",
      ],
      "Arrastra cada situación hasta el plan.",
    ),
  ],

  A1_future_plans_will: [
    fill("Practica: will", [
      "I think it ___ be sunny tomorrow. | will | is, does",
      "She'll ___ you later. | call | calls, to call",
      "Maybe they ___ come. They are not sure. | will | are, do",
      "We ___ forget your birthday. We promise! | won't | don't, aren't",
      "___ you be at home tonight? | Will | Does, Is",
    ]),
    build("Practica: quizás", "🏖️ Quizás iremos a la playa la próxima semana", "Maybe we will go to the beach next week", ["going", "goes"]),
    cat("Practica: ¿para qué se usa will?", [
      ["Promesa", ["I will always help you", "I won't tell anyone"]],
      ["Predicción", ["It will rain tomorrow", "You will be famous"]],
      ["Decisión del momento", ["I'll have the soup", "I'll take the bus"]],
    ]),
  ],

  A1_goals: [
    fill("Practica: metas", [
      "My ___ is to run a marathon. | goal | goals, become",
      "She wants to ___ a nurse. | become | becomes, be to",
      "I am going to ___ money for a car. | save | saves, saving",
      "He ___ to learn Chinese. | wants | want, wanting",
      "What is your dream ___? | job | jobs, working",
    ]),
    build("Practica: ahorrar", "💰 Voy a ahorrar dinero para un viaje", "I am going to save money for a trip", ["saving", "goes"]),
    drag(
      "Practica: ¿qué necesitas?",
      [
        "To become a doctor = Study medicine",
        "To speak English = Practice every day",
        "To buy a house = Save money",
        "To run a marathon = Train a lot",
      ],
      "Arrastra cada meta hasta lo que necesitas hacer.",
    ),
  ],

  A1_intentions_decisions: [
    fill("Practica: decisiones", [
      "There's no milk. I ___ go to the shop. | will | am, do",
      "I have ___ to study medicine. (decidí) | decided | decide, decision",
      "Can I ___ you? | help | helping, helps",
      "My ___ is to visit Japan. | plan | plans, decide",
      "I will ___ you at eight. | call | calls, calling",
    ]),
    build("Practica: un ofrecimiento", "📦 Te ayudaré con las cajas", "I will help you with the boxes", ["helps", "going"]),
    drag(
      "Practica: ¿qué dices?",
      [
        "Your friend is sick = I will bring you some soup",
        "Your mom is busy = I will wash the dishes",
        "Someone is at the door = I will open it",
        "You forgot a birthday = I will buy a gift tomorrow",
      ],
      "Arrastra cada situación hasta tu decisión.",
    ),
  ],

  // ---------- Unidad: compras y ropa ----------
  A1_shopping: [
    fill("Practica: en la tienda", [
      "This T-shirt is ___. It's only $3. | cheap | expensive, much",
      "What ___ are you? Medium? | size | price, fit",
      "These shoes don't ___. They are too small. | fit | size, wear",
      "Is there a ___ today? 20% off? | discount | receipt, price",
      "How ___ money do you have? | much | many, any",
    ]),
    build("Practica: otra talla", "👕 ¿Tienen esta camisa en talla grande?", "Do you have this shirt in a large size?", ["any", "sizes"]),
    drag(
      "Practica: ¿qué dice el cliente?",
      [
        "It's too big = Do you have a smaller size?",
        "It's too expensive = Is there anything cheaper?",
        "I want it in red = Do you have it in red?",
        "I want to try it on = Where are the fitting rooms?",
      ],
      "Arrastra cada problema hasta la pregunta.",
    ),
  ],

  A1_clothes: [
    fill("Practica: la ropa", [
      "It's cold. Put on your ___. | jacket | T-shirt, skirt",
      "I wear ___ on my feet. | socks | hats, skirts",
      "He is wearing ___ hat today. | a | an, some",
      "Are these your ___? | jeans | jean, a jeans",
      "Her skirt ___ blue. | is | are, am",
    ], "Elige la prenda adecuada de las tres (3) para completar la oración."),
    build("Practica: hoy llevo", "👖 Hoy llevo jeans y una camiseta blanca", "Today I am wearing jeans and a white T-shirt", ["wear", "whites"]),
  ],

  // ---------- Unidad: casa, ciudad y viajes ----------
  A1_housing: [
    fill("Practica: la casa", [
      "We eat dinner in the ___. | dining room | bathroom, garage",
      "There are flowers in the ___. | garden | garage, roof",
      "Look at ___ birds on the roof over there! | those | these, this",
      "Can you open the ___? It's hot. | window | roof, garage",
      "My bedroom has a small ___. I can see the street. | balcony | kitchen, garage",
    ], "Completa la oración con el lugar de la casa que corresponda, de los tres (3) planteados."),
    build("Practica: esa casa", "🏡 Esa casa tiene un jardín grande", "That house has a big garden", ["This", "have"]),
    cat("Practica: ¿dentro o fuera?", [
      ["Dentro de la casa", ["Kitchen", "Bedroom", "Bathroom", "Dining room"]],
      ["Fuera de la casa", ["Garden", "Roof", "Balcony", "Swimming pool"]],
    ]),
  ],

  A1_directions: [
    fill("Practica: dónde está", [
      "The library is ___ the school. (detrás) | behind | in front of, next to",
      "___ the street at the traffic light. | Cross | Turn, Go straight",
      "The park is ___ to the bank. | next | near, between",
      "Is the supermarket ___ here? | near | next, between",
      "Go straight and turn ___ at the bank. | right | straight, cross",
    ]),
    build("Practica: ¿está cerca?", "🗺️ ¿La biblioteca está cerca de aquí?", "Is the library near here?", ["next", "are"]),
    cat("Practica: ¿lugar o indicación?", [
      ["Lugares", ["Bank", "Pharmacy", "Park", "Library"]],
      ["Indicaciones", ["Turn left", "Go straight", "Cross the street", "Turn right"]],
    ]),
  ],

  A1_travel_and_transport: [
    fill("Practica: de viaje", [
      "I put my clothes in my ___. | suitcase | passport, ticket",
      "You need a ___ to travel to another country. | passport | suitcase, taxi",
      "The ___ goes under the city. | subway | airplane, bicycle",
      "She is ___ to work by bicycle. | going | go, goes",
      "Where ___ you going? | are | is, do",
    ]),
    build("Practica: en metro", "🚇 Hoy voy al trabajo en metro", "Today I am going to work by subway", ["take", "in"]),
    dialog("Practica: En la estación", "Compras un boleto de tren.", [
      ["Clerk", "Good morning. Where are you going?", "I am going to Madrid.", "I am going by Madrid.", "Di el destino: 'going to'."],
      ["Clerk", "One way or return?", "Return, please.", "By train, please.", "Te pregunta si es de ida o de ida y vuelta."],
      ["Clerk", "Here is your ticket. The train is leaving from platform 3.", "Thank you!", "Here is my passport.", "Te dan el boleto: agradece."],
    ]),
  ],

  A1_team_sports: [
    fill("Practica: el partido", [
      "The ___ is talking to the players. | coach | ball, game",
      "Who ___ winning? | is | are, does",
      "Our team ___ losing 2–0. | is | are, am",
      "I am ___ a game on TV. | watching | watch, watches",
      "Is the player ___ the ball? | kicking | kick, kicks",
    ]),
    build("Practica: ¿quién juega?", "⚽ ¿Quién está jugando ahora?", "Who is playing now?", ["are", "plays"]),
    drag(
      "Practica: ¿qué deporte es?",
      [
        "You play with your feet = Soccer",
        "You play on ice = Hockey",
        "You hit the ball with a bat = Baseball",
        "You throw the ball into a basket = Basketball",
        "You hit the ball over a high net = Volleyball",
      ],
      "Arrastra cada descripción hasta el deporte.",
    ),
  ],

  // ---------- Unidad: salud y emociones ----------
  A1_health_symptoms: [
    fill("Practica: síntomas", [
      "My head hurts. I have a ___. | headache | toothache, fever",
      "He ___ a sore throat. | has | have, is",
      "My stomach hurts. I have a ___. | stomachache | cough, headache",
      "Take this ___ twice a day. | medicine | doctor, fever",
      "Your temperature is 39 °C. You have a ___. | fever | cold, cough",
    ]),
    build("Practica: tos y resfriado", "🤧 Mi hijo tiene tos y un resfriado", "My son has a cough and a cold", ["have", "is"]),
    match("Practica: síntoma y consejo", [
      "I have a cold = Drink hot tea",
      "I have a fever = Stay in bed",
      "I have a toothache = Go to the dentist",
      "I have a sore throat = Don't talk too much",
    ]),
  ],

  A1_medical_vocabulary: [
    fill("Practica: en el médico", [
      "I need ___ go to the pharmacy. | to | for, at",
      "The ___ gives me my medicine at the hospital. | nurse | pill, appointment",
      "Take one ___ after breakfast. | pill | pain, rest",
      "I feel ___ today. Yesterday I was sick. | better | pain, rest",
      "I have a ___ in my back. | pain | pill, rest",
    ]),
    build("Practica: la cita", "📅 Tengo una cita con el médico mañana", "I have an appointment with the doctor tomorrow", ["a", "need"]),
    cat("Practica: ¿need o need to?", [
      ["need + cosa", ["I need a pill", "She needs a nurse", "We need a doctor"]],
      ["need to + verbo", ["I need to rest", "She needs to sleep", "We need to call a doctor"]],
    ]),
  ],

  A1_feeling_sick: [
    fill("Practica: cómo te sientes", [
      "I didn't eat breakfast. I'm ___. | hungry | thirsty, dizzy",
      "She ___ better today. | feels | feel, is feel",
      "I'm ___. Can I have some water? | thirsty | hungry, weak",
      "He is very ___. He can't stand up. | weak | better, hungry",
      "Are you OK? You ___ very tired. | look | looks, are look",
    ]),
    build("Practica: mucho mejor", "🙂 Hoy me siento mucho mejor", "I feel much better today", ["good", "feels"]),
    match("Practica: ¿cómo están?", ["🥱 = Tired", "🤢 = Sick", "😵 = Dizzy", "🥤 = Thirsty", "🍽️ = Hungry"]),
  ],

  A1_emotions_feelings: [
    fill("Practica: emociones", [
      "I won the game! I'm so ___. | happy | sad, bored",
      "My brother broke my phone. I'm ___! | angry | proud, excited",
      "She ___ worried about her mom. | is | are, feel",
      "Don't be ___. The dog is friendly. | scared | proud, happy",
      "We are ___ because we are going to Disney! | excited | bored, worried",
    ]),
    build("Practica: orgulloso", "🏅 Estoy orgulloso de mi hija", "I am proud of my daughter", ["for", "proudly"]),
  ],

  A1_animals: [
    fill("Practica: los animales", [
      "Horses ___ very fast. | run | runs, running",
      "My hamster ___ very small. | is | are, am",
      "Pigs ___ on farms. | live | lives, living",
      "___ are big and gray. | Elephants | Elephant, An elephant",
      "There ___ two cats in the garden. | are | is, am",
    ]),
    build("Practica: mi mascota", "🐶 Mi perro es pequeño y blanco", "My dog is small and white", ["are", "whites"]),
    match("Practica: ¿qué sonido hace?", ["Dog = Woof", "Cow = Moo", "Pig = Oink", "Lion = Roar", "Horse = Neigh"]),
  ],

  A1_nature_environment: [
    fill("Practica: la naturaleza", [
      "There is a beautiful ___ near my house. We swim in it. | lake | mountain, forest",
      "Look at the ___! There are no clouds. | sky | tree, flower",
      "We ___ paper and plastic. | recycle | waste, throw",
      "I ___ the sound of the river. | hear | am hearing, hears",
      "This flower ___ nice. | smells | is smelling, smell",
    ]),
    build("Practica: el bosque", "🌳 Este bosque tiene árboles muy altos", "This forest has very tall trees", ["have", "tallest"]),
  ],

  // ---------- Unidad: pasado ----------
  A1_past_experiences: [
    fill("Practica: pasado regular", [
      "I ___ to music last night. | listened | listen, listening",
      "My parents ___ in Spain in 2010. | lived | live, living",
      "We ___ for two hours in the park. | walked | walk, walking",
      "Did you ___ your homework? | finish | finished, finishing",
      "She ___ her friend yesterday. (llamó) | called | call, calls",
    ]),
    build("Practica: el año pasado", "✈️ Viajamos a México el año pasado", "We traveled to Mexico last year", ["travel", "did"]),
    dialog("Practica: El fin de semana", "Tu amigo te pregunta qué hiciste.", [
      ["Friend", "What did you do on Saturday?", "I played soccer with my friends.", "I play soccer with my friends.", "Habla del pasado: 'played'."],
      ["Friend", "Did you watch the game on Sunday?", "No, I didn't. I studied for my exam.", "No, I don't. I studied for my exam.", "La pregunta es en pasado: 'I didn't'."],
      ["Friend", "Did you cook on Sunday night?", "Yes, I cooked pasta.", "Yes, I cook pasta.", "Responde en pasado: 'cooked'."],
    ]),
  ],

  A1_past_experiences_2: [
    fill("Practica: pasado irregular", [
      "I ___ a lot of photos on my trip. | took | taked, take",
      "We ___ sandwiches for the picnic. | made | maked, make",
      "Where ___ you yesterday? | were | was, did",
      "I ___ my friend at the mall. (vi) | saw | seed, see",
      "It ___ a great day. | was | were, is",
    ]),
    build("Practica: fotos en la playa", "📸 Sacamos muchas fotos en la playa", "We took a lot of photos at the beach", ["take", "was"]),
    dialog("Practica: ¿Dónde estabas?", "Tu mamá te pregunta por anoche.", [
      ["Mom", "Where were you last night?", "I was at Ana's house.", "I were at Ana's house.", "Con 'I' se usa 'was'."],
      ["Mom", "What did you do there?", "We made pizza and saw a movie.", "We make pizza and see a movie.", "Habla en pasado."],
      ["Mom", "Did you take the bus home?", "Yes, I took the last bus.", "Yes, I taked the last bus.", "'Take' es irregular: 'took'."],
    ]),
  ],

  A1_events_celebrations: [
    fill("Practica: celebraciones", [
      "We ___ New Year with fireworks. | celebrate | celebrates, celebrating",
      "There were fifty ___ at the wedding. | guests | guest, gifts",
      "I ___ my aunt a gift. (di) | gave | gived, give",
      "Last Christmas we ___ at my grandparents' house. | were | was, are",
      "The children ___ a lot of candy at the party. | ate | eated, eat",
    ]),
    build("Practica: Nochevieja", "🎆 Vimos los fuegos artificiales en Nochevieja", "We watched the fireworks on New Year's Eve", ["watch", "in"]),
  ],
};
