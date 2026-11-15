// ============================================================
//  ENGENHARIA DE MASSA E GESTÃO DE ÓRBITA
//  • Montagem: cada módulo, melhoria e reserva tem massa. A massa de decolagem
//    tem um limite (lançador) e a equação do foguete (Tsiolkovsky) mostra o Δv:
//      Δv = Isp · g₀ · ln(m₀ / m_f)
//    Nave mais pesada gasta mais combustível em cruzeiro, órbita e pouso.
//  • Pontes-01b: a nave chega numa órbita alta de captura e o jogador escolhe
//    a altitude (queimas de Hohmann gastam combustível de verdade), evitando o
//    cinturão de radiação e o arrasto da órbita baixa.
// ============================================================
'use strict';

const G0 = 9.80665, ISP = 360;          // s — motor químico
const REF_MASS = 3600, LAUNCH_MAX = 4600; // kg
const MASS_STRUCT = 1500, CREW_KG = 6 * 85; // casco, motores, aviônica, suporte à vida + 6 tripulantes
const ROUTE_DV = { rapida: 650, equilibrada: 450, segura: 380 }; // m/s que a rota pede
// massa seca dos itens (kg)
const MASS_ITEM = {
  estufa: 140, reciclaAgua: 90, biorreator: 110, reciclaLixo: 85, hibernacao: 160, solar: 70, fusao: 260, escudoMag: 120,
  lab: 90, radar: 45, sonda: 70, pouso: 320, mineradora: 130, sementes: 60, enfermaria: 70, bemestar: 35, cupula: 80,
  impressora: 60, drone: 40, ia: 12,
  casco1: 120, casco2: 90, cobertor: 15, pintura: 6, propReforco: 25, motorEf: 30, valvulas: 10, redundante: 15, sensores: 5,
  filtroReserva: 20, antena: 25, trajes: 40,
  baterias: 120, pecas: 40, kitMedico: 25, armazenamento: 8, cisterna: 12, cilindros: 10, tanqueExtra: 18,
};
const massOfItem = id => MASS_ITEM[id] || 0;

function stHas(st, id) { return ['modules', 'upgrades', 'reserves', 'training', 'gadgets', 'pantry', 'skills'].some(l => (st[l] || []).includes(id)); }
// massa e Δv da nave montada (antes e depois de decolar)
function setupMassInfo(st) {
  let dry = MASS_STRUCT + CREW_KG;
  for (const l of ['modules', 'upgrades', 'reserves', 'gadgets']) for (const id of (st[l] || [])) dry += massOfItem(id);
  const curta = S && S.journey === 'curta';
  const days = Math.round((curta ? 12 : 30) * (ROUTES.find(r => r.id === st.route) || ROUTES[1]).days);
  const food = Math.ceil(0.4 * 7 * days * (curta ? 0.93 : 1.08)) + (stHas(st, 'racaoExtra') ? 30 : 0);
  const prop = 500 + (stHas(st, 'tanqueExtra') ? 100 : 0);
  const cons = prop + 600 + (stHas(st, 'cisterna') ? 150 : 0) + 90 + (stHas(st, 'cilindros') ? 20 : 0) + food + 40 + (stHas(st, 'sementesEstoque') ? 10 : 0);
  const total = dry + cons;
  const dv = ISP * G0 * Math.log(total / (total - prop));
  return { dry: Math.round(dry), prop, total: Math.round(total), dv: Math.round(dv), need: ROUTE_DV[st.route] || 450, lim: LAUNCH_MAX };
}
const massErr = st => { const m = setupMassInfo(st); return m.total > m.lim ? m : null; };
// massa atual em voo: a nave fica mais leve conforme gasta combustível, água, ar e comida
function curMass() {
  if (!S || !S.res) return REF_MASS;
  const r = S.res;
  return (S.massDry || 2500) + r.combustivel + r.agua + r.oxigenio + r.comida + r.plantacao;
}
const massFactor = () => clamp(curMass() / REF_MASS, 0.7, 1.5);

// ---------- órbita ----------
const PLANET = { R: 6050, mu: 337500 }; // km, km³/s²: raio 0,95 R⊕ e 0,85 M⊕ → gravidade 0,94 g (coerente com a atmosfera de 0,93 atm)
const FUEL_SCALE = 0.1;                // escala do jogo: o tanque de 500 kg não é o foguete inteiro
const ORBIT_ALTS = [400, 800, 2400];   // km
const BELT = [1000, 1800];             // cinturão de radiação (km)
const inBelt = a => a >= BELT[0] && a <= BELT[1];
const dragKm = a => a < 300 ? 40 : a < 500 ? 6 : a < 700 ? 1 : 0; // km perdidos por dia
function orbitDv(h1, h2) { // m/s, transferência de Hohmann entre órbitas circulares
  const r1 = PLANET.R + h1, r2 = PLANET.R + h2, v1 = Math.sqrt(PLANET.mu / r1), v2 = Math.sqrt(PLANET.mu / r2);
  return (Math.abs(v1 * (Math.sqrt(2 * r2 / (r1 + r2)) - 1)) + Math.abs(v2 * (1 - Math.sqrt(2 * r1 / (r1 + r2))))) * 1000;
}
function deorbitDv(h) { // m/s para baixar o periapsis a 60 km
  const r1 = PLANET.R + h, rp = PLANET.R + 60, v1 = Math.sqrt(PLANET.mu / r1);
  return Math.abs(v1 * (1 - Math.sqrt(2 * rp / (r1 + rp)))) * 1000;
}
const fuelForDv = (dv, m) => m * (1 - Math.exp(-dv / (ISP * G0))) * FUEL_SCALE;
const orbitPeriodMin = h => 2 * Math.PI * Math.sqrt(Math.pow(PLANET.R + h, 3) / PLANET.mu) / 60;
function landingFuel() { // combustível do pouso: nave de pouso/principal + baixar a órbita
  const base = (typeof has === 'function' && has('pouso') ? 40 : 80) * massFactor();
  const alt = S && S.orbit ? S.orbit.alt : 800;
  return Math.ceil(base + fuelForDv(deorbitDv(alt), curMass()));
}

// ---------- ganchos no jogo ----------
(function hooks() {
  const _setup = applySetup;
  applySetup = function () { _setup(); S.massDry = setupMassInfo(S.setup).dry; S.dvShort = setupMassInfo(S.setup).dv < (ROUTE_DV[S.setup.route] || 450); };
  const _launch = UIH.launch;
  UIH.launch = function () {
    const e = massErr(S.setup);
    if (e) { Sfx.bad(); toastLocal(K('Massa de decolagem acima do limite do lançador (' + e.total + ' / ' + e.lim + ' kg): retire algo.', 'Launch mass is above the launcher limit (' + e.total + ' / ' + e.lim + ' kg): remove something.', 'La masa de despegue supera el límite del lanzador (' + e.total + ' / ' + e.lim + ' kg): quite algo.')); return; }
    _launch();
    if (S && S.scene === 'launch') teach('rocketEq', true);
  };
  const _ra = readinessAlerts;
  readinessAlerts = function () {
    const a = _ra(), m = setupMassInfo(S.setup);
    const kk = (pt, en, es) => L(K(pt, en, es));
    if (m.total > m.lim) a.unshift(['bad', kk(`Massa de decolagem ${m.total} kg: acima do limite do lançador (${m.lim} kg). Retire módulos ou reservas.`, `Launch mass ${m.total} kg: above the launcher limit (${m.lim} kg). Remove modules or reserves.`, `Masa de despegue ${m.total} kg: supera el límite del lanzador (${m.lim} kg). Quite módulos o reservas.`)]);
    else if (m.total > m.lim * 0.92) a.push(['warn', kk(`Massa de decolagem ${m.total} kg, quase no limite (${m.lim} kg).`, `Launch mass ${m.total} kg, almost at the limit (${m.lim} kg).`, `Masa de despegue ${m.total} kg, casi en el límite (${m.lim} kg).`)]);
    if (m.dv < m.need) a.push(['bad', kk(`Δv de ${m.dv} m/s, mas esta rota pede ${m.need} m/s: o combustível não basta para a massa da nave (queima ~20% a mais).`, `Δv of ${m.dv} m/s, but this route needs ${m.need} m/s: the propellant is not enough for the ship's mass (burns ~20% more).`, `Δv de ${m.dv} m/s, pero esta ruta pide ${m.need} m/s: el combustible no alcanza para la masa de la nave (gasta ~20 % más).`)]);
    else a.push(['good', kk(`Δv de ${m.dv} m/s para uma rota que pede ${m.need} m/s: combustível suficiente.`, `Δv of ${m.dv} m/s for a route that needs ${m.need} m/s: enough propellant.`, `Δv de ${m.dv} m/s para una ruta que pide ${m.need} m/s: combustible suficiente.`)]);
    return a;
  };
  const _ss = setupScreen;
  setupScreen = function () {
    const h = _ss(); if (!S || !S.setup) return h;
    const m = setupMassInfo(S.setup), pct = Math.min(100, m.total / m.lim * 100), over = m.total > m.lim, short = m.dv < m.need;
    const box = `<div class="massbox"><div>⚖ ${esc(L(K('Massa', 'Mass', 'Masa')))} <b class="${over ? 'red' : ''}">${m.total} / ${m.lim} kg</b></div>
      <div class="massbar"><i style="width:${pct.toFixed(0)}%;background:${over ? '#ff5a5a' : pct > 90 ? '#ffb347' : '#5fd0ff'}"></i></div>
      <div>🚀 Δv <b class="${short ? 'orange' : ''}">${m.dv}</b> m/s <span class="muted">(${esc(L(K('rota pede', 'route needs', 'ruta pide')))} ${m.need})</span></div></div>`;
    return h.replace('<ol class="steps">', box + '<ol class="steps">');
  };
  // combustível de cruzeiro: nave pesada gasta mais; Δv curto gasta ~20% a mais
  const _en = enterPlanet;
  enterPlanet = function () {
    _en();
    if (S && S.scene === 'planet') { S.orbit = { alt: 2400, days: 0, burns: 0, fuelUsed: 0 }; teach('orbit', true); }
  };
  const _pa = ACTIONS.planetAnalyze; ACTIONS.planetAnalyze = function (p, a) { const n = S.planet.analyzed.length; _pa(p, a); if (S.planet.analyzed.length > n) orbitDay(); };
  const _ch = ACTIONS.challenge; ACTIONS.challenge = function (p, a) { const n = S.planet.challenges.length; _ch(p, a); if (S.planet.challenges.length > n) orbitDay(); };
  const _ps = planetScreen;
  planetScreen = function () { const h = _ps(); return S && S.orbit ? h.replace('<!--orbit-->', orbitPanel()) : h; };
  const _ms = migrationScreen;
  migrationScreen = function () {
    const h = _ms(); if (!S || !S.orbit) return h;
    const need = landingFuel();
    const info = `<div class="alert ${S.res.combustivel >= need ? 'info' : 'bad'}">⛽ ${esc(L(K('Pouso a partir da órbita de ' + Math.round(S.orbit.alt) + ' km: ' + need + ' kg de combustível (nave pesada gasta mais; órbita mais baixa gasta menos para descer).', 'Landing from a ' + Math.round(S.orbit.alt) + ' km orbit: ' + need + ' kg of propellant (a heavier ship burns more; a lower orbit costs less to come down from).', 'Aterrizaje desde una órbita de ' + Math.round(S.orbit.alt) + ' km: ' + need + ' kg de combustible (una nave pesada gasta más; una órbita más baja cuesta menos para bajar).')))}</div>`;
    return h.replace('<div class="row"><button class="btn primary big" data-act="land">', info + '<div class="row"><button class="btn primary big" data-act="land">');
  };
})();

function orbitDay() {
  const O = S && S.orbit; if (!O || S.scene === 'end') return;
  O.days++;
  const d = dragKm(O.alt);
  if (d) {
    O.alt -= d;
    if (O.alt < 150) return fail(K('A órbita baixa decaiu por causa do arrasto da atmosfera e a nave não teve combustível para reimpulsionar.', 'The low orbit decayed from atmospheric drag and the ship had no propellant to reboost.', 'La órbita baja decayó por el arrastre de la atmósfera y la nave no tuvo combustible para reimpulsar.'));
    if (O.alt < 500) toast(K('Arrasto da atmosfera: a órbita desceu ' + d + ' km hoje. Reimpulsione!', 'Atmospheric drag: the orbit dropped ' + d + ' km today. Reboost!', 'Arrastre atmosférico: la órbita bajó ' + d + ' km hoy. ¡Reimpulse!'), 'warn');
  }
  if (inBelt(O.alt)) { moral(-2); damageSys('casco', 3); toast(K('Cinturão de radiação: a tripulação e o casco sofrem a cada dia nesta altitude.', 'Radiation belt: the crew and hull suffer every day at this altitude.', 'Cinturón de radiación: la tripulación y el casco sufren cada día a esta altitud.'), 'bad'); teach('belt', true); }
  S.v++;
}
ACTIONS.orbitBurn = p => {
  const O = S.orbit; if (!O || S.scene !== 'planet') return;
  const alt = +p.alt; if (!ORBIT_ALTS.includes(alt) || alt === Math.round(O.alt)) return;
  const dv = orbitDv(O.alt, alt), fuel = fuelForDv(dv, curMass());
  if (S.res.combustivel < fuel + 5) return toast(K('Combustível insuficiente para esta manobra (' + Math.ceil(fuel) + ' kg).', 'Not enough propellant for this maneuver (' + Math.ceil(fuel) + ' kg).', 'Combustible insuficiente para esta maniobra (' + Math.ceil(fuel) + ' kg).'), 'warn');
  addRes('combustivel', -fuel, 'Manobra de órbita');
  O.alt = alt; O.burns++; O.fuelUsed += fuel;
  toast(K('Manobra concluída: órbita de ' + alt + ' km (Δv ' + Math.round(dv) + ' m/s, ' + Math.ceil(fuel) + ' kg de combustível).', 'Maneuver complete: ' + alt + ' km orbit (Δv ' + Math.round(dv) + ' m/s, ' + Math.ceil(fuel) + ' kg of propellant).', 'Maniobra completada: órbita de ' + alt + ' km (Δv ' + Math.round(dv) + ' m/s, ' + Math.ceil(fuel) + ' kg de combustible).'), 'good');
  teach('hohmann', true);
};
ACTIONS.orbitWait = () => { if (S.orbit && S.scene === 'planet') { orbitDay(); } };

function orbitPanel() {
  const O = S.orbit, alt = Math.round(O.alt), m = curMass();
  const R = PLANET.R, scale = 62 / (R + 2800), cxy = 80;
  const rr = h => (R + h) * scale;
  const ang = O.days * 0.9;
  const sx = cxy + rr(alt) * Math.cos(ang), sy = cxy + rr(alt) * Math.sin(ang);
  const svg = `<svg viewBox="0 0 160 160" width="150" height="150" aria-hidden="true">
    <circle cx="${cxy}" cy="${cxy}" r="${rr(BELT[1]).toFixed(1)}" fill="rgba(255,90,90,.18)"/><circle cx="${cxy}" cy="${cxy}" r="${rr(BELT[0]).toFixed(1)}" fill="#0b1226"/>
    <circle cx="${cxy}" cy="${cxy}" r="${(R * scale).toFixed(1)}" fill="#b5654a"/>
    <circle cx="${cxy}" cy="${cxy}" r="${rr(alt).toFixed(1)}" fill="none" stroke="#5fd0ff" stroke-dasharray="3 3"/>
    <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="3.2" fill="#fff"/></svg>`;
  const opts = ORBIT_ALTS.map(a => {
    const same = a === alt, fuel = same ? 0 : fuelForDv(orbitDv(alt, a), m), dv = same ? 0 : orbitDv(alt, a);
    const note = a < 500 ? K('arrasto: perde altitude', 'drag: loses altitude', 'arrastre: pierde altitud') : a > 2000 ? K('mais cara para pousar', 'costlier to land from', 'más cara para aterrizar') : K('análises mais baratas', 'cheaper analyses', 'análisis más baratos');
    return `<button class="opt ${same ? 'on' : ''}" ${same ? 'disabled' : ''} data-act="orbitBurn" data-p='${JSON.stringify({ alt: a })}'><b>${a} km</b><span>${esc(L(note))} · T ${orbitPeriodMin(a).toFixed(0)} min</span><em>${same ? esc(L(K('órbita atual', 'current orbit', 'órbita actual'))) : 'Δv ' + Math.round(dv) + ' m/s · ⛽ ' + Math.ceil(fuel) + ' kg'}</em></button>`;
  }).join('');
  const warn = inBelt(alt) ? `<div class="alert bad">☢ ${esc(L(K('Dentro do cinturão de radiação (1000–1800 km)!', 'Inside the radiation belt (1000–1800 km)!', '¡Dentro del cinturón de radiación (1000–1800 km)!')))}</div>` : dragKm(alt) ? `<div class="alert warn">🌬 ${esc(L(K('Órbita baixa: a atmosfera freia a nave ' + dragKm(alt) + ' km por dia.', 'Low orbit: the atmosphere slows the ship ' + dragKm(alt) + ' km per day.', 'Órbita baja: la atmósfera frena la nave ' + dragKm(alt) + ' km por día.')))}</div>` : '';
  return `<h4>🛰 ${esc(L(K('Gestão de órbita', 'Orbit management', 'Gestión de órbita')))}</h4>
    <div class="orbitbox">${svg}<div class="orbitinfo">
      <div>${esc(L(K('Altitude', 'Altitude', 'Altitud')))}: <b>${alt} km</b> · ${esc(L(K('período', 'period', 'período')))} ${orbitPeriodMin(alt).toFixed(0)} min · ${esc(L(K('velocidade', 'speed', 'velocidad')))} ${Math.sqrt(PLANET.mu / (R + alt)).toFixed(2)} km/s</div>
      <div>⚖ ${esc(L(K('Massa atual', 'Current mass', 'Masa actual')))}: <b>${Math.round(m)} kg</b> · ⛽ ${Math.round(S.res.combustivel)} kg · ${esc(L(K('pouso daqui', 'landing from here', 'aterrizaje desde aquí')))}: ${landingFuel()} kg</div>
      <div class="small muted">${esc(L(K('Cada análise, desafio ou dia de espera passa 1 dia em órbita. Manobras gastam combustível (equação do foguete).', 'Each analysis, challenge or waiting day spends 1 day in orbit. Maneuvers burn propellant (rocket equation).', 'Cada análisis, desafío o día de espera pasa 1 día en órbita. Las maniobras gastan combustible (ecuación del cohete).')))}</div>
    </div></div>${warn}<div class="opts">${opts}</div>
    <div class="row"><button class="btn primary" data-act="landNow">🛬 ${esc(L(K('Descer para a colônia agora', 'Land at the colony now', 'Descender a la colonia ahora')))}</button> <button class="btn small" data-act="orbitWait">⏳ ${esc(L(K('Esperar 1 dia em órbita', 'Wait 1 day in orbit', 'Esperar 1 día en órbita')))}</button></div>`;
}

// ---------- lições e perguntas do Quiz ----------
(function lessons() {
  const add = (key, fact, quiz) => { quiz.l = quiz.l || 'gp:' + key; quiz.cat = quiz.cat || 'mass'; QUIZ_BANK.push(quiz); ALL_LESSONS[key] = { fact, quiz }; };
  add('rocketEq', K('Cada quilo a mais na nave exige combustível extra — e esse combustível também pesa. É a equação do foguete.', 'Every extra kilo on the ship needs extra propellant — and that propellant weighs too. That is the rocket equation.', 'Cada kilo extra en la nave necesita combustible extra — y ese combustible también pesa. Es la ecuación del cohete.'),
    Q('', '', ['Por que cada quilo a mais na nave exige mais combustível do que 1 kg?', 'Why does each extra kilo on a ship need more than 1 kg of propellant?', '¿Por qué cada kilo extra en la nave necesita más de 1 kg de combustible?'],
      [['Porque o combustível extra também precisa ser acelerado (equação do foguete)', 'Because the extra propellant also has to be accelerated (rocket equation)', 'Porque el combustible extra también debe acelerarse (ecuación del cohete)'], ['Porque o espaço tem atrito', 'Because space has friction', 'Porque el espacio tiene fricción'], ['Porque a gravidade some', 'Because gravity disappears', 'Porque la gravedad desaparece'], ['Não exige: é 1 para 1', 'It does not: it is 1 to 1', 'No lo necesita: es 1 a 1']], 0,
      ['O Δv cresce com o logaritmo da razão de massas: dobrar a carga exige bem mais que o dobro de propelente.', 'Δv grows with the logarithm of the mass ratio: doubling the payload needs far more than double the propellant.', 'El Δv crece con el logaritmo de la razón de masas: duplicar la carga exige mucho más del doble de propelente.']));
  QUIZ_BANK.push(Qc('mass', 'Tsiolkovsky', ['A equação de Tsiolkovsky relaciona o Δv da nave com…', 'The Tsiolkovsky equation relates a ship\'s Δv to…', 'La ecuación de Tsiolkovsky relaciona el Δv de la nave con…'],
    [['A velocidade de exaustão e a razão entre massa inicial e final', 'The exhaust velocity and the ratio of initial to final mass', 'La velocidad de escape y la razón entre masa inicial y final'], ['A cor do motor', 'The color of the engine', 'El color del motor'], ['O número de tripulantes', 'The number of crew', 'El número de tripulantes'], ['A distância até a Terra', 'The distance to Earth', 'La distancia a la Tierra']], 0,
    ['Δv = Isp·g₀·ln(m₀/m_f). Por isso naves leves e motores eficientes (Isp alto) vão mais longe.', 'Δv = Isp·g₀·ln(m₀/m_f). That is why light ships and efficient engines (high Isp) go farther.', 'Δv = Isp·g₀·ln(m₀/m_f). Por eso las naves ligeras y los motores eficientes (Isp alto) llegan más lejos.']));
  QUIZ_BANK.push(Qc('mass', 'Rocket propulsion', ['O que mede o impulso específico (Isp) de um motor?', 'What does a rocket engine\'s specific impulse (Isp) measure?', '¿Qué mide el impulso específico (Isp) de un motor?'],
    [['A eficiência: quanto empurrão cada kg de propelente dá', 'Efficiency: how much push each kg of propellant gives', 'La eficiencia: cuánto empuje da cada kg de propelente'], ['O peso do motor', 'The weight of the engine', 'El peso del motor'], ['A temperatura da chama', 'The flame temperature', 'La temperatura de la llama'], ['O barulho', 'The noise', 'El ruido']], 0,
    ['Medido em segundos: motores iônicos têm Isp muito maior que os químicos, mas empurram bem de leve.', 'Measured in seconds: ion engines have much higher Isp than chemical ones, but push very gently.', 'Se mide en segundos: los motores iónicos tienen Isp mucho mayor que los químicos, pero empujan muy suave.']));
  QUIZ_BANK.push(Qc('mass', 'Spaceflight engineering', ['Por que engenheiros guardam uma "margem de massa" ao projetar uma nave?', 'Why do engineers keep a "mass margin" when designing a spacecraft?', '¿Por qué los ingenieros guardan un "margen de masa" al diseñar una nave?'],
    [['Porque a nave quase sempre engorda durante o desenvolvimento', 'Because the ship almost always gets heavier during development', 'Porque la nave casi siempre engorda durante el desarrollo'], ['Para enfeitar o relatório', 'To decorate the report', 'Para adornar el informe'], ['Porque a massa diminui no espaço', 'Because mass shrinks in space', 'Porque la masa disminuye en el espacio'], ['Porque o foguete não aceita peso', 'Because the rocket accepts no weight', 'Porque el cohete no acepta peso']], 0,
    ['Cada peça nova, cabo ou reforço soma quilos — e cada quilo pede combustível. Sem margem, o projeto estoura o limite do lançador.', 'Each new part, cable or reinforcement adds kilos — and each kilo needs propellant. Without margin, the design busts the launcher limit.', 'Cada pieza, cable o refuerzo suma kilos — y cada kilo pide combustible. Sin margen, el diseño revienta el límite del lanzador.']));
  add('orbit', K('Quanto mais baixa a órbita, mais rápido a nave anda: na Estação Espacial, 28.000 km/h.', 'The lower the orbit, the faster the ship moves: on the Space Station, 28,000 km/h.', 'Cuanto más baja la órbita, más rápido va la nave: en la Estación Espacial, 28.000 km/h.'),
    Qc('orbit', '', ['Numa órbita circular, uma nave mais baixa anda…', 'In a circular orbit, a lower ship moves…', 'En una órbita circular, una nave más baja se mueve…'],
      [['Mais rápido e dá a volta em menos tempo', 'Faster and goes around in less time', 'Más rápido y da la vuelta en menos tiempo'], ['Mais devagar', 'Slower', 'Más despacio'], ['Na mesma velocidade de qualquer altitude', 'At the same speed at any altitude', 'A la misma velocidad a cualquier altitud'], ['Parada', 'Stopped', 'Parada']], 0,
      ['v = √(μ/r): perto do planeta a gravidade é mais forte e é preciso ir mais rápido para não cair.', 'v = √(μ/r): near the planet gravity is stronger, so you must go faster to not fall.', 'v = √(μ/r): cerca del planeta la gravedad es más fuerte y hay que ir más rápido para no caer.']));
  add('hohmann', K('Para subir ou descer de órbita gastando pouco, a nave faz duas queimas: a transferência de Hohmann.', 'To go up or down an orbit cheaply, a ship does two burns: the Hohmann transfer.', 'Para subir o bajar de órbita gastando poco, la nave hace dos quemas: la transferencia de Hohmann.'),
    Qc('orbit', '', ['Qual é a forma econômica de passar de uma órbita circular para outra?', 'What is the economical way to move from one circular orbit to another?', '¿Cuál es la forma económica de pasar de una órbita circular a otra?'],
      [['Transferência de Hohmann (duas queimas)', 'Hohmann transfer (two burns)', 'Transferencia de Hohmann (dos quemas)'], ['Ligar o motor o tempo todo', 'Keeping the engine on all the time', 'Dejar el motor siempre encendido'], ['Frear contra o vácuo', 'Braking against the vacuum', 'Frenar contra el vacío'], ['Esperar o planeta empurrar', 'Waiting for the planet to push', 'Esperar a que el planeta empuje']], 0,
      ['Uma queima leva a nave à elipse de transferência e a segunda circulariza na nova altitude.', 'One burn puts the ship on the transfer ellipse and the second circularizes at the new altitude.', 'Una quema lleva la nave a la elipse de transferencia y la segunda circulariza en la nueva altitud.']));
  add('belt', K('Os cinturões de Van Allen são regiões com partículas presas pelo campo magnético da Terra; satélites evitam ficar nelas.', 'The Van Allen belts are regions of particles trapped by Earth\'s magnetic field; satellites avoid staying in them.', 'Los cinturones de Van Allen son regiones con partículas atrapadas por el campo magnético de la Tierra; los satélites evitan quedarse en ellos.'),
    Qc('orbit', '', ['O que são os cinturões de Van Allen?', 'What are the Van Allen belts?', '¿Qué son los cinturones de Van Allen?'],
      [['Regiões com partículas carregadas presas pelo campo magnético da Terra', 'Regions of charged particles trapped by Earth\'s magnetic field', 'Regiones con partículas cargadas atrapadas por el campo magnético de la Tierra'], ['Anéis de gelo da Terra', 'Rings of ice around Earth', 'Anillos de hielo de la Tierra'], ['Cinturões de asteroides', 'Asteroid belts', 'Cinturones de asteroides'], ['Nuvens de poeira lunar', 'Clouds of lunar dust', 'Nubes de polvo lunar']], 0,
      ['Descobertos em 1958 com os dados do Explorer 1. A radiação ali pode danificar eletrônicos e tripulantes.', 'Discovered in 1958 with data from Explorer 1. The radiation there can damage electronics and crew.', 'Descubiertos en 1958 con datos del Explorer 1. La radiación allí puede dañar la electrónica y a la tripulación.']));
  QUIZ_BANK.push(Qc('orbit', 'ISS Facts', ['Por que a Estação Espacial precisa de reimpulsos de tempos em tempos?', 'Why does the Space Station need reboosts from time to time?', '¿Por qué la Estación Espacial necesita reimpulsos de vez en cuando?'],
    [['A atmosfera rarefeita a 400 km freia a estação e ela perde altitude', 'The thin atmosphere at 400 km slows the station and it loses altitude', 'La atmósfera tenue a 400 km frena la estación y pierde altitud'], ['Porque a Lua puxa a estação', 'Because the Moon pulls it', 'Porque la Luna la jala'], ['Para trocar a tripulação', 'To swap the crew', 'Para cambiar la tripulación'], ['Não precisa de reimpulso', 'It does not need reboosts', 'No necesita reimpulsos']], 0,
    ['Por isso naves de carga e a própria estação usam seus propulsores para subir de novo.', 'That is why cargo ships and the station itself use their thrusters to climb again.', 'Por eso las naves de carga y la propia estación usan sus propulsores para subir otra vez.']));
  QUIZ_BANK.push(Qc('orbit', 'Satellite orbits', ['A que altitude fica uma órbita geoestacionária, que acompanha a rotação da Terra?', 'At what altitude is a geostationary orbit, which follows Earth\'s rotation?', '¿A qué altitud está una órbita geoestacionaria, que acompaña la rotación de la Tierra?'],
    [['Cerca de 35.786 km', 'About 35,786 km', 'Cerca de 35.786 km'], ['Cerca de 400 km', 'About 400 km', 'Cerca de 400 km'], ['Cerca de 3.000 km', 'About 3,000 km', 'Cerca de 3.000 km'], ['Cerca de 384.000 km', 'About 384,000 km', 'Cerca de 384.000 km']], 0,
    ['Lá o período é de 24 h: o satélite parece parado no céu, ótimo para comunicação e meteorologia.', 'There the period is 24 h: the satellite seems fixed in the sky, great for communications and weather.', 'Allí el período es de 24 h: el satélite parece quieto en el cielo, ideal para comunicación y meteorología.']));
})();
