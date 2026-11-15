// ============================================================
//  PROJETO DA MISSÃO — objetivo e requisitos, instrumentos
//  científicos, veículo de lançamento, órbita de chegada e o painel
//  de restrições (orçamento, massa, energia, comunicação, dados e
//  vida útil). Cada escolha mexe nas outras partes da missão.
// ============================================================
'use strict';

const kk = (pt, en, es) => L(K(pt, en, es));
// ---------- catálogos ----------
const OBJECTIVES = [
  { id: 'colonia', icon: '🏗', name: K('Fundar a colônia', 'Found the colony', 'Fundar la colonia'), desc: K('Pousar em segurança e erguer a base em Pontes-01b.', 'Land safely and build the base on Pontes-01b.', 'Aterrizar con seguridad y levantar la base en Pontes-01b.') },
  { id: 'ciencia', icon: '🔬', name: K('Missão científica', 'Science mission', 'Misión científica'), desc: K('Coletar e enviar à Terra o máximo de dados no caminho.', 'Collect and send Earth as much data as possible on the way.', 'Recolectar y enviar a la Tierra el máximo de datos en el camino.') },
  { id: 'reconhecimento', icon: '🛰', name: K('Reconhecimento', 'Reconnaissance', 'Reconocimiento'), desc: K('Estudar os exoplanetas da estação e todo o planeta antes de pousar.', 'Study the station\'s exoplanets and the whole planet before landing.', 'Estudiar los exoplanetas de la estación y todo el planeta antes de aterrizar.') },
];
// instrumentos: pts de verba, massa (kg), energia (kWh/dia) e dados (GB/dia)
const INSTRUMENTS = [
  { id: 'espectrometro', name: K('Espectrômetro', 'Spectrometer', 'Espectrómetro'), pts: 2, kg: 25, kwh: 0.5, gb: 2, desc: K('Lê a composição do ar e da luz: análises custam metade dos dados.', 'Reads the makeup of air and light: analyses cost half the data.', 'Lee la composición del aire y de la luz: los análisis cuestan la mitad de datos.') },
  { id: 'telescopio', name: K('Telescópio infravermelho', 'Infrared telescope', 'Telescopio infrarrojo'), pts: 3, kg: 60, kwh: 1, gb: 6, desc: K('Observa o céu o tempo todo: gera muitos dados.', 'Watches the sky all the time: produces lots of data.', 'Observa el cielo todo el tiempo: genera muchos datos.') },
  { id: 'detectorRad', name: K('Detector de radiação', 'Radiation detector', 'Detector de radiación'), pts: 1, kg: 10, kwh: 0.2, gb: 1, desc: K('Avisa antes das tempestades: a tripulação recebe 25% menos radiação.', 'Warns before storms: the crew gets 25% less radiation.', 'Avisa antes de las tormentas: la tripulación recibe un 25 % menos de radiación.') },
  { id: 'camera', name: K('Câmera de mapeamento', 'Mapping camera', 'Cámara de mapeo'), pts: 2, kg: 30, kwh: 0.5, gb: 3, desc: K('Mapeia o local de pouso: o pouso gasta 10 kg a menos de combustível.', 'Maps the landing site: landing uses 10 kg less propellant.', 'Mapea el lugar de aterrizaje: el aterrizaje gasta 10 kg menos de combustible.') },
];
const MAX_INSTR = 3;
// veículos de lançamento: quanto mais forte, mais massa leva e mais caro
const LAUNCHERS = [
  { id: 'leve', name: K('Foguete leve', 'Light rocket', 'Cohete ligero'), pts: 0, lim: 4000, desc: K('Barato, mas leva pouca massa.', 'Cheap, but carries little mass.', 'Barato, pero lleva poca masa.') },
  { id: 'medio', name: K('Foguete médio', 'Medium rocket', 'Cohete mediano'), pts: 1, lim: 4600, desc: K('Equilíbrio entre custo e carga.', 'Balance between cost and payload.', 'Equilibrio entre costo y carga.') },
  { id: 'pesado', name: K('Foguete pesado', 'Heavy rocket', 'Cohete pesado'), pts: 4, lim: 5600, desc: K('Leva muito mais, mas custa caro.', 'Carries much more, but costs a lot.', 'Lleva mucho más, pero cuesta caro.') },
];
// órbita de chegada em Pontes-01b
const ARRIVAL_ORBITS = [
  { alt: 400, name: K('Baixa (400 km)', 'Low (400 km)', 'Baja (400 km)'), desc: K('Pouso barato, mas o arrasto do ar puxa a nave para baixo.', 'Cheap landing, but air drag pulls the ship down.', 'Aterrizaje barato, pero el arrastre del aire tira de la nave.') },
  { alt: 800, name: K('Média (800 km)', 'Medium (800 km)', 'Media (800 km)'), desc: K('Equilíbrio: sem arrasto e fora do cinturão de radiação.', 'Balanced: no drag and outside the radiation belt.', 'Equilibrio: sin arrastre y fuera del cinturón de radiación.') },
  { alt: 2400, name: K('Alta (2400 km)', 'High (2400 km)', 'Alta (2400 km)'), desc: K('Entrar é barato, mas descer dali gasta mais combustível.', 'Cheap to enter, but coming down from there burns more propellant.', 'Entrar es barato, pero bajar de allí gasta más combustible.') },
];
const DOWNLINK = { base: 10, antena: 10 }; // GB por dia enviados à Terra
// a antena de alto ganho passa a ser vendida na aba Suprimentos (comunicação é uma restrição da missão)
if (!ESSENTIALS.some(e => e[1] === 'antena')) ESSENTIALS.push(['upgrades', 'antena']);

// ---------- escolhas guardadas na montagem ----------
const sd = st => { st = st || (S && S.setup) || {}; if (!st.objective) st.objective = 'colonia'; if (!st.instruments) st.instruments = []; if (!st.launcher) st.launcher = 'medio'; if (!st.orbitAlt) st.orbitAlt = 800; return st; };
const launcherOf = st => LAUNCHERS.find(l => l.id === sd(st).launcher) || LAUNCHERS[1];
{
  const _b = blankSetup; blankSetup = function () { return sd(_b()); };
  const _c = setupCost;
  setupCost = function (st) { sd(st); return _c(st) + st.instruments.reduce((s, id) => s + (INSTRUMENTS.find(i => i.id === id) || { pts: 0 }).pts, 0) + launcherOf(st).pts; };
  // instrumentos contam como itens da nave para has()
  const _h = has; has = function (id) { return _h(id) || !!(S && S.setup && (S.setup.instruments || []).includes(id)); };
  // massa: instrumentos pesam; o limite é o do foguete escolhido
  const _m = setupMassInfo;
  setupMassInfo = function (st) {
    const m = _m(st); sd(st);
    const add = st.instruments.reduce((s, id) => s + (INSTRUMENTS.find(i => i.id === id) || { kg: 0 }).kg, 0);
    m.dry += add; m.total += add; m.dv = Math.round(ISP * G0 * Math.log(m.total / (m.total - m.prop))); m.lim = launcherOf(st).lim;
    return m;
  };
}

// ---------- números das restrições (calculados da montagem) ----------
function designNumbers(st) {
  st = sd(st); const h = id => stHas(st, id) || st.instruments.includes(id);
  const ins = st.instruments.map(id => INSTRUMENTS.find(i => i.id === id)).filter(Boolean);
  const gen = 18 + (h('solar') ? 8 : 0) + (h('fusao') ? 20 : 0);
  const use = 4 + 6 + 3 + (h('biorreator') ? 2 : 0) + (h('escudoMag') ? 3 : 0) + (h('lab') ? 1 : 0) + (h('estufa') ? 1 : 0) + ins.reduce((s, i) => s + i.kwh, 0);
  const dataDay = (h('lab') ? 6 : 3) + ins.reduce((s, i) => s + i.gb, 0);
  const down = DOWNLINK.base + (h('antena') ? DOWNLINK.antena : 0);
  const store = 400 + (h('armazenamento') ? 100 : 0);
  const days = Math.round((S && S.journey === 'curta' ? 12 : 30) * (ROUTES.find(r => r.id === st.route) || ROUTES[1]).days);
  const food = Math.ceil(0.4 * 7 * days * (S && S.journey === 'curta' ? 0.93 : 1.08)) + (h('racaoExtra') ? 30 : 0);
  const life = Math.floor(food / (0.4 * 7)) + (h('estufa') || h('biorreator') ? 6 : 0);
  return { gen, use, net: gen - use, dataDay, down, store, fill: dataDay > down ? Math.round(store / (dataDay - down)) : null, days, life };
}
// requisitos que nascem do objetivo escolhido
function missionRequirements(st) {
  st = sd(st); const h = id => stHas(st, id) || st.instruments.includes(id); const m = setupMassInfo(st), n = designNumbers(st);
  const base = [
    [kk('Combustível para a rota (Δv)', 'Propellant for the route (Δv)', 'Combustible para la ruta (Δv)'), m.dv >= m.need],
    [kk('Massa dentro do limite do foguete', 'Mass within the rocket limit', 'Masa dentro del límite del cohete'), m.total <= m.lim],
    [kk('Energia: gerar mais do que gasta', 'Power: generate more than you use', 'Energía: generar más de lo que gasta'), n.net >= 0],
  ];
  const by = {
    colonia: [[kk('Sonda ou nave de pouso para descer com segurança', 'Probe or lander to go down safely', 'Sonda o nave de aterrizaje para bajar seguro'), h('sonda') || h('pouso')], [kk('Estufa ou sementes para comer no planeta', 'Greenhouse or seeds to eat on the planet', 'Invernadero o semillas para comer en el planeta'), h('estufa') || h('sementes') || h('sementesEstoque')]],
    ciencia: [[kk('Pelo menos 2 instrumentos científicos', 'At least 2 science instruments', 'Al menos 2 instrumentos científicos'), st.instruments.length >= 2], [kk('Enviar à Terra tudo o que coleta (antena)', 'Send Earth everything you collect (antenna)', 'Enviar a la Tierra todo lo que recoge (antena)'), n.dataDay <= n.down]],
    reconhecimento: [[kk('Telescópio ou espectrômetro', 'Telescope or spectrometer', 'Telescopio o espectrómetro'), h('telescopio') || h('espectrometro')], [kk('Sonda de reconhecimento', 'Reconnaissance probe', 'Sonda de reconocimiento'), h('sonda')]],
  };
  return base.concat(by[st.objective] || []);
}

// ---------- montagem recomendada: um clique monta uma nave equilibrada ----------
UIH.setupRecommend = () => {
  const st = S.setup; ['modules', 'upgrades', 'reserves', 'pantry', 'skills', 'training', 'gadgets'].forEach(l => { st[l] = []; }); sd(st).instruments = [];
  st.objective = 'colonia'; st.route = 'equilibrada'; st.launcher = 'medio'; st.orbitAlt = 800;
  const want = [['modules', 'estufa'], ['modules', 'sonda'], ['modules', 'reciclaAgua'], ['modules', 'enfermaria'], ['upgrades', 'filtroReserva'], ['pantry', 'racaoExtra'], ['modules', 'solar']];
  const cats = { modules: MODULES, upgrades: UPGRADES, pantry: PANTRY, reserves: RESERVES };
  for (const [l, id] of want) {
    const it = (cats[l] || []).find(x => x.id === id); if (!it) continue;
    st[l].push(id);
    const m = setupMassInfo(st);
    if (setupCost(st) > setupBudget() - 6 || (l === 'modules' && setupSlots(st) > SLOTS) || m.total > m.lim || m.dv < m.need) st[l].pop(); // guarda ~6 pts de reserva
  }
  U.setupDirty = true; Sfx.ok && Sfx.ok();
};

// ---------- telas da montagem ----------
UIH.setObjective = id => { sd(S.setup).objective = id; U.setupDirty = true; };
UIH.setLauncher = id => { const st = sd(S.setup); const old = st.launcher; st.launcher = id; if (setupCost(st) > setupBudget()) { st.launcher = old; Sfx.bad(); } U.setupDirty = true; };
UIH.setArrival = a => { sd(S.setup).orbitAlt = +a; U.setupDirty = true; };
UIH.setInstr = id => {
  const st = sd(S.setup); const i = st.instruments.indexOf(id);
  if (i >= 0) st.instruments.splice(i, 1);
  else { const it = INSTRUMENTS.find(x => x.id === id); if (st.instruments.length >= MAX_INSTR || setupCost(st) + it.pts > setupBudget()) { Sfx.bad(); return; } st.instruments.push(id); }
  U.setupDirty = true;
};
function reqList(st) { return `<div class="reqs">${missionRequirements(st).map(([t, ok]) => `<div class="${ok ? 'green' : 'orange'}">${ok ? '✔' : '✖'} ${esc(t)}</div>`).join('')}</div>`; }
function constraintsBox(st) {
  const n = designNumbers(st), left = setupBudget() - setupCost(st);
  const row = (ic, name, val, ok, tip) => `<div class="cst ${ok ? '' : 'bad'}" title="${esc(tip)}"><span>${ic} ${esc(name)}</span><b>${val}</b></div>`;
  return `<div class="cstbox"><h4>${esc(kk('Restrições da missão', 'Mission constraints', 'Restricciones de la misión'))}</h4>
    ${row('💰', kk('Orçamento', 'Budget', 'Presupuesto'), left + ' pts', left >= 0, kk('Verba que sobra vira fundo de contingência.', 'Leftover budget becomes the contingency fund.', 'El presupuesto sobrante se vuelve fondo de contingencia.'))}
    ${row('⚡', kk('Energia', 'Power', 'Energía'), `${n.net >= 0 ? '+' : ''}${fmt(n.net, 1)} kWh/${kk('dia', 'day', 'día')}`, n.net >= 0, kk(`Gera ${fmt(n.gen, 1)} e gasta ${fmt(n.use, 1)} kWh por dia.`, `Generates ${fmt(n.gen, 1)} and uses ${fmt(n.use, 1)} kWh per day.`, `Genera ${fmt(n.gen, 1)} y gasta ${fmt(n.use, 1)} kWh por día.`))}
    ${row('📡', kk('Comunicação', 'Communications', 'Comunicación'), `${n.down} / ${n.dataDay} GB`, n.dataDay <= n.down, kk(`Envia ${n.down} GB por dia à Terra e coleta ${n.dataDay} GB por dia.`, `Sends ${n.down} GB a day to Earth and collects ${n.dataDay} GB a day.`, `Envía ${n.down} GB al día a la Tierra y recoge ${n.dataDay} GB al día.`))}
    ${row('💾', kk('Dados', 'Data', 'Datos'), n.fill ? kk(`enche em ${n.fill} dias`, `full in ${n.fill} days`, `se llena en ${n.fill} días`) : kk('sem acúmulo', 'no backlog', 'sin acumulación'), !n.fill || n.fill >= n.days, kk(`Armazenamento de ${n.store} GB.`, `${n.store} GB of storage.`, `Almacenamiento de ${n.store} GB.`))}
    ${row('⏳', kk('Vida útil', 'Mission lifetime', 'Vida útil'), `${n.life} / ${n.days} ${kk('dias', 'days', 'días')}`, n.life >= n.days, kk('Dias de comida (porção média) contra os dias de viagem.', 'Days of food (medium portion) versus days of travel.', 'Días de comida (porción media) frente a los días de viaje.'))}
  </div>`;
}
{
  const _ss = setupScreen;
  setupScreen = function () {
    let h = _ss(); if (!S || !S.setup) return h;
    const st = sd(S.setup), step = SETUP_STEPS[U.setupStep].id;
    // painel de restrições sempre à vista
    h = h.replace('<ol class="steps">', constraintsBox(st) + '<ol class="steps">');
    if (step === 'mission') {
      const obj = `<h4>🎯 ${esc(kk('Objetivo da missão', 'Mission objective', 'Objetivo de la misión'))}</h4><div class="opts">${OBJECTIVES.map(o => `<button class="opt ${st.objective === o.id ? 'on' : ''}" data-ui="setObjective" data-arg="${o.id}"><b>${o.icon} ${esc(L(o.name))}</b><span>${esc(L(o.desc))}</span></button>`).join('')}</div>
        <h4>📋 ${esc(kk('Requisitos da missão', 'Mission requirements', 'Requisitos de la misión'))}</h4>${reqList(st)}`;
      h = h.replace(/(<h2>1\. [^<]*<\/h2>)/, '$1' + obj);
    }
    if (step === 'modules') {
      const ins = `<h4>🔭 ${esc(kk('Instrumentos científicos', 'Science instruments', 'Instrumentos científicos'))} <small class="muted">${st.instruments.length}/${MAX_INSTR}</small></h4><div class="opts">${INSTRUMENTS.map(i => { const on = st.instruments.includes(i.id); return `<button class="opt ${on ? 'on' : ''}" data-ui="setInstr" data-arg="${i.id}" title="${esc(L(i.desc))}"><b>${{ espectrometro: '🌈', telescopio: '🔭', detectorRad: '☢', camera: '📷' }[i.id] || ''} ${esc(L(i.name))}</b><span class="idesc">${esc(L(i.desc))}</span><em>${i.pts} pts · ${i.kg} kg · −${fmt(i.kwh, 1)} kWh/${kk('dia', 'day', 'día')} · +${i.gb} GB/${kk('dia', 'day', 'día')}</em></button>`; }).join('')}</div>`;
      h = h.replace(/(<h2>2\. [^<]*<\/h2>)/, '$1' + ins);
    }
    if (step === 'report') {
      const lv = `<h4>🚀 ${esc(kk('Veículo de lançamento', 'Launch vehicle', 'Vehículo de lanzamiento'))}</h4><div class="opts">${LAUNCHERS.map(l => `<button class="opt ${st.launcher === l.id ? 'on' : ''}" data-ui="setLauncher" data-arg="${l.id}"><b>${esc(L(l.name))}</b><span>${esc(L(l.desc))}</span><em>${l.pts} pts · ${kk('até', 'up to', 'hasta')} ${l.lim} kg</em></button>`).join('')}</div>
        <h4>🪐 ${esc(kk('Órbita de chegada em Pontes-01b', 'Arrival orbit at Pontes-01b', 'Órbita de llegada en Pontes-01b'))}</h4><div class="opts">${ARRIVAL_ORBITS.map(o => `<button class="opt ${st.orbitAlt === o.alt ? 'on' : ''}" data-ui="setArrival" data-arg="${o.alt}"><b>${esc(L(o.name))}</b><span>${esc(L(o.desc))}</span></button>`).join('')}</div>
        <h4>📋 ${esc(kk('Requisitos da missão', 'Mission requirements', 'Requisitos de la misión'))}</h4>${reqList(st)}`;
      h = h.replace(/(<h2>4\. [^<]*<\/h2>)/, '$1' + lv);
    }
    // botão de montagem recomendada logo abaixo do título
    if (step === 'mission' || step === 'modules') h = h.replace(/(<h2>[12]\. [^<]*<\/h2>)/, `$1<button class="btn primary" data-ui="setupRecommend">⭐ ${esc(kk('Montagem recomendada', 'Recommended build', 'Montaje recomendado'))}</button>`);
    return h;
  };
}

// ---------- efeitos em jogo ----------
{
  // instrumentos: gastam energia e geram dados todo dia; o que passa do envio à Terra vira atraso
  const _sim = simulate;
  simulate = function (dt) {
    _sim(dt); if (!S || S.scene !== 'ship') return;
    const st = sd(S.setup); if (!st.instruments.length) return;
    const f = dt / S.dayLen; const ins = st.instruments.map(id => INSTRUMENTS.find(i => i.id === id)).filter(Boolean);
    if (S.res.energia > 2) { addRes('energia', -ins.reduce((s, i) => s + i.kwh, 0) * f, 'Instrumentos científicos'); addRes('dados', ins.reduce((s, i) => s + i.gb, 0) * f, 'Instrumentos científicos'); }
    S.stats.dataMade = (S.stats.dataMade || 0) + ins.reduce((s, i) => s + i.gb, 0) * f;
  };
  // espectrômetro: análises custam metade dos dados
  const _ae = ACTIONS.analyzeExo; ACTIONS.analyzeExo = function (p, a) { const n = S.explore.analyzed.length; _ae(p, a); if (S.explore.analyzed.length > n && has('espectrometro')) addRes('dados', has('lab') ? 2.5 : 5, 'Espectrômetro'); };
  const _pa = ACTIONS.planetAnalyze; ACTIONS.planetAnalyze = function (p, a) { const n = S.planet.analyzed.length; _pa(p, a); if (S.planet.analyzed.length > n && has('espectrometro')) { const an = PLANET_ANALYSES.find(x => x.id === p.id); if (an) addRes('dados', an.cost * 0.25, 'Espectrômetro'); } };
  // detector de radiação: 25% menos dose
  if (typeof radShield === 'function') { const _rs = radShield; radShield = function () { return _rs() * (has('detectorRad') ? 0.75 : 1); }; }
  // câmera de mapeamento: pouso mais preciso
  if (typeof landingFuel === 'function') { const _lf = landingFuel; landingFuel = function () { return Math.max(0, _lf() - (has('camera') ? 10 : 0)); }; }
  // órbita de chegada escolhida na montagem (entrar mais baixo custa combustível de captura)
  const _ep = enterPlanet;
  enterPlanet = function () {
    _ep();
    if (S && S.scene === 'planet' && S.orbit) {
      const alt = sd(S.setup).orbitAlt || 2400;
      if (alt !== S.orbit.alt) { const fuel = Math.ceil(fuelForDv(orbitDv(S.orbit.alt, alt), curMass())); addRes('combustivel', -Math.min(fuel, S.res.combustivel), 'Captura em órbita'); S.orbit.alt = alt; toast(K(`Captura: órbita de ${alt} km (−${fuel} kg de combustível).`, `Capture: ${alt} km orbit (−${fuel} kg of propellant).`, `Captura: órbita de ${alt} km (−${fuel} kg de combustible).`), 'info'); }
    }
  };
}
// objetivo cumprido? (vale bônus no fim)
function objectiveMet() {
  const st = sd(S.setup);
  if (st.objective === 'colonia') return !!S.colony;
  if (st.objective === 'ciencia') return (S.stats.dataMade || 0) >= 100;
  if (st.objective === 'reconhecimento') return (S.explore.analyzed || []).length >= 5 && (S.planet.analyzed || []).length >= 4;
  return false;
}
{
  const _es = endScreen;
  endScreen = function () {
    let h = _es(); if (!S || !S.setup) return h;
    const o = OBJECTIVES.find(x => x.id === sd(S.setup).objective); const ok = objectiveMet();
    if (ok && !S.objAwarded && Net.role !== 'client') { S.objAwarded = true; addPoints(100, 'Objetivo da missão'); }
    const box = `<div class="alert ${ok ? 'good' : 'warn'}">🎯 ${esc(kk('Objetivo', 'Objective', 'Objetivo'))}: <b>${esc(L(o.name))}</b> — ${ok ? esc(kk('cumprido! +100 pontos', 'achieved! +100 points', '¡cumplido! +100 puntos')) : esc(kk('não cumprido', 'not achieved', 'no cumplido'))}</div>`;
    return h.replace('<div class="kv">', box + '<div class="kv">');
  };
}

// ---------- nave recomendada como padrão: decolar logo ou "montar a minha" ----------
{
  const _to = UIH.toSetup;
  UIH.toSetup = function () { _to(); UIH.setupRecommend(); U.setupQuick = true; U.setupDirty = true; };
  UIH.buildOwn = () => { U.setupQuick = false; U.setupStep = 0; U.setupDirty = true; };
  UIH.buildQuick = () => { UIH.setupRecommend(); U.setupQuick = true; U.setupDirty = true; };
  const _ss = setupScreen;
  setupScreen = function () {
    if (!U.setupQuick || !S || !S.setup) {
      const h = _ss();
      return S && S.setup ? h.replace('<h3>MONTAGEM</h3>', `<h3>MONTAGEM</h3><button class="btn" data-ui="buildQuick">⭐ ${esc(kk('Usar a recomendada', 'Use recommended', 'Usar la recomendada'))}</button>`) : h;
    }
    const st = sd(S.setup);
    const cats = [['modules', MODULES], ['upgrades', UPGRADES], ['pantry', PANTRY], ['reserves', RESERVES]];
    const items = [];
    for (const [l, cat] of cats) for (const id of st[l] || []) { const it = cat.find(x => x.id === id); if (it) items.push(`<div class="qitem"><span>${ITEM_ICON[id] || '▪'}</span><b>${esc(T(it.name))}</b></div>`); }
    for (const id of st.instruments || []) { const it = INSTRUMENTS.find(x => x.id === id); if (it) items.push(`<div class="qitem"><span>🔭</span><b>${esc(L(it.name))}</b></div>`); }
    const route = ROUTES.find(r => r.id === st.route) || {};
    const lv = LAUNCHERS.find(l => l.id === st.launcher) || {};
    return `<div class="setup quickset"><div class="qpanel">
      <h2>⭐ ${esc(kk('Nave recomendada', 'Recommended ship', 'Nave recomendada'))}</h2>
      <p class="muted">${esc(kk('Já montamos uma nave equilibrada para você. É só decolar!', 'We already built a balanced ship for you. Just launch!', 'Ya armamos una nave equilibrada para ti. ¡Solo despega!'))}</p>
      <div class="qgrid">${items.join('')}</div>
      <div class="qline"><span>🧭 ${esc(T(route.name || ''))}</span><span>🚀 ${esc(L(lv.name || ''))}</span><span>💰 ${setupBudget() - setupCost(st)} pts ${esc(kk('de reserva', 'in reserve', 'de reserva'))}</span></div>
      <div class="qorigin"><b>👤 ${esc(kk('Especialidade do Comandante', 'Commander specialty', 'Especialidad del Comandante'))}</b><div class="mchips">${ORIGINS.map(o => `<button class="chip ${S.setup.origin === o.id ? 'on' : ''}" data-ui="setOrigin" data-arg="${o.id}" title="${esc(T(o.bonus))}">${esc(T(o.name))}</button>`).join('')}</div><small class="muted">${esc(T((ORIGINS.find(o => o.id === S.setup.origin) || {}).bonus || ''))}</small></div>
      <div class="row qbtns"><button class="btn primary huge" data-ui="launch">🚀 ${esc(kk('DECOLAR', 'LAUNCH', 'DESPEGAR'))}</button><button class="btn huge2" data-ui="buildOwn">🛠 ${esc(kk('Montar a minha', 'Build my own', 'Armar la mía'))}</button></div>
    </div></div>`;
  };
}
