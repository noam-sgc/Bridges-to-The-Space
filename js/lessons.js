// ============================================================
//  LIÇÕES NA GAMEPLAY — depois de cada desafio o computador de bordo
//  conta uma curiosidade real sobre o tema. As perguntas (que dão
//  créditos) ficam só no Quiz da tela inicial; o que você aprendeu
//  aqui vale bônus lá.
// ============================================================
'use strict';

const EXO_COUNT = 6470; // exoplanetas confirmados (Exoplanet Archive, 15/11/2026)
// fato contado pelo computador + a pergunta correspondente, que entra no Quiz da tela inicial
const EV_LESSONS = {
  termico: {
    fact: K('A Estação Espacial usa radiadores de amônia para jogar o calor no espaço.', 'The Space Station uses ammonia radiators to dump heat into space.', 'La Estación Espacial usa radiadores de amoníaco para expulsar el calor al espacio.'),
    quiz: Q('ev:termico', '', ['Como a Estação Espacial se livra do excesso de calor?', 'How does the Space Station get rid of extra heat?', '¿Cómo se libra la Estación Espacial del exceso de calor?'],
      [['Com radiadores de amônia', 'With ammonia radiators', 'Con radiadores de amoníaco'], ['Abrindo as janelas', 'By opening the windows', 'Abriendo las ventanas'], ['Com ventiladores para fora', 'With fans blowing outside', 'Con ventiladores hacia afuera'], ['Não precisa, o espaço é frio', 'It doesn\'t need to, space is cold', 'No hace falta, el espacio es frío']], 0,
      ['No vácuo não há ar para levar o calor: ele só sai por radiação.', 'In a vacuum there is no air to carry heat away: it can only leave as radiation.', 'En el vacío no hay aire que se lleve el calor: solo sale por radiación.']) },
  asteroides: {
    fact: K('Em 2022, a missão DART desviou um asteroide batendo de propósito nele.', 'In 2022, the DART mission deflected an asteroid by crashing into it on purpose.', 'En 2022, la misión DART desvió un asteroide chocando a propósito contra él.'),
    quiz: Q('ev:asteroides', '', ['O que a missão DART fez em 2022?', 'What did the DART mission do in 2022?', '¿Qué hizo la misión DART en 2022?'],
      [['Desviou um asteroide batendo nele', 'Deflected an asteroid by hitting it', 'Desvió un asteroide chocando con él'], ['Pousou em Marte', 'Landed on Mars', 'Aterrizó en Marte'], ['Fotografou Plutão', 'Photographed Pluto', 'Fotografió Plutón'], ['Levou turistas à Lua', 'Took tourists to the Moon', 'Llevó turistas a la Luna']], 0,
      ['Foi o primeiro teste real de defesa planetária: a órbita de Dimorphos ficou 32 minutos mais curta.', 'It was the first real planetary defense test: Dimorphos\'s orbit got 32 minutes shorter.', 'Fue la primera prueba real de defensa planetaria: la órbita de Dimorphos se acortó 32 minutos.']) },
  brecha: {
    fact: K('Em 2018, astronautas selaram um furo de 2 mm numa nave Soyuz com selante epóxi e gaze.', 'In 2018, astronauts sealed a 2 mm hole in a Soyuz with epoxy sealant and gauze.', 'En 2018, unos astronautas sellaron un agujero de 2 mm en una Soyuz con sellador epoxi y gasa.'),
    quiz: Q('ev:brecha', '', ['Com o que a tripulação selou o furo na Soyuz em 2018?', 'What did the crew use to seal the hole in the Soyuz in 2018?', '¿Con qué selló la tripulación el agujero de la Soyuz en 2018?'],
      [['Selante epóxi e gaze', 'Epoxy sealant and gauze', 'Sellador epoxi y gasa'], ['Fita adesiva comum', 'Regular tape', 'Cinta adhesiva común'], ['Chiclete', 'Chewing gum', 'Chicle'], ['Não selaram, voltaram à Terra', 'They didn\'t, they went back to Earth', 'No lo sellaron, volvieron a la Tierra']], 0,
      ['O furo tinha só 2 mm, mas no espaço até um vazamento pequeno vai esvaziando o ar.', 'The hole was only 2 mm, but in space even a small leak slowly drains the air.', 'El agujero tenía solo 2 mm, pero en el espacio hasta una fuga pequeña va vaciando el aire.']) },
  combFalta: {
    fact: K('A Voyager 2 usou a gravidade de quatro planetas como estilingue para economizar combustível.', 'Voyager 2 used the gravity of four planets as a slingshot to save fuel.', 'La Voyager 2 usó la gravedad de cuatro planetas como honda para ahorrar combustible.'),
    quiz: Q('ev:combFalta', '', ['Como uma sonda pode ganhar velocidade sem gastar combustível?', 'How can a probe gain speed without burning fuel?', '¿Cómo puede una sonda ganar velocidad sin gastar combustible?'],
      [['Passando perto de um planeta (assistência gravitacional)', 'Flying close to a planet (gravity assist)', 'Pasando cerca de un planeta (asistencia gravitatoria)'], ['Abrindo uma vela de pano', 'Opening a cloth sail', 'Abriendo una vela de tela'], ['Desligando os motores', 'Turning off the engines', 'Apagando los motores'], ['Não é possível', 'It is not possible', 'No es posible']], 0,
      ['A gravidade do planeta "puxa" e lança a sonda: foi assim que a Voyager 2 visitou quatro planetas gigantes.', 'The planet\'s gravity "pulls" and flings the probe: that is how Voyager 2 visited four giant planets.', 'La gravedad del planeta "tira" y lanza la sonda: así la Voyager 2 visitó cuatro planetas gigantes.']) },
  combVaz: {
    fact: K('A sonda Dawn visitou Vesta e Ceres com um motor iônico que gasta só miligramas de xenônio por segundo.', 'The Dawn probe visited Vesta and Ceres with an ion engine that burns only milligrams of xenon per second.', 'La sonda Dawn visitó Vesta y Ceres con un motor iónico que gasta solo miligramos de xenón por segundo.'),
    quiz: Q('ev:combVaz', '', ['Que tipo de motor a sonda Dawn usou para visitar Vesta e Ceres?', 'What kind of engine did the Dawn probe use to visit Vesta and Ceres?', '¿Qué tipo de motor usó la sonda Dawn para visitar Vesta y Ceres?'],
      [['Propulsão iônica (xenônio)', 'Ion propulsion (xenon)', 'Propulsión iónica (xenón)'], ['Motor a vapor', 'Steam engine', 'Motor a vapor'], ['Hélice', 'Propeller', 'Hélice'], ['Vela solar de papel', 'Paper solar sail', 'Vela solar de papel']], 0,
      ['O empurrão é fraquinho, mas dura meses: economia enorme de combustível.', 'The push is tiny, but it lasts for months: huge fuel savings.', 'El empuje es muy débil, pero dura meses: un ahorro enorme de combustible.']) },
  oxigenio: {
    fact: K('Na Estação Espacial, o oxigênio é feito separando a água por eletrólise.', 'On the Space Station, oxygen is made by splitting water through electrolysis.', 'En la Estación Espacial, el oxígeno se obtiene separando el agua por electrólisis.'),
    quiz: Q('ev:oxigenio', '', ['De onde vem o oxigênio que os astronautas respiram na Estação Espacial?', 'Where does the oxygen astronauts breathe on the Space Station come from?', '¿De dónde viene el oxígeno que respiran los astronautas en la Estación Espacial?'],
      [['Da água, por eletrólise', 'From water, by electrolysis', 'Del agua, por electrólisis'], ['De plantas no teto', 'From plants on the ceiling', 'De plantas en el techo'], ['Do espaço lá fora', 'From space outside', 'Del espacio exterior'], ['De garrafas trazidas todo dia', 'From bottles brought every day', 'De botellas traídas cada día']], 0,
      ['A eletrólise separa H₂O em hidrogênio e oxigênio. Por isso água é tão preciosa a bordo.', 'Electrolysis splits H₂O into hydrogen and oxygen. That is why water is so precious on board.', 'La electrólisis separa el H₂O en hidrógeno y oxígeno. Por eso el agua es tan valiosa a bordo.']) },
  painel: {
    fact: K('As antenas da Deep Space Network ficam na Califórnia, na Espanha e na Austrália para nunca perder uma nave de vista.', 'Deep Space Network antennas sit in California, Spain and Australia so a spacecraft is never out of sight.', 'Las antenas de la Deep Space Network están en California, España y Australia para no perder nunca de vista una nave.'),
    quiz: Q('ev:painel', '', ['Por que as antenas da Deep Space Network ficam em três continentes?', 'Why are the Deep Space Network antennas on three continents?', '¿Por qué las antenas de la Deep Space Network están en tres continentes?'],
      [['Para sempre ter uma virada para a nave enquanto a Terra gira', 'So one always faces the ship while Earth rotates', 'Para que siempre una apunte a la nave mientras la Tierra gira'], ['Para dividir o custo', 'To split the cost', 'Para dividir el costo'], ['Por causa do clima', 'Because of the weather', 'Por el clima'], ['É só coincidência', 'It is just a coincidence', 'Es pura coincidencia']], 0,
      ['Separadas por ~120°, uma delas sempre enxerga a nave, de dia ou de noite.', 'About 120° apart, one of them can always see the ship, day or night.', 'Separadas ~120°, una de ellas siempre ve la nave, de día o de noche.']) },
  lixo: {
    fact: K('Na Estação Espacial, o lixo vai em naves de carga que queimam ao reentrar na atmosfera.', 'On the Space Station, trash goes into cargo ships that burn up when they reenter the atmosphere.', 'En la Estación Espacial, la basura va en naves de carga que se queman al reentrar en la atmósfera.'),
    quiz: Q('ev:lixo', '', ['O que acontece com o lixo da Estação Espacial?', 'What happens to trash on the Space Station?', '¿Qué pasa con la basura de la Estación Espacial?'],
      [['Vai numa nave de carga que queima na reentrada', 'It goes on a cargo ship that burns up on reentry', 'Va en una nave de carga que se quema al reentrar'], ['É jogado pela janela', 'It is thrown out the window', 'Se tira por la ventana'], ['Fica flutuando para sempre', 'It floats around forever', 'Flota para siempre'], ['Vira combustível na hora', 'It instantly becomes fuel', 'Se convierte en combustible al instante']], 0,
      ['Nada pode ser simplesmente "jogado fora" no espaço: tudo precisa de um destino planejado.', 'Nothing can just be "thrown away" in space: everything needs a planned destination.', 'En el espacio nada se puede "tirar" sin más: todo necesita un destino planeado.']) },
  radio: {
    fact: K('Um sinal de rádio leva de 3 a 22 minutos para ir da Terra a Marte.', 'A radio signal takes 3 to 22 minutes to travel from Earth to Mars.', 'Una señal de radio tarda de 3 a 22 minutos en ir de la Tierra a Marte.'),
    quiz: Q('controle:1', '', ['Quanto tempo leva um sinal de rádio de Marte até a Terra (um sentido)?', 'How long does a radio signal take from Mars to Earth (one way)?', '¿Cuánto tarda una señal de radio de Marte a la Tierra (un sentido)?'],
      [['De 3 a 22 minutos', 'From 3 to 22 minutes', 'De 3 a 22 minutos'], ['Menos de 1 segundo', 'Under 1 second', 'Menos de 1 segundo'], ['Cerca de 2 dias', 'About 2 days', 'Cerca de 2 días'], ['Exatamente 1 hora', 'Exactly 1 hour', 'Exactamente 1 hora']], 0,
      ['A distância entre os planetas muda o tempo todo; por isso naves precisam decidir sozinhas.', 'The distance between planets keeps changing; that is why ships must decide on their own.', 'La distancia entre planetas cambia todo el tiempo; por eso las naves deben decidir solas.']) },
  contaminacao: {
    fact: K('A Estação Espacial recupera 98% da sua água, até a do suor e da urina.', 'The Space Station recovers 98% of its water, even from sweat and urine.', 'La Estación Espacial recupera el 98 % de su agua, incluso la del sudor y la orina.'),
    quiz: Q('ev:contaminacao', '', ['Que porcentagem da água a Estação Espacial consegue recuperar desde 2023?', 'What share of its water can the Space Station recover since 2023?', '¿Qué porcentaje del agua recupera la Estación Espacial desde 2023?'],
      [['98%', '98%', '98 %'], ['10%', '10%', '10 %'], ['50%', '50%', '50 %'], ['0%: a água vem toda da Terra', '0%: all water comes from Earth', '0 %: toda el agua viene de la Tierra']], 0,
      ['Reciclar quase tudo é a única forma de viajar longe: cada litro trazido da Terra é caro.', 'Recycling almost everything is the only way to travel far: every liter brought from Earth is costly.', 'Reciclar casi todo es la única forma de viajar lejos: cada litro traído de la Tierra es caro.']) },
  traje: {
    fact: K('Uma caminhada espacial dura, em média, cerca de seis horas e meia.', 'A spacewalk lasts about six and a half hours on average.', 'Una caminata espacial dura, en promedio, unas seis horas y media.'),
    quiz: Q('ev:traje', '', ['Quanto dura, em média, uma caminhada espacial?', 'How long does a spacewalk last on average?', '¿Cuánto dura en promedio una caminata espacial?'],
      [['Cerca de 6 horas e meia', 'About 6.5 hours', 'Unas 6 horas y media'], ['5 minutos', '5 minutes', '5 minutos'], ['3 dias', '3 days', '3 días'], ['1 semana', '1 week', '1 semana']], 0,
      ['O traje é uma nave em miniatura: ar, temperatura e pressão precisam funcionar o tempo todo.', 'The suit is a tiny spacecraft: air, temperature and pressure must work the whole time.', 'El traje es una nave en miniatura: aire, temperatura y presión deben funcionar todo el tiempo.']) },
  doenca: {
    fact: K('No espaço, os fluidos do corpo sobem para a cabeça e o rosto dos astronautas incha.', 'In space, body fluids shift to the head and astronauts\' faces get puffy.', 'En el espacio, los fluidos del cuerpo suben a la cabeza y la cara de los astronautas se hincha.'),
    quiz: Q('ev:doenca', '', ['Por que o rosto dos astronautas incha no espaço?', 'Why do astronauts\' faces get puffy in space?', '¿Por qué se hincha la cara de los astronautas en el espacio?'],
      [['Os fluidos do corpo sobem para a cabeça', 'Body fluids shift toward the head', 'Los fluidos del cuerpo suben a la cabeza'], ['Comem sal demais', 'They eat too much salt', 'Comen demasiada sal'], ['Por causa do frio', 'Because of the cold', 'Por el frío'], ['É alergia ao capacete', 'It is a helmet allergy', 'Es alergia al casco']], 0,
      ['Sem gravidade puxando para baixo, sangue e líquidos se espalham de outro jeito pelo corpo.', 'Without gravity pulling down, blood and fluids spread through the body differently.', 'Sin gravedad tirando hacia abajo, la sangre y los líquidos se reparten de otra forma.']) },
  tempestade: {
    fact: K('Na cápsula Orion, a tripulação se protege de tempestades solares num abrigo feito com os sacos de carga.', 'In the Orion capsule, the crew shelters from solar storms in a fort built from cargo bags.', 'En la cápsula Orion, la tripulación se protege de las tormentas solares en un refugio hecho con las bolsas de carga.'),
    quiz: Q('ev:tempestade', '', ['Na cápsula Orion, como a tripulação se protege de uma tempestade solar?', 'In the Orion capsule, how does the crew protect itself from a solar storm?', 'En la cápsula Orion, ¿cómo se protege la tripulación de una tormenta solar?'],
      [['Monta um abrigo com os sacos de carga', 'Builds a shelter out of cargo bags', 'Arma un refugio con las bolsas de carga'], ['Usa óculos escuros', 'Wears sunglasses', 'Usa gafas de sol'], ['Abre as janelas', 'Opens the windows', 'Abre las ventanas'], ['Não faz nada', 'Does nothing', 'No hace nada']], 0,
      ['Massa entre você e a radiação ajuda a bloquear partículas: água, comida e carga viram escudo.', 'Mass between you and the radiation helps block particles: water, food and cargo become a shield.', 'La masa entre usted y la radiación ayuda a bloquear partículas: agua, comida y carga se vuelven escudo.']) },
};
// os temas da gameplay também entram no Quiz do menu
Object.values(EV_LESSONS).forEach(x => { if (!QUIZ_BANK.some(q => q.q.pt === x.quiz.q.pt)) QUIZ_BANK.push(x.quiz); });
const END_LESSONS = [
  () => K(`Já foram confirmados ${EXO_COUNT.toLocaleString('pt-BR')} exoplanetas, e nenhum é habitável.`, `${EXO_COUNT.toLocaleString('en-US')} exoplanets have been confirmed, and none is habitable.`, `Ya se confirmaron ${EXO_COUNT.toLocaleString('es-ES')} exoplanetas, y ninguno es habitable.`),
  () => K('Até o exoplaneta mais próximo, a viagem levaria uns 75 mil anos.', 'Even to the closest exoplanet, the trip would take about 75,000 years.', 'Hasta el exoplaneta más cercano, el viaje tardaría unos 75 mil años.'),
  () => K('2024 foi o ano mais quente já registrado na Terra.', '2024 was the warmest year on record on Earth.', '2024 fue el año más cálido registrado en la Tierra.'),
];

function lessonOf(rec) { return rec && rec.ev ? ALL_LESSONS[rec.ev] : null; }

// depois de cada desafio: a lição do tema daquele desafio
{
  const _close = closeEvent;
  closeEvent = function () { const ev = S && S.event; const type = ev && ev.type; _close(); if (type) teach(type, true); };
}
// consertos, tarefas da rotina e etapas da viagem também ensinam
{
  const _rep = TASK_DONE.repair; TASK_DONE.repair = (c, d) => { _rep(c, d); if (d && SYS_LESSON[d.sys]) teach(SYS_LESSON[d.sys]); };
  const _hook = routineHook; routineHook = function (type, p, actor) { const r = S && S.routine; const before = r ? r.items.filter(x => x.done).map(x => x.id) : []; _hook(type, p, actor); if (!r) return; const now = r.items.filter(x => x.done && !before.includes(x.id)); if (now[0] && CHORE_LESSON[now[0].id]) teach(CHORE_LESSON[now[0].id]); };
  const ACTION_LESSON = { eat: 'horta', cook: 'horta', harvest: 'horta', plant: 'horta', careAll: 'horta', sleep: 'doenca', rest: 'doenca', treat: 'doenca', replaceMeds: 'doenca', processTrash: 'lixo', ejectTrash: 'lixo', research: 'webb', cruise: 'rotas', trade: 'iss', analyzeExo: 'webb', cEat: 'horta', cSleep: 'sol' };
  const _apply = applyAction; applyAction = function (type, p, actorId) { _apply(type, p, actorId); if (ACTION_LESSON[type] && S && (type !== 'research' || (p && p.on))) teach(ACTION_LESSON[type]); };
  const _fund = ACTIONS.fund; ACTIONS.fund = (p, a) => { _fund(p, a); teach('margins'); };
  const _st = enterStation; enterStation = function () { _st(); teach('iss', true); };
  const _col = startColony; startColony = function (a, b) { _col(a, b); teach('marsGrav', true); };
  const _lv = leaveStation; leaveStation = function () { _lv(); teach('webb', true); };
}
// ---------- mais temas: ligados a consertos, tarefas e etapas da viagem ----------
// fato + pergunta do Quiz (pelo texto da pergunta já existente, ou uma nova)
const qRef = pt => QUIZ_BANK.find(q => q.q.pt === pt);
const MORE_LESSONS = {
  voyager: { fact: K('A Voyager 1, lançada em 1977, é o objeto feito por humanos mais distante da Terra.', 'Voyager 1, launched in 1977, is the most distant human-made object from Earth.', 'La Voyager 1, lanzada en 1977, es el objeto humano más lejano de la Tierra.'), ref: 'Qual sonda lançada em 1977 chegou ao espaço interestelar em 2012?' },
  webb: { fact: K('O Telescópio James Webb observa o universo a 1,5 milhão de km da Terra.', 'The James Webb Space Telescope observes the universe from 1.5 million km away from Earth.', 'El Telescopio James Webb observa el universo a 1,5 millones de km de la Tierra.'), ref: 'Onde fica o Telescópio Espacial James Webb?' },
  iss: { fact: K('A Estação Espacial dá uma volta na Terra a cada 90 minutos, a 400 km de altura.', 'The Space Station circles Earth every 90 minutes, 400 km up.', 'La Estación Espacial da una vuelta a la Tierra cada 90 minutos, a 400 km de altura.'), ref: 'A que altitude orbita a Estação Espacial Internacional?' },
  marsAtm: { fact: K('A atmosfera de Marte é quase toda de dióxido de carbono.', 'Mars\'s atmosphere is almost all carbon dioxide.', 'La atmósfera de Marte es casi toda de dióxido de carbono.'), ref: 'Qual gás compõe cerca de 95% da atmosfera de Marte?' },
  marsGrav: { fact: K('Em Marte, a gravidade é só 38% da gravidade da Terra.', 'On Mars, gravity is only 38% of Earth\'s.', 'En Marte, la gravedad es solo el 38 % de la de la Tierra.'), ref: 'A gravidade na superfície de Marte é aproximadamente…' },
  sol: { fact: K('Um dia em Marte dura 24 horas e 37 minutos.', 'A day on Mars lasts 24 hours and 37 minutes.', 'Un día en Marte dura 24 horas y 37 minutos.'), ref: 'Um dia marciano (sol) dura aproximadamente…' },
  ingenuity: { fact: K('Em 2021, o helicóptero Ingenuity fez o primeiro voo motorizado em outro planeta.', 'In 2021, the Ingenuity helicopter made the first powered flight on another planet.', 'En 2021, el helicóptero Ingenuity hizo el primer vuelo motorizado en otro planeta.'), ref: 'O que foi o Ingenuity?' },
  margins: { fact: K('Missões espaciais sempre guardam uma folga de massa, energia e dinheiro para imprevistos.', 'Space missions always keep spare mass, power and money for surprises.', 'Las misiones espaciales siempre guardan un margen de masa, energía y dinero para imprevistos.'), ref: 'Por que as missões mantêm margens (folgas) de massa, energia e orçamento?' },
  phases: { fact: K('Toda missão científica começa pelas perguntas que ela quer responder.', 'Every science mission starts with the questions it wants to answer.', 'Toda misión científica empieza por las preguntas que quiere responder.'), ref: 'Numa missão científica, o que deve vir primeiro?' },
  horta: { fact: K('Astronautas já cultivaram e comeram alface na Estação Espacial.', 'Astronauts have already grown and eaten lettuce on the Space Station.', 'Los astronautas ya cultivaron y comieron lechuga en la Estación Espacial.'),
    quiz: Q('gp:horta', '', ['Que alimento os astronautas já cultivaram e comeram na Estação Espacial?', 'Which food have astronauts grown and eaten on the Space Station?', '¿Qué alimento ya cultivaron y comieron los astronautas en la Estación Espacial?'],
      [['Alface', 'Lettuce', 'Lechuga'], ['Melancia', 'Watermelon', 'Sandía'], ['Café', 'Coffee', 'Café'], ['Nada: plantas não crescem no espaço', 'Nothing: plants cannot grow in space', 'Nada: las plantas no crecen en el espacio']], 0,
      ['Com luz de LED, água e nutrientes medidos, plantas crescem mesmo em microgravidade.', 'With LED light, water and measured nutrients, plants grow even in microgravity.', 'Con luz LED, agua y nutrientes medidos, las plantas crecen incluso en microgravedad.']) },
};
for (const [k, v] of Object.entries(MORE_LESSONS)) {
  if (v.ref) { v.quiz = qRef(v.ref); if (!v.quiz) { delete MORE_LESSONS[k]; continue; } if (!v.quiz.l) v.quiz.l = 'gp:' + k; } // sem tema → ganha um para valer bônus
  if (!QUIZ_BANK.includes(v.quiz)) QUIZ_BANK.push(v.quiz);
}
const ALL_LESSONS = Object.assign({}, EV_LESSONS, MORE_LESSONS);
// o que ensina o quê
const SYS_LESSON = { comunicacao: 'radio', suporte: 'oxigenio', propulsao: 'voyager', tanques: 'combVaz', termico: 'termico', casco: 'asteroides', avionica: 'painel', acoplamento: 'traje' };
const CHORE_LESSON = { suporte: 'oxigenio', horta: 'horta', lixo: 'lixo', radio: 'radio', motor: 'voyager', saude: 'doenca', pesquisa: 'webb', rota: 'painel', tanques: 'contaminacao', cardapio: 'horta', dormir: 'doenca' };
// mostra a lição do tema (uma vez por jornada; fora dos desafios, no máximo uma a cada 25 s)
function teach(key, force) {
  if (!S || !ALL_LESSONS[key] || (typeof Net !== 'undefined' && Net.role === 'client')) return;
  if (Save.data.settings.curios === false && !(typeof Net !== 'undefined' && Net.role)) return; // desligadas no solo
  if (S.scene === 'end') return; // jogo acabou: nada novo para contar
  S.lessons = S.lessons || [];
  if (S.lessons.some(x => x.ev === key)) return;
  const now = Date.now(); // relógio de parede: vale na nave, na estação, no planeta e na colônia
  if (!force && S.lessonLast && now - S.lessonLast.at < 25000) return;
  const rec = { ev: key, at: now }; S.lessons.push(rec); S.lessonLast = rec; S.v++;
}

// cartão do computador: só conta a curiosidade (as perguntas ficam no Quiz da tela inicial)
function lessonCard() {
  if (!S || !S.lessonLast || !['ship', 'colony', 'station', 'planet', 'migration', 'detour'].includes(S.scene) || (S.event && S.event.phase !== 'result')) return '';
  if (Save.data.settings.curios === false) return ''; // desligadas nas configurações
  const rec = S.lessonLast; const ls = lessonOf(rec); if (!ls || !ls.fact) return '';
  if (Date.now() - rec.at > 45000 || U.lessonHide === rec.at) return '';
  if (U.lessonMarked !== rec.at) { // primeira vez na tela: marca o tema para o Quiz e o computador fala
    U.lessonMarked = rec.at; learnMark(ls.quiz.l);
    const pre = K('Você sabia? ', 'Did you know? ', '¿Sabías que…? ');
    if (typeof Narrator !== 'undefined') Narrator.say(L(pre) + L(ls.fact));
  }
  return `<div class="lesson-card"><button class="x" data-ui="lessonClose">✕</button><b>💻 ${esc(L('Você sabia?'))}</b><p>${esc(L(ls.fact))}</p></div>`;
}
UIH.lessonClose = () => { if (S && S.lessonLast) U.lessonHide = S.lessonLast.at; };
// o que já foi aprendido nesta jornada (painel do computador e relatório final)
function lessonList() { return ((S && S.lessons) || []).map(lessonOf).filter(Boolean).map(ls => ls.fact); }
const curiosOn = () => !(Save.data.settings && Save.data.settings.curios === false);
function lessonReport() {
  if (!curiosOn()) return '';
  const list = lessonList().concat(END_LESSONS.map(f => f()));
  return `<div class="lesson-report"><h4>💻 ${esc(L('O que você aprendeu nesta jornada'))}</h4>${list.map(t => `<div class="nf"><p>${esc(L(t))}</p></div>`).join('')}</div>`;
}
