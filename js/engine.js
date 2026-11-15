// ============================================================
//  MOTOR — estado do jogo, simulação, tripulação e ações
// ============================================================
'use strict';

// ---------- Mundo 2D da nave (corte lateral) ----------
const WORLD_W = 1200;
const DECKS = { U: { top: 70, floor: 138 }, L: { top: 152, floor: 216 } };
const ROOMS = [
  { id: 'propulsao', name: 'PROPULSÃO', deck: 'U', x0: 60, x1: 210 },
  { id: 'comunicacao', name: 'COMUNICAÇÃO', deck: 'U', x0: 210, x1: 365 },
  { id: 'laboratorio', name: 'LABORATÓRIO', deck: 'U', x0: 365, x1: 520 },
  { id: 'enfermaria', name: 'ENFERMARIA', deck: 'U', x0: 520, x1: 690 },
  { id: 'avionica', name: 'AVIÔNICA', deck: 'U', x0: 690, x1: 860 },
  { id: 'ponte', name: 'PONTE DE COMANDO', deck: 'U', x0: 860, x1: 1130 },
  { id: 'tanques', name: 'TANQUES', deck: 'L', x0: 60, x1: 220 },
  { id: 'suporte', name: 'SUPORTE À VIDA', deck: 'L', x0: 220, x1: 430 },
  { id: 'estufa', name: 'ESTUFA', deck: 'L', x0: 430, x1: 640 },
  { id: 'cozinha', name: 'COZINHA E MESA', deck: 'L', x0: 640, x1: 830 },
  { id: 'eclusa', name: 'ECLUSA', deck: 'L', x0: 830, x1: 990 },
  { id: 'dormitorio', name: 'DORMITÓRIOS', deck: 'L', x0: 990, x1: 1130 },
];
const LADDERS = [340, 765, 1010];
const STATIONS = {
  motor: { name: 'Motores', x: 120, deck: 'U', sys: 'propulsao', kind: 'engine' },
  antena: { name: 'Rádio e antena', x: 280, deck: 'U', sys: 'comunicacao', kind: 'radio' },
  lab: { name: 'Laboratório', x: 445, deck: 'U', kind: 'lab' },
  enfermaria: { name: 'Enfermaria', x: 605, deck: 'U', kind: 'med' },
  avionica: { name: 'Computador de bordo', x: 790, deck: 'U', sys: 'avionica', kind: 'computer' },
  ponte: { name: 'Painel de pilotagem', x: 960, deck: 'U', kind: 'helm' },
  termico: { name: 'Painel térmico', x: 1075, deck: 'U', sys: 'termico', kind: 'thermal' },
  tanqueAux: { name: 'Tanque auxiliar', x: 95, deck: 'L', sys: 'tanques', kind: 'tank' },
  bomba: { name: 'Bomba de combustível', x: 175, deck: 'L', sys: 'tanques', kind: 'pump' },
  suporte: { name: 'Suporte à vida', x: 270, deck: 'L', sys: 'suporte', kind: 'life' },
  lixo: { name: 'Compactador de lixo', x: 400, deck: 'L', kind: 'trash' },
  estufa: { name: 'Estufa', x: 535, deck: 'L', kind: 'farm' },
  cozinha: { name: 'Cozinha e mesa', x: 715, deck: 'L', kind: 'kitchen' },
  eclusa: { name: 'Eclusa', x: 905, deck: 'L', sys: 'acoplamento', kind: 'airlock' },
  dormitorio: { name: 'Dormitórios', x: 1075, deck: 'L', kind: 'bed' },
};

const RES_META = [
  { id: 'energia', name: 'Energia', unit: 'kWh', icon: '⚡' },
  { id: 'combustivel', name: 'Combustível', unit: 'kg', icon: '⛽' },
  { id: 'oxigenio', name: 'Oxigênio', unit: 'kg', icon: 'O₂' },
  { id: 'agua', name: 'Água', unit: 'L', icon: '💧' },
  { id: 'comida', name: 'Comida (ração)', unit: 'kg', icon: '🍱' },
  { id: 'plantacao', name: 'Plantação', unit: 'kg', icon: '🌱' },
  { id: 'escudo', name: 'Escudo térmico', unit: 'mm', icon: '🛡' },
  { id: 'casco', name: 'Casco', unit: '%', icon: '▣' },
  { id: 'dados', name: 'Dados científicos', unit: 'GB', icon: '💾' },
  { id: 'medicos', name: 'Recursos médicos', unit: 'un', icon: '✚' },
  { id: 'lixo', name: 'Lixo', unit: 'kg', icon: '🗑', inverse: true },
];

// ---------- Utilidades ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const d20 = () => 1 + Math.floor(Math.random() * 20);
const d10 = () => 1 + Math.floor(Math.random() * 10);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
// números no formato do idioma (1.5 em inglês, 1,5 em português/espanhol)
const fmt = (v, d = 1) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString(typeof I18n !== 'undefined' && I18n.lang === 'en' ? 'en-US' : typeof I18n !== 'undefined' && I18n.lang === 'es' ? 'es-ES' : 'pt-BR');
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Persistência (créditos, loja, avatar) ----------
const SAVE_KEY = 'pontes01_save_v1';
const Save = {
  data: { credits: 0, owned: [], avatar: null, settings: { music: 0.6, sfx: 0.7, narration: true, showDice: false, fastEarth: false }, best: null, runs: 0 },
  load() { try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (d) Object.assign(this.data, d, { settings: Object.assign({}, this.data.settings, d.settings || {}) }); } catch (e) { /* sem storage */ } },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ } },
  owns(id) { return this.data.owned.includes(id); },
};
Save.load();

function shopBonus() {
  let moral = 0, eff = 0;
  for (const it of SHOP) if (Save.owns(it.id)) { moral += it.moral || 0; eff += it.eff || 0; }
  return { moral, eff };
}

// ---------- Estado ----------
let S = null; // estado global da partida (serializável)

function blankSetup() {
  return { origin: 'astronauta', skills: [], route: 'equilibrada', modules: [], upgrades: [], reserves: [], training: [], gadgets: [], pantry: [] };
}
function setupCost(st) {
  let c = 0;
  const add = (list, cat) => list.forEach(id => { const it = cat.find(x => x.id === id); if (it) c += it.pts; });
  add(st.skills, SKILLS); add(st.modules, MODULES); add(st.upgrades, UPGRADES); add(st.reserves, RESERVES);
  add(st.training, TRAINING); add(st.gadgets, GADGETS); add(st.pantry, PANTRY);
  return c;
}
function setupSlots(st) { return st.modules.reduce((s, id) => s + (MODULES.find(m => m.id === id).slots), 0); }
function setupBudget() { return BUDGET + (Save.owns('verba') ? 3 : 0) + (S && S.earthBonus ? S.earthBonus : 0); }

function has(id) {
  if (!S) return false;
  const st = S.setup;
  return st.modules.includes(id) || st.upgrades.includes(id) || st.reserves.includes(id) || st.training.includes(id) ||
    st.gadgets.includes(id) || st.pantry.includes(id) || st.skills.includes(id);
}

function newGame(journey, mode) {
  const cmdAvatar = Object.assign({}, DEFAULT_AVATAR, Save.data.avatar || {});
  const names = shuffle(CREW_NAMES.slice());
  const crew = [{
    id: 'cmd', role: 'comandante', roleName: 'Comandante', name: (cmdAvatar.name && cmdAvatar.name !== 'Comandante') ? cmdAvatar.name : 'Commander', avatar: cmdAvatar,
  }];
  ROLES.forEach((r, i) => crew.push({ id: r.id, role: r.id, roleName: roleForName(r.name, names[i]), name: names[i], avatar: Object.assign(randomAvatar(Math.random, FEM_NAMES.includes(names[i])), { name: names[i] }) }));
  crew.forEach((c, i) => Object.assign(c, {
    alive: true, status: 'ok', statusT: 0, humor: 85 + Math.floor(Math.random() * 10), saciedade: 90, nutricao: 80, nut: [80, 80, 80],
    x: 0, deck: 'U', tx: 0, tdeck: 'U', climb: 0, face: 1, walkT: 0, moving: false, task: null, idleT: Math.random() * 4,
    bubble: null, owner: c.id === 'cmd' ? 'host' : null, likes: [], avoid: [], allergy: [], sickness: null, noFoodDays: 0,
    outfit: 'suit', hibernating: false,
  }));
  // gostos sorteados a cada partida (como sugere o documento)
  crew.forEach(c => {
    const r = ROLES.find(x => x.id === c.role);
    if (r && Math.random() < 0.6) { c.likes = r.likes.slice(); c.avoid = r.avoid.slice(); c.allergy = r.allergy.slice(); }
    else {
      const tags = shuffle(FOOD_TAGS.slice());
      c.likes = [tags[0]]; c.avoid = Math.random() < 0.6 ? [tags[1]] : []; c.allergy = Math.random() < 0.25 ? [tags[2]] : [];
      if (r && r.allergy.length) c.allergy = r.allergy.slice();
    }
  });
  S = {
    v: 0, mode: mode || 'solo', journey, scene: 'intro', setup: blankSetup(), setupStep: 0,
    day: 1, dayT: 0, dayLen: 30, totalDays: journey === 'curta' ? 12 : 30, progress: 0, stage: 0,
    cruise: 'normal', speedMod: 1, paused: false,
    res: {}, cap: {}, flowsTotal: {}, flowsDay: {}, flowsYesterday: {},
    systems: {}, crew, event: null, schedule: [], eventsDone: [], eventN: 0,
    points: 0, fund: 0, peças: 0, adubo: 0,
    meds: { validUntil: 12 }, food: { racionamento: 'pleno', menu: ['racao', 'racao', 'racao'], mesa: 'revezamento', fresh: {}, dishes: {}, recipes: [], banquete: false, meals: 0, waste: 0, produced: 0, wasted: 0, mesaDays: 0, lastMeal: -1 },
    trays: [], log: [], toast: null, narration: null, tutorial: 0,
    dead: [], fail: null, ending: null, failsInPhase: 0, stats: { thermalKwh: 0, thermalFuel: 0, events: [], kwhFood: 0, waterFood: 0 },
    explore: { analyzed: [], chosen: null, trades: 0 }, planet: { analyzed: [], challenges: [], site: null },
    trash: [], researchOn: true, equipOff: false, commDown: 0, alarm: 0, o2Zero: 0, waterZero: 0, cylinders: false,
    oneShot: {}, journeyTime: 0,
  };
  return S;
}

// Aplica a montagem ao estado (chamado na decolagem)
function applySetup() {
  const st = S.setup;
  const route = ROUTES.find(r => r.id === st.route);
  S.totalDays = Math.round((S.journey === 'curta' ? 12 : 30) * route.days);
  // a ração dá certinho para a viagem com a porção MÉDIA (0,4 kg/pessoa/dia): normal falta, mínima sobra
  const foodKg = Math.ceil(0.4 * 7 * S.totalDays * (S.journey === 'curta' ? 0.93 : 1.08)); // curta: margem bem justa
  S.res = { energia: 60, combustivel: 500, escudo: 50, casco: 100, agua: 600, oxigenio: 90, comida: foodKg, plantacao: 40, dados: 200, medicos: 10, lixo: 0 };
  S.cap = { energia: 60, combustivel: 500, escudo: 50, casco: 100, agua: 600, oxigenio: 90, comida: foodKg, plantacao: 40, dados: 400, medicos: 10, lixo: 40 };
  const addR = (k, v) => { S.res[k] += v; S.cap[k] = Math.max(S.cap[k], S.res[k]); };
  if (has('tanqueExtra')) { addR('combustivel', 100); }
  if (has('baterias')) { S.cap.energia += 20; S.res.energia += 20; }
  if (has('cisterna')) addR('agua', 150);
  if (has('cilindros')) addR('oxigenio', 20);
  if (has('sementesEstoque')) addR('plantacao', 10);
  if (has('kitMedico')) addR('medicos', 6);
  if (has('pecas')) S.peças += 1;
  if (has('armazenamento')) { S.cap.dados += 100; }
  if (has('racaoExtra')) addR('comida', 30);
  if (Save.owns('pecaInicial')) S.peças += 1;
  if (Save.owns('bateriaReserva')) { S.cap.energia += 10; S.res.energia += 10; }
  for (const k of Object.keys(SYSTEMS)) S.systems[k] = { hp: 100 };
  if (Save.owns('cascoExtra')) S.systems.casco.hp = 100;
  S.fund = setupBudget() - setupCost(st);
  // a nave já sai com cozinha equipada (não entra mais na compra)
  if (!st.pantry.includes('cozinha')) st.pantry.push('cozinha');
  if (has('livro')) S.food.recipes = ['salada', 'ensopado', 'tortilha'];
  // horta
  const nTrays = has('estufa') ? 12 : (has('ervas') ? 2 : 0);
  S.trays = [];
  for (let i = 0; i < nTrays; i++) S.trays.push({ crop: null, g: 0, luz: 80, agua: 80, nutr: 80, state: 'vazio', readyT: 0 });
  S.food.fresh = { alface: 0, batata: 0, soja: 0, pimenta: 0, algas: 0 };
  // agenda de eventos
  buildSchedule();
  RES_META.forEach(r => { S.flowsTotal[r.id] = {}; S.flowsDay[r.id] = {}; });
  // posições iniciais
  S.crew.forEach(c => {
    const home = c.id === 'cmd' ? STATIONS.ponte : STATIONS[ROLES.find(r => r.id === c.role).home];
    c.x = home.x + (Math.random() * 30 - 15); c.deck = home.deck; c.tx = c.x; c.tdeck = c.deck;
  });
}

function buildSchedule() {
  const route = ROUTES.find(r => r.id === S.setup.route);
  const n = S.journey === 'curta' ? 4 : 9;
  const pool = ['termico', 'asteroides', 'combFalta', 'combVaz', 'oxigenio', 'painel', 'lixo', 'radio', 'contaminacao', 'traje', 'doenca', 'tempestade', 'prateleira', 'destrocos'];
  const weight = { asteroides: route.risk, tempestade: route.risk, termico: 1.2 };
  const chosen = [];
  const bag = pool.slice();
  while (chosen.length < n && bag.length) {
    const tot = bag.reduce((s, t) => s + (weight[t] || 1), 0);
    let r = Math.random() * tot, idx = 0;
    for (; idx < bag.length; idx++) { r -= weight[bag[idx]] || 1; if (r <= 0) break; }
    chosen.push(bag.splice(Math.min(idx, bag.length - 1), 1)[0]);
  }
  // espalha os eventos pela viagem (evita o 1º dia e a parada na estação)
  const days = S.totalDays;
  // o 1º dia (e o 2º na jornada longa) é só para aprender: o primeiro desafio vem depois
  const start = S.journey === 'curta' ? 2.5 : 3.2;
  S.schedule = chosen.map((type, i) => ({ type, day: start + (i + 0.3 + Math.random() * 0.5) * (days - start - 0.5) / n }));
  S.schedule.sort((a, b) => a.day - b.day);
}

// ---------- Recursos e fluxos ----------
function addRes(k, v, reason) {
  if (!S.res.hasOwnProperty(k)) return;
  const before = S.res[k];
  // estoques recebidos além da capacidade inicial (trocas, colheitas) ampliam o depósito em vez de sumir
  if (v > 0 && S.cap[k] != null && ['comida', 'plantacao', 'agua', 'oxigenio', 'medicos'].includes(k) && before + v > S.cap[k]) S.cap[k] = before + v;
  S.res[k] = clamp(before + v, 0, S.cap[k] != null ? S.cap[k] * (k === 'lixo' ? 10 : 1) : 1e9);
  const real = S.res[k] - before;
  if (!reason) return real;
  const ft = S.flowsTotal[k] || (S.flowsTotal[k] = {}), fd = S.flowsDay[k] || (S.flowsDay[k] = {});
  ft[reason] = (ft[reason] || 0) + real; fd[reason] = (fd[reason] || 0) + real;
  return real;
}
const alive = () => S.crew.filter(c => c.alive);
const crewById = id => S.crew.find(c => c.id === id) || (S.colony && S.colony.people ? S.colony.people.find(c => c.id === id) : undefined); // inclui colonos (Arcas)
const byRole = role => S.crew.filter(c => c.role === role || (role === 'engenheiro' && (c.role === 'engenheiro1' || c.role === 'engenheiro2')));
function available(c) { return c && c.alive && !c.hibernating && c.status !== 'incapacitado' && !c.task && !(c.status === 'ferido' && c.statusT > 0); }
function roleAvailable(role) { return byRole(role).find(available); }
function roleAlive(role) { return byRole(role).some(c => c.alive); }

// ---------- Funções da tripulação no multiplayer ----------
// Quem tem a função é chamado primeiro (jogador real ou bot). Se um jogador não
// for até a estação a tempo, um bot da mesma função assume.
const CALL_TIMEOUT = 45;
const isHumanCrew = c => !!(c && c.owner && c.owner !== 'bot');
function pickForRole(role, except) {
  const cands = byRole(role).filter(c => available(c) && c.id !== except);
  return cands.find(isHumanCrew) || cands.find(c => !isHumanCrew(c)) || null;
}
function pickBotForRole(role, except) {
  const free = alive().filter(c => available(c) && !isHumanCrew(c) && c.id !== 'cmd' && c.id !== except);
  return free.find(c => byRole(role).includes(c)) || free[0] || null;
}
function callCrew(c, task, role) {
  if (isHumanCrew(c)) {
    assignTask(c, Object.assign({}, task, { called: true, wait: 0, role: role || null }));
    toast(`📢 ${c.name} foi chamado(a): ${task.label}`, 'info');
  } else assignTask(c, task);
}
function handOffCall(c) {
  const t = c.task; c.task = null; S.v++;
  const step = t.key === 'evStep' && S.event ? S.event.steps.find(s => s.id === (t.data || {}).step) : null;
  if (step && step.claimed === c.id) step.claimed = null;
  const bot = pickBotForRole(t.role || 'engenheiro', c.id);
  if (!bot) return toast(`${c.name} não atendeu o chamado.`, 'warn');
  if (step) step.claimed = bot.id;
  assignTask(bot, Object.assign({}, t, { called: false, t: 0 }));
  toast(`${c.name} não atendeu o chamado; ${bot.name} assumiu.`, 'warn');
}

function moralIndex() {
  const a = alive().filter(c => !c.hibernating);
  if (!a.length) return 0;
  return clamp(a.reduce((s, c) => s + c.humor, 0) / a.length + shopBonus().moral + (has('mascote') ? 2 : 0), 0, 100);
}
function effIndex() {
  const a = alive();
  if (!a.length) return 0;
  let e = 82 + shopBonus().eff;
  for (const c of a) {
    if (c.status === 'ferido') e -= 4; if (c.status === 'incapacitado') e -= 7; if (c.sickness) e -= 5;
    if (c.saciedade < 30) e -= 3;
    if (c.nut && c.nut[2] < 25) e -= 3; // sem vitaminas: cansaço
    if (c.nut && (c.nut[0] < 20 || c.nut[1] < 20)) e -= 2;
  }
  const m = moralIndex(); if (m < 40) e -= 10; else if (m < 60) e -= 4;
  e -= (6 - (a.length - 1)) * 3;
  if (S.food.racionamento === 'minimo') e -= 9;
  return clamp(e, 5, 100);
}
function sysHp(k) { return S.systems[k] ? S.systems[k].hp : 100; }
// v = gravidade base (1 = ocorrência média); o nível do sistema define a % descontada (Baixo 10 · Médio 20 · Alto 30)
function damageSys(k, v) { if (S.systems[k]) S.systems[k].hp = clamp(S.systems[k].hp - v * DMG_PCT[SYSTEMS[k].dmg] / 20, 0, 100); }

// moral: altera humor de todos (ou de um tripulante)
function moral(v, who) {
  const list = who ? [who] : alive();
  for (const c of list) {
    let d = v;
    if (v < 0 && S.setup.origin === 'medico' && !who) d = Math.min(0, v + 1);
    c.humor = clamp(c.humor + d, 0, 100);
  }
}

// ---------- Mensagens ----------
const ptOf = t => (t && typeof t === 'object') ? t.pt : t;
function logMsg(text, kind = 'info') {
  S.log.push({ t: Date.now(), day: S.day, text: ptOf(text), kind });
  if (S.log.length > 60) S.log.shift();
  S.v++;
}
function say(id, text, dur = 5) {
  const c = typeof id === 'string' ? crewById(id) : id;
  if (!c || !c.alive) return;
  c.bubble = { text, t: dur };
  logMsg(`${c.roleName} ${c.name}: “${ptOf(text)}”`, 'say');
}
function sayRole(role, text, dur) { const c = byRole(role).find(x => x.alive); if (c) say(c, text, dur); else logMsg(ptOf(text), 'say'); }
function toast(text, kind = 'info') { S.toast = { text, kind, t: 4, id: Math.random() }; logMsg(ptOf(text), kind); }
function narrate(text) { S.narration = { text, id: Math.random() }; logMsg('Narração: ' + ptOf(text), 'narr'); }

// ---------- Movimento ----------
function nearestLadder(x) { return LADDERS.reduce((b, l) => Math.abs(l - x) < Math.abs(b - x) ? l : b, LADDERS[0]); }
function stepMove(c, dt) {
  const sp = (c.status === 'ferido' ? 38 : 62) * (c.sickness ? 0.7 : 1);
  if (c.climb > 0) { c.climb -= dt; if (c.climb <= 0) c.deck = c.climbTo; c.moving = true; return; }
  let goal = c.tx;
  if (c.deck !== c.tdeck) goal = nearestLadder(c.x);
  const dx = goal - c.x;
  if (Math.abs(dx) < 1.5) {
    c.x = goal;
    if (c.deck !== c.tdeck) { c.climb = 0.7; c.climbTo = c.tdeck; c.moving = true; return; }
    c.moving = false; return;
  }
  c.face = dx > 0 ? 1 : -1;
  c.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
  c.moving = true; c.walkT += dt;
}
function goTo(c, stationId, off = 0) {
  const st = STATIONS[stationId];
  c.tx = st.x + off; c.tdeck = st.deck;
}
function atStation(c, stationId, tol = 18) {
  const st = STATIONS[stationId];
  return c.deck === st.deck && Math.abs(c.x - st.x) <= tol && c.climb <= 0;
}
// console bem à frente do personagem (usado pelo Espaço, que também pula)
function stationAt(c) { if (!c) return null; for (const id in STATIONS) { const st = STATIONS[id]; if (st.deck === c.deck && Math.abs(st.x - c.x) < 22) return id; } return null; }
function stationNear(c) {
  if (!c || c.climb > 0) return null;
  let best = null, bd = 22;
  for (const id in STATIONS) {
    const st = STATIONS[id];
    if (st.deck !== c.deck) continue;
    const d = Math.abs(st.x - c.x);
    if (d < bd) { bd = d; best = id; }
  }
  if (best) return best;
  // em qualquer ponto da sala (perto do motor, dos tanques, das camas…), vale o console daquela sala
  const room = ROOMS.find(r => r.deck === c.deck && c.x >= r.x0 && c.x <= r.x1);
  if (!room) return null;
  let bd2 = 1e9;
  for (const id in STATIONS) { const st = STATIONS[id]; if (st.deck !== c.deck || st.x < room.x0 || st.x > room.x1) continue; const d = Math.abs(st.x - c.x); if (d < bd2) { bd2 = d; best = id; } }
  return best;
}

// ---------- Tarefas (executadas por qualquer tripulante: jogador, bot ou jogador remoto) ----------
// task = { station, dur, t, label, key, data }
function assignTask(c, task) {
  c.task = Object.assign({ t: 0 }, task);
  if (!c.owner || c.owner === 'bot') goTo(c, task.station, (Math.random() * 10 - 5));
  S.v++;
}
function taskSpeed(c) {
  let s = effIndex() / 82;
  if (c.status === 'ferido') s *= 0.6;
  if (c.sickness) s *= 0.7;
  if (c.humor < 25) s *= 0.8; // cansado (humor/sono baixo) trabalha mais devagar
  return clamp(s, 0.3, 1.4);
}
const TASK_DONE = {}; // preenchido por events.js / ui

function tickCrew(dt) {
  const bigEvent = S.event && S.event.phase === 'run';
  for (const c of S.crew) {
    if (!c.alive) continue;
    if (c.bubble) { c.bubble.t -= dt; if (c.bubble.t <= 0) c.bubble = null; }
    if (c.statusT > 0) { c.statusT -= dt * (has('enfermaria') ? 1.6 : 1) * (c.nut && c.nut[2] < 25 ? 0.6 : 1); if (c.statusT <= 0) { c.status = 'ok'; c.statusT = 0; if (c.id !== 'cmd') say(c, F('crew.c17')); } }
    if (c.hibernating) continue;
    const isHuman = c.owner && c.owner !== 'bot';
    if (c.task) {
      if (atStation(c, c.task.station, 20)) {
        c.task.t += dt * taskSpeed(c);
        c.moving = false;
        if (c.task.t >= c.task.dur) {
          const t = c.task; c.task = null; S.v++;
          const fn = TASK_DONE[t.key]; if (fn) fn(c, t.data || {});
        }
      } else if (!isHuman) {
        goTo(c, c.task.station, 0);
      } else if (c.task.called && c.task.t === 0 && c.id !== U.me) {
        c.task.wait = (c.task.wait || 0) + dt;
        if (c.task.wait > CALL_TIMEOUT) handOffCall(c);
      }
    } else if (!isHuman) {
      // IA dos bots: ficam no posto, vão à mesa, passeiam
      c.idleT -= dt;
      if (c.idleT <= 0) {
        c.idleT = 6 + Math.random() * 10;
        const r = ROLES.find(x => x.id === c.role);
        const home = r ? r.home : 'ponte';
        let dest = home;
        if (!bigEvent) {
          const roll = Math.random();
          if (roll < 0.12) dest = 'cozinha'; else if (roll < 0.2) dest = 'dormitorio'; else if (roll < 0.26 && has('cupula')) dest = 'lab';
        }
        if (S.food.mesaNow > 0) dest = 'cozinha';
        const night = S.dayT / S.dayLen > 0.82 || S.dayT / S.dayLen < 0.06;
        if (!bigEvent && (c.humor < 35 || (night && c.humor < 75))) { assignTask(c, { station: 'dormitorio', dur: 9, label: 'Dormir', key: 'sleep' }); continue; }
        goTo(c, dest, Math.random() * 40 - 20);
      }
    }
    if (!isHuman) stepMove(c, dt);
  }
}

// ---------- Simulação diária ----------
function routeObj() { return ROUTES.find(r => r.id === S.setup.route); }
function cruiseObj() { return { economico: { speed: 0.85, fuel: 0.7 }, normal: { speed: 1, fuel: 1 }, acelerado: { speed: 1.2, fuel: 1.5 } }[S.cruise]; }

function simulate(dt) {
  const f = dt / S.dayLen; // fração de dia
  const people = alive();
  const n = people.reduce((s, c) => s + (c.hibernating ? 0.1 : 1), 0);
  const econ = has('economia') ? 0.95 : 1;
  const sup = sysHp('suporte') / 100;
  // Oxigênio
  let o2use = NASA.o2PorPessoaDia * n * econ * (S.cylinders ? 1.6 : 1);
  if (S.res.energia < 12) o2use *= 1.25; // suporte em alerta
  addRes('oxigenio', -o2use * f, 'Respiração da tripulação');
  if (!S.cylinders && S.res.energia > 0 && S.res.agua > 5 && !(S.event && S.event.type === 'oxigenio' && S.event.phase === 'run')) {
    addRes('oxigenio', NASA.ogsO2Dia * sup * f, 'Eletrólise (OGS)');
    addRes('agua', -NASA.ogsAguaDia * sup * f, 'Eletrólise (OGS)');
    addRes('energia', -3 * f, 'Eletrólise (OGS)');
  }
  if (has('estufa') && S.res.plantacao > 5) addRes('oxigenio', 1.0 * f, 'Estufa (fotossíntese)');
  if (has('biorreator')) { addRes('oxigenio', 2.0 * f, 'Biorreator de algas'); addRes('energia', -2 * f, 'Biorreator de algas'); addRes('agua', -1 * f, 'Biorreator de algas'); }
  // Água (reciclagem WRS)
  let recov = has('reciclaAgua') ? NASA.recuperacaoAguaCiclo : NASA.recuperacaoAguaBase;
  if (Save.owns('filtroAgua')) recov = Math.min(0.99, recov + 0.05);
  if (S.event && S.event.type === 'contaminacao' && S.event.phase === 'run') recov = 0;
  recov *= (0.5 + 0.5 * sup);
  const wUse = NASA.aguaPorPessoaDia * n * econ;
  addRes('agua', -wUse * f, 'Consumo da tripulação');
  addRes('agua', wUse * recov * f, 'Reciclagem de água (WRS)');
  // Energia
  addRes('energia', 18 * f, 'Gerador base (RTG)');
  if (has('solar')) addRes('energia', 8 * (sysHp('casco') > 30 ? 1 : 0.5) * f, 'Painéis solares');
  if (has('fusao')) addRes('energia', 20 * f, 'Reator de fusão');
  addRes('energia', -(S.equipOff ? 2 : 4) * f, 'Sistemas de bordo');
  addRes('energia', -6 * f, 'Suporte à vida');
  if (has('escudoMag')) addRes('energia', -3 * f, 'Escudo magnético');
  if (has('lab') && S.researchOn && !S.equipOff) addRes('energia', -1 * f, 'Laboratório');
  const activeTrays = S.trays.filter(t => t.crop).length;
  if (activeTrays) { addRes('energia', -0.25 * activeTrays * f, 'Horta (luz LED)'); S.stats.kwhFood += 0.25 * activeTrays * f; }
  // Dados científicos
  if (S.researchOn && !S.equipOff && roleAlive('pesquisador')) {
    let gb = 4 * (has('lab') ? 2 : 1) * (has('sonda') && has('lab') ? 2 : 1) + (has('cupula') ? 1 : 0) + (S.setup.origin === 'cientista' ? 2 : 0);
    addRes('dados', gb * f, 'Pesquisa a bordo');
  }
  // Combustível e progresso
  const stopped = S.stage !== 1 || (S.event && S.event.stopShip);
  if (!stopped) {
    const route = routeObj(), cr = cruiseObj();
    let fuel = 8 * route.fuel * cr.fuel * (sysHp('propulsao') < 50 ? 1.3 : 1) * (has('motorEf') ? 0.85 : 1) * massFactor() * (S.dvShort ? 1.2 : 1); // massa: nave pesada gasta mais
    if (S.res.combustivel > 0) {
      addRes('combustivel', -fuel * f, 'Propulsão de cruzeiro');
      let sp = cr.speed * S.speedMod * (sysHp('avionica') < 40 ? 0.8 : 1);
      S.progress = Math.min(1, S.progress + sp * f / (S.totalDays));
    }
    if (sysHp('tanques') < 40) addRes('combustivel', -2 * f, 'Microvazamento nos tanques');
  }
  // Lixo
  addRes('lixo', NASA.lixoPorPessoaDia * n * f, 'Lixo gerado');
  const tm = trashMode();
  if (tm === 'reciclar' && S.res.lixo > 0.5) {
    const conv = Math.min(S.res.lixo, 1.4 * f);
    addRes('lixo', -conv, 'Reciclador de lixo'); addRes('energia', -0.4 * conv, 'Reciclador de lixo');
    S.adubo += conv; S.recycled = (S.recycled || 0) + conv;
    if (has('impressora') && S.recycled >= 6) { S.recycled -= 6; S.peças += 1; toast('Oficina 3D: lixo reciclado virou 1 peça de reparo.'); }
  } else if (tm === 'compostar' && S.res.lixo > 0.5) {
    const conv = Math.min(S.res.lixo, 0.7 * f);
    addRes('lixo', -conv, 'Compostagem'); S.adubo += conv * 0.5;
  } else if (tm === 'ejetar' && S.res.lixo > 8) {
    const kg = S.res.lixo - 2; addRes('lixo', -kg, 'Ejetado pela eclusa'); S.food.wasted += kg * 0.3;
    if (!S.oneShot.ejectInfo) { S.oneShot.ejectInfo = true; toast('Descarte automático: lixo ejetado pela eclusa (nada é reaproveitado).'); }
  }
  // Humor diário
  for (const c of people) {
    if (c.hibernating) { c.humor = clamp(c.humor + 1 * f, 0, 100); continue; }
    let decay = 1.0 * (S.setup.route === 'segura' ? 1.5 : 1);
    if (has('bemestar')) decay *= 0.5;
    if (has('jogos')) decay -= 0.3;
    if (has('cupula')) decay -= 0.3;
    if (S.res.lixo > 15) decay += 1;
    if (S.food.racionamento === 'pleno') decay -= 0.5; // porção cheia: tripulação mais feliz
    if (S.food.racionamento === 'reduzido') decay += 0.3;
    if (S.food.racionamento === 'minimo') decay += 5;
    if (c.sickness) decay += 4;
    c.humor = clamp(c.humor - decay * f, 0, 100);
    // a fome desce no mesmo ritmo do sono (humor acordado)
    c.saciedade = clamp(c.saciedade - 1 * (Math.max(0, decay) + 4) * f, 0, 100); // fome no mesmo ritmo do sono
    // o humor também é o sono: acordado ele cai um pouco mais; dormir (Dormitórios) recupera
    if (!(c.task && c.task.key === 'sleep')) c.humor = clamp(c.humor - 4 * f, 0, 100);
    else c.humor = clamp(c.humor + 60 * f, 0, 100); // dormindo: recupera aos poucos, além do bônus ao acordar
    if (!c.nut) c.nut = [80, 80, 80];
    for (let k = 0; k < 3; k++) c.nut[k] = clamp(c.nut[k] - 35 * f, 0, 100);
    c.nutricao = (c.nut[0] + c.nut[1] + c.nut[2]) / 3;
    if (c.sickness) { c.sickT = (c.sickT || 0) + f; }
  }
  // Morte por falta de O2/água (limite de tempo real)
  if (S.res.oxigenio <= 0) { S.o2Zero += dt; if (S.o2Zero > 20) { S.o2Zero = 0; killRandom('falta de oxigênio'); } } else S.o2Zero = 0;
  if (S.res.agua <= 0) { S.waterZero += dt; if (S.waterZero > 40) { S.waterZero = 0; killRandom('desidratação'); } } else S.waterZero = 0;
  if (S.res.energia <= 0 && !S.blackout) {
    S.blackout = true; moral(-20); toast('ENERGIA ZERADA! Todos os sistemas pararam. Dois tripulantes desmaiaram.', 'bad');
    alive().filter(c => c.id !== 'cmd').slice(0, 2).forEach(c => { c.status = 'incapacitado'; c.statusT = 20; });
  }
  if (S.res.energia > 5) S.blackout = false;
}

function killRandom(cause) {
  const cands = alive().filter(c => c.id !== 'cmd');
  const victim = cands.length ? pick(cands) : crewById('cmd');
  kill(victim, cause);
}
function kill(c, cause) {
  if (!c || !c.alive) return;
  c.alive = false; c.task = null;
  S.dead.push({ name: c.name, role: c.roleName, cause, day: S.day });
  toast(`☠ ${c.roleName} ${c.name} morreu (${cause}).`, 'bad');
  moral(-15);
  checkFail();
}
function checkFail() {
  if (S.fail) return;
  const cmd = crewById('cmd');
  const a = alive();
  if (!cmd.alive) return fail('O Comandante morreu. A missão falhou.');
  if (a.length < 3) return fail('Restaram menos de 3 tripulantes vivos.');
  if (!roleAlive('agricultor') && !roleAlive('engenheiro')) return fail('O agricultor e os engenheiros morreram: não há como manter a nave nem plantar.');
  if (S.res.casco <= 0 || sysHp('casco') <= 0) return fail('O casco cedeu. A nave foi perdida.');
  if (S.stage === 1 && S.res.combustivel <= 0 && S.progress < 1) return fail('O combustível acabou. A nave ficou à deriva no espaço.');
}
// já chegou a Pontes-01b? (órbita, migração ou colônia)
function onPlanet() { return !!S && (['planet', 'migration', 'colony'].includes(S.scene) || S.stage >= 3); }
// fim da jornada em Pontes-01b quando não há mais como avançar: conta como final bom
function planetEnding(note) {
  if (!S || S.scene === 'end') return;
  // ainda em órbita (sem colônia) e com tripulação: em vez de encerrar, a nave faz um pouso forçado e a colônia começa
  if (!S.colony && ['planet', 'migration'].includes(S.scene) && S.crew.filter(c => c.alive).length >= 3 && crewById('cmd') && crewById('cmd').alive && typeof startColony === 'function') {
    const site = LANDING_SITES.find(x => x.id === (S.planet && S.planet.site)) || bestSite();
    S.planet = S.planet || {}; S.planet.site = site.id;
    damageSys('casco', 20); moral(-5);
    toast('Pouso forçado em Pontes-01b! A colônia começa em condições difíceis.', 'bad');
    startColony(site, 1);
    return;
  }
  const C = S.colony;
  const site = C ? C.site : (S.planet && S.planet.site && (LANDING_SITES.find(x => x.id === S.planet.site) || {}).name) || 'Pontes-01b';
  addPoints(C ? 120 : 80, 'Chegada a Pontes-01b');
  S.scene = 'end'; S.stage = 6;
  S.ending = { ok: true, site, score: (C && C.score) || 0, colony: !!C, note };
  logMsg(note, 'good');
  try { Save.data.runs++; if (!Save.data.best || S.points > Save.data.best) Save.data.best = S.points; Save.write(); } catch (e) { /* */ }
  S.v++;
}
// estágios em que não é mais possível ganhar: encerra a jornada
function checkStuck(dt) {
  if (!S || S.fail || S.scene === 'end' || (typeof Net !== 'undefined' && Net.role === 'client')) return;
  const sc = S.scene;
  if (['ship', 'station', 'detour'].includes(sc)) {
    S.stuckPower = S.res.energia < 1 ? (S.stuckPower || 0) + dt / S.dayLen : 0;
    if (S.stuckPower >= 1.5) return fail('Sem energia por dias: os sistemas pararam de vez e a nave não consegue mais seguir viagem.');
    const fresh = Object.values(S.food.fresh || {}).reduce((a, b) => a + b, 0) + Object.values(S.food.dishes || {}).reduce((a, b) => a + b, 0);
    const canGrow = S.trays.some(t => t.crop) || (S.trays.length && S.res.plantacao >= 0.5);
    if (S.res.comida < 0.05 && fresh < 0.2 && !canGrow) {
      S.stuckFood = (S.stuckFood || 0) + dt / S.dayLen;
      if (S.stuckFood >= 0.5 && !S.stuckFoodWarned) { S.stuckFoodWarned = true; toast('🍱 A comida acabou de vez! Troque, plante ou a missão vai falhar.', 'bad'); }
      if (S.stuckFood >= 2) return fail('A comida acabou e não há como produzir mais: a tripulação não chegaria viva a Pontes-01b.');
    } else { S.stuckFood = 0; S.stuckFoodWarned = false; }
    if (sc === 'station' && S.res.combustivel < 1) return fail('Sem combustível na Estação Ponte-Alfa: a nave não consegue mais partir.');
  }
  if (sc === 'colony' && S.colony) {
    const C = S.colony, solarCost = (typeof CCOST !== 'undefined' && CCOST.solar[1]) ? CCOST.solar[1].kwh : 8;
    const noPower = S.res.energia < 1 || (!(C.b && C.b.solar) && S.res.energia < solarCost);
    S.stuckPower = noPower ? (S.stuckPower || 0) + dt / (C.dayLen || 30) : 0;
    if (S.stuckPower >= 2) return planetEnding('A energia da colônia acabou, mas a tripulação chegou a Pontes-01b e abriu caminho para quem vem depois.');
  }
}
function fail(reason) {
  if (S.fail) return;
  // em Pontes-01b, uma situação sem saída encerra a jornada com o final bom
  if (onPlanet()) return planetEnding(String(L(reason)).length && typeof reason === 'string' ? reason.replace(/\s*A missão falhou\.?/, '').trim() || reason : reason);
  S.fail = reason;
  S.scene = 'end';
  S.ending = { ok: false, reason };
  logMsg('MISSÃO FALHOU: ' + reason, 'bad');
  S.v++;
}

// ---------- Refeições (3 por dia) e virada de dia ----------
function serveMeal(slot) {
  const fd = S.food;
  const per = { pleno: 0.2, reduzido: 0.133, minimo: 0.067 }[fd.racionamento];
  const full = { pleno: 34, reduzido: 23, minimo: 21 }[fd.racionamento];
  // no almoço (refeição do meio-dia) os jogadores precisam ir à Cozinha comer; os bots comem sozinhos
  // jogadores comem quando têm fome (Cozinha → Comer agora); os bots comem nas refeições
  const eaters = alive().filter(c => !c.hibernating && !(S.scene === 'ship' && isHumanCrew(c)));
  const n = eaters.length;
  let item = fd.menu[slot] || 'racao';
  let tags = [], humor = 0, label = 'ração';
  // a ração é guardada: pratos prontos e comida fresca (que estraga) são servidos antes
  if (item === 'racao') {
    const dish = Object.keys(fd.dishes).find(k => fd.dishes[k] >= 1);
    const crop = Object.keys(fd.fresh).filter(k => fd.fresh[k] >= per * n * 1.5).sort((a, b) => fd.fresh[b] - fd.fresh[a])[0];
    if (dish) item = dish; else if (crop) item = crop;
  }
  const recipe = RECIPES.find(r => r.id === item);
  if (recipe) {
    if ((fd.dishes[item] || 0) >= 1) { fd.dishes[item] -= 1; tags = recipe.tags; humor = recipe.humor; label = recipe.name; }
    else item = 'racao';
  } else if (CROPS[item]) {
    const need = per * n * 1.5;
    if ((fd.fresh[item] || 0) >= need) { fd.fresh[item] -= need; tags = CROPS[item].tags; humor = CROPS[item].humor + 1; label = CROPS[item].name; }
    else item = 'racao';
  }
  if (item === 'racao') {
    const need = per * n;
    if (S.res.comida >= need) { addRes('comida', -need, 'Refeições'); label = 'ração'; humor = has('temperos') ? 0 : -1; tags = ['racao']; }
    else { // sem comida
      label = null;
    }
  }
  if (!label) { eaters.forEach(c => c.noFood = true); logMsg('Sem comida para a refeição!', 'bad'); return; }
  const nutr = foodNutr(tags.includes('racao') ? 'racao' : item);
  addRes('lixo', 0.05 * n, 'Restos de comida');
  fd.meals++;
  for (const c of eaters) {
    c.noFood = false;
    let h = humor;
    let s = full;
    if (tags.some(t => c.likes.includes(t))) { h += 3; s = 40; if (has('favorito')) h += 1; }
    if (tags.some(t => c.avoid.includes(t))) h -= 2;
    if (tags.some(t => c.allergy.includes(t))) {
      const r = d10();
      if (r === 1) { c.status = 'incapacitado'; c.statusT = 40; say(c, F('crew.c18')); }
      else if (r <= 4) { c.status = 'ferido'; c.statusT = 20; say(c, F('crew.c19')); }
      else h -= 1;
    }
    if (tags.includes('diferente') && c.likes.includes('diferente')) h += 1;
    c.humor = clamp(c.humor + h * 0.5, 0, 100);
    c.saciedade = clamp(c.saciedade + s, 0, 100);
    if (!c.nut) c.nut = [80, 80, 80];
    const lv = { pleno: 1, reduzido: 0.67, minimo: 0.33 }[fd.racionamento];
    for (let k = 0; k < 3; k++) c.nut[k] = clamp(c.nut[k] + nutr[k] * lv, 0, 100);
    c.nutricao = (c.nut[0] + c.nut[1] + c.nut[2]) / 3;
  }
  // mesa na refeição da noite
  if (slot === 2) {
    if (S.event && fd.mesa === 'completa') { logMsg('Crise em andamento: a mesa completa virou revezamento.'); }
    if (fd.mesa === 'completa' && !S.event) {
      fd.mesaDays++; fd.mesaNow = 8;
      eaters.forEach(c => c.humor = clamp(c.humor + 3, 0, 100));
      const r = d10();
      if (r === 1) { const two = shuffle(eaters.slice()).slice(0, 2); two.forEach(c => c.humor = clamp(c.humor - 5, 0, 100)); toast('Briga por comida na mesa! Dois tripulantes perderam humor.', 'bad'); }
      else if (r >= 5) { S.unity = true; toast('A tripulação se uniu na mesa. A próxima falha custará menos moral.', 'good'); }
      else logMsg('Clima tenso na mesa, mas nada aconteceu.');
    } else if (fd.mesa === 'revezamento') eaters.forEach(c => c.humor = clamp(c.humor + 1, 0, 100));
    else eaters.forEach(c => c.humor = clamp(c.humor - 1, 0, 100));
  }
}

function newDay() {
  S.day++;
  S.flowsYesterday = S.flowsDay; S.flowsDay = {};
  RES_META.forEach(r => S.flowsDay[r.id] = {});
  const fd = S.food;
  // fome prolongada
  for (const c of alive()) {
    if (c.saciedade <= 0) c.noFoodDays++; else c.noFoodDays = 0;
    if (c.noFoodDays === 1 || c.noFoodDays === 2) { toast(`🍱 ${c.name} está passando fome! Sirva comida ou coma na Cozinha.`, 'bad'); say(c, F('crew.c20')); }
    if (c.noFoodDays >= 3) {
      const r = d10();
      if (r === 1) kill(c, 'fome'); else if (r <= 4) { c.status = 'incapacitado'; c.statusT = 30; } else c.humor = clamp(c.humor - 5, 0, 100);
    }
    if (fd.racionamento === 'minimo' && (S.minDays || 0) >= 3 && d10() <= 2 && c.status === 'ok') { c.status = 'incapacitado'; c.statusT = 15; say(c, F('crew.c20')); }
  }
  S.minDays = fd.racionamento === 'minimo' ? (S.minDays || 0) + 1 : 0;
  // comida fresca estraga
  const life = has('geladeira') ? 6 : 3;
  for (const k in fd.fresh) {
    if (fd.fresh[k] > 0) {
      const spoil = fd.fresh[k] / life;
      fd.fresh[k] -= spoil; fd.wasted += spoil; addRes('lixo', spoil, 'Comida estragada');
    }
  }
  // remédios vencidos
  if (S.day === S.meds.validUntil) { toast('Os remédios da enfermaria venceram! Troque o estoque na Enfermaria.', 'warn'); sayRole('paramedico', F('crew.c21')); }
  if (S.day > S.meds.validUntil && Math.random() < 0.18 && !S.event && !S.schedule.some(e => e.type === 'doenca' && e.day < S.day + 2)) {
    S.schedule.push({ type: 'doenca', day: S.day + 0.4 }); S.schedule.sort((a, b) => a.day - b.day);
  }
  if (S.setup.origin === 'cientista') addRes('dados', 20, 'Bônus de cientista');
  checkFail();
}

// Ritmo principal: avança tudo
function tickGame(dt) {
  if (!S || S.fail || S.paused) return;
  if (S.scene !== 'ship') { tickCrew(dt); return; }
  S.journeyTime += dt;
  const prevT = S.dayT;
  S.dayT += dt;
  // refeições
  const frac0 = prevT / S.dayLen, frac1 = S.dayT / S.dayLen;
  [0.2, 0.5, 0.8].forEach((m, i) => { if (frac0 < m && frac1 >= m) serveMeal(i); });
  if (S.food.mesaNow > 0) S.food.mesaNow -= dt;
  if (S.dayT >= S.dayLen) { S.dayT -= S.dayLen; newDay(); }
  simulate(dt);
  tickTrays(dt);
  tickCrew(dt);
  tickEvents(dt);
  if (S.toast) { S.toast.t -= dt; if (S.toast.t <= 0) S.toast = null; }
  if (S.commDown > 0) S.commDown -= dt;
  // estágios
  if (S.stage === 1 && S.progress >= 0.5 && !S.oneShot.station && !S.event) { S.oneShot.station = true; enterStation(); }
  if (S.stage === 1 && S.progress >= 1 && !S.event) { enterPlanet(); }
  checkFail();
}

// ---------- Horta ----------
function tickTrays(dt) {
  const f = dt / S.dayLen;
  const agr = roleAvailable('agricultor') || (roleAlive('agricultor') ? byRole('agricultor')[0] : null);
  // agricultor (bot) planta bandejas vazias e colhe as prontas
  const agrBot = agr && agr.alive && !agr.hibernating && (!agr.owner || agr.owner === 'bot') && agr.status !== 'incapacitado';
  const rot = has('biorreator') ? ['batata', 'alface', 'soja', 'pimenta', 'algas'] : ['batata', 'alface', 'soja', 'pimenta'];
  S.trays.forEach((t, i) => {
    if (!agrBot || Math.random() > dt * 0.12) return;
    const maxActive = has('reciclaAgua') ? 12 : 6;
    if (!t.crop && S.res.plantacao >= 0.5 && S.res.agua > 150 && S.res.energia > 15 && S.trays.filter(x => x.crop).length < maxActive) ACTIONS.plant({ i, crop: S.trays.length <= 2 ? (i ? 'pimenta' : 'alface') : rot[i % rot.length] });
    else if (t.state === 'pronto' && t.readyT < 50) harvestTray(t);
    else if (t.state === 'estragado') harvestTray(t);
  });
  for (const t of S.trays) {
    if (!t.crop) continue;
    const cr = CROPS[t.crop];
    if (t.state === 'crescendo') {
      t.luz = clamp(t.luz - 30 * f, 0, 100); t.agua = clamp(t.agua - 40 * f, 0, 100); t.nutr = clamp(t.nutr - 20 * f, 0, 100);
      // o agricultor (bot) cuida sozinho de vez em quando
      if (agr && agr.alive && !agr.owner && Math.random() < dt * 0.08) {
        const low = ['luz', 'agua', 'nutr'].reduce((a, b) => t[a] < t[b] ? a : b);
        if (t[low] < 55) careTray(t, low, true);
      }
      const ok = t.luz > 30 && t.agua > 30 && t.nutr > 30;
      if (ok) t.g += f / cr.days;
      if (S.thermal && (S.thermal.T > 26 || S.thermal.T < 18)) t.g = Math.max(0, t.g - f * 0.3 / (has('tAgr') ? 2 : 1));
      const wf = has('reciclaAgua') ? 0.1 : 0.45; // o reciclador devolve parte da água ao ciclo
      addRes('agua', -(cr.water / cr.days) * wf * f, 'Horta (irrigação líquida)');
      S.stats.waterFood += (cr.water / cr.days) * wf * f;
      if (t.g >= 1) { t.state = 'pronto'; t.readyT = 60; }
    } else if (t.state === 'pronto') {
      t.readyT -= dt;
      if (t.readyT <= 0) { t.state = 'estragado'; logMsg(`Uma bandeja de ${cr.name} passou do ponto e estragou.`, 'warn'); }
    }
  }
}
function careTray(t, what, bot) {
  if (!t || !t.crop || t.state !== 'crescendo') return;
  const cost = { luz: ['energia', 0.1], agua: ['agua', 0.5], nutr: ['plantacao', 0] }[what];
  if (cost[0] === 'agua' && S.res.agua < 1) return;
  addRes(cost[0], -cost[1], 'Cuidados na horta');
  t[what] = clamp(t[what] + (bot ? 40 : 45) + (has('tAgr') ? 10 : 0), 0, 100);
  if (what === 'nutr' && S.adubo > 0.5) { S.adubo -= 0.5; t[what] = 100; }
}
function harvestTray(t) {
  if (t.state === 'estragado') { addRes('lixo', 1, 'Plantas estragadas'); S.food.wasted += 1; Object.assign(t, { crop: null, state: 'vazio', g: 0 }); return; }
  if (t.state !== 'pronto') return;
  const cr = CROPS[t.crop];
  const early = 0; // colheita no tempo certo
  let kg = cr.yield * 0.4 + (S.adubo > 2 ? 2 : 0) + (S.sojaBonus ? 1 : 0);
  if (S.adubo > 2) S.adubo -= 2;
  S.sojaBonus = t.crop === 'soja';
  S.food.fresh[t.crop] = (S.food.fresh[t.crop] || 0) + kg + early;
  S.food.produced += kg;
  addRes('plantacao', kg * 0.2, 'Colheita');
  addRes('lixo', 0.2, 'Cascas e folhas');
  toast(`Colheita: +${fmt(kg)} kg de ${cr.name}.`, 'good');
  Object.assign(t, { crop: null, state: 'vazio', g: 0 });
}

// ---------- Estágios da campanha ----------
function enterStation() {
  S.stage = 2; S.scene = 'station';
  narrate('Exploração científica. A nave atracou na Estação Orbital Ponte-Alfa. Aqui é possível fazer escambo e analisar dados reais de exoplanetas.');
  addPoints(50, 'Metade da viagem');
}
function leaveStation() {
  S.stage = 1; S.scene = 'ship';
  narrate('Partindo da Estação Ponte-Alfa. Próximo destino: Pontes-01b.');
}
function enterPlanet() {
  S.stage = 3; S.scene = 'planet';
  addPoints(80, 'Chegada a Pontes-01b');
  narrate('O novo mundo. A nave entrou em órbita de Pontes-01b. Investigue o planeta, faça análises e enfrente os desafios de adaptação.');
}

function addPoints(v, reason) {
  S.points += v;
  Save.data.credits += v; Save.write();
  logMsg(`+${v} pontos (${reason}).`, 'good');
}

// ---------- Ações (todas as mudanças vindas da interface passam por aqui) ----------
const ACTIONS = {};
function applyAction(type, p, actorId) {
  const fn = ACTIONS[type];
  if (!fn || !S) return;
  const actor = crewById(actorId || 'cmd');
  fn(p || {}, actor);
  S.v++;
}

function trashMode() { const m = S.trashMode || 'compostar'; return m === 'reciclar' && !has('reciclaLixo') ? 'compostar' : m; }
ACTIONS.trashMode = p => { if (['reciclar', 'compostar', 'ejetar'].includes(p.mode)) { S.trashMode = p.mode; logMsg('Destino do lixo: ' + p.mode); } };
ACTIONS.processTrash = () => {
  if (S.res.lixo < 0.5) return toast('Não há lixo para processar.', 'warn');
  if (S.res.energia < 2) return toast('Energia insuficiente (2 kWh).', 'warn');
  const kg = Math.min(S.res.lixo, 3); addRes('energia', -2, 'Processar lixo'); addRes('lixo', -kg, 'Processado manualmente');
  const rec = has('reciclaLixo');
  S.adubo += kg * (rec ? 1 : 0.5);
  if (rec && has('impressora')) { S.recycled = (S.recycled || 0) + kg; if (S.recycled >= 6) { S.recycled -= 6; S.peças += 1; toast('Oficina 3D: lixo reciclado virou 1 peça de reparo.', 'good'); } }
  toast(`${fmt(kg)} kg de lixo viraram ${fmt(kg * (rec ? 1 : 0.5))} kg de adubo para a horta.`, 'good');
};
ACTIONS.cruise = p => { S.cruise = p.mode; logMsg('Modo de cruzeiro: ' + p.mode); if (S.tutorial === 1) S.tutorial = 3; };
ACTIONS.repair = (p, actor) => {
  const sys = p.sys; if (!S.systems[sys] || S.systems[sys].hp >= 100) return;
  const st = Object.keys(STATIONS).find(k => STATIONS[k].sys === sys) || 'avionica';
  let who = actor;
  if (p.call) { who = pickForRole('engenheiro', actor && actor.id); if (!who) return toast('Nenhum engenheiro disponível.', 'warn'); }
  if (!available(who)) return toast('Este tripulante está ocupado.', 'warn');
  if (S.peças > 0) S.peças--; else { if (S.res.energia < 5) return toast('Energia insuficiente para o reparo.', 'warn'); addRes('energia', -5, 'Reparos'); }
  const rt = { station: st, dur: (has('drone') && sys === 'casco') ? 3 : 6, label: 'Reparar ' + SYSTEMS[sys].name, key: 'repair', data: { sys } };
  if (p.call) callCrew(who, rt, 'engenheiro'); else assignTask(who, rt);
};
TASK_DONE.repair = (c, d) => {
  let gain = 25 + (c.role.startsWith('engenheiro') ? 10 : 0) + (S.setup.origin === 'engenheiro' && c.id === 'cmd' ? 5 : 0) + (has('tEng') && c.role.startsWith('engenheiro') ? 5 : 0);
  S.systems[d.sys].hp = clamp(S.systems[d.sys].hp + gain, 0, 100);
  toast(`${SYSTEMS[d.sys].name} reparado (+${gain}%).`, 'good');
};
ACTIONS.replaceMeds = (p, actor) => {
  if (S.res.medicos < 2) return toast('Recursos médicos insuficientes (precisa de 2).', 'warn');
  addRes('medicos', -2, 'Troca do lote de remédios');
  S.meds.validUntil = S.day + 12;
  toast('Estoque de remédios renovado (válido por 12 dias).', 'good');
};
ACTIONS.treat = (p, actor) => {
  const c = crewById(p.id); if (!c || !c.alive || (c.status === 'ok' && !c.sickness)) return;
  // o paramédico (jogador ou bot) trata gastando menos
  const cost = (has('tMed') || (actor && actor.role === 'paramedico')) ? 1 : 2;
  if (!roleAlive('paramedico')) return toast('Sem paramédico, feridos não são tratados.', 'warn');
  if (S.res.medicos < cost) return toast('Sem recursos médicos.', 'warn');
  addRes('medicos', -cost, 'Tratamento');
  c.statusT = Math.min(c.statusT, 3);
  if (c.sickness && S.day <= S.meds.validUntil) c.sickness = null;
  toast(`${c.name} recebeu tratamento.`, 'good');
};
ACTIONS.ejectTrash = () => {
  if (S.res.lixo < 0.5) return;
  const kg = S.res.lixo;
  addRes('lixo', -kg, 'Ejetado pela eclusa');
  S.food.wasted += kg * 0.3;
  toast(`${fmt(kg)} kg de lixo ejetados. Sem reciclador, a chance de reaproveitar foi perdida.`);
};
ACTIONS.plant = p => {
  const t = S.trays[p.i]; if (!t || t.crop) return;
  const cr = CROPS[p.crop]; if (cr.needs && !has(cr.needs)) return toast('Algas exigem o Biorreator de algas.', 'warn');
  if (S.trays.length <= 2 && !['alface', 'pimenta'].includes(p.crop)) return toast('O kit de ervas só cultiva folhas e pimenta.', 'warn');
  if (S.res.plantacao < 0.5) return toast('Sem sementes/biomassa.', 'warn');
  addRes('plantacao', -0.5, 'Sementes plantadas');
  Object.assign(t, { crop: p.crop, g: 0, luz: 80, agua: 80, nutr: 80, state: 'crescendo' });
};
ACTIONS.care = p => careTray(S.trays[p.i], p.what);
ACTIONS.careAll = () => S.trays.forEach(t => { if (t.crop && t.state === 'crescendo') ['luz', 'agua', 'nutr'].forEach(w => { if (t[w] < 60) careTray(t, w); }); });
ACTIONS.harvest = p => harvestTray(S.trays[p.i]);
ACTIONS.sacrificeTray = p => { const t = S.trays[p.i]; if (!t || !t.crop) return; addRes('lixo', 0.5, 'Bandeja sacrificada'); Object.assign(t, { crop: null, state: 'vazio', g: 0 }); toast('Bandeja sacrificada para economizar água.'); };
ACTIONS.menu = p => { S.food.menu[p.slot] = p.item; };
ACTIONS.menuAll = p => { S.food.menu = [p.item, p.item, p.item]; };
ACTIONS.ration = p => { S.food.racionamento = p.level; logMsg('Racionamento: ' + p.level); };
ACTIONS.mesa = p => { S.food.mesa = p.mode; };
ACTIONS.cook = p => {
  const ing = (p.ing || []).slice().sort();
  if (ing.length < 2) return;
  const fd = S.food;
  for (const i of ing) {
    if (i === 'racao') { if (S.res.comida < 1) return toast('Ração insuficiente.', 'warn'); }
    else if ((fd.fresh[i] || 0) < 1) return toast(`Falta ${CROPS[i].name} (1 kg).`, 'warn');
  }
  const recipe = RECIPES.find(r => r.ing.slice().sort().join() === ing.join());
  if (recipe && recipe.cook && !has('cozinha')) return toast('Esta receita precisa da cozinha equipada (fogão e forno).', 'warn');
  for (const i of ing) { if (i === 'racao') addRes('comida', -1, 'Cozinha'); else fd.fresh[i] -= 1; }
  const en = recipe ? recipe.energy : 0.5;
  addRes('energia', -en, 'Cozinha'); addRes('agua', -2, 'Cozinha'); S.stats.kwhFood += en; S.stats.waterFood += 2;
  if (!recipe) { addRes('lixo', 0.5, 'Combinação desconhecida'); fd.wasted += 1; return toast('Combinação desconhecida. Os ingredientes foram perdidos.', 'warn'); }
  fd.dishes[recipe.id] = (fd.dishes[recipe.id] || 0) + 2; // 2 refeições para todos
  if (!fd.recipes.includes(recipe.id)) { fd.recipes.push(recipe.id); toast(`Receita descoberta: ${recipe.name}! ${recipe.fact}`, 'good'); }
  else toast(`${recipe.name} pronta (2 refeições).`, 'good');
};
ACTIONS.banquete = () => {
  const fd = S.food;
  if (fd.banquete) return;
  if (S.res.comida < BANQUETE.cost) return toast('Comida de reserva insuficiente.', 'warn');
  addRes('comida', -BANQUETE.cost, 'Banquete do Dia da Terra');
  fd.banquete = true; moral(BANQUETE.humor);
  toast('Banquete do Dia da Terra! Humor +10 para todos.', 'good');
};
ACTIONS.research = p => { S.researchOn = !!p.on; };
ACTIONS.fund = p => {
  const costs = { peca: 2, medico: 3, energia: 2, oxigenio: 2, agua: 2, comida: 2 };
  const c = costs[p.kind]; if (S.fund < c) return toast('Fundo de contingência insuficiente.', 'warn');
  S.fund -= c;
  if (p.kind === 'peca') { S.peças++; toast('Fundo: +1 peça de reposição.'); }
  if (p.kind === 'medico') { alive().forEach(x => { if (x.status !== 'ok') x.statusT = 0.1; if (x.sickness) { x.sickness = null; } }); toast('Fundo: tratamento médico urgente para todos.'); }
  if (p.kind === 'energia') { addRes('energia', 20, 'Fundo de contingência'); toast('Fundo: +20 kWh de baterias de emergência.'); }
  if (p.kind === 'agua') { addRes('agua', 100, 'Fundo de contingência'); toast('Fundo: +100 L de água.'); }
  if (p.kind === 'comida') { addRes('comida', 20, 'Fundo de contingência'); toast('Fundo: +20 kg de ração.'); }
  if (p.kind === 'oxigenio') { addRes('oxigenio', 15, 'Fundo de contingência'); toast('Fundo: +15 kg de oxigênio.'); }
};
ACTIONS.hibernate = p => {
  const c = crewById(p.id); if (!c || !c.alive || !has('hibernacao') || c.id === 'cmd') return;
  const others = S.crew.filter(x => x.hibernating && x !== c);
  if (!c.hibernating && others.length) return toast('A câmara comporta um tripulante por vez.', 'warn');
  c.hibernating = !c.hibernating; c.task = null;
  if (c.hibernating) { c.statusT = c.statusT ? 1 : 0; goTo(c, 'dormitorio'); c.x = STATIONS.dormitorio.x; c.deck = 'L'; }
  toast(c.hibernating ? `${c.name} entrou em hibernação.` : `${c.name} saiu da hibernação.`);
};
// comer fora de hora: prato pronto > comida fresca > ração
ACTIONS.eat = (p, actor) => {
  const c = actor; if (!c || !c.alive) return;
  if (c.saciedade >= 85) return toast('Você ainda está satisfeito.', 'info');
  const lv = S.food.racionamento; const portion = { pleno: 0.6, reduzido: 0.4, minimo: 0.2 }[lv] || 0.4; const fill = { pleno: 75, reduzido: 60, minimo: 40 }[lv] || 60;
  const fd = S.food; let item = null;
  const dish = Object.keys(fd.dishes).find(k => fd.dishes[k] >= 1);
  const crop = Object.keys(fd.fresh).find(k => fd.fresh[k] >= 0.3);
  if (dish) { fd.dishes[dish] -= 1; item = dish; }
  else if (crop) { fd.fresh[crop] -= 0.3; item = crop; }
  else if (S.res.comida >= portion) { addRes('comida', -portion, 'Refeições'); item = 'racao'; }
  else return toast('Não há nada para comer!', 'bad');
  c.saciedade = clamp(c.saciedade + fill, 0, 100); c.noFoodDays = 0; c.hungryWarned = false;
  const n = foodNutr(item); if (!c.nut) c.nut = [80, 80, 80];
  for (let k = 0; k < 3; k++) c.nut[k] = clamp(c.nut[k] + n[k] * 0.5, 0, 100);
  c.nutricao = (c.nut[0] + c.nut[1] + c.nut[2]) / 3;
  addRes('lixo', 0.05, 'Restos de comida');
  toast('🍴 ' + c.name + ' comeu.', 'good');
};
ACTIONS.sleep = (p, actor) => {
  const c = crewById(p.id || actor.id); if (!available(c)) return;
  if (p.id && p.id !== actor.id) callCrew(c, { station: 'dormitorio', dur: 9, label: 'Dormir', key: 'sleep' }); else assignTask(c, { station: 'dormitorio', dur: 9, label: 'Dormir', key: 'sleep' });
};
TASK_DONE.sleep = c => { c.humor = clamp(c.humor + 50, 0, 100); };
ACTIONS.rest = (p, actor) => {
  const c = crewById(p.id || actor.id); if (!available(c)) return;
  assignTask(c, { station: 'dormitorio', dur: 6, label: 'Descansar / lazer', key: 'rest' });
};
TASK_DONE.rest = c => { c.humor = clamp(c.humor + 15 + shopBonus().moral / 3, 0, 100); say(c, F('crew.c22')); };
ACTIONS.selfTask = (p, actor) => {}; // reservado
