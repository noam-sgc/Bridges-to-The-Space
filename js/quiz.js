// ============================================================
//  QUIZ — perguntas com dados oficiais; acertos rendem créditos
//  (usados na Loja). Perguntas com "l" valem bônus se o jogador já aprendeu
//  o assunto na cidade (Save.data.learned).
// ============================================================
'use strict';

// Q(lição, fonte, pergunta[pt,en,es], opções[[pt,en,es]...], índice correto, explicação[pt,en,es])
const Q = (l, src, q, o, a, e) => ({ l, src, q: K(...q), o: o.map(x => K(...x)), a, e: K(...e) });
const Qc = (cat, src, q, o, a, e) => Object.assign(Q('', src, q, o, a, e), { cat });
const QUIZ_BANK = [
  Q('controle:0', 'Space Communications and Navigation (DSN)',
    ['Quais são os 3 complexos da Rede de Espaço Profundo (DSN)?', 'Which are the 3 complexes of Deep Space Network (DSN)?', '¿Cuáles son los 3 complejos de la Red del Espacio Profundo (DSN)?'],
    [['Goldstone, Madri e Canberra', 'Goldstone, Madrid and Canberra', 'Goldstone, Madrid y Canberra'], ['Houston, Paris e Tóquio', 'Houston, Paris and Tokyo', 'Houston, París y Tokio'], ['Cabo Canaveral, Moscou e Pequim', 'Cape Canaveral, Moscow and Beijing', 'Cabo Cañaveral, Moscú y Pekín'], ['Kourou, Lima e Sydney', 'Kourou, Lima and Sydney', 'Kourou, Lima y Sídney']], 0,
    ['As antenas ficam espaçadas ~120° ao redor da Terra: sempre uma delas enxerga a sonda.', 'The antennas are spaced ~120° around Earth, so one of them can always see the spacecraft.', 'Las antenas están separadas ~120° alrededor de la Tierra: siempre una ve la sonda.']),
  Q('controle:1', 'Mars Exploration',
    ['Quanto tempo leva um sinal de rádio de Marte até a Terra (um sentido)?', 'How long does a radio signal take from Mars to Earth (one way)?', '¿Cuánto tarda una señal de radio de Marte a la Tierra (un sentido)?'],
    [['De 3 a 22 minutos', 'From 3 to 22 minutes', 'De 3 a 22 minutos'], ['Menos de 1 segundo', 'Under 1 second', 'Menos de 1 segundo'], ['Cerca de 2 dias', 'About 2 days', 'Cerca de 2 días'], ['Exatamente 1 hora', 'Exactly 1 hour', 'Exactamente 1 hora']], 0,
    ['A luz viaja a ~300.000 km/s, mas as distâncias entre planetas variam muito. Por isso sondas precisam de autonomia.', 'Light travels ~300,000 km/s, but distances between planets vary a lot. That is why probes need autonomy.', 'La luz viaja a ~300.000 km/s, pero las distancias entre planetas varían mucho. Por eso las sondas necesitan autonomía.']),
  Q('observatorio:0', 'Mars Exploration',
    ['Qual gás compõe cerca de 95% da atmosfera de Marte?', 'Which gas makes up about 95% of the Martian atmosphere?', '¿Qué gas forma cerca del 95% de la atmósfera de Marte?'],
    [['Dióxido de carbono', 'Carbon dioxide', 'Dióxido de carbono'], ['Oxigênio', 'Oxygen', 'Oxígeno'], ['Nitrogênio', 'Nitrogen', 'Nitrógeno'], ['Hélio', 'Helium', 'Helio']], 0,
    ['Por isso o experimento MOXIE, no rover Perseverance, produziu oxigênio a partir do CO₂ marciano.', 'That is why the MOXIE experiment on the Perseverance rover made oxygen from Martian CO₂.', 'Por eso el experimento MOXIE del rover Perseverance produjo oxígeno a partir del CO₂ marciano.']),
  Q('', 'Mars Exploration',
    ['A gravidade na superfície de Marte é aproximadamente…', 'Gravity on the surface of Mars is about…', 'La gravedad en la superficie de Marte es aproximadamente…'],
    [['38% da gravidade da Terra', '38% of Earth\'s gravity', '38% de la gravedad de la Tierra'], ['O dobro da Terra', 'Twice Earth\'s', 'El doble de la Tierra'], ['Igual à da Terra', 'The same as Earth\'s', 'Igual a la de la Tierra'], ['10% da Terra', '10% of Earth\'s', '10% de la Tierra']], 0,
    ['Quem pesa 100 kg na Terra "pesaria" cerca de 38 kg em Marte (a massa continua a mesma).', 'Someone weighing 100 kg on Earth would "weigh" about 38 kg on Mars (mass stays the same).', 'Quien pesa 100 kg en la Tierra "pesaría" unos 38 kg en Marte (la masa sigue igual).']),
  Q('', 'Mars Exploration',
    ['Um dia marciano (sol) dura aproximadamente…', 'A Martian day (sol) lasts about…', 'Un día marciano (sol) dura aproximadamente…'],
    [['24 h 37 min', '24 h 37 min', '24 h 37 min'], ['12 horas', '12 hours', '12 horas'], ['30 horas', '30 hours', '30 horas'], ['48 horas', '48 hours', '48 horas']], 0,
    ['Equipes de rovers vivem em "tempo marciano" para operar a missão.', 'Rover teams live on "Mars time" to operate the mission.', 'Los equipos de los rovers viven en "hora marciana" para operar la misión.']),
  Q('', 'Mars Exploration',
    ['O que foi o Ingenuity?', 'What was Ingenuity?', '¿Qué fue Ingenuity?'],
    [['Um helicóptero que voou em Marte (2021)', 'A helicopter that flew on Mars (2021)', 'Un helicóptero que voló en Marte (2021)'], ['Um satélite da Lua', 'A Moon satellite', 'Un satélite de la Luna'], ['Um telescópio espacial', 'A space telescope', 'Un telescopio espacial'], ['Uma estação em órbita', 'An orbiting station', 'Una estación en órbita']], 0,
    ['Foi o primeiro voo controlado e motorizado em outro planeta.', 'It was the first powered, controlled flight on another planet.', 'Fue el primer vuelo motorizado y controlado en otro planeta.']),
  Q('casa:0', 'Climate Change',
    ['o CO₂ na atmosfera hoje está acima de…', 'atmospheric CO₂ today is above…', 'el CO₂ atmosférico hoy supera…'],
    [['420 ppm', '420 ppm', '420 ppm'], ['280 ppm', '280 ppm', '280 ppm'], ['100 ppm', '100 ppm', '100 ppm'], ['1000 ppm', '1000 ppm', '1000 ppm']], 0,
    ['Antes da Revolução Industrial era ~280 ppm. O valor é medido continuamente, por exemplo no observatório de Mauna Loa.', 'Before the Industrial Revolution it was ~280 ppm. It is measured continuously, e.g. at Mauna Loa observatory.', 'Antes de la Revolución Industrial era ~280 ppm. Se mide de forma continua, por ejemplo en Mauna Loa.']),
  Q('casa:1', 'GISS / Climate Change',
    ['Desde o fim do século XIX, a temperatura média global subiu cerca de…', 'Since the late 19th century, global average temperature has risen about…', 'Desde fines del siglo XIX, la temperatura media global subió cerca de…'],
    [['1,2 °C', '1.2 °C', '1,2 °C'], ['0,01 °C', '0.01 °C', '0,01 °C'], ['5 °C', '5 °C', '5 °C'], ['Não mudou', 'It has not changed', 'No cambió']], 0,
    ['Os dados vêm de estações e satélites e são analisados pelo GISS.', 'The data come from stations and satellites and are analysed by GISS.', 'Los datos vienen de estaciones y satélites y los analiza el GISS.']),
  Q('casa:1', 'Sea Level Change',
    ['Em média, o nível do mar sobe há décadas a cerca de…', 'On average, sea level has been rising for decades at about…', 'En promedio, el nivel del mar sube desde hace décadas a cerca de…'],
    [['3,4 mm por ano', '3.4 mm per year', '3,4 mm por año'], ['3,4 m por ano', '3.4 m per year', '3,4 m por año'], ['0,01 mm por ano', '0.01 mm per year', '0,01 mm por año'], ['Está caindo', 'It is falling', 'Está bajando']], 0,
    ['Satélites altimétricos medem o oceano desde 1993 — e a taxa vem acelerando.', 'Altimetry satellites have measured the ocean since 1993 — and the rate is accelerating.', 'Satélites altimétricos miden el océano desde 1993 — y la tasa se acelera.']),
  Q('', 'ISS Facts',
    ['A que altitude orbita a Estação Espacial Internacional?', 'At what altitude does the International Space Station orbit?', '¿A qué altitud orbita la Estación Espacial Internacional?'],
    [['Cerca de 400 km', 'About 400 km', 'Cerca de 400 km'], ['Cerca de 40 km', 'About 40 km', 'Cerca de 40 km'], ['Cerca de 40.000 km', 'About 40,000 km', 'Cerca de 40.000 km'], ['Cerca de 384.000 km', 'About 384,000 km', 'Cerca de 384.000 km']], 0,
    ['Ela dá uma volta na Terra a cada ~90 minutos, a ~28.000 km/h.', 'It circles Earth every ~90 minutes at ~28,000 km/h.', 'Da una vuelta a la Tierra cada ~90 minutos, a ~28.000 km/h.']),
  Q('', 'Voyager Mission',
    ['Qual sonda lançada em 1977 chegou ao espaço interestelar em 2012?', 'Which probe launched in 1977 reached interstellar space in 2012?', '¿Qué sonda lanzada en 1977 llegó al espacio interestelar en 2012?'],
    [['Voyager 1', 'Voyager 1', 'Voyager 1'], ['Apollo 11', 'Apollo 11', 'Apollo 11'], ['Hubble', 'Hubble', 'Hubble'], ['Curiosity', 'Curiosity', 'Curiosity']], 0,
    ['A Voyager 1 é o objeto feito por humanos mais distante da Terra.', 'Voyager 1 is the most distant human-made object from Earth.', 'La Voyager 1 es el objeto humano más lejano de la Tierra.']),
  Q('', 'Webb Mission',
    ['Onde fica o Telescópio Espacial James Webb?', 'Where is the James Webb Space Telescope located?', '¿Dónde está el Telescopio Espacial James Webb?'],
    [['No ponto L2, a ~1,5 milhão de km da Terra', 'At point L2, ~1.5 million km from Earth', 'En el punto L2, a ~1,5 millones de km de la Tierra'], ['Em órbita baixa a 400 km', 'In low orbit at 400 km', 'En órbita baja a 400 km'], ['Na superfície da Lua', 'On the Moon\'s surface', 'En la superficie de la Luna'], ['Em Marte', 'On Mars', 'En Marte']], 0,
    ['Lá o escudo solar mantém os instrumentos infravermelhos bem frios.', 'There, the sunshield keeps the infrared instruments very cold.', 'Allí el escudo solar mantiene fríos los instrumentos infrarrojos.']),
  Q('missao:0', 'Systems Engineering / NPR 7120.5',
    ['Qual fase do ciclo de vida de uma missão espacial cobre conceito e desenvolvimento de tecnologia?', 'Which phase of a space mission lifecycle covers concept and technology development?', '¿Qué fase del ciclo de vida de una misión espacial cubre el concepto y el desarrollo tecnológico?'],
    [['Fase A', 'Phase A', 'Fase A'], ['Fase E', 'Phase E', 'Fase E'], ['Fase F', 'Phase F', 'Fase F'], ['Fase D', 'Phase D', 'Fase D']], 0,
    ['Antes dela há a Pré-Fase A (estudos de conceito). Depois: B projeto preliminar, C projeto final e construção, D integração, testes e lançamento, E operações, F encerramento.', 'Before it comes Pre-Phase A (concept studies). Then: B preliminary design, C final design and build, D integration, test and launch, E operations, F closeout.', 'Antes está la Pre-Fase A (estudios de concepto). Luego: B diseño preliminar, C diseño final y construcción, D integración, pruebas y lanzamiento, E operaciones, F cierre.']),
  Q('missao:0', 'Systems Engineering / NPR 7120.5',
    ['Em qual fase a missão já está no espaço, coletando e enviando ciência?', 'In which phase is the mission already in space, collecting and sending science?', '¿En qué fase la misión ya está en el espacio, recolectando y enviando ciencia?'],
    [['Fase E (operações)', 'Phase E (operations)', 'Fase E (operaciones)'], ['Fase B', 'Phase B', 'Fase B'], ['Pré-Fase A', 'Pre-Phase A', 'Pre-Fase A'], ['Fase C', 'Phase C', 'Fase C']], 0,
    ['A Fase E é de operações e sustentação; a F é o encerramento (por exemplo, descarte seguro da sonda).', 'Phase E is operations and sustainment; F is closeout (for example, safe disposal of the spacecraft).', 'La Fase E es de operaciones y sostenimiento; la F es el cierre (por ejemplo, descarte seguro de la sonda).']),
  Q('missao:1', 'Systems Engineering Handbook',
    ['O que significa a sigla PDR numa missão espacial?', 'What does PDR stand for in a space mission?', '¿Qué significa la sigla PDR en una misión espacial?'],
    [['Revisão Preliminar de Projeto', 'Preliminary Design Review', 'Revisión Preliminar de Diseño'], ['Plano de Decolagem Rápida', 'Rapid Departure Plan', 'Plan de Despegue Rápido'], ['Programa de Dados do Rover', 'Rover Data Program', 'Programa de Datos del Rover'], ['Painel de Direção Remota', 'Remote Driving Panel', 'Panel de Dirección Remota']], 0,
    ['Revisões (como PDR e CDR, a Revisão Crítica de Projeto) são portões: a missão só avança se o projeto estiver maduro.', 'Reviews (like PDR and CDR, the Critical Design Review) are gates: the mission only moves on if the design is mature.', 'Las revisiones (como PDR y CDR, la Revisión Crítica de Diseño) son puertas: la misión solo avanza si el diseño está maduro.']),
  Q('missao:2', 'Science Mission Directorate',
    ['Numa missão científica, o que deve vir primeiro?', 'In a science mission, what should come first?', 'En una misión científica, ¿qué debe venir primero?'],
    [['As perguntas científicas, que definem objetivos e instrumentos', 'The science questions, which define objectives and instruments', 'Las preguntas científicas, que definen objetivos e instrumentos'], ['Escolher a cor da nave', 'Choosing the spacecraft color', 'Elegir el color de la nave'], ['Comprar o foguete', 'Buying the rocket', 'Comprar el cohete'], ['Escolher a data da festa de lançamento', 'Picking the launch party date', 'Elegir la fecha de la fiesta de lanzamiento']], 0,
    ['Perguntas → objetivos → requisitos → instrumentos e nave. O design da missão nasce da ciência.', 'Questions → objectives → requirements → instruments and spacecraft. Mission design starts from the science.', 'Preguntas → objetivos → requisitos → instrumentos y nave. El diseño nace de la ciencia.']),
  Q('missao:2', 'Systems Engineering Handbook',
    ['Por que as missões mantêm margens (folgas) de massa, energia e orçamento?', 'Why do missions keep margins (reserves) of mass, power and budget?', '¿Por qué las misiones mantienen márgenes de masa, energía y presupuesto?'],
    [['Porque imprevistos acontecem e o projeto cresce durante o desenvolvimento', 'Because surprises happen and designs grow during development', 'Porque ocurren imprevistos y el diseño crece durante el desarrollo'], ['Para gastar dinheiro à toa', 'To waste money', 'Para gastar dinero sin sentido'], ['Porque os engenheiros não sabem fazer contas', 'Because engineers cannot do math', 'Porque los ingenieros no saben hacer cuentas'], ['Não existem margens', 'There are no margins', 'No existen márgenes']], 0,
    ['É exatamente a ideia do seu fundo de contingência no jogo!', 'This is exactly the idea behind your contingency fund in the game!', '¡Es exactamente la idea de su fondo de contingencia en el juego!']),
];


// ---------- perguntas ligadas às regras da nave (Regulação Térmica, água, sistemas, montagem) ----------
QUIZ_BANK.push(
  Qc('ship', 'Thermal control', ['Na fase de Regulação Térmica, qual faixa de temperatura interna a tripulação precisa manter?', 'In the Thermal Regulation phase, what internal temperature range must the crew keep?', 'En la fase de Regulación Térmica, ¿qué rango de temperatura interna debe mantener la tripulación?'],
    [['Entre 18 °C e 26 °C', 'Between 18 °C and 26 °C', 'Entre 18 °C y 26 °C'], ['Entre 0 °C e 10 °C', 'Between 0 °C and 10 °C', 'Entre 0 °C y 10 °C'], ['Entre 30 °C e 40 °C', 'Between 30 °C and 40 °C', 'Entre 30 °C y 40 °C'], ['Qualquer uma', 'Any range', 'Cualquiera']], 0,
    ['Na Terra a atmosfera regula a temperatura de graça; numa nave tudo isso custa energia, combustível e tempo.', 'On Earth the atmosphere regulates temperature for free; on a ship all of it costs energy, propellant and time.', 'En la Tierra la atmósfera regula la temperatura gratis; en una nave todo cuesta energía, combustible y tiempo.']),
  Qc('ship', 'Thermal control', ['Por que o lado da nave voltado para a estrela e o lado na sombra podem ter mais de 200 °C de diferença?', 'Why can the star-facing side and the shadow side of a ship differ by more than 200 °C?', '¿Por qué el lado de la nave hacia la estrella y el lado en sombra pueden diferir en más de 200 °C?'],
    [['Porque no vácuo não há ar para espalhar o calor', 'Because in a vacuum there is no air to spread the heat', 'Porque en el vacío no hay aire que reparta el calor'], ['Porque a nave é de metal fino', 'Because the ship is thin metal', 'Porque la nave es de metal fino'], ['Porque a estrela pisca', 'Because the star blinks', 'Porque la estrella parpadea'], ['Por causa do som', 'Because of sound', 'Por el sonido']], 0,
    ['O calor só sai da nave por radiação. Por isso as naves têm radiadores e giram devagar.', 'Heat only leaves a ship by radiation. That is why ships have radiators and rotate slowly.', 'El calor solo sale de la nave por radiación. Por eso las naves tienen radiadores y giran despacio.']),
  Qc('ship', 'Thermal control', ['Para que serve girar lentamente a nave (a técnica de "assar espetinho")?', 'What is slowly rotating the ship (the "rotisserie" technique) for?', '¿Para qué sirve girar lentamente la nave (la técnica del "asado")?'],
    [['Distribuir o calor do Sol por todos os lados', 'Spreading the Sun\'s heat over every side', 'Repartir el calor del Sol por todos los lados'], ['Gerar gravidade artificial para plantas', 'Making artificial gravity for plants', 'Generar gravedad artificial para plantas'], ['Economizar oxigênio', 'Saving oxygen', 'Ahorrar oxígeno'], ['Ouvir o rádio melhor', 'Hearing the radio better', 'Oír mejor la radio']], 0,
    ['Assim nenhum lado esquenta ou congela demais. A manobra gasta combustível e exige um bom navegador.', 'That way no side overheats or freezes. The maneuver burns propellant and needs a good navigator.', 'Así ningún lado se calienta o congela demasiado. La maniobra gasta combustible y requiere un buen navegante.']),
  Qc('ship', 'Water recovery', ['Quais são as etapas de descontaminação da água do jogo?', 'What are the water decontamination steps in the game?', '¿Cuáles son las etapas de descontaminación del agua del juego?'],
    [['Destilação, Filtração, Oxidação e Desinfecção', 'Distillation, Filtration, Oxidation and Disinfection', 'Destilación, Filtración, Oxidación y Desinfección'], ['Fervura, Congelamento, Sal e Sol', 'Boiling, Freezing, Salt and Sun', 'Hervor, Congelación, Sal y Sol'], ['Só Filtração', 'Filtration only', 'Solo Filtración'], ['Adicionar açúcar', 'Adding sugar', 'Añadir azúcar']], 0,
    ['Num sistema de ciclo fechado, urina, suor e condensação voltam a ser água potável: quase 100% é reaproveitado.', 'In a closed-loop system, urine, sweat and condensation become drinking water again: nearly 100% is reused.', 'En un sistema de ciclo cerrado, orina, sudor y condensación vuelven a ser agua potable: casi el 100 % se reaprovecha.']),
  Qc('ship', 'ISS Environmental Control', ['Na Estação Espacial, que parte da água usada (incluindo urina e suor) é recuperada?', 'On the Space Station, how much of the used water (including urine and sweat) is recovered?', 'En la Estación Espacial, ¿qué parte del agua usada (incluida orina y sudor) se recupera?'],
    [['Cerca de 90% ou mais', 'About 90% or more', 'Cerca del 90 % o más'], ['Quase nada', 'Almost none', 'Casi nada'], ['Cerca de 10%', 'About 10%', 'Cerca del 10 %'], ['Só a água da chuva', 'Only rainwater', 'Solo agua de lluvia']], 0,
    ['Cada litro reaproveitado é um litro que não precisa ser lançado da Terra — e cada quilo lançado custa muito.', 'Every liter reused is a liter that does not have to be launched from Earth — and every launched kilo is expensive.', 'Cada litro reaprovechado es un litro que no hace falta lanzar desde la Tierra — y cada kilo lanzado cuesta mucho.']),
  Qc('ship', 'Pontes-01b ship rules', ['No jogo, qual destes sistemas sofre DANO ALTO quando atingido?', 'In the game, which of these systems takes HIGH damage when hit?', 'En el juego, ¿cuál de estos sistemas sufre DAÑO ALTO al ser golpeado?'],
    [['Sistema de Propulsão', 'Propulsion system', 'Sistema de Propulsión'], ['Casco e Blindagem', 'Hull and shielding', 'Casco y Blindaje'], ['Sistema de Comunicação', 'Communication system', 'Sistema de Comunicación'], ['Módulos de Acoplamento', 'Docking modules', 'Módulos de Acoplamiento']], 0,
    ['Propulsão, tanques e suporte à vida são alto; aviônica, escudo térmico, comunicação e acoplamento são médio; o casco é baixo.', 'Propulsion, tanks and life support are high; avionics, thermal shield, communications and docking are medium; the hull is low.', 'Propulsión, tanques y soporte vital son alto; aviónica, escudo térmico, comunicación y acoplamiento son medio; el casco es bajo.']),
  Qc('ship', 'Pontes-01b ship rules', ['O que acontece com os pontos de verba que sobram na montagem da nave?', 'What happens to the budget points left over when building the ship?', '¿Qué pasa con los puntos de presupuesto que sobran al montar la nave?'],
    [['Viram o fundo de contingência para emergências', 'They become the contingency fund for emergencies', 'Se vuelven el fondo de contingencia para emergencias'], ['Somem', 'They vanish', 'Desaparecen'], ['Viram créditos da Loja', 'They become Shop credits', 'Se vuelven créditos de la Tienda'], ['Compram mais tripulantes', 'They buy more crew', 'Compran más tripulantes']], 0,
    ['É o dilema real de engenharia: gastar tudo para sair forte ou guardar folga para o imprevisto.', 'It is the real engineering dilemma: spend everything to leave strong or keep slack for surprises.', 'Es el dilema real de ingeniería: gastar todo para salir fuerte o guardar margen para lo imprevisto.']),
  Qc('ship', 'Pontes-01b ship rules', ['Quantos tripulantes tem a nave e quem NÃO pode morrer sem a missão falhar?', 'How many crew does the ship have and who must NOT die or the mission fails?', '¿Cuántos tripulantes tiene la nave y quién NO puede morir o la misión falla?'],
    [['6 tripulantes; o Comandante', '6 crew; the Commander', '6 tripulantes; el Comandante'], ['4 tripulantes; o cozinheiro', '4 crew; the cook', '4 tripulantes; el cocinero'], ['10 tripulantes; o navegador', '10 crew; the navigator', '10 tripulantes; el navegante'], ['2 tripulantes; ninguém', '2 crew; nobody', '2 tripulantes; nadie']], 0,
    ['Também falha se restarem menos de 3 vivos. Cada morte tira a função do tripulante e derruba a moral de todos.', 'It also fails if fewer than 3 remain alive. Each death removes the crew member\'s role and drops everyone\'s morale.', 'También falla si quedan menos de 3 con vida. Cada muerte quita la función del tripulante y baja la moral de todos.']),
  Qc('ship', 'Pontes-01b ship rules', ['Qual módulo deixa o tripulante quase sem consumir recursos, mas indisponível?', 'Which module lets a crew member consume almost no resources, but be unavailable?', '¿Qué módulo deja al tripulante casi sin consumir recursos, pero no disponible?'],
    [['Câmara de hibernação', 'Hibernation chamber', 'Cámara de hibernación'], ['Cúpula de observação', 'Observation dome', 'Cúpula de observación'], ['Oficina 3D', '3D workshop', 'Taller 3D'], ['Radar', 'Radar', 'Radar']], 0,
    ['A hibernação reduz o consumo e protege, e combina bem com a enfermaria — mas o tripulante não trabalha.', 'Hibernation cuts consumption and protects, and pairs well with the infirmary — but the crew member does not work.', 'La hibernación reduce el consumo y protege, y combina con la enfermería — pero el tripulante no trabaja.']),
);

const QUIZ_N = 8;
// categorias do Quiz (cada pergunta tem 'cat'; as antigas herdam pela lição/tema)
const QUIZ_CATS = [
  { id: 'space', icon: '🪐', n: K('Espaço real', 'Real space', 'Espacio real') },
  { id: 'earth', icon: '🌍', n: K('Terra e clima', 'Earth and climate', 'Tierra y clima') },
  { id: 'mission', icon: '🛰', n: K('Missões', 'Missions', 'Misiones') },
  { id: 'ship', icon: '🚀', n: K('Nave e sistemas', 'Ship and systems', 'Nave y sistemas') },
  { id: 'mass', icon: '⚖', n: K('Massa e foguetes', 'Mass and rockets', 'Masa y cohetes') },
  { id: 'orbit', icon: '🌀', n: K('Órbitas', 'Orbits', 'Órbitas') },
];
function qCat(q) {
  if (q.cat) return q.cat;
  const l = q.l || '';
  if (/^(ev|gp):/.test(l)) return 'ship';
  if (/^missao:/.test(l)) return 'mission';
  if (/^casa:/.test(l)) return 'earth';
  return 'space';
}
const quizPool = cat => QUIZ_BANK.filter(q => !cat || qCat(q) === cat);
const quizLearned = l => !!(l && Save.data.learned && Save.data.learned[l]);
function learnMark(key) { if (!key) return; Save.data.learned = Save.data.learned || {}; if (!Save.data.learned[key]) { Save.data.learned[key] = 1; Save.write(); } }

function quizStart(cat) {
  const qs = shuffle(quizPool(cat)).slice(0, QUIZ_N).map(q => ({ q, ord: shuffle(q.o.map((_, i) => i)) }));
  U.quiz = { qs, i: 0, ok: 0, earned: 0, picked: null, done: false, cat: cat || '' };
}
function quizScreen() {
  const Z = U.quiz;
  if (!Z) return `<div class="panel center wide"><h2>🛰 ${esc(L(K('QUIZ', 'QUIZ', 'QUIZ')))} <span class="credits">✦ ${Save.data.credits}</span></h2>
    <p>${L(K('Responda perguntas com dados oficiais e ganhe <b>créditos</b> para usar na Loja e na missão. Acertos de assuntos que você aprendeu na cidade ou nos desafios da viagem rendem bônus. Visite o <b>Centro de Design de Missões</b> na cidade para aprender mais!', 'Answer questions with official data and earn <b>credits</b> for the Shop and your mission. Right answers on topics you learned in the city or during the trip challenges earn a bonus. Visit the <b>Mission Design Center</b> in the city to learn more!', '¡Responda preguntas con datos oficiales y gane <b>créditos</b> para la Tienda y la misión! Los aciertos en temas aprendidos en la ciudad o en los desafíos del viaje dan bonificación. ¡Visite el <b>Centro de Diseño de Misiones</b> en la ciudad para aprender más!'))}</p>
    <p class="small muted">${esc(L(K('Cada acerto: +5 ✦ (primeira vez) ou +1 ✦ (repetida) · +2 ✦ se você aprendeu o tema na cidade ou na viagem · Rodada perfeita: +5 ✦', 'Each right answer: +5 ✦ (first time) or +1 ✦ (repeat) · +2 ✦ if you learned the topic in the city or on the trip · Perfect round: +5 ✦', 'Cada acierto: +5 ✦ (primera vez) o +1 ✦ (repetida) · +2 ✦ si aprendió el tema en la ciudad o en el viaje · Ronda perfecta: +5 ✦')))}</p>
    <div class="opts quizcats"><button class="opt rec" data-ui="quizStart" data-arg=""><b>🎲 ${esc(L(K('Misto', 'Mixed', 'Mixto')))}</b><span>${QUIZ_BANK.length} ${esc(L(K('perguntas', 'questions', 'preguntas')))}</span></button>${QUIZ_CATS.map(c => { const pool = quizPool(c.id), done = pool.filter(q => (Save.data.quizDone || {})[q.q.pt]).length; return `<button class="opt" data-ui="quizStart" data-arg="${c.id}"><b>${c.icon} ${esc(L(c.n))}</b><span>${done}/${pool.length} ${esc(L(K('acertadas', 'solved', 'acertadas')))}</span></button>`; }).join('')}</div>
    <div class="row"><button class="btn" data-ui="title">◀ ${esc(L('Voltar'))}</button></div></div>`;
  if (Z.done) {
    const perfect = Z.ok === Z.qs.length;
    return `<div class="panel center wide"><h2>🛰 ${esc(L(K('Resultado', 'Result', 'Resultado')))}</h2>
      <div class="bignum">${Z.ok}/${Z.qs.length}</div>
      <p class="credits big">+${Z.earned} ✦ ${esc(L(K('créditos', 'credits', 'créditos')))}${perfect ? ' 🏆' : ''}</p>
      <p class="small muted">${esc(L(K('Total na carteira:', 'Wallet total:', 'Total en la cartera:')))} ✦ ${Save.data.credits}</p>
      <div class="row"><button class="btn primary" data-ui="quizStart" data-arg="${esc(Z.cat || '')}">↻ ${esc(L(K('Jogar de novo', 'Play again', 'Jugar de nuevo')))}</button><button class="btn" data-ui="shop">✦ ${esc(L('LOJA'))}</button><button class="btn" data-ui="quizExit">◀ ${esc(L('Voltar'))}</button></div></div>`;
  }
  const it = Z.qs[Z.i], q = it.q, ans = it.ord.indexOf(q.a);
  const opts = it.ord.map((oi, k) => {
    let cls = '';
    if (Z.picked !== null) cls = k === ans ? ' good' : k === Z.picked ? ' bad' : ' cant';
    return `<button class="opt${cls}" data-ui="quizPick" data-arg="${k}" ${Z.picked !== null ? 'disabled' : ''}><b>${'ABCD'[k]}</b> ${esc(L(q.o[oi]))}</button>`;
  }).join('');
  const fb = Z.picked === null ? '' : `<div class="quizfb"><b>${Z.picked === ans ? '✔ ' + esc(L(K('Correto!', 'Correct!', '¡Correcto!'))) : '✖ ' + esc(L(K('Não foi dessa vez.', 'Not this time.', 'Esta vez no.')))}</b> ${Z.gain ? `<span class="credits">+${Z.gain} ✦</span>` : ''}<p>${esc(L(q.e))}</p><p class="small muted">${esc(L(K('Fonte: ', 'Source: ', 'Fuente: ')))}${esc(q.src)}</p>
    <button class="btn primary" data-ui="quizNext">${Z.i + 1 >= Z.qs.length ? esc(L(K('Ver resultado', 'See result', 'Ver resultado'))) : esc(L(K('Próxima ▶', 'Next ▶', 'Siguiente ▶')))}</button></div>`;
  return `<div class="panel center wide scroll"><h2>🛰 ${esc(L(K('QUIZ', 'QUIZ', 'QUIZ')))} <span class="small muted">${Z.i + 1}/${Z.qs.length} · ✦ ${Z.earned}</span></h2>
    <p class="citytxt">${esc(L(q.q))}</p><div class="opts">${opts}</div>${fb}
    <div class="row"><button class="btn small" data-ui="quizExit">✕ ${esc(L(K('Sair do quiz', 'Quit quiz', 'Salir del quiz')))}</button></div></div>`;
}
UIH.quiz = () => { U.screen = 'quiz'; U.quiz = null; S = S && S.scene === 'end' ? null : S; };
UIH.quizStart = cat => { quizStart(typeof cat === 'string' ? cat : ''); U.screen = 'quiz'; };
UIH.quizExit = () => { U.quiz = null; UIH.title(); };
UIH.quizPick = k => {
  const Z = U.quiz; if (!Z || Z.picked !== null || Z.done) return;
  k = +k; const it = Z.qs[Z.i], q = it.q; Z.picked = k; Z.gain = 0;
  if (it.ord[k] === q.a) {
    Save.data.quizDone = Save.data.quizDone || {};
    const key = q.q.pt; const first = !Save.data.quizDone[key];
    Z.gain = (first ? 5 : 1) + (quizLearned(q.l) ? 2 : 0);
    Save.data.quizDone[key] = 1; Z.ok++; if (Sfx.ok) Sfx.ok();
  } else if (Sfx.click) Sfx.click();
  Z.earned += Z.gain; Save.data.credits += Z.gain; Save.write();
};
UIH.quizNext = () => {
  const Z = U.quiz; if (!Z) return;
  if (Z.i + 1 >= Z.qs.length) {
    if (Z.ok === Z.qs.length) { Z.earned += 5; Save.data.credits += 5; Save.write(); }
    Z.done = true;
  } else { Z.i++; Z.picked = null; Z.gain = 0; }
};
