// ============================================================
//  COLÔNIA EM PONTES-01b — o jogo continua depois do pouso
//  Construir a base, transmitir dados para a Terra e receber
//  as naves de tripulação (colonos). Textos novos em PT/EN/ES.
// ============================================================
'use strict';

const COLONY_W = 1900, CGROUND = 226;

const CBUILD = {
  nave: { x: 150, icon: '🚀', name: 'Nave pousada · Controle da Colônia',
    fact: 'O pouso em Marte da Perseverance (2021) usou o “guindaste aéreo” e levou cerca de 7 minutos da atmosfera ao solo, sem nenhum controle ao vivo: o sinal demora minutos para chegar da Terra.' },
  lab: { x: 360, icon: '🔬', name: 'Laboratório de campo e oficina',
    fact: 'O instrumento MOXIE, a bordo do rover Perseverance, produziu oxigênio a partir do CO₂ da atmosfera de Marte: 122 gramas no total, o suficiente para um cachorro pequeno respirar por cerca de 10 horas. É o princípio do uso de recursos locais (ISRU).' },
  solar: { x: 580, icon: '☀', name: 'Campo solar',
    fact: 'A Estação Espacial Internacional tem painéis solares com área maior que a de uma quadra de tênis e gera energia da ordem de 100 kW em plena luz do Sol. Mas ela passa pela sombra da Terra a cada órbita (~90 min): por isso tem baterias.' },
  agua: { x: 800, icon: '💧', name: 'Estação de água',
    fact: 'Em 2023 a ISS alcançou 98% de recuperação de água: urina, suor e até a umidade da respiração viram água potável de novo. A sonda Phoenix confirmou gelo de água em Marte em 2008.' },
  estufa: { x: 1020, icon: '🌱', name: 'Estufa colonial',
    fact: 'Astronautas da ISS já cultivaram e comeram alface (2015, experimento Veggie) e colheram pimentas Hatch (2021, Plant Habitat-04). Plantas também produzem O₂ e ajudam o psicológico da tripulação.' },
  torre: { x: 1240, icon: '📡', name: 'Torre de comunicação',
    fact: 'A Rede de Espaço Profundo (DSN) tem 3 complexos — Goldstone (EUA), Madri (Espanha) e Canberra (Austrália) — separados por cerca de 120°, para que sempre um deles enxergue a nave enquanto a Terra gira. Em 2023 o teste DSOC enviou dados por laser a 267 Mbps de 31 milhões de km.' },
  pista: { x: 1470, icon: '🛬', name: 'Pista de pouso e farol',
    fact: 'Pousar exige um alvo conhecido: os cientistas escolheram a cratera Jezero, em Marte, depois de anos de imagens de satélite. Sinais de rádio e faróis ajudam a guiar o pouso final.' },
  habitat: { x: 1720, icon: '🏠', name: 'Habitat e domos',
    fact: 'Na simulação CHAPEA, quatro voluntários viveram 378 dias em um habitat impresso em 3D (“Mars Dune Alpha”, 2023–2024) para estudar o isolamento, a comida e o trabalho em equipe.' },
};
const CSHORT = { nave: 'Nave', lab: 'Laboratório', solar: 'Campo solar', agua: 'Água', estufa: 'Estufa', torre: 'Torre', pista: 'Pista', habitat: 'Habitat' };
const CORDER = ['nave', 'lab', 'solar', 'agua', 'estufa', 'torre', 'pista', 'habitat'];
// custos por nível (kwh, água L, peças, sementes kg, duração s)
const CCOST = {
  solar: [null, { kwh: 8, peca: 1, dur: 10 }, { kwh: 12, peca: 1, dur: 12 }, { kwh: 16, peca: 2, dur: 14 }],
  agua: [null, { kwh: 10, peca: 1, dur: 10 }, { kwh: 14, peca: 1, dur: 12 }],
  estufa: [null, { kwh: 8, agua: 40, plant: 5, dur: 12 }, { kwh: 12, agua: 60, plant: 5, dur: 14 }],
  torre: [null, { kwh: 12, peca: 1, dur: 12 }, { kwh: 16, peca: 1, dur: 14 }],
  pista: [null, { kwh: 10, dur: 10 }, { kwh: 14, peca: 1, dur: 12 }],
  habitat: [null, { kwh: 12, peca: 1, agua: 30, dur: 14 }, { kwh: 14, peca: 1, agua: 30, dur: 14 }, { kwh: 16, peca: 2, agua: 40, dur: 16 }],
};
const CROLE = { solar: 'engenheiro', agua: 'engenheiro', estufa: 'agricultor', torre: 'engenheiro', pista: 'engenheiro', habitat: 'engenheiro', lab: 'pesquisador' };
const CREQ = { // pré-requisitos de construção (id → [[prédio, nível]])
  agua: [['solar', 1]], estufa: [['agua', 1]], torre: [['solar', 1]], pista: [['solar', 1]], habitat: [['solar', 1]],
};
const TX_PACKAGES = [
  { id: 'atmosfera', gb: 20, name: 'Atmosfera', need: 'atmosfera' },
  { id: 'agua', gb: 20, name: 'Água', need: 'agua' },
  { id: 'solo', gb: 25, name: 'Solo', need: 'solo' },
  { id: 'radiacao', gb: 15, name: 'Radiação', need: 'radiacao' },
  { id: 'biologia', gb: 30, name: 'Biologia', need: 'biologia' },
  { id: 'diario', gb: 10, name: 'Diário de bordo da viagem', need: null },
  { id: 'saude', gb: 10, name: 'Relatório médico da tripulação', need: null },
];
const CSHIPS = [
  { n: 1, name: 'Colonial-1', size: 10, sup: { kwh: 10, agua: 80, comida: 20 } },
  { n: 2, name: 'Colonial-2', size: 15, sup: { kwh: 12, agua: 100, comida: 30 } },
  { n: 3, name: 'Colonial-3', size: 20, sup: { kwh: 15, agua: 120, comida: 40 } },
];
const CFACTS = []; // preenchido por data/lang/<idioma>.json ("falas")

// ---------- estado ----------
function startColony(site, score) {
  S.stage = 5; S.scene = 'colony';
  // módulo de carga do pouso: garante o mínimo para começar
  S.cap.energia = Math.max(S.cap.energia, 60); S.cap.agua = Math.max(S.cap.agua, 400); S.cap.comida = Math.max(S.cap.comida, 100); S.cap.plantacao = Math.max(S.cap.plantacao, 60);
  S.res.energia = Math.max(S.res.energia, 40); S.res.agua = Math.max(S.res.agua, 200); S.res.comida = Math.max(S.res.comida, 40); S.res.plantacao = Math.max(S.res.plantacao, 12);
  S.peças = Math.max(S.peças, 2);
  S.colony = {
    t: 0, day: 1, dayT: 0, dayLen: 40, site: site.name, score,
    b: { solar: 0, agua: 0, estufa: 0, torre: 0, pista: 0, habitat: 0 },
    colonists: 0, tx: {}, txCount: 0, ships: [], shipsLanded: 0, short: { comida: 0, agua: 0 },
    tut: 0, done: false, finishT: 0, feed: [], storm: 0, factN: 0, nextFact: 70, built: 0, people: [], pid: 0,
  };
  S.crew.forEach((c, i) => { c.x = 110 + i * 22; c.deck = 'L'; c.tx = c.x; c.tdeck = 'L'; c.moving = false; c.ctask = null; c.task = null; c.climb = 0; c.eva = false; c.hibernating = false; c.bubble = null; });
  narrate(K('Pouso realizado em ' + site.name + '. Bem-vindos a Pontes-01b! A viagem acabou, mas a missão está só começando: construam a base, falem com a Terra e recebam as naves de tripulação.',
    'Landing complete at ' + site.name + '. Welcome to Pontes-01b! The trip is over, but the mission is just beginning: build the base, talk to Earth and receive the crew ships.',
    'Aterrizaje completado en ' + site.name + '. ¡Bienvenidos a Pontes-01b! El viaje terminó, pero la misión recién empieza: construyan la base, hablen con la Tierra y reciban las naves de tripulación.'));
}
const colonyPop = () => alive().length + (S.colony ? S.colony.colonists : 0);
const colonyBeds = () => S.colony.b.habitat * 20;
function colonyObjectives() {
  const C = S.colony;
  return [
    { id: 'solar', done: C.b.solar >= 1, t: 'Instalar o campo solar' },
    { id: 'agua', done: C.b.agua >= 1, t: 'Captar e purificar água' },
    { id: 'estufa', done: C.b.estufa >= 1, t: 'Plantar a primeira estufa' },
    { id: 'torre', done: C.b.torre >= 1, t: 'Erguer a torre de comunicação' },
    { id: 'tx', done: C.txCount >= 3, t: K('Transmitir 3 pacotes de dados à Terra (' + Math.min(3, C.txCount) + '/3)', 'Send 3 data packages to Earth (' + Math.min(3, C.txCount) + '/3)', 'Transmitir 3 paquetes de datos a la Tierra (' + Math.min(3, C.txCount) + '/3)') },
    { id: 'pista', done: C.b.pista >= 1, t: 'Preparar a pista de pouso e o farol' },
    { id: 'naves', done: C.shipsLanded >= 3, t: K('Receber 3 naves de tripulação (' + C.shipsLanded + '/3)', 'Receive 3 crew ships (' + C.shipsLanded + '/3)', 'Recibir 3 naves de tripulación (' + C.shipsLanded + '/3)') },
  ];
}
function colonyMsg(k, kind) { // mensagem da Terra / sistema: toast + chat + feed
  const C = S.colony; if (!C) return;
  C.feed.push({ d: C.day, t: k, kind: kind || 'mc' }); if (C.feed.length > 14) C.feed.shift();
  S.toast = { text: k, kind: kind === 'bad' ? 'bad' : kind === 'good' ? 'good' : 'info', t: 5, id: Math.random() };
  S.v++;
  if (typeof Chat !== 'undefined') Chat.sysAll(k, kind === 'bad' ? 'bad' : 'mc');
}

// ---------- ações ----------
const bots = () => S.crew.filter(c => c.alive && (!c.owner || c.owner === 'bot'));
const roleMatch = (c, role) => role === 'engenheiro' ? c.role.startsWith('engenheiro') || (c.id === 'cmd' && S.setup.origin === 'engenheiro') : c.role === role;
// quem tem a função é chamado primeiro (jogador ou bot); se ninguém da função estiver livre, um bot ajuda
function pickWorker(role, except) {
  const free = S.crew.filter(c => c.alive && !c.ctask && c.status !== 'incapacitado' && c.id !== 'cmd' && c.id !== except);
  return free.find(c => roleMatch(c, role) && isHumanCrew(c)) || free.find(c => roleMatch(c, role)) || free.find(c => !isHumanCrew(c)) || null;
}
function costTxt(c) {
  const a = [];
  if (c.kwh) a.push('⚡' + c.kwh + ' kWh'); if (c.agua) a.push('💧' + c.agua + ' L'); if (c.peca) a.push('⚙' + c.peca + ' ' + L('peça') + (c.peca > 1 ? 's' : ''));
  if (c.plant) a.push('🌱' + c.plant + ' kg'); if (c.gb) a.push('💾' + c.gb + ' GB'); if (c.dur) a.push('⏱' + c.dur + 's');
  return a.join(' · ');
}
function canPay(c) {
  if (c.kwh && S.res.energia < c.kwh) return 'Energia insuficiente.';
  if (c.agua && S.res.agua < c.agua) return 'Água insuficiente.';
  if (c.peca && S.peças < c.peca) return 'Faltam peças. Fabrique no laboratório de campo.';
  if (c.plant && S.res.plantacao < c.plant) return 'Faltam sementes/biomassa.';
  if (c.gb && S.res.dados < c.gb) return 'Dados insuficientes.';
  return null;
}
function pay(c) {
  if (c.kwh) addRes('energia', -c.kwh, 'Colônia'); if (c.agua) addRes('agua', -c.agua, 'Colônia');
  if (c.peca) S.peças -= c.peca; if (c.plant) addRes('plantacao', -c.plant, 'Colônia'); if (c.gb) addRes('dados', -c.gb, 'Transmissão');
}
function buildReqErr(id, lvl) {
  const C = S.colony;
  for (const [b, l] of (CREQ[id] || [])) if (C.b[b] < l) return K('Antes: ' + L(CSHORT[b]) + ' (nível ' + l + ').', 'First: ' + L(CSHORT[b]) + ' (level ' + l + ').', 'Antes: ' + L(CSHORT[b]) + ' (nivel ' + l + ').');
  return null;
}
function taskSpec(p) {
  const C = S.colony;
  if (p.k === 'build') {
    const id = p.b, lvl = (C.b[id] || 0) + 1;
    const simple = id === 'habitat' && S.journey === 'curta'; // Jornada Curta: habitat simplificado (barato, rápido, sem peça nem pré-requisito)
    const c = simple ? (CCOST[id] && CCOST[id][lvl] && { kwh: 6, agua: 10, dur: 7 }) : CCOST[id] && CCOST[id][lvl];
    if (!c) return null;
    const imp = simple ? null : buildReqErr(id, lvl);
    return { bid: id, cost: Object.assign({}, c), role: CROLE[id], err: imp, label: K('Construir: ' + L(CBUILD[id].name), 'Build: ' + L(CBUILD[id].name), 'Construir: ' + L(CBUILD[id].name)) };
  }
  if (p.k === 'fab') { const c = { kwh: has('impressora') ? 5 : 8, agua: 15, dur: has('impressora') ? 5 : 8 }; return { bid: 'lab', cost: c, role: 'engenheiro', label: 'Fabricar uma peça (impressão 3D)' }; }
  if (p.k === 'an') {
    const an = PLANET_ANALYSES.find(a => a.id === p.a); if (!an || S.planet.analyzed.includes(an.id)) return null;
    return { bid: 'lab', cost: { kwh: 4, dur: has('lab') ? 5 : 8 }, role: 'pesquisador', label: K('Analisar: ' + an.name, 'Analyze: ' + an.name, 'Analizar: ' + an.name) };
  }
  if (p.k === 'tx') {
    const pk = TX_PACKAGES.find(x => x.id === p.a); if (!pk || C.tx[pk.id]) return null;
    let err = null;
    if (C.b.torre < 1) err = 'Construa a torre de comunicação primeiro.';
    else if (pk.need && !S.planet.analyzed.includes(pk.need)) err = 'Sem dados: faça a análise no laboratório de campo.';
    else if (pk.id === 'saude' && !roleAlive('paramedico')) err = 'Sem paramédico para o relatório médico.';
    return { bid: 'torre', cost: { kwh: 6, gb: pk.gb, dur: 8 }, role: 'pesquisador', err, label: K('Transmitir: ' + L(pk.name), 'Transmit: ' + L(pk.name), 'Transmitir: ' + L(pk.name)) };
  }
  if (p.k === 'beacon') {
    const sh = C.ships.find(x => x.state === 'inbound');
    return { bid: 'pista', cost: { kwh: 2, dur: 5 }, role: 'engenheiro', err: !sh ? 'Nenhuma nave a caminho.' : (sh.beacon ? 'O farol já está aceso.' : null), label: 'Acender o farol de pouso' };
  }
  return null;
}
ACTIONS.cTut = () => { if (S.colony) S.colony.tut = 1; };
ACTIONS.cTask = (p, actor) => {
  const C = S.colony; if (!C || S.scene !== 'colony' || C.done) return;
  const sp = taskSpec(p); if (!sp) return;
  if (sp.err) return toast(sp.err, 'warn');
  const pe = canPay(sp.cost); if (pe) return toast(pe, 'warn');
  let who = actor;
  if (p.call) { who = pickWorker(sp.role, actor && actor.id); if (!who) return toast('Nenhum tripulante livre para ajudar.', 'warn'); }
  else if (Math.abs(who.x - CBUILD[sp.bid].x) > 90) return toast('Vá até o local para trabalhar.', 'warn');
  if (!who.alive) return;
  if (who.ctask) return toast('Este tripulante já está ocupado.', 'warn');
  if (who.status === 'incapacitado') return toast('Tripulante incapacitado.', 'warn');
  pay(sp.cost);
  const mult = (roleMatch(who, sp.role) ? 1.4 : 1) * clamp(effIndex() / 82, 0.5, 1.3);
  who.ctask = { key: p.k, bid: sp.bid, dur: sp.cost.dur / mult, t: 0, label: sp.label, data: p, role: sp.role, called: !!p.call && isHumanCrew(who), wait: 0 };
  if (who.ctask.called) toast(K(`📢 ${who.name} foi chamado(a): ${L(sp.label)}`, `📢 ${who.name} was called: ${L(sp.label)}`, `📢 ${who.name} fue llamado/a: ${L(sp.label)}`), 'info');
  S.v++;
};
const CTASK_DONE = {
  build(c, t) {
    const C = S.colony, id = t.data.b; C.b[id]++; C.built++;
    if (id === 'solar') { S.cap.energia += 40; }
    if (id === 'agua') { S.cap.agua += 150; }
    if (id === 'estufa') { S.cap.comida += 40; }
    addPoints(20, 'Construção em Pontes-01b');
    colonyMsg(K(c.name + ' concluiu: ' + L(CBUILD[id].name) + ' (nível ' + C.b[id] + ').', c.name + ' finished: ' + L(CBUILD[id].name) + ' (level ' + C.b[id] + ').', c.name + ' terminó: ' + L(CBUILD[id].name) + ' (nivel ' + C.b[id] + ').'), 'good');
    Sfx.ok();
  },
  fab(c) { S.peças++; toast('Peça fabricada com materiais locais.', 'good'); },
  an(c, t) {
    const an = PLANET_ANALYSES.find(a => a.id === t.data.a);
    if (!S.planet.analyzed.includes(an.id)) S.planet.analyzed.push(an.id);
    addRes('dados', 12, 'Análise de campo');
    colonyMsg(K('Análise de ' + an.name + ' concluída: ' + an.result, an.name + ' analysis done: ' + an.result, 'Análisis de ' + an.name + ' completado: ' + an.result), 'good');
  },
  tx(c, t) {
    const C = S.colony; const pk = TX_PACKAGES.find(x => x.id === t.data.a);
    const mods = (C.b.torre * 2) + (sysHp('comunicacao') >= 70 ? 2 : sysHp('comunicacao') < 40 ? -3 : 0) + (roleMatch(c, 'pesquisador') ? 2 : 0) + (has('radar') ? 1 : 0);
    const r = d20(); const ok = r === 20 || (r !== 1 && r + mods >= 8);
    if (!ok) { addRes('dados', pk.gb * 0.5, 'Pacote corrompido'); return colonyMsg(K('Ruído na linha: o pacote “' + L(pk.name) + '” chegou corrompido. Metade dos dados foi recuperada: tente de novo.', 'Line noise: package “' + L(pk.name) + '” arrived corrupted. Half the data was recovered: try again.', 'Ruido en la línea: el paquete “' + L(pk.name) + '” llegó dañado. Se recuperó la mitad de los datos: intente de nuevo.'), 'bad'); }
    C.tx[pk.id] = true; C.txCount++; C.txFx = 4; S.v++;
    addPoints(25, 'Dados enviados à Terra');
    const delay = 8 + Math.floor(Math.random() * 12);
    C.pendingAck = (C.pendingAck || []).concat([{ t: 6, k: K('Terra → Pontes-01b: pacote “' + L(pk.name) + '” recebido e validado pelos cientistas. O sinal viaja à velocidade da luz (atraso de ~' + delay + ' min, como Marte em média). Obrigado, Pontes-01b!', 'Earth → Pontes-01b: package “' + L(pk.name) + '” received and validated by scientists. The signal travels at the speed of light (~' + delay + ' min delay, like Mars on average). Thank you, Pontes-01b!', 'Tierra → Pontes-01b: paquete “' + L(pk.name) + '” recibido y validado por los científicos. La señal viaja a la velocidad de la luz (retraso de ~' + delay + ' min, como Marte en promedio). ¡Gracias, Pontes-01b!') }]);
    colonyMsg(K('Transmitindo “' + L(pk.name) + '” para a Terra pela antena de alto ganho… sinal enviado!', 'Transmitting “' + L(pk.name) + '” to Earth through the high-gain antenna… signal sent!', 'Transmitiendo “' + L(pk.name) + '” a la Tierra por la antena de alta ganancia… ¡señal enviada!'), 'good');
  },
  beacon(c) {
    const sh = S.colony.ships.find(x => x.state === 'inbound'); if (!sh) return;
    sh.beacon = true; colonyMsg(K('Farol aceso! A nave ' + sh.name + ' recebe o sinal e corrige a descida.', 'Beacon lit! Ship ' + sh.name + ' picks up the signal and corrects its descent.', '¡Baliza encendida! La nave ' + sh.name + ' recibe la señal y corrige el descenso.'), 'good');
  },
};
ACTIONS.cShip = p => {
  const C = S.colony; if (!C || S.scene !== 'colony' || C.done) return;
  const def = CSHIPS.find(s => s.n === +p.n); if (!def) return;
  if (C.ships.some(s => s.n === def.n)) return;
  const err = C.b.pista < 1 ? 'Prepare a pista de pouso.'
    : C.b.torre < 1 || C.txCount < 1 ? 'Transmita ao menos um pacote de dados para a Terra antes de pedir a nave.'
    : C.ships.some(s => s.state === 'inbound') ? 'Já há uma nave a caminho.'
    : def.n > 1 && !C.ships.some(s => s.n === def.n - 1 && s.state === 'landed') ? 'Receba a nave anterior primeiro.'
    : C.colonists + def.size > colonyBeds() ? K('Camas insuficientes: amplie o habitat (' + colonyBeds() + ' camas; precisa de ' + (C.colonists + def.size) + ').', 'Not enough beds: expand the habitat (' + colonyBeds() + ' beds; needs ' + (C.colonists + def.size) + ').', 'Camas insuficientes: amplíe el hábitat (' + colonyBeds() + ' camas; necesita ' + (C.colonists + def.size) + ').')
    : S.res.energia < 12 ? 'Energia insuficiente para o farol e o radar de guiagem (12 kWh).'
    : null;
  if (err) return toast(err, 'warn');
  addRes('energia', -12, 'Guiagem da nave');
  C.ships.push({ n: def.n, name: def.name, size: def.size, state: 'inbound', t: 0, eta: 32, beacon: false });
  colonyMsg(K('A ' + def.name + ' (' + def.size + ' colonos) iniciou a descida! Chegada em ~30 s. Acenda o farol na pista para ajudar no pouso.', 'Ship ' + def.name + ' (' + def.size + ' colonists) started its descent! Arrival in ~30 s. Light the beacon at the pad to help it land.', '¡La nave ' + def.name + ' (' + def.size + ' colonos) inició el descenso! Llegada en ~30 s. Encienda la baliza en la pista para ayudar al aterrizaje.'));
};
function landShip(sh) {
  const C = S.colony; const def = CSHIPS.find(s => s.n === sh.n);
  const mods = C.b.pista * 2 + (sh.beacon ? 4 : 0) + (C.b.torre >= 2 ? 1 : 0) + (sysHp('comunicacao') >= 70 ? 1 : 0) + (C.storm > 0 ? -3 : 0);
  const r = d20(); const ok = r === 20 || (r !== 1 && r + mods >= 9);
  if (!ok) {
    S.fast = 0; sh.state = 'abort'; C.ships = C.ships.filter(x => x !== sh);
    return colonyMsg(K('Pouso abortado! A ' + sh.name + ' voltou à órbita por falta de guiagem' + (C.storm > 0 ? ' e por causa da tempestade de poeira' : '') + '. Acenda o farol e melhore a pista, depois chame de novo.', 'Landing aborted! Ship ' + sh.name + ' went back to orbit for lack of guidance' + (C.storm > 0 ? ' and because of the dust storm' : '') + '. Light the beacon and improve the pad, then call again.', '¡Aterrizaje abortado! La nave ' + sh.name + ' volvió a órbita por falta de guía' + (C.storm > 0 ? ' y por la tormenta de polvo' : '') + '. Encienda la baliza y mejore la pista, luego llame de nuevo.'), 'bad');
  }
  S.fast = 0; sh.state = 'landed'; C.shipsLanded++; C.colonists += sh.size; arcaLanded(sh);
  addRes('energia', def.sup.kwh, 'Suprimentos da nave'); addRes('agua', def.sup.agua, 'Suprimentos da nave'); addRes('comida', def.sup.comida, 'Suprimentos da nave');
  moral(6); addPoints(60, 'Nave de tripulação recebida');
  colonyMsg(K(sh.name + ' pousou! +' + sh.size + ' colonos chegaram a Pontes-01b trazendo suprimentos. População: ' + colonyPop() + '.', sh.name + ' landed! +' + sh.size + ' colonists arrived on Pontes-01b with supplies. Population: ' + colonyPop() + '.', sh.name + ' aterrizó! +' + sh.size + ' colonos llegaron a Pontes-01b con suministros. Población: ' + colonyPop() + '.'), 'good');
  Sfx.ok();
}

// ---------- simulação ----------
function colonyNewDay() {
  const C = S.colony; C.day++; S.day++;
  const pop = colonyPop();
  const stormMul = C.storm > 0 ? 0.5 : 1;
  const sol = C.b.solar * (14 + (has('solar') ? 3 : 0)) * stormMul;
  addRes('energia', sol, 'Campo solar'); addRes('energia', -(2 + pop * 0.1), 'Consumo da colônia');
  addRes('agua', C.b.agua * 35, 'Estação de água'); addRes('agua', -pop * 3, 'Consumo da colônia');
  const food = C.b.estufa * (5 + (has('estufa') ? 1 : 0) + (has('sementes') ? 1 : 0) + (S.planet.analyzed.includes('solo') ? 1 : 0) + (roleAlive('agricultor') ? 1 : 0));
  addRes('comida', food, 'Estufa colonial'); addRes('comida', -pop * 0.5, 'Consumo da colônia');
  if (C.storm > 0) C.storm--;
  const lack = [];
  for (const k of ['comida', 'agua']) { if (S.res[k] < 0.5) { C.short[k]++; lack.push(k); } else C.short[k] = 0; }
  if (lack.length) {
    moral(-4);
    colonyMsg(K('Alerta: ' + lack.map(k => k === 'comida' ? 'comida' : 'água').join(' e ') + ' acabando! Construa/amplie a estufa e a estação de água.', 'Warning: ' + lack.map(k => k === 'comida' ? 'food' : 'water').join(' and ') + ' running out! Build/expand the greenhouse and water station.', 'Alerta: ¡' + lack.map(k => k === 'comida' ? 'comida' : 'agua').join(' y ') + ' se agota! Construya/amplíe el invernadero y la estación de agua.'), 'bad');
  }
  if (C.short.comida >= 3 || C.short.agua >= 3) return fail(C.short.comida >= 3 ? 'A colônia ficou sem comida por 3 dias. Sem produção de alimentos local, a vida em outro planeta não se sustenta.' : 'A colônia ficou sem água por 3 dias. Sem água, não há colônia.');
  if (C.day > 3 && C.storm <= 0 && C.b.solar > 0 && Math.random() < 0.14) {
    C.storm = 2; S.fast = 0;
    colonyMsg('Tempestade de poeira! A produção solar cai pela metade por 2 dias e pousos ficam mais difíceis. (Em Marte, tempestades de poeira já cobriram o planeta inteiro e silenciaram o rover Opportunity em 2018.)', 'bad');
  }
  for (const c of alive()) { c.humor = clamp(c.humor + (lack.length ? -2 : 1), 0, 100); }
  checkFail();
}
function moveToward(c, tx, dt, sp) {
  const d = tx - c.x;
  if (Math.abs(d) < 3) { c.moving = false; return true; }
  const s = Math.min(Math.abs(d), (sp || 55) * dt); c.x += Math.sign(d) * s; c.face = d > 0 ? 1 : -1; c.moving = true; c.walkT += dt;
  return false;
}
function tickColony(dt) {
  const C = S.colony; if (!C || S.fail) return;
  if (C.done) { C.finishT -= dt; if (C.finishT <= 0 && S.scene === 'colony') finishColony(); return; }
  if (C.tut === 0) return; // espera a introdução
  C.t += dt; C.dayT += dt; if (C.txFx > 0) C.txFx -= dt;
  if (C.dayT >= C.dayLen) { C.dayT -= C.dayLen; colonyNewDay(); if (S.fail) return; }
  if (S.toast) { S.toast.t -= dt; if (S.toast.t <= 0) S.toast = null; }
  // fome, sono, colonos (bots) e jogadores que entraram por outra nave
  arcaTick(dt);
  // tripulação e colonos
  for (const c of colonyAll()) {
    if (!c.alive || c.csleep || c.spawnT > 0) continue;
    if (c.bubble) { c.bubble.t -= dt; if (c.bubble.t <= 0) c.bubble = null; }
    if (c.statusT > 0) { c.statusT -= dt; if (c.statusT <= 0) { c.status = 'ok'; c.statusT = 0; } }
    const human = c.owner && c.owner !== 'bot';
    const t = c.ctask;
    if (t) {
      const B = CBUILD[t.bid]; const near = Math.abs(c.x - B.x) < 70;
      if (near) {
        t.t += dt; c.moving = false;
        if (t.t >= t.dur) { c.ctask = null; S.v++; const fn = CTASK_DONE[t.key]; if (fn) fn(c, t); }
      } else if (!human) moveToward(c, B.x + (Math.random() * 20 - 10), dt, 60);
      else if (t.called && t.t === 0 && c.id !== U.me) { // jogador chamado que não veio: um bot assume
        t.wait = (t.wait || 0) + dt;
        if (t.wait > CALL_TIMEOUT) { c.ctask = null; const bot = S.crew.find(b => b.alive && !b.ctask && !isHumanCrew(b) && b.id !== 'cmd' && b.status !== 'incapacitado' && roleMatch(b, t.role)) || S.crew.find(b => b.alive && !b.ctask && !isHumanCrew(b) && b.id !== 'cmd' && b.status !== 'incapacitado'); if (bot) { bot.ctask = Object.assign({}, t, { called: false, t: 0 }); toast(K(`${c.name} não atendeu; ${bot.name} assumiu.`, `${c.name} didn't answer; ${bot.name} took over.`, `${c.name} no respondió; ${bot.name} tomó el relevo.`), 'warn'); } S.v++; }
      }
    } else if (!human && !c.goal && !(c.eatT > 0)) {
      c.idleT -= dt;
      if (c.idleT <= 0) { c.idleT = 4 + Math.random() * 8; c.wx = 90 + Math.random() * (COLONY_W - 180); if (Math.random() < 0.5) c.wx = CBUILD[pick(CORDER)].x + (Math.random() * 60 - 30); }
      if (c.wx != null) { if (moveToward(c, c.wx, dt, 38)) c.wx = null; } else c.moving = false;
    }
  }
  // naves a caminho
  for (const sh of C.ships.slice()) if (sh.state === 'inbound') { sh.t += dt; if (sh.t >= sh.eta) landShip(sh); }
  // respostas da Terra (atraso do sinal)
  if (C.pendingAck && C.pendingAck.length) {
    C.pendingAck.forEach(a => { a.t -= dt; });
    const due = C.pendingAck.filter(a => a.t <= 0); C.pendingAck = C.pendingAck.filter(a => a.t > 0);
    due.forEach(a => colonyMsg(a.k, 'mc'));
  }
  // curiosidades
  C.nextFact -= dt;
  if (C.nextFact <= 0) { C.nextFact = 80 + Math.random() * 40; const f = CFACTS[C.factN++ % CFACTS.length]; if (typeof Chat !== 'undefined') Chat.sysAll(f, 'fact'); }
  // fim?
  if (colonyObjectives().every(o => o.done)) { C.done = true; C.finishT = 3; narrate('A colônia está de pé. Painéis, água, estufa, antena, pista e três naves de tripulação: a humanidade tem um novo lar.'); }
  checkFail();
}
function finishColony() {
  const C = S.colony;
  addPoints(200, 'Colônia estabelecida em Pontes-01b');
  S.scene = 'end'; S.stage = 6;
  S.ending = { ok: true, site: C.site, score: C.score, colony: true };
  Save.data.runs++; if (!Save.data.best || S.points > Save.data.best) Save.data.best = S.points; Save.write();
}

// ---------- movimento do jogador local ----------
function moveColonyHuman(c, dt) {
  if (!c || !c.alive) return;
  if (c.csleep) { c.moving = false; if (keys.ArrowLeft || keys.ArrowRight || keys.KeyA || keys.KeyD) act('cWake'); return; } // dormindo no quarto: qualquer seta acorda
  const L_ = keys.ArrowLeft || keys.KeyA, R_ = keys.ArrowRight || keys.KeyD;
  if (L_ || R_) U.clickTarget = null;
  let dx = (R_ ? 1 : 0) - (L_ ? 1 : 0);
  if (L_ || R_) U.cOpen = null;
  if (!dx && U.clickTarget) { const d = U.clickTarget.x - c.x; if (Math.abs(d) < 3) { U.clickTarget = null; if (U.cOpen && !U.panel) { U.cOpen = null; colonyInteract(); } } else dx = Math.sign(d); }
  if (dx) { c.x = clamp(c.x + dx * (c.status === 'ferido' ? 40 : 75) * (keys.ShiftLeft || keys.ShiftRight ? RUN_MULT : 1) * dt, 24, COLONY_W - 24); c.face = dx; c.moving = true; c.walkT += dt; }
  else c.moving = false;
  c.deck = 'L'; c.tx = c.x;
}
function nearBuilding(c) {
  let best = null, bd = 60;
  for (const id of CORDER) { const d = Math.abs(CBUILD[id].x - c.x); if (d < bd) { bd = d; best = id; } }
  return best;
}
function colonyInteract() {
  const c = me(); if (!c || !c.alive || !S.colony) return;
  if (S.colony.tut === 0) return act('cTut');
  const b = nearBuilding(c);
  if (!b) { // longe de tudo: anda até o prédio mais próximo e abre ao chegar
    let best = null, bd = 320; for (const id of CORDER) { const d = Math.abs(CBUILD[id].x - c.x); if (d < bd) { bd = d; best = id; } }
    if (best) { U.clickTarget = { x: CBUILD[best].x }; U.cOpen = best; }
    return;
  }
  U.cOpen = null; U.panel = 'c:' + b; U.tab = null;
}

// ---------- desenho ----------
function drawColony(dt) {
  const C = S.colony; const m = me() || S.crew[0];
  R.colCam = clamp((m ? m.x : 200) - VW / 2, 0, COLONY_W - VW);
  const cam = Math.round(R.colCam);
  const f = C.dayT / C.dayLen; // 0..1
  const night = clamp((Math.abs(f - 0.5) - 0.42) * 7, 0, 0.55);
  // céu (estrela G9 laranja-amarelada)
  const g = cx.createLinearGradient(0, 0, 0, CGROUND);
  g.addColorStop(0, '#2c5ba6'); g.addColorStop(0.55, '#7fb0d8'); g.addColorStop(1, '#f1d8a4');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  const sx = 40 + f * 400, sy = 120 - Math.sin(f * Math.PI) * 88;
  cx.fillStyle = 'rgba(255,220,140,0.35)'; cx.beginPath(); cx.arc(sx, sy, 24, 0, 7); cx.fill();
  cx.fillStyle = '#ffd98a'; cx.beginPath(); cx.arc(sx, sy, 15, 0, 7); cx.fill();
  // lua gigante pálida
  cx.fillStyle = 'rgba(235,235,250,0.85)'; cx.beginPath(); cx.arc(Math.round(90 - cam * 0.03), 56, 20, 0, 7); cx.fill();
  cx.fillStyle = 'rgba(180,180,205,0.8)'; cx.fillRect(Math.round(84 - cam * 0.03), 50, 6, 5); cx.fillRect(Math.round(96 - cam * 0.03), 60, 8, 4);
  // nuvens
  cx.fillStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 6; i++) { const x = ((i * 190 + R.t * 5) % (VW + 160)) - 80 - cam * 0.1; cx.fillRect(Math.round(x), 40 + (i % 3) * 22, 52, 6); cx.fillRect(Math.round(x + 10), 36 + (i % 3) * 22, 30, 5); }
  // montanhas
  cx.fillStyle = '#6f89b4';
  for (let x = -20; x < VW + 20; x += 6) { const wx = x + cam * 0.2; const h = 34 + Math.sin(wx * 0.021) * 18 + Math.sin(wx * 0.07) * 6; cx.fillRect(x, Math.round(CGROUND - 24 - h), 6, Math.round(h + 24)); }
  cx.fillStyle = '#4f8a78';
  for (let x = -20; x < VW + 20; x += 4) { const wx = x + cam * 0.5; const h = 14 + Math.sin(wx * 0.035 + 2) * 9; cx.fillRect(x, Math.round(CGROUND - 8 - h), 4, Math.round(h + 8)); }
  // chão e rio
  cx.fillStyle = '#6aa05a'; cx.fillRect(0, CGROUND, VW, VH - CGROUND);
  cx.fillStyle = '#58904c'; for (let x = -(cam % 20); x < VW; x += 20) cx.fillRect(x, CGROUND, 10, 2);
  cx.fillStyle = '#4a7d41'; cx.fillRect(0, CGROUND + 20, VW, 3);
  const rx = 640 - cam; cx.fillStyle = '#2f78c8'; cx.fillRect(Math.round(rx), CGROUND + 6, 90, 12); cx.fillStyle = '#6fb4ff'; for (let i = 0; i < 6; i++) cx.fillRect(Math.round(rx + 4 + ((i * 16 + R.t * 14) % 78)), CGROUND + 9 + (i % 3) * 3, 6, 1);
  // flora alienígena (decor)
  for (let i = 0; i < 40; i++) { const wx = 60 + i * 47 + (i * 31 % 17); const x = Math.round(wx - cam); if (x < -10 || x > VW + 10) continue; const hgt = 5 + (i * 7 % 9); cx.fillStyle = i % 3 ? '#2fc4a8' : '#d86ad0'; cx.fillRect(x, CGROUND - hgt, 2, hgt); cx.fillRect(x - 2, CGROUND - hgt, 6, 2); }
  // construções
  for (const id of CORDER) drawBuilding(id, CBUILD[id].x - cam, cam);
  // naves a caminho
  for (const sh of C.ships) if (sh.state === 'inbound') {
    const p = clamp(sh.t / sh.eta, 0, 1); const bx = CBUILD.pista.x - cam; const y = -40 + p * (CGROUND - 24 + 40) * (1 - Math.pow(1 - p, 3) * 0.2);
    cx.save(); cx.translate(Math.round(bx + Math.sin(R.t * 2) * (1 - p) * 8), Math.round(y)); cx.rotate(-Math.PI / 2); cx.scale(0.8, 0.8);
    drawShipExteriorRaw(0, 0, true); cx.restore();
    cx.fillStyle = 'rgba(255,255,255,0.6)'; cx.fillRect(Math.round(bx - 1), 0, 2, Math.max(0, Math.round(y - 22)));
    text(sh.name + ' · ' + Math.max(0, Math.ceil(sh.eta - sh.t)) + 's', bx, Math.max(4, y - 42), '#ffd34c', 8, 'center');
  }
  // tripulantes
  for (const c of S.crew) if (!c.alive) { const x = Math.round(c.x - cam); if (x > -40 && x < VW + 40) drawCorpse(c, x, CGROUND + 14); }
  drawSleepers(cam); drawPeople(cam);
  const order = S.crew.filter(c => c.alive && !c.csleep).sort((a, b) => a.x - b.x);
  for (const c of order) {
    const x = Math.round(c.x - cam); if (x < -30 || x > VW + 30) continue;
    drawChar(c.avatar, 'suit', x, CGROUND + 14 - (c.jy || 0), c.face, c.moving ? Math.floor(c.walkT * 8) : 0, c.humor < 35 ? 'sad' : 'happy');
    const mine = c.id === U.me;
    text(c.name, x, CGROUND + 14 - SPR_H - 10, mine ? '#ffd34c' : (c.owner && c.owner !== 'bot' ? '#7dffb0' : '#bcd3ff'), 7, 'center');
    if (c.ctask) { const B = CBUILD[c.ctask.bid]; const pr = clamp(c.ctask.t / c.ctask.dur, 0, 1); cx.fillStyle = '#000'; cx.fillRect(x - 12, CGROUND + 14 - SPR_H - 3, 24, 4); cx.fillStyle = Math.abs(c.x - B.x) < 70 ? '#46e08a' : '#ffd23f'; cx.fillRect(x - 11, CGROUND + 14 - SPR_H - 2, Math.round(22 * pr), 2); }
    if (c.eatT > 0) drawEatIcon(x + 9, CGROUND + 14 - 12);
    if (c.bubble) bubble(c.bubble.text, x, CGROUND + 14 - SPR_H - 12);
  }
  // noite
  if (night > 0) { cx.fillStyle = `rgba(8,10,40,${night})`; cx.fillRect(0, 0, VW, VH); }
  if (C.storm > 0) { cx.fillStyle = 'rgba(190,140,80,0.22)'; cx.fillRect(0, 0, VW, VH); cx.fillStyle = 'rgba(220,170,110,0.5)'; for (let i = 0; i < 30; i++) cx.fillRect(((i * 53 + R.t * 220) % (VW + 40)) - 20, (i * 37) % VH, 12, 1); }
  // prompt de proximidade
  const nb = m ? nearBuilding(m) : null;
  if (nb && !U.panel && C.tut && !(m && m.csleep)) text('[E] ' + T(L(CSHORT[nb])), VW / 2, 64, '#fff', 8, 'center');
}
function drawShipExteriorRaw(x, y, flame) { drawShipExterior(x, y, 1, flame); }
function drawBuilding(id, bx, cam) {
  const C = S.colony; const B = CBUILD[id]; const lv = id === 'nave' || id === 'lab' ? 1 : C.b[id];
  if (bx < -120 || bx > VW + 120) return;
  const G = CGROUND; const r = (a, b, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(bx + a), Math.round(b), w, h); };
  const label = (t) => text(T(t), bx, G + 19, lv ? '#fff' : '#cfd6e6', 7, 'center');
  const short = L(CSHORT[id]);
  if (id === 'nave') {
    drawShipExterior(bx - 36, G - 26, 1.15, false);
    r(-60, G - 6, 8, 6, '#555'); r(40, G - 6, 8, 6, '#555'); r(-62, G - 2, 12, 2, '#333'); r(38, G - 2, 12, 2, '#333');
    r(56, G - 40, 3, 40, '#aaa'); r(52, G - 44, 11, 5, '#ff4a5a');
    label(short); return;
  }
  if (lv === 0) { // terreno de obra
    cx.strokeStyle = '#ffd23f'; cx.setLineDash([4, 3]); cx.strokeRect(Math.round(bx - 32) + 0.5, G - 30.5, 64, 30); cx.setLineDash([]);
    r(-34, G - 34, 3, 34, '#8a6a30'); r(31, G - 34, 3, 34, '#8a6a30'); r(-34, G - 34, 68, 2, '#8a6a30');
    r(-12, G - 18, 24, 12, '#3a3a50'); text(B.icon, bx, G - 22, '#fff', 10, 'center');
    label(short); return;
  }
  if (id === 'lab') {
    r(-40, G - 34, 80, 34, '#d7dbe8'); r(-40, G - 34, 80, 3, '#fff'); r(-40, G - 4, 80, 4, '#8a93ad');
    r(-14, G - 24, 28, 24, '#2c3354'); r(-12, G - 22, 24, 20, '#7ad8ff'); r(-12, G - 12, 24, 2, '#2f5bd7');
    r(-34, G - 28, 14, 10, '#7ad8ff'); r(20, G - 28, 14, 10, '#7ad8ff');
    r(-16, G - 44, 32, 10, '#b0b8d0'); r(-4, G - 54, 8, 10, '#8a93ad'); r(-12, G - 58, 24, 4, '#ff8a2a');
    label(short); return;
  }
  if (id === 'solar') {
    const n = 2 + lv * 2;
    for (let i = 0; i < n; i++) { const px = -34 + i * 16; r(px, G - 30 - (i % 2) * 4, 14, 22, '#1d3a9a'); r(px, G - 30 - (i % 2) * 4, 14, 2, '#5a7cff'); cx.fillStyle = '#5a7cff'; for (let k = 0; k < 4; k++) cx.fillRect(Math.round(bx + px + 1), G - 27 - (i % 2) * 4 + k * 5, 12, 1); r(px + 6, G - 8 - (i % 2) * 4 + 0, 2, 8 + (i % 2) * 4, '#777'); }
    r(-40, G - 4, 80, 4, '#444'); if (lv > 0) { r(-44, G - 14, 8, 14, '#bbb'); r(-43, G - 12, 6, 3, '#ffd23f'); }
    label(short + ' Nv' + lv); return;
  }
  if (id === 'agua') {
    r(-36, G - 22, 28, 22, '#9aa3bb'); r(-36, G - 22, 28, 3, '#cfd6e6'); r(-30, G - 30, 16, 8, '#cfd6e6');
    r(0, G - 30, 40, 30, '#2f78c8'); r(0, G - 30, 40, 4, '#6fb4ff'); r(4, G - 22, 32, 2, '#6fb4ff'); r(4, G - 14, 32, 2, '#1d5aa0');
    for (let i = 0; i < 3; i++) r(-8, G - 14 + i * 4, 10, 2, '#888'); const dr = Math.floor(R.t * 6) % 4; r(-6, G - 8 + dr, 2, 2, '#6fb4ff');
    if (lv > 1) { r(44, G - 24, 18, 24, '#9aa3bb'); r(46, G - 22, 14, 6, '#6fb4ff'); }
    label(short + ' Nv' + lv); return;
  }
  if (id === 'estufa') {
    const w = lv > 1 ? 100 : 72; r(-w / 2, G - 34, w, 34, 'rgba(160,230,255,0.35)'); r(-w / 2, G - 36, w, 3, '#cfd6e6'); r(-w / 2, G - 34, 3, 34, '#cfd6e6'); r(w / 2 - 3, G - 34, 3, 34, '#cfd6e6');
    for (let i = 0; i < 4; i++) r(-w / 2 + i * w / 4, G - 34, 2, 34, 'rgba(255,255,255,0.5)');
    for (let i = 0; i < (lv > 1 ? 9 : 6); i++) { const px = -w / 2 + 6 + i * 11; const hgt = 8 + (i * 5 % 9) + Math.floor(Math.sin(R.t + i) * 1); r(px, G - hgt - 4, 2, hgt, '#3fa84a'); r(px - 3, G - hgt - 4, 8, 3, '#5fd35f'); }
    r(-w / 2, G - 4, w, 4, '#5a4020'); label(short + ' Nv' + lv); return;
  }
  if (id === 'torre') {
    r(-6, G - 80, 12, 80, '#cfd6e6'); r(-4, G - 78, 3, 76, '#fff'); for (let i = 0; i < 6; i++) r(-6, G - 72 + i * 12, 12, 2, '#8a93ad');
    r(-16, G - 92, 32, 8, '#b0b8d0'); cx.fillStyle = '#e8ecf6'; cx.beginPath(); cx.ellipse(Math.round(bx), G - 96, 18, 8, -0.3, 0, 7); cx.fill(); r(-1, G - 104, 2, 10, '#ff4a5a');
    if (lv > 1) { cx.fillStyle = '#e8ecf6'; cx.beginPath(); cx.ellipse(Math.round(bx + 24), G - 44, 12, 6, 0.4, 0, 7); cx.fill(); r(22, G - 44, 3, 44, '#aaa'); }
    r(-20, G - 6, 40, 6, '#555'); r(-12, G - 16, 24, 10, '#cfd6e6'); r(-8, G - 14, 6, 4, '#7ad8ff');
    if ((C.txFx || 0) > 0) for (let i = 0; i < 3; i++) { const rr = ((R.t * 30 + i * 14) % 42); cx.strokeStyle = `rgba(122,216,255,${1 - rr / 42})`; cx.beginPath(); cx.arc(Math.round(bx), G - 100, 6 + rr, Math.PI * 1.15, Math.PI * 1.85); cx.stroke(); }
    label(short + ' Nv' + lv); return;
  }
  if (id === 'pista') {
    r(-52, G - 3, 104, 3, '#555'); r(-48, G - 2, 96, 1, '#999'); for (let i = 0; i < 8; i++) r(-46 + i * 13, G - 2, 6, 1, '#ffd23f');
    r(-30, G - 36, 60, 2, '#444'); r(-30, G - 36, 2, 36, '#444'); r(28, G - 36, 2, 36, '#444');
    const on = C.ships.some(s => s.state === 'inbound' && s.beacon);
    for (let i = 0; i < 2 + lv; i++) { const lx = -48 + i * (96 / (1 + lv)); r(lx, G - 8, 3, 8, '#888'); r(lx - 1, G - 11, 5, 3, on && Math.floor(R.t * 4) % 2 ? '#ffffff' : '#ff4a5a'); }
    r(-4, G - 56, 8, 56, '#777'); r(-8, G - 60, 16, 6, on ? (Math.floor(R.t * 6) % 2 ? '#fff' : '#ffd23f') : '#c33'); if (on) { cx.fillStyle = 'rgba(255,240,150,0.25)'; cx.beginPath(); cx.moveTo(bx, G - 58); cx.lineTo(bx - 60, G - 180); cx.lineTo(bx + 60, G - 180); cx.fill(); }
    label(short + ' Nv' + lv); return;
  }
  if (id === 'habitat') {
    for (let i = 0; i < lv; i++) {
      const px = -28 + i * 40 - (lv - 1) * 8 + 8; const rad = 22 - i * 1;
      cx.fillStyle = '#e8e8f0'; cx.beginPath(); cx.arc(Math.round(bx + px), G, rad, Math.PI, 0); cx.fill();
      cx.fillStyle = '#b0b8d0'; cx.beginPath(); cx.arc(Math.round(bx + px), G, rad - 4, Math.PI, 0); cx.fill();
      cx.fillStyle = (Math.floor(R.t + i) % 3) ? '#ffe9a0' : '#7ad8ff'; cx.fillRect(Math.round(bx + px - 8), G - 14, 6, 6); cx.fillRect(Math.round(bx + px + 3), G - 14, 6, 6);
      r(px - 4, G - 8, 8, 8, '#2c3354');
      if (i > 0) r(px - 20, G - 6, 8, 4, '#8a93ad');
    }
    label(short + ' Nv' + lv); return;
  }
}

// ---------- interface ----------
function colonyHud() {
  const C = S.colony; const items = RES_META.filter(m => ['energia', 'agua', 'comida', 'dados', 'plantacao'].includes(m.id)).map(m => {
    const v = S.res[m.id], cap = S.cap[m.id];
    return `<div class="rb" title="${esc(m.name)}: ${fmt(v)} ${m.unit}"><span class="ic">${m.icon}</span>${bar(v, cap)}<span class="v">${fmt(v, v < 10 ? 1 : 0)}<small>${m.unit}</small></span></div>`;
  });
  items.push(`<div class="rb" title="${esc(L('Peças'))}"><span class="ic">⚙</span><span class="v">${S.peças}<small>${esc(L('peças'))}</small></span></div>`);
  items.push(`<div class="rb" title="${esc(L('População'))}"><span class="ic">👥</span><span class="v">${colonyPop()}<small>${esc(L('pessoas'))}</small></span></div>`);
  if (me()) items.push(needBars(me()));
  items.push(`<div class="rb" title="Moral"><span class="ic">☺</span>${bar(moralIndex(), 100)}<span class="v">${fmt(moralIndex(), 0)}<small>pts</small></span></div>`);
  const f = C.dayT / C.dayLen, hh = Math.floor(f * 24), mm = Math.floor((f * 24 * 60) % 60);
  const obj = colonyObjectives(); const doneN = obj.filter(o => o.done).length;
  const m = me(); const nb = m && m.alive ? nearBuilding(m) : null;
  let prompt = '';
  if (m && m.ctask) prompt = `⏳ ${esc(L(m.ctask.label))} — ${Math.abs(m.x - CBUILD[m.ctask.bid].x) < 70 ? esc(L('fique aqui')) : esc(L('volte ao local!'))}`;
  else if (nb) prompt = `<b>E</b> — ${esc(L(CSHORT[nb]))}`;
  let call = '';
  if (m && m.ctask && m.ctask.called && Math.abs(m.x - CBUILD[m.ctask.bid].x) >= 70) call = `<div class="callbar"><b class="blink">📢</b> ${esc(L('Você foi chamado(a):'))} <b>${esc(L(m.ctask.label))}</b> <button class="btn small primary" data-ui="gotoC" data-arg="${m.ctask.bid}">${esc(L('Ir até lá'))}</button></div>`;
  return `<div class="hud-top"><div class="bars">${items.join('')}</div><div class="clock"><b>${esc(L('COLÔNIA · DIA'))} ${C.day}</b> ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}<br><small>${esc(C.site)}${C.storm > 0 ? ' · 🌪' : ''}</small></div></div>
    <div class="objbox"><b>${esc(L('MISSÃO PONTES-01b'))} ${doneN}/${obj.length}</b>${obj.map(o => `<div class="${o.done ? 'done' : ''}">${o.done ? '✔' : '▫'} ${esc(L(o.t))}</div>`).join('')}</div>
    ${call}<div class="hud-bottom"><div class="prompt">${prompt}</div>
    <div class="btns"><button class="btn small" data-ui="panel" data-arg="fund">[F] ${esc(L('Fundo'))} ${S.fund|0}</button><button class="btn small" data-ui="panel" data-arg="c:nave">${esc(L('Controle'))}</button><button class="btn small" data-ui="panel" data-arg="menu">☰</button></div></div>`;
}
function ctaskBar(bid) {
  const ws = (typeof colonyAll === 'function' ? colonyAll() : S.crew).filter(c => c.alive && c.ctask && c.ctask.bid === bid);
  return ws.map(c => `<div class="alert info">⏳ ${esc(c.name)}: ${esc(L(c.ctask.label))} ${bar(c.ctask.t, c.ctask.dur)} ${Math.abs(c.x - CBUILD[bid].x) < 70 ? '' : '<b class="orange">' + esc(L('(longe do local)')) + '</b>'}</div>`).join('');
}
function taskBtns(p) {
  const sp = taskSpec(p); if (!sp) return '';
  const err = sp.err || canPay(sp.cost);
  const bots_ = pickWorker(sp.role);
  const J_ = o => esc(JSON.stringify(o));
  return `<div class="row"><button class="btn ${err ? '' : 'primary'}" data-act="cTask" data-p='${J_(Object.assign({}, p, { call: 0 }))}' ${err ? 'disabled' : ''}>${esc(L('Eu faço'))}</button>
    <button class="btn" data-act="cTask" data-p='${J_(Object.assign({}, p, { call: 1 }))}' ${err || !bots_ ? 'disabled' : ''}>${esc(L('Chamar equipe'))}</button>
    <span class="small ${err ? 'orange' : 'muted'}">${esc(costTxt(sp.cost))}${err ? ' · ' + esc(L(err)) : ''}</span></div>`;
}
function buildBlock(id) {
  const C = S.colony, lv = C.b[id], max = CCOST[id].length - 1;
  const eff = { solar: '+14 kWh por dia por nível e mais capacidade de bateria.',
    agua: '+35 L por dia por nível (extração e filtragem do rio).',
    estufa: '+5 kg de comida por dia por nível (mais com solo analisado e agricultor).',
    torre: 'Permite transmitir dados à Terra; níveis melhoram o sinal.',
    pista: 'Necessária para receber naves; níveis aumentam a chance de um pouso seguro.',
    habitat: S.journey === 'curta' ? K('Habitat simples: +20 camas por nível, barato e rápido de montar (sem peças).', 'Simple habitat: +20 beds per level, cheap and quick to build (no parts).', 'Hábitat simple: +20 camas por nivel, barato y rápido de montar (sin piezas).') : '+20 camas por nível: é preciso ter cama para cada colono.' }[id];
  return `<p class="small">${esc(L(eff))}</p><p>${esc(L('Nível'))}: <b>${lv}/${max}</b> ${bar(lv, max)}</p>${lv < max ? taskBtns({ k: 'build', b: id }) : `<p class="green">✔ ${esc(L('Nível máximo'))}</p>`}`;
}
function colonyPanel(id) {
  const C = S.colony; const B = CBUILD[id]; let body = '';
  const sec = t => `<h4>${esc(L(t))}</h4>`;
  if (id === 'nave') {
    const obj = colonyObjectives();
    body = sec('Objetivos da missão') + obj.map(o => `<div class="alert ${o.done ? 'good' : 'info'}">${o.done ? '✔' : '▫'} ${esc(L(o.t))}</div>`).join('') +
      sec('Colônia') + `<div class="kv"><span>${esc(L('População'))}</span><b>${colonyPop()} (${alive().length} ${esc(L('tripulantes'))} + ${C.colonists} ${esc(L('colonos'))})</b><span>${esc(L('Camas'))}</span><b>${C.colonists}/${colonyBeds()}</b><span>${esc(L('Pacotes enviados'))}</span><b>${C.txCount}</b><span>${esc(L('Naves recebidas'))}</span><b>${C.shipsLanded}/3</b><span>${esc(L('Local'))}</span><b>${esc(C.site)}</b></div>` +
      sec('Mensagens da Terra') + `<div class="evlog">${C.feed.slice(-6).map(f => `<div>${esc(L(f.t))}</div>`).join('') || '<i>—</i>'}</div>` +
      sec('Tripulação') + crewList();
  } else if (id === 'lab') {
    const pending = PLANET_ANALYSES.filter(a => !S.planet.analyzed.includes(a.id));
    body = sec('Oficina de impressão 3D') + `<p class="small">${esc(L('Peças podem ser fabricadas com o solo local (regolito) e plástico reciclado. Cada obra grande precisa de peças.'))}</p>` + `<p>⚙ ${S.peças} ${esc(L('peças em estoque'))}</p>` + taskBtns({ k: 'fab' }) +
      sec('Análises de campo (sem risco)') +
      (pending.length ? pending.map(a => `<div class="opt"><b>${esc(T(a.name))}</b>${taskBtns({ k: 'an', a: a.id })}</div>`).join('') : `<p class="green">✔ ${esc(L('Todas as análises concluídas. Os resultados viram pacotes de dados para a Terra.'))}</p>`) +
      sec('Resultados') + S.planet.analyzed.map(a => `<p class="small">• <b>${esc(T(PLANET_ANALYSES.find(x => x.id === a).name))}:</b> ${esc(T(PLANET_ANALYSES.find(x => x.id === a).result))}</p>`).join('');
  } else if (id === 'torre') {
    body = buildBlock(id);
    if (C.b.torre >= 1) body += sec('Transmitir dados para a Terra') + `<p class="small">${esc(L('Cada pacote usa dados (GB) e energia. A qualidade do sinal depende da torre, da comunicação da nave e do pesquisador. Meta: 3 pacotes.'))}</p>` +
      TX_PACKAGES.map(pk => C.tx[pk.id] ? `<div class="opt on"><b>✔ ${esc(L(pk.name))}</b><span>${esc(L('Enviado à Terra'))}</span></div>` : `<div class="opt"><b>${esc(L(pk.name))}</b>${taskBtns({ k: 'tx', a: pk.id })}</div>`).join('');
  } else if (id === 'pista') {
    body = buildBlock(id);
    if (C.b.pista >= 1) {
      body += sec('Naves de tripulação (colonos)') + `<p class="small">${esc(L('Peça a nave à Terra (exige 1+ pacote enviado, pista, energia e camas livres). Durante a descida, alguém deve ir à pista e acender o farol (+4 no pouso)!'))}</p>` + ctaskBar('pista');
      body += CSHIPS.map(def => {
        const sh = C.ships.find(s => s.n === def.n);
        if (sh && sh.state === 'landed') return `<div class="opt on"><b>✔ ${def.name}</b><span>+${def.size} ${esc(L('colonos a bordo da colônia'))}</span></div>`;
        if (sh && sh.state === 'inbound') return `<div class="opt"><b>🛬 ${def.name} — ${Math.max(0, Math.ceil(sh.eta - sh.t))}s</b>${bar(sh.t, sh.eta)}<span>${sh.beacon ? '💡 ' + esc(L('Farol aceso')) : esc(L('Acenda o farol!'))}</span>${sh.beacon ? '' : taskBtns({ k: 'beacon' })}</div>`;
        return `<div class="opt"><b>${def.name}</b><span>${def.size} ${esc(L('colonos'))} · ${esc(L('traz suprimentos'))}</span><button class="btn tiny" data-act="cShip" data-p='${esc(JSON.stringify({ n: def.n }))}'>${esc(L('Pedir à Terra'))} (⚡12)</button></div>`;
      }).join('');
    }
  } else if (id === 'habitat') {
    body = buildBlock(id) + `<p>${esc(L('Camas'))}: <b>${C.colonists}/${colonyBeds()}</b> · ${esc(L('Naves previstas'))}: 10 + 15 + 20</p>`;
  } else body = buildBlock(id);
  if (id === 'nave') body += sec(K('Naves e colonos', 'Spaceships and colonists', 'Naves y colonos')) + arcaPeopleBlock();
  body += arcaPanelExtra(id);
  body = ctaskBar(id === 'nave' ? '__' : id) + body;
  return `<div class="modal-bg" data-ui="closePanel"><div class="panel station wide" data-stop="1"><button class="x" data-ui="closePanel">✕</button><h2>${B.icon} ${esc(L(B.name))}</h2>${body}<p class="quote small">🛰 ${esc(L(B.fact))}</p></div></div>`;
}
function colonyIntro() {
  return `<div class="modal-bg"><div class="panel center wide scroll" data-stop="1"><div class="introhead"><div><div class="blink cyan">● ${esc(L('PONTES-01b · SUPERFÍCIE'))}</div><h2>${esc(L('A MISSÃO CONTINUA'))}</h2></div><button class="btn primary big" data-act="cTut">${esc(L('Começar a construir ▶'))}</button></div>
    <p class="big">${esc(L(K('Pousamos em ' + S.colony.site + '! Mas uma colônia não se faz sozinha.', 'We landed at ' + T(S.colony.site) + '! But a colony does not build itself.', '¡Aterrizamos en ' + T(S.colony.site) + '! Pero una colonia no se construye sola.')))}</p>
    <div class="objgrid">${colonyObjectives().map(o => `<div class="alert info">▫ ${esc(L(o.t))}</div>`).join('')}</div>
    <p class="small">${esc(L('Ande com ← → (A/D) e use E nas construções. Você pode trabalhar sozinho ou chamar a equipe (bots/jogadores). Fique perto do local enquanto trabalha. Nenhuma construção funciona sem energia: comece pelo campo solar. Se faltar comida ou água por 3 dias, a colônia falha.'))}</p>
    <div class="row stickyfoot"><button class="btn primary big" data-act="cTut">${esc(L('Começar a construir ▶'))}</button></div></div></div>`;
}

// ---------- desvio de rota: planeta errado ----------
function drawDetourBg(dt) {
  spaceBg(); drawStars(1, dt);
  const exo = S.detour && EXOPLANETS.find(e => e.id === S.detour.id);
  drawPlanet(exo ? exo.trip.type : 'rock', 180, 150, 220, R.t * 0.5);
  const a = R.t * 0.4; drawShipExterior(180 + Math.cos(a) * 140, 150 + Math.sin(a) * 40, 0.7, false);
  text(exo ? exo.name.toUpperCase() : '', 12, 10, '#ff9f5a', 8);
}
