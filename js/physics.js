// ============================================================
//  FÍSICA E REALISMO — radiação acumulada com consequências e as
//  lições do computador de bordo sobre gravidade, atmosfera,
//  radiação, consumo de recursos e trajetórias.
// ============================================================
'use strict';

// ---------- radiação: cada tripulante acumula dose (mSv) ----------
// Fora da Terra, ~1,8 mSv por dia (na Terra, ~3 mSv por ANO). Tempestades
// solares fora do abrigo e o cinturão de radiação somam muito mais.
const RAD = { day: 1.8, storm: 120, shelter: 10, belt: 40, mild: 100, high: 250 };
function radShield() { let r = 1; if (has('escudoMag')) r *= 0.5; if (has('casco2')) r *= 0.8; return r; }
function addDose(c, mSv) { if (!c || !c.alive) return; c.rad = (c.rad || 0) + mSv * radShield(); radCheck(c); }
function radCheck(c) {
  c.radLv = c.radLv || 0;
  if (c.rad >= RAD.mild && c.radLv < 1) { c.radLv = 1; toast(`☢ ${c.name}: ${Math.round(c.rad)} mSv de radiação acumulada. Cansaço e enjoo.`, 'warn'); teach('radiacao', true); }
  if (c.rad >= RAD.high && c.radLv < 2) { c.radLv = 2; toast(`☢ ${c.name}: dose alta de radiação (${Math.round(c.rad)} mSv). Risco de adoecer.`, 'bad'); }
}
const avgDose = () => { const a = (S && S.crew || []).filter(c => c.alive); return a.length ? a.reduce((s, c) => s + (c.rad || 0), 0) / a.length : 0; };
{
  // dose diária no espaço
  const _sim = simulate;
  simulate = function (dt) { _sim(dt); if (!S || S.scene !== 'ship') return; const f = dt / S.dayLen; for (const c of alive()) addDose(c, RAD.day * f); };
  // consequências da exposição prolongada, uma vez por dia
  const _nd = newDay;
  newDay = function () {
    _nd();
    if (!S) return;
    for (const c of alive()) {
      if ((c.rad || 0) >= RAD.mild) c.humor = clamp(c.humor - 3, 0, 100); // cansaço da radiação
      if ((c.rad || 0) >= RAD.high && c.status === 'ok' && Math.random() < 0.12) { c.status = 'ferido'; c.statusT = 20; toast(`☢ ${c.name} está com enjoo de radiação.`, 'bad'); }
    }
    if (S.day === 2 && S.scene === 'ship') teach('consumo', true); // depois do 1º dia: quanto cada um consome
  };
  // tempestade solar: quem está fora do abrigo leva uma dose alta
  const _st = EV.tempestade.tick;
  EV.tempestade.tick = function (ev, dt) {
    const before = ev.data.storm; _st.call(this, ev, dt);
    if (!before && ev.data.storm) {
      const room = ROOMS.find(r => r.id === 'dormitorio');
      for (const c of alive().filter(x => !x.eva)) { const inside = c.deck === 'L' && c.x >= room.x0 && c.x <= room.x1; addDose(c, inside ? RAD.shelter : RAD.storm); }
    }
  };
  // cinturão de radiação na órbita de Pontes-01b
  if (typeof orbitDay === 'function') {
    const _od = orbitDay;
    orbitDay = function () { _od(); if (S && S.orbit && typeof inBelt === 'function' && inBelt(S.orbit.alt)) for (const c of alive()) addDose(c, RAD.belt); };
  }
}

// ---------- lições de física (o computador conta; as perguntas vão para o Quiz) ----------
const PHYS_LESSONS = {
  gravidade: { fact: K('Pontes-01b tem 0,94 g: a gravidade de um planeta depende da sua massa e do seu raio.', 'Pontes-01b has 0.94 g: a planet\'s gravity depends on its mass and radius.', 'Pontes-01b tiene 0,94 g: la gravedad de un planeta depende de su masa y su radio.'),
    quiz: Q('gp:gravidade', '', ['Do que depende a gravidade na superfície de um planeta?', 'What does the surface gravity of a planet depend on?', '¿De qué depende la gravedad en la superficie de un planeta?'],
      [['Da massa e do raio do planeta', 'The planet\'s mass and radius', 'De la masa y el radio del planeta'], ['Da cor do planeta', 'The planet\'s color', 'Del color del planeta'], ['Do número de luas', 'The number of moons', 'Del número de lunas'], ['Da distância até a estrela', 'The distance to its star', 'De la distancia a su estrella']], 0,
      ['Mais massa puxa mais; um raio maior deixa a superfície mais longe do centro e puxa menos.', 'More mass pulls harder; a bigger radius puts the surface farther from the center, so it pulls less.', 'Más masa atrae más; un radio mayor aleja la superficie del centro y atrae menos.']) },
  atmosfera: { fact: K('O ar de Pontes-01b tem 0,93 atm de pressão, 19% de oxigênio e 19 °C no vale: dá para respirar depois de se acostumar.', 'Pontes-01b\'s air has 0.93 atm of pressure, 19% oxygen and 19 °C in the valley: breathable after getting used to it.', 'El aire de Pontes-01b tiene 0,93 atm de presión, 19 % de oxígeno y 19 °C en el valle: se puede respirar tras acostumbrarse.'),
    quiz: Q('gp:atmosfera', '', ['Para respirar sem traje, o que uma atmosfera precisa ter?', 'To breathe without a suit, what does an atmosphere need?', 'Para respirar sin traje, ¿qué necesita una atmósfera?'],
      [['Pressão e oxigênio suficientes, e temperatura suportável', 'Enough pressure and oxygen, and a bearable temperature', 'Presión y oxígeno suficientes, y temperatura soportable'], ['Só ser azul', 'Just being blue', 'Solo ser azul'], ['Muito dióxido de carbono', 'Lots of carbon dioxide', 'Mucho dióxido de carbono'], ['Nenhum gás', 'No gas at all', 'Ningún gas']], 0,
      ['Marte tem só 0,006 atm e quase nada de oxigênio: lá é preciso traje o tempo todo.', 'Mars has only 0.006 atm and almost no oxygen: a suit is needed all the time there.', 'Marte tiene solo 0,006 atm y casi nada de oxígeno: allí hace falta traje todo el tiempo.']) },
  radiacao: { fact: K('Fora da Terra, um astronauta recebe cerca de 1,8 mSv de radiação por dia, quase o que recebemos em meio ano aqui.', 'Outside Earth, an astronaut gets about 1.8 mSv of radiation a day, almost what we get in half a year here.', 'Fuera de la Tierra, un astronauta recibe cerca de 1,8 mSv de radiación al día, casi lo que recibimos en medio año aquí.'),
    quiz: Q('gp:radiacao', '', ['Quanto de radiação um astronauta recebe por dia no espaço profundo, aproximadamente?', 'About how much radiation does an astronaut get per day in deep space?', '¿Cuánta radiación recibe un astronauta por día en el espacio profundo, aproximadamente?'],
      [['Cerca de 1,8 mSv', 'About 1.8 mSv', 'Cerca de 1,8 mSv'], ['Cerca de 0,001 mSv', 'About 0.001 mSv', 'Cerca de 0,001 mSv'], ['Cerca de 500 mSv', 'About 500 mSv', 'Cerca de 500 mSv'], ['Nenhuma', 'None', 'Ninguna']], 0,
      ['Sem o campo magnético e a atmosfera da Terra, a dose se acumula: por isso naves têm abrigos e blindagem.', 'Without Earth\'s magnetic field and atmosphere the dose adds up: that is why ships have shelters and shielding.', 'Sin el campo magnético y la atmósfera de la Tierra la dosis se acumula: por eso las naves tienen refugios y blindaje.']) },
  consumo: { fact: K('Cada pessoa a bordo usa por dia cerca de 0,84 kg de oxigênio, 3 litros de água e 0,6 kg de comida.', 'Each person on board uses about 0.84 kg of oxygen, 3 liters of water and 0.6 kg of food a day.', 'Cada persona a bordo usa al día cerca de 0,84 kg de oxígeno, 3 litros de agua y 0,6 kg de comida.'),
    quiz: Q('gp:consumo', '', ['Quanto oxigênio uma pessoa respira por dia, aproximadamente?', 'About how much oxygen does a person breathe per day?', '¿Cuánto oxígeno respira una persona por día, aproximadamente?'],
      [['Cerca de 0,84 kg', 'About 0.84 kg', 'Cerca de 0,84 kg'], ['Cerca de 10 kg', 'About 10 kg', 'Cerca de 10 kg'], ['Cerca de 10 g', 'About 10 g', 'Cerca de 10 g'], ['Cerca de 100 kg', 'About 100 kg', 'Cerca de 100 kg']], 0,
      ['Multiplique pelo número de pessoas e pelos dias de viagem: é assim que se planeja o estoque de uma missão.', 'Multiply by the number of people and the days of travel: that is how a mission\'s supplies are planned.', 'Multiplique por el número de personas y los días de viaje: así se planifican los suministros de una misión.']) },
  rotas: { fact: K('Chegar mais rápido exige acelerar mais, e o combustível necessário cresce muito mais rápido que a velocidade: é a equação do foguete.', 'Getting there faster means accelerating more, and the fuel needed grows much faster than the speed: that is the rocket equation.', 'Llegar más rápido exige acelerar más, y el combustible necesario crece mucho más rápido que la velocidad: es la ecuación del cohete.'),
    quiz: Q('gp:rotas', '', ['Por que uma rota mais rápida gasta mais combustível?', 'Why does a faster route burn more fuel?', '¿Por qué una ruta más rápida gasta más combustible?'],
      [['Porque acelerar mais exige muito mais combustível (equação do foguete)', 'Because accelerating more takes much more fuel (rocket equation)', 'Porque acelerar más exige mucho más combustible (ecuación del cohete)'], ['Porque o espaço tem atrito', 'Because space has friction', 'Porque el espacio tiene fricción'], ['Porque o motor esquenta', 'Because the engine heats up', 'Porque el motor se calienta'], ['Não gasta mais', 'It does not burn more', 'No gasta más']], 0,
      ['No vácuo não há atrito: o combustível vai todo para mudar a velocidade, e cada aumento custa cada vez mais.', 'There is no friction in a vacuum: all the fuel goes into changing speed, and each increase costs more and more.', 'En el vacío no hay fricción: todo el combustible sirve para cambiar la velocidad, y cada aumento cuesta cada vez más.']) },
};
for (const [k, v] of Object.entries(PHYS_LESSONS)) { ALL_LESSONS[k] = v; if (!QUIZ_BANK.includes(v.quiz)) QUIZ_BANK.push(v.quiz); }
{
  // gatilhos: chegada ao planeta, análises, escolha da rota
  const _ep = enterPlanet; enterPlanet = function () { _ep(); teach('gravidade', true); };
  const _pa = ACTIONS.planetAnalyze;
  ACTIONS.planetAnalyze = function (p, a) { const n = S.planet.analyzed.length; _pa(p, a); if (S.planet.analyzed.length > n) { if (p.id === 'atmosfera') teach('atmosfera', true); if (p.id === 'radiacao') teach('radiacao', true); } };
}
