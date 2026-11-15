// ============================================================
//  EVENTOS — desafios da viagem e estágios finais
// ============================================================
'use strict';

const EV = {}; // definições

// ---- ciclo de vida ----
function startEvent(type) {
  const def = EV[type]; if (!def) return;
  const info = EVENT_INFO[type];
  S.eventN++;
  S.event = { id: S.eventN, type, phase: 'warn', t: def.time || 60, dur: def.time || 60, steps: [], data: {}, puzzle: null, result: null, warnT: 3, stopShip: false }; // o desafio começa sozinho depois de um aviso curto
  S.failsInPhase = 0;
  if (def.setup) def.setup(S.event);
  trimSteps(S.event);
  S.alarm = 1;
  logMsg(`⚠ ALERTA: ${info.title}`, 'bad');
  S.v++;
}
// o principal logo: em desafios com quebra-cabeça, os passos de "esperar a barra"
// antes dele saem (o quebra-cabeça abre direto). Na jornada curta (partida rápida)
// só fica o quebra-cabeça, e os passos de barra que sobram ficam pela metade.
const NO_TRIM = { traje: 1, brecha: 1, lixo: 1, tempestade: 1, termico: 1 };
function trimSteps(ev) {
  const short = S.journey === 'curta';
  if (short && ev.type === 'termico' && S.thermal) { S.thermal.D = 40; ev.t = ev.dur = 40; }
  if (!ev.steps || !ev.steps.length) return;
  if (!NO_TRIM[ev.type]) {
    const pi = ev.steps.findIndex(s => s.puzzle);
    if (pi > 0) { if (ev.type === 'asteroides') ev.data.shield = true; ev.steps = ev.steps.slice(pi); }
    if (short && pi >= 0) ev.steps = ev.steps.filter(s => s.puzzle);
    else if (short) ev.steps = ev.steps.filter(s => !s.optional).slice(0, 1); // sem quebra-cabeça: um passo só
  }
  if (short) for (const s of ev.steps) if (!s.puzzle) s.dur = Math.max(0.8, s.dur * 0.5);
}
function goEvent() {
  const ev = S.event; if (!ev || ev.phase !== 'warn') return;
  ev.phase = 'run';
  const def = EV[ev.type];
  if (def.start) def.start(ev);
  // dica extra do Controle da Missão
  if (has('linha') && !(S.commDown > 0)) logMsg('Controle da Missão: ' + (def.tip || 'Mantenham a calma e sigam o procedimento.'), 'earth');
  if (has('ia')) {
    const wrong = sysHp('avionica') < 40 && Math.random() < 0.6;
    logMsg('Copiloto de IA sugere: ' + (wrong ? 'ignorar o alerta (sensores com defeito?)' : (def.ai || 'seguir os passos na ordem.')), 'ai');
  }
  S.v++;
}
function curStep(ev) { return ev.steps.find(s => !s.done && !s.optional) || null; }
function stepById(ev, id) { return ev.steps.find(s => s.id === id); }
function completeStep(ev, step, c) {
  step.done = true; step.doer = c ? c.name : null;
  logMsg(`✔ ${step.label}${c ? ' — ' + c.name : ''}`, 'good');
  const def = EV[ev.type];
  if (def.onStep) def.onStep(ev, step, c);
  if (!curStep(ev) && ev.phase === 'run' && !def.customEnd) endEvent(true);
  S.v++;
}
function endEvent(ok, extra) {
  const ev = S.event; if (!ev || ev.phase === 'result') return;
  const def = EV[ev.type];
  ev.phase = 'result';
  const res = { ok, text: '', points: 0 };
  if (ok) { res.points = def.points || 25; if (def.success) res.text = def.success(ev) || ''; }
  else {
    res.points = 0; // falha não rende pontos
    if (def.failure) res.text = def.failure(ev) || '';
    // toda falha também atrasa a viagem
    if (S.stage === 1) { S.progress = Math.max(0, S.progress - 0.01); res.delay = true; }
    const loss = has('voz') ? 1 : 2; moral(S.unity ? -loss + 1 : -loss); S.unity = false;
  }
  if (extra) Object.assign(res, extra);
  ev.result = res;
  S.alarm = 0;
  S.crew.forEach(c => { if (c.task && c.task.ev === ev.id) c.task = null; });
  S.stats.events.push({ type: ev.type, ok: res.ok, grade: res.grade || (ok ? 'Sucesso' : 'Falha') });
  addPoints(res.points, EVENT_INFO[ev.type].title);
  S.v++;
}
function closeEvent() {
  const ev = S.event; if (!ev || ev.phase !== 'result') return;
  const def = EV[ev.type];
  if (def.cleanup) def.cleanup(ev);
  S.event = null; S.thermal = null; S.speedMod = 1; S.cylinders = false;
  S.eventsDone.push(ev.type);
  S.v++;
  if (S.pendingBreach) { S.pendingBreach = false; startEvent('brecha'); goEvent(); }
}
function tickEvents(dt) {
  const ev = S.event;
  if (!ev) {
    const next = S.schedule[0];
    if (next && S.stage === 1 && (S.day - 1 + S.dayT / S.dayLen) >= next.day) {
      S.schedule.shift();
      if (EV[next.type].can && !EV[next.type].can()) return;
      startEvent(next.type);
    }
    return;
  }
  if (ev.phase === 'warn') {
    ev.warnT -= dt;
    if (ev.warnT <= 0) goEvent(); // a crise não espera
    return;
  }
  if (ev.phase !== 'run') return;
  const def = EV[ev.type];
  if (!def.noTimer) ev.t -= dt;
  if (def.tick) def.tick(ev, dt);
  if (ev.phase === 'run' && ev.t <= 0 && !def.noTimer) endEvent(false);
}

// ---- ações gerais dos eventos ----
ACTIONS.eventGo = () => goEvent();
ACTIONS.eventClose = () => closeEvent();
ACTIONS.doStep = (p, actor) => {
  const ev = S.event; if (!ev || ev.phase !== 'run') return;
  const step = p.step ? stepById(ev, p.step) : curStep(ev);
  if (!step || step.done || !step.station) return;
  if (!step.optional && step !== curStep(ev)) return toast('Faça os passos na ordem.', 'warn');
  if (!actor.alive || actor.status === 'incapacitado') return;
  if (!atStation(actor, step.station, 26)) return toast(`Vá até: ${STATIONS[step.station].name}.`, 'warn');
  // quem apertar primeiro fica com o passo: os outros jogadores não podem repetir (nem resolver o mesmo quebra-cabeça)
  if (S.crew.some(o => o.id !== actor.id && o.alive && ((o.task && o.task.key === 'evStep' && o.task.data && o.task.data.step === step.id) || (ev.puzzle && ev.puzzle.step === step.id && ev.puzzle.by === o.id)))) return toast('Outro tripulante já está cuidando deste passo.', 'warn');
  if (step.role && !roleMatches(actor, step.role) && step.roleOnly) return toast('Este passo precisa de um ' + step.role + '.', 'warn');
  if (actor.task && actor.task.key === 'evStep' && actor.task.data && actor.task.data.step === step.id) return; // já fazendo: apertar de novo não reinicia
  if (step.puzzle && actor.owner && actor.owner !== 'bot') { // um clique e o desafio aparece
    if (ev.puzzle && ev.puzzle.step === step.id) return;
    ev.puzzle = makePuzzle(step.puzzle, ev, step); ev.puzzle.step = step.id; ev.puzzle.by = actor.id; S.v++; return;
  }
  actor.task = { station: step.station, dur: step.dur, t: 0, label: step.label, key: 'evStep', data: { ev: ev.id, step: step.id }, ev: ev.id };
};
ACTIONS.callRole = (p) => {
  const ev = S.event; if (!ev || ev.phase !== 'run') return;
  const step = p.step ? stepById(ev, p.step) : curStep(ev);
  if (!step || step.done) return;
  const role = p.role || step.role || 'engenheiro';
  let c = null;
  if (p.id) c = crewById(p.id);
  else c = pickForRole(role) || pickBotForRole(role);
  if (!c && has('exemplo') && p.role) return toast('Ninguém disponível. Use “Exemplo em campo”: vá você mesmo.', 'warn');
  if (!c) return toast('Ninguém disponível para essa função.', 'warn');
  if (step.claimed) return;
  step.claimed = c.id;
  callCrew(c, { station: step.station, dur: step.dur * (roleMatches(c, step.role) ? 1 : 1.5), label: step.label, key: 'evStep', data: { ev: ev.id, step: step.id }, ev: ev.id }, role);
  if (!isHumanCrew(c)) say(c, 'Indo agora: ' + step.label.charAt(0).toLowerCase() + step.label.slice(1) + '.');
};
function roleMatches(c, role) {
  if (!role) return true;
  if (role === 'engenheiro') return c.role === 'engenheiro1' || c.role === 'engenheiro2';
  return c.role === role;
}
TASK_DONE.evStep = (c, d) => {
  const ev = S.event; if (!ev || ev.id !== d.ev || ev.phase !== 'run') return;
  const step = stepById(ev, d.step); if (!step || step.done) return;
  step.claimed = null;
  if (step.puzzle) {
    const human = c.owner && c.owner !== 'bot';
    if (human) { if (ev.puzzle) return; ev.puzzle = makePuzzle(step.puzzle, ev, step); ev.puzzle.step = step.id; ev.puzzle.by = c.id; return; }
    // bot resolve com rolagem
    let mod = roleMatches(c, step.role) ? 3 : 0;
    if (has('tEng') && roleMatches(c, 'engenheiro')) mod++;
    if (effIndex() < 50) mod--;
    const r = d20();
    if (r === 20 || (r !== 1 && r + mod >= (step.dc || 9))) { botSolves(ev, step, c); completeStep(ev, step, c); }
    else { say(c, F('crew.c2')); step.claimed = c.id; c.task = { station: step.station, dur: step.dur, t: 0, label: step.label, key: 'evStep', data: d, ev: ev.id }; ev.t -= 6; }
    return;
  }
  completeStep(ev, step, c);
};
function botSolves(ev, step, c) {
  const def = EV[ev.type]; if (def.botSolve) def.botSolve(ev, step, c);
}

// ---------- quebra-cabeças ----------
function makePuzzle(kind, ev, step) {
  if (kind === 'filtros') {
    const n = 6; return { kind, n, bad: Math.floor(Math.random() * n), seen: [], swapped: false, flow: Array.from({ length: n }, () => 70 + Math.floor(Math.random() * 30)) };
  }
  if (kind === 'mapa') {
    // 4 setores tortos; um clique endireita o setor
    const tiles = Array(9).fill(0); shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 4).forEach(i => { tiles[i] = 1 + Math.floor(Math.random() * 3); });
    return { kind, tiles };
  }
  if (kind === 'radio') {
    const msg = pick(RADIO_MESSAGES);
    return { kind, freq: 50, target: 10 + Math.floor(Math.random() * 80), msgIdx: RADIO_MESSAGES.indexOf(msg), seed: Math.floor(Math.random() * 1000), answered: false };
  }
  if (kind === 'agua') return { kind, order: [], options: shuffle(['Destilação', 'Filtração', 'Oxidação', 'Desinfecção']) };
  if (kind === 'remedio') return { kind, seen: {}, expiredWarned: false };
  if (kind === 'substituto') return { kind };
  if (kind === 'rota') return { kind };
  if (kind === 'pilot') return { kind, y: 0.5, rocks: [], t: 16, hits: 0, spawn: 0 };
  return { kind };
}
function puzzleDone(ev) {
  const step = stepById(ev, ev.puzzle.step);
  const c = crewById(ev.puzzle.by);
  ev.puzzle = null;
  completeStep(ev, step, c);
}

// jornada curta (partida rápida): depois de um erro, o painel mostra a solução
const quickHelp = pz => { if (S.journey === 'curta') pz.hint = true; };
ACTIONS.puzzle = (p, actor) => {
  const ev = S.event; if (!ev || !ev.puzzle) return;
  const pz = ev.puzzle;
  if (pz.by && actor && actor.id !== pz.by) return toast('Só quem chegou primeiro ao console resolve este passo.', 'warn');
  switch (pz.kind) {
    case 'filtros':
      if (p.op === 'inspect' && !pz.seen.includes(p.i)) { pz.seen.push(p.i); ev.t -= 2; }
      if (p.op === 'swap' && !pz.seen.includes(p.i)) pz.seen.push(p.i);
      if (p.op === 'swap') {
        if (p.i === pz.bad) { toast('Filtro entupido trocado pelo reserva!', 'good'); puzzleDone(ev); }
        else { toast('Esse filtro estava bom. Tempo perdido!', 'warn'); ev.t -= 6; quickHelp(pz); }
      }
      break;
    case 'mapa':
      if (pz.tiles[p.i] === 0) { ev.t -= 2; quickHelp(pz); break; } // já estava certo
      pz.tiles[p.i] = 0;
      if (pz.tiles.every(t => t === 0)) { toast('Mapa estelar recalibrado!', 'good'); puzzleDone(ev); }
      break;
    case 'radio':
      if (p.op === 'tune') pz.freq = clamp(pz.freq + p.d, 0, 99);
      if (p.op === 'set') pz.freq = clamp(+p.f, 0, 99);
      if (p.op === 'answer' && !pz.answered) {
        pz.answered = true;
        const msg = RADIO_MESSAGES[pz.msgIdx];
        ev.data.correct = p.answer === msg.answer;
        ev.data.msg = msg;
        if (!ev.data.correct && S.journey === 'curta') toast('💡 ' + L('Resposta certa') + ': ' + T(msg.answer), 'warn');
        puzzleDone(ev);
      }
      break;
    case 'agua': {
      const correct = ['Destilação', 'Filtração', 'Oxidação', 'Desinfecção'];
      const nextOk = correct[pz.order.length];
      if (p.stage === nextOk) { pz.order.push(p.stage); if (pz.order.length === 4) { toast('Ordem correta! Processando a água...', 'good'); puzzleDone(ev); } }
      else { toast(`Etapa fora de ordem (${p.stage}). O ciclo reiniciou.`, 'warn'); pz.order = []; ev.t -= 8; quickHelp(pz); }
      break;
    }
    case 'remedio': {
      const v = crewById(ev.data.victim); const dis = DISEASES.find(d => d.id === ev.data.disease);
      if (p.op === 'device') {
        if (p.dev === 'scanner') { if (S.res.medicos < 1) return toast('Sem recursos para o scanner.', 'warn'); addRes('medicos', -1, 'Scanner médico'); }
        pz.seen[p.dev] = dis.readings[p.dev]; ev.t -= 3;
      }
      if (p.op === 'replace') { ACTIONS.replaceMeds(); }
      if (p.op === 'give') {
        if (S.day > S.meds.validUntil) { toast('O remédio está vencido e não fez efeito! Troque o estoque primeiro.', 'bad'); ev.t -= 10; quickHelp(pz); S.v++; return; }
        if (S.res.medicos < 1) return toast('Sem recursos médicos!', 'bad');
        addRes('medicos', -1, 'Remédio');
        if (p.med === dis.med) { v.sickness = null; toast(`${v.name} tomou ${MEDICINES.find(m => m.id === p.med).name} e está se recuperando.`, 'good'); puzzleDone(ev); }
        else { toast('Remédio errado. Os sintomas continuam.', 'warn'); moral(-1, v); ev.t -= 8; quickHelp(pz); }
      }
      break;
    }
    case 'substituto': {
      const sub = crewById(p.id); if (!sub || !available(sub) && sub.id !== 'cmd') return toast('Tripulante indisponível.', 'warn');
      ev.data.sub = sub.id;
      const step = stepById(ev, 'troca');
      ev.puzzle = null;
      completeStep(ev, stepById(ev, 'escolher'), actor);
      if (sub.owner && sub.owner !== 'bot') toast(`${sub.name}: vá até a Eclusa e pressione E para trocar de lugar.`, 'warn');
      else { step.claimed = sub.id; assignTask(sub, { station: 'eclusa', dur: step.dur, label: step.label, key: 'evStep', data: { ev: ev.id, step: 'troca' }, ev: ev.id }); say(sub, F('crew.c3')); }
      break;
    }
    case 'rota': {
      const opt = p.opt;
      if (opt === 'gravidade') { S.totalDays += 2; S.fuelBonus = 0.85; logMsg('Rota com assistência gravitacional: -15% de consumo, +2 dias.'); }
      if (opt === 'economico') { S.cruise = 'economico'; logMsg('Cruzeiro econômico definido para o resto da viagem.'); }
      if (opt === 'manter') { moral(-3); logMsg('Rota mantida. A tripulação ficou apreensiva.'); }
      ev.data.choice = opt;
      puzzleDone(ev);
      break;
    }
    case 'pilot':
      if (p.op === 'move') pz.y = clamp(pz.y + p.d, 0.05, 0.95);
      break;
  }
  S.v++;
};

// =============== DEFINIÇÕES DOS EVENTOS ===============
EV.asteroides = {
  time: 60, points: 30, tip: 'Desviem dos maiores, os pequenos o escudo aguenta.', ai: 'ativar o escudo antes de pilotar.',
  setup(ev) {
    ev.steps = [
      { id: 'escudo', label: 'Ativar o escudo de proteção da nave', station: 'ponte', dur: 2.5 },
      { id: 'manche', label: 'Usar o manche para desviar dos meteoros', station: 'ponte', dur: 0.5, puzzle: 'pilot', role: 'navegador', dc: 9 },
      { id: 'radar', label: 'Conferir no radar se o caminho ficou livre', station: 'ponte', dur: 2 },
    ];
  },
  onStep(ev, step) { if (step.id === 'escudo') ev.data.shield = true; },
  botSolve(ev, step, c) { const hits = Math.max(0, 3 - Math.floor(Math.random() * 4)); ev.data.hits = hits; asteroidHits(hits); },
  tick(ev, dt) {
    const pz = ev.puzzle; if (!pz || pz.kind !== 'pilot') return;
    pz.t -= dt; pz.spawn -= dt;
    if (pz.spawn <= 0) { pz.spawn = 0.45 + Math.random() * 0.4; pz.rocks.push({ x: 1.05, y: Math.random(), r: 0.03 + Math.random() * 0.05, v: 0.35 + Math.random() * 0.35 }); }
    for (const r of pz.rocks) {
      r.x -= r.v * dt;
      if (!r.hit && Math.abs(r.x - 0.15) < r.r + 0.04 && Math.abs(r.y - pz.y) < r.r + 0.05) { r.hit = true; pz.hits++; asteroidHits(1, r.r > 0.06); }
    }
    pz.rocks = pz.rocks.filter(r => r.x > -0.1 && !r.hit);
    if (pz.t <= 0) { ev.data.hits = pz.hits; puzzleDone(ev); }
  },
  success(ev) { if ((ev.data.hits || 0) >= 3) S.pendingBreach = true; return `A nave atravessou a chuva de meteoros com ${ev.data.hits || 0} impacto(s).` + ((ev.data.hits || 0) >= 3 ? ' ' + 'Um dos impactos furou o casco!' : ''); },
  failure() { damageSys('casco', 20); damageSys('propulsao', 15); addRes('casco', -20, 'Impactos de meteoros'); S.pendingBreach = true; return 'Sem desvio a tempo: vários impactos no casco e na propulsão. Um meteoro furou o casco!'; },
};
function asteroidHits(n, big) {
  for (let i = 0; i < n; i++) {
    let dmg = (big ? 9 : 5) * (S.event && S.event.data.shield ? 0.5 : 1);
    if (has('casco1')) dmg *= 0.75; if (has('casco2')) dmg *= 0.8; if (Save.owns('cascoExtra')) dmg *= 0.85;
    damageSys('casco', dmg); addRes('casco', -dmg, 'Impactos de meteoros');
    if (has('solar') && !has('casco1') && Math.random() < 0.4) { damageSys('casco', 2); logMsg('Um painel solar foi atingido!', 'bad'); }
  }
  if (n) S.shake = 0.5;
}

// Brecha no casco: consequência de falhar (ou levar muitos impactos) na chuva de meteoros
const BREACH_ROOMS = ['lab', 'enfermaria', 'cozinha', 'estufa', 'dormitorio', 'antena'];
EV.brecha = {
  time: 50, points: 30, tip: 'Selem a brecha com resina epóxi antes que o ar acabe!', ai: 'pegar a resina na Eclusa e selar a brecha.',
  setup(ev) {
    const st = pick(BREACH_ROOMS);
    ev.data.at = st;
    ev.steps = [
      { id: 'resina', label: 'Pegar a resina epóxi na Eclusa', station: 'eclusa', dur: 2 },
      { id: 'selar', label: 'Selar a brecha no casco', station: st, dur: 4, role: 'engenheiro' },
      { id: 'pressao', label: 'Conferir a pressão no Suporte à vida', station: 'suporte', dur: 2 },
    ];
  },
  start(ev) { S.shake = 0.8; S.cylinders = true; sayRole('engenheiro1', 'Brecha no casco! O ar está vazando, precisamos selar agora!'); },
  tick(ev, dt) {
    const sealed = ev.steps[1].done;
    if (!sealed) { addRes('oxigenio', -0.35 * dt, 'Brecha no casco'); if (Math.random() < dt * 0.6) S.shake = 0.15; }
    if (sealed) S.cylinders = false;
  },
  success() { S.cylinders = false; damageSys('casco', -5); return 'Brecha selada com resina epóxi. A pressão voltou ao normal.'; },
  failure(ev) {
    S.cylinders = false;
    damageSys('casco', 15); addRes('casco', -15, 'Brecha no casco'); addRes('oxigenio', -15, 'Brecha no casco');
    const room = ROOMS.find(r => STATIONS[ev.data.at] && STATIONS[ev.data.at].x >= r.x0 && STATIONS[ev.data.at].x <= r.x1 && r.deck === STATIONS[ev.data.at].deck);
    const hurt = alive().filter(c => c.id !== 'cmd' && room && c.deck === room.deck && c.x >= room.x0 && c.x <= room.x1);
    hurt.forEach(c => { c.status = 'ferido'; c.statusT = 30; });
    return 'A brecha não foi selada a tempo: perdemos ar, o casco piorou' + (hurt.length ? ' e quem estava na sala se feriu.' : '.');
  },
};

EV.combFalta = {
  time: 55, points: 25, tip: 'A reserva do tanque auxiliar resolve. Válvula, bomba e confirmação no painel.', ai: 'tanque auxiliar → bomba → painel.',
  setup(ev) {
    ev.steps = [
      { id: 'valvula', label: 'Abrir a válvula de reserva do tanque auxiliar', station: 'tanqueAux', dur: 3, role: 'engenheiro' },
      { id: 'bomba', label: 'Ligar a bomba de combustível', station: 'bomba', dur: 3, role: 'engenheiro' },
      { id: 'painel', label: 'Conferir no painel se o nível subiu e a velocidade voltou', station: 'ponte', dur: 2, role: 'navegador' },
    ];
  },
  start() { S.speedMod = 0.45; sayRole('navegador', F('crew.c4')); },
  success() { addRes('combustivel', 60, 'Reserva do tanque auxiliar'); return 'Combustível da reserva liberado. Velocidade normalizada.'; },
  failure() { addRes('combustivel', -40, 'Falha na alimentação'); damageSys('propulsao', 10); S.progress = Math.max(0, S.progress - 0.02); return 'O motor engasgou: perdemos combustível e tempo.'; },
};

EV.combVaz = {
  time: 60, points: 30, tip: 'Vamos recalcular a rota. Mantenham o rádio aberto.', ai: 'pedir o recálculo da rota à Terra.',
  setup(ev) {
    ev.steps = [
      { id: 'pedir', label: 'Pedir à equipe em solo o recálculo da rota', station: 'antena', dur: (S.setup.origin === 'diplomata' || has('antena')) ? 2 : 4.5 },
      { id: 'escolher', label: 'Escolher a nova rota calculada pela Terra', station: 'antena', dur: 0.5, puzzle: 'rota', role: 'navegador', dc: 7 },
    ];
  },
  start(ev) {
    const pct = has('valvulas') ? 0.10 : 0.20;
    const lost = S.res.combustivel * pct; ev.data.lost = lost;
    addRes('combustivel', -lost, 'Vazamento de combustível');
    damageSys('tanques', 20);
    toast(`Vazaram ${fmt(lost, 0)} kg de combustível (${pct * 100}%)!`, 'bad');
  },
  botSolve(ev) { S.cruise = 'economico'; ev.data.choice = 'economico'; },
  success(ev) { return 'Rota recalculada com a ajuda da equipe em solo.'; },
  failure() { addRes('combustivel', -30, 'Rota ineficiente'); return 'Sem nova rota, gastamos ainda mais combustível.'; },
};

EV.oxigenio = {
  time: 60, points: 35, tip: 'Usem os cilindros. O filtro reserva está no compartimento do suporte à vida.', ai: 'inspecionar os filtros e trocar o entupido.',
  setup(ev) {
    const quick = has('filtroReserva');
    ev.steps = [
      { id: 'achar', label: quick ? 'Localizar o filtro (troca rápida instalada)' : 'Descobrir qual filtro está entupido', station: 'suporte', dur: quick ? 1.5 : 1, puzzle: quick ? null : 'filtros', role: 'engenheiro', dc: 8 },
      { id: 'trocar', label: 'Trocar pelo filtro reserva', station: 'suporte', dur: quick ? 1.5 : 3, role: 'engenheiro' },
      { id: 'reiniciar', label: 'Reiniciar o sistema de O₂ e conferir o nível verde', station: 'suporte', dur: 2 },
    ];
  },
  start() { S.cylinders = true; narrate('Alerta de perigo! O suporte à vida apresentou problemas. Até resolver, toda a tripulação usa cilindros de oxigênio.'); },
  success() { S.cylinders = false; return 'Filtro trocado, oxigênio de volta ao verde.'; },
  failure() { S.cylinders = false; damageSys('suporte', 30); addRes('oxigenio', -15, 'Falha na filtragem'); moral(-10); return 'A filtragem ficou parada tempo demais. Suporte à vida danificado.'; },
};

EV.painel = {
  time: 55, points: 30, tip: 'Reiniciem o computador e recalibrem pelo mapa estelar.', ai: 'chamar o engenheiro para reiniciar e recalibrar.',
  setup(ev) {
    const backup = has('redundante') || has('analogicos');
    ev.steps = [
      { id: 'reboot', label: 'Reiniciar o computador de bordo', station: 'avionica', dur: 3, role: 'engenheiro' },
      { id: 'calibrar', label: backup ? 'Carregar o mapa de backup' : 'Recalibrar o mapa estelar', station: 'avionica', dur: backup ? 2 : 0.5, puzzle: backup ? null : 'mapa', role: 'engenheiro', dc: 9 },
    ];
  },
  start() { S.speedMod = 0.5; sayRole('navegador', F('crew.c5')); },
  success() { return 'Computador recalibrado. A nave sabe onde está de novo.'; },
  failure() { S.progress = Math.max(0, S.progress - 0.03); damageSys('avionica', 25); return 'A nave ficou perdida por tempo demais e desviou da rota.'; },
};

EV.lixo = {
  time: 60, points: 25, tip: 'Recolham tudo que flutua e confiram os mecanismos.', ai: 'coletar o lixo e chamar um engenheiro para o motor.',
  setup(ev) {
    ev.steps = [
      { id: 'coletar', label: 'Coletar a maior parte do lixo (8 de 11)', station: null, dur: 0 },
      { id: 'mecanismo', label: 'Engenheiro: retirar lixo preso no mecanismo do motor', station: 'motor', dur: 4, role: 'engenheiro', optional: true },
    ];
  },
  start(ev) {
    S.trash = [];
    const kinds = ['lata', 'garrafa', 'papel', 'resto'];
    for (let i = 0; i < 11; i++) {
      const room = pick(ROOMS);
      S.trash.push({ id: i, x: room.x0 + 15 + Math.random() * (room.x1 - room.x0 - 30), deck: room.deck, kind: pick(kinds), ph: Math.random() * 6 });
    }
    ev.data.collected = 0;
    addRes('lixo', 4, 'Lixo solto');
    sayRole('engenheiro1', F('crew.c6'));
  },
  tick(ev, dt) {
    // bots ajudam a recolher
    for (const c of alive()) {
      if (c.owner && c.owner !== 'bot') continue;
      if (c.task || c.hibernating) continue;
      if (Math.random() < dt * 0.3) { const t = pick(S.trash); if (t) { c.tx = t.x; c.tdeck = t.deck; } }
    }
    for (const c of alive()) {
      for (const t of S.trash) if (!t.got && t.deck === c.deck && Math.abs(t.x - c.x) < 10 && (!c.owner || c.owner === 'bot' ? Math.random() < dt * 1.5 : false)) collectTrash(ev, t, c);
    }
    S.trash = S.trash.filter(t => !t.got);
    const s = ev.steps[0];
    if (!s.done && ev.data.collected >= 8) completeStep(ev, s, null);
    s.label = `Coletar a maior parte do lixo (${ev.data.collected} de 11)`;
    if (s.done && ev.steps[1].done) endEvent(true);
  },
  customEnd: true,
  onStep(ev, step, c) {
    if (step.id === 'mecanismo' && c && !roleMatches(c, 'engenheiro')) {
      if (d20() < 10) { damageSys('propulsao', 10); toast('Sem experiência, a retirada danificou o mecanismo.', 'warn'); }
    }
    if (ev.steps.every(s => s.done)) endEvent(true);
  },
  success() { S.trash = []; return 'Lixo recolhido e compactado. O motor está livre.'; },
  failure(ev) { S.trash = []; moral(-5); if (!ev.steps[1].done) damageSys('propulsao', 15); return 'Lixo demais pela nave: mau cheiro, mofo e um mecanismo travado.'; },
};
function collectTrash(ev, t, c) {
  if (t.got) return; t.got = true; ev.data.collected++;
  addRes('lixo', -0.2, 'Lixo recolhido');
  S.v++;
}
ACTIONS.pickTrash = (p, actor) => {
  const ev = S.event; if (!ev || ev.type !== 'lixo' || ev.phase !== 'run') return;
  const t = S.trash.find(x => !x.got && x.deck === actor.deck && Math.abs(x.x - actor.x) < 16);
  if (t) collectTrash(ev, t, actor);
};

EV.radio = {
  time: 75, points: 30, tip: '…ssshhh… (a dica também chegou cortada)', ai: 'girar o sintonizador até o chiado sumir.',
  setup(ev) {
    ev.steps = [
      { id: 'sintonizar', label: 'Sintonizar o rádio e decifrar a mensagem', station: 'antena', dur: 1, puzzle: 'radio', role: 'engenheiro', dc: 10 },
      { id: 'antena', label: 'Engenheiro: consertar a antena (reduz o chiado)', station: 'antena', dur: 6, role: 'engenheiro', optional: true },
    ];
  },
  start() { S.commDown = 999; sayRole('engenheiro2', F('crew.c7')); },
  onStep(ev, step) { if (step.id === 'antena') { ev.data.fixed = true; damageSys('comunicacao', -15); } },
  botSolve(ev) { ev.data.correct = Math.random() < 0.7; ev.data.msg = pick(RADIO_MESSAGES); },
  success(ev) {
    S.commDown = 0;
    if (ev.data.correct) { addPoints(10, 'Mensagem decifrada'); if (ev.data.msg) applyRadioMsg(ev.data.msg); return 'Mensagem entendida: “' + (ev.data.msg ? ev.data.msg.answer : '') + '”.'; }
    moral(-5); return 'O rádio voltou, mas a mensagem foi mal interpretada. A tripulação ficou confusa.';
  },
  failure() { S.commDown = 0; damageSys('comunicacao', 20); return 'Ficamos sem entender o aviso da Terra.'; },
};
function applyRadioMsg(msg) {
  if (msg.answer.includes('tempestade')) S.stormWarned = true;
  if (msg.answer.includes('remédios')) toast('Dica: verifique a validade dos remédios na Enfermaria.', 'info');
  if (msg.answer.includes('detritos')) { S.progress = Math.min(1, S.progress + 0.01); }
  if (msg.answer.includes('água')) moral(5);
}

EV.contaminacao = {
  time: 70, points: 35, tip: 'Destilação, filtração, oxidação e desinfecção — nessa ordem.', ai: 'seguir as 4 etapas do ciclo fechado.',
  setup(ev) {
    ev.steps = [
      { id: 'ordem', label: 'Montar a sequência de descontaminação', station: 'suporte', dur: 1, puzzle: 'agua', role: 'engenheiro', dc: 8 },
      { id: 'processar', label: 'Processar a água no ciclo fechado', station: 'suporte', dur: 4 },
    ];
  },
  start() { addRes('agua', -40, 'Água contaminada descartada'); narrate('A água disponível foi contaminada por mau gerenciamento. Ela é vital para a hidratação e para a agricultura.'); },
  success() { return 'Água descontaminada: destilada, filtrada, oxidada e desinfetada.'; },
  failure() {
    addRes('agua', -120, 'Água contaminada'); addRes('plantacao', -5, 'Irrigação contaminada');
    const v = pick(alive()); v.sickness = 'infeccao'; v.status = 'ferido'; v.statusT = 30;
    return 'A água contaminada se espalhou. Perdemos água e alguém adoeceu.';
  },
};

EV.traje = {
  time: 60, points: 40, tip: 'Mandem outro tripulante pela eclusa, rápido!', ai: 'escolher o outro engenheiro como substituto.',
  can() { return roleAlive('engenheiro'); },
  setup(ev) {
    ev.time = has('trajes') ? 75 : 55; ev.t = ev.dur = ev.time;
    ev.steps = [
      { id: 'escolher', label: 'Escolher quem vai substituir o engenheiro', station: 'eclusa', dur: 0.5, puzzle: 'substituto', dc: 5 },
      { id: 'troca', label: 'Substituto: trocar de lugar pela eclusa', station: 'eclusa', dur: 4 },
    ];
  },
  start(ev) {
    const v = byRole('engenheiro').find(c => c.alive && !c.hibernating) || byRole('engenheiro').find(c => c.alive);
    ev.data.victim = v.id; v.task = null; v.outfit = 'broken'; v.x = STATIONS.eclusa.x + 30; v.deck = 'L'; v.tx = v.x; v.tdeck = 'L'; v.eva = true;
    say(v, F('crew.c8'), 8);
  },
  botSolve(ev) { const sub = alive().find(c => c.id !== ev.data.victim && available(c) && c.id !== 'cmd'); ev.data.sub = sub ? sub.id : null; },
  success(ev) { const v = crewById(ev.data.victim); v.outfit = 'suit'; v.eva = false; moral(-2, v); damageSys('acoplamento', -10); return `${v.name} voltou para dentro a tempo. O substituto terminou o reparo.`; },
  failure(ev) {
    const v = crewById(ev.data.victim); v.outfit = 'suit'; v.eva = false;
    if (has('trajes') || has('enfermaria')) { const r = d10(); if (r === 1) kill(v, 'vazamento no traje'); else { v.status = 'incapacitado'; v.statusT = 60; return `${v.name} foi resgatado inconsciente. Sobreviveu graças aos trajes/enfermaria.`; } }
    else kill(v, 'vazamento no traje');
    return 'O substituto não chegou a tempo.';
  },
};

EV.doenca = {
  time: 60, points: 30, tip: 'Usem os aparelhos para o diagnóstico antes do remédio.', ai: 'medir temperatura e oxigênio no sangue primeiro.',
  setup(ev) {
    ev.steps = [{ id: 'tratar', label: 'Diagnosticar e medicar o doente', station: 'enfermaria', dur: 1, puzzle: 'remedio', role: 'paramedico', dc: 8 }];
  },
  start(ev) {
    const cands = alive().filter(c => !c.hibernating);
    const v = pick(cands);
    const dis = pick(DISEASES);
    ev.data.victim = v.id; ev.data.disease = dis.id;
    v.sickness = dis.id;
    say(v, `Não estou bem... sinto ${dis.sintoma}.`, 7);
    if (S.day > S.meds.validUntil) logMsg('Atenção: os remédios em estoque estão vencidos.', 'warn');
  },
  botSolve(ev) {
    if (S.day > S.meds.validUntil) ACTIONS.replaceMeds();
    const v = crewById(ev.data.victim); if (v) v.sickness = null; addRes('medicos', -1, 'Remédio');
  },
  success(ev) { const v = crewById(ev.data.victim); return `${v.name} foi tratado e está se recuperando.`; },
  failure(ev) {
    const v = crewById(ev.data.victim);
    v.status = 'incapacitado'; v.statusT = 40; moral(-8); addRes('medicos', -2, 'Tentativas de tratamento');
    if (!has('enfermaria') && !roleAlive('paramedico') && d10() === 1) kill(v, 'doença sem tratamento');
    return `${v.name} piorou e ficou incapacitado por um tempo, com mobilidade e visão reduzidas.`;
  },
};

EV.tempestade = {
  time: 45, points: 25, tip: 'Todos ao abrigo blindado dos dormitórios!', ai: 'ordenar abrigo imediatamente.',
  setup(ev) { ev.steps = [{ id: 'abrigo', label: 'Levar toda a tripulação ao abrigo (Dormitórios)', station: null, dur: 0 }]; },
  start(ev) { ev.data.stormAt = 22; narrate('Tempestade solar! Partículas de alta energia vão atravessar a nave em instantes.'); },
  customEnd: true,
  tick(ev, dt) {
    const room = ROOMS.find(r => r.id === 'dormitorio');
    const inside = c => c.deck === 'L' && c.x >= room.x0 && c.x <= room.x1;
    const all = alive().filter(c => !c.eva);
    ev.data.inside = all.filter(inside).length; ev.data.total = all.length;
    ev.steps[0].label = `Levar toda a tripulação ao abrigo (${ev.data.inside}/${ev.data.total} nos Dormitórios)`;
    if (ev.t <= ev.data.stormAt && !ev.data.storm) {
      ev.data.storm = true; S.commDown = 20; S.shake = 0.6;
      let hurt = 0;
      for (const c of all) if (!inside(c)) { c.status = 'ferido'; c.statusT = has('escudoMag') ? 15 : 35; hurt++; }
      let dmg = (has('escudoMag') ? 3 : 8) * (has('casco2') ? 0.5 : 1) * (S.stormWarned ? 0.5 : 1);
      damageSys('casco', dmg); damageSys('comunicacao', dmg);
      ev.data.hurt = hurt;
      logMsg(`A tempestade atingiu a nave. ${hurt} tripulante(s) fora do abrigo.`, hurt ? 'bad' : 'good');
    }
    if (ev.data.storm && ev.t <= ev.data.stormAt - 15) endEvent(ev.data.hurt === 0, { text: ev.data.hurt ? `${ev.data.hurt} tripulante(s) ficaram expostos à radiação.` : 'Todos protegidos no abrigo. Ninguém foi exposto.' });
  },
  noTimer: false,
  success() { return 'Todos protegidos no abrigo.'; },
  failure() { return 'Parte da tripulação foi exposta à radiação.'; },
};
ACTIONS.shelter = () => {
  for (const c of alive()) if ((!c.owner || c.owner === 'bot') && !c.eva && !c.hibernating) { c.task = null; goTo(c, 'dormitorio', Math.random() * 60 - 40); c.idleT = 40; }
  toast('Tripulação a caminho do abrigo!');
};

// ===================== REGULAÇÃO TÉRMICA =====================
// Só liga/desliga: aquecedor (esquenta) e resfriador (esfria) para manter
// o interior entre 18 e 26 °C. Os dois gastam energia.
const TH_CTRL = {
  heat: { icon: '🔥', name: 'Aquecedor' },
  cool: { icon: '❄', name: 'Resfriador' },
};
const TH_KWH = { heat: 0.25, cool: 0.2 }; // kWh por segundo ligado

EV.termico = {
  time: 60, points: 0, noTimer: true, customEnd: true,
  tip: 'No calor, ligue o resfriador; na sombra, ligue o aquecedor.', ai: 'ligar o resfriador no pico de calor.',
  setup(ev) {
    const D = 60; // fase térmica de 1 minuto
    ev.t = ev.dur = D;
    ev.steps = [];
    S.thermal = { D, el: 0, T: 22, sun: 30, shade: -60, scene: 0, overload: false, shadow: false,
      on: { heat: false, cool: false, shut: false }, kwh: 0, fuel: 0, plantsLost: 0, outT: 0, plantT: 0, msgs: [] };
  },
  start(ev) {
    narrate('Atenção, tripulação. A nave está entrando em uma zona de calor extremo. No espaço não há ar para espalhar o calor. O lado voltado para a estrela esquenta sem parar, enquanto o outro lado congela. Mantenham a temperatura interna entre 18 e 26 graus.');
    sayRole('navegador', F('crew.c9'), 9);
    thMsg('Alerta de calor: a nave vai esquentar. Prepare o resfriador.');
  },
  tick(ev, dt) { thermalTick(ev, dt); },
};

function thMsg(t) { const th = S.thermal; if (!th) return; th.msgs.push(t); if (th.msgs.length > 12) th.msgs.shift(); logMsg(t, 'thermal'); }

function thermalTick(ev, dt) {
  const th = S.thermal; if (!th) return;
  th.el += dt; ev.t = Math.max(0, th.D - th.el);
  const p = th.el / th.D;
  const peak = has('pintura') ? 100 : 120;
  if (th.scene < 2 && p >= 0.12) { th.scene = 2; thMsg('A estrela se aproxima: o lado do Sol sobe para +' + peak + ' °C. Ligue o resfriador.'); sayRole('engenheiro1', F('crew.c10'), 8); }
  if (th.scene < 4 && p >= 0.45) { th.scene = 4; th.overload = true; thMsg('Sobrecarga elétrica: os equipamentos esquentam a nave. Ligue o resfriador.'); sayRole('pesquisador', F('crew.c12'), 8); }
  if (th.scene < 5 && p >= 0.66) { th.scene = 5; th.shadow = true; th.overload = false; thMsg('Entrada na sombra: vai esfriar rápido. Desligue o resfriador e ligue o aquecedor.'); sayRole('paramedico', F('crew.c13'), 8); }
  // temperaturas externas
  const sunT = th.shadow ? -60 : (th.scene >= 2 ? peak : 50);
  const shadeT = th.shadow ? -150 : (th.scene >= 2 ? -120 : -100);
  th.sun += (sunT - th.sun) * Math.min(1, dt * 0.4);
  th.shade += (shadeT - th.shade) * Math.min(1, dt * 0.4);
  // gasto de energia dos aparelhos ligados (desligam sozinhos sem energia)
  for (const k of ['heat', 'cool']) {
    if (!th.on[k]) continue;
    const need = TH_KWH[k] * dt;
    if (S.res.energia < need) { th.on[k] = false; thMsg('Sem energia: ' + TH_CTRL[k].name + ' desligou.'); continue; }
    addRes('energia', -need, 'Regulação térmica'); th.kwh += need; S.stats.thermalKwh += need;
  }
  const closed = false; // sem cortinas: só liga/desliga
  const heatIn = Math.max(0, th.sun - 20) * 0.06 * (closed ? 0.3 : 1);
  const coldLoss = Math.max(0, 20 - th.shade) * (th.shadow ? 0.06 : 0.012) * (closed ? 0.5 : 1);
  const equip = (th.overload ? 7 : 3) + (has('fusao') ? 1 : 0);
  // sem aparelhos a nave iria para "base"; o painel indica o que ligar a partir dela
  th.base = 22 + heatIn - coldLoss + equip;
  th.want = { cool: th.base > 26, heat: th.base < 18 };
  const Teq = th.base - (th.on.cool ? 8 : 0) + (th.on.heat ? 9 : 0);
  th.Teq = Teq;
  th.T += (Teq - th.T) * Math.min(1, dt * 0.25);
  // plantação e tripulação sofrem fora da faixa
  if (th.T > 26 || th.T < 18) {
    th.outT += dt; th.plantT += dt * 5;
    const every = has('tAgr') ? 12 : 7;
    if (th.plantT >= every && th.plantsLost < 18) { th.plantT = 0; th.plantsLost += 1; addRes('plantacao', -1, 'Temperatura fora da faixa'); }
  }
  if (th.T > 32 || th.T < 12) for (const c of alive()) c.humor = clamp(c.humor - dt * 0.75, 0, 100);
  if (th.el >= th.D) thermalEnd(ev);
}
ACTIONS.thToggle = p => {
  const th = S.thermal; const ev = S.event;
  if (!th || !ev || ev.phase !== 'run' || !TH_CTRL[p.k]) return;
  const k = p.k;
  if (!th.on[k] && S.res.energia < 1) return toast('Energia insuficiente.', 'warn');
  th.on[k] = !th.on[k];
  if (th.on[k]) th.on[k === 'heat' ? 'cool' : 'heat'] = false; // um desliga o outro
  thMsg(TH_CTRL[k].name + (th.on[k] ? ' ligado.' : ' desligado.'));
  S.v++;
};

function thermalEnd(ev) {
  const th = S.thermal;
  const E = S.res.energia, sh = S.res.escudo;
  let grade, pts;
  if (E < 9 || sh < 25) {
    grade = 'Crítico'; pts = 0; // falha não rende pontos
    const v = pick(alive().filter(c => c.id !== 'cmd')); if (v) { v.status = 'ferido'; v.statusT = 90; }
    S.fragile = true;
  } else if (th.outT < th.D * 0.15 && E > 24) { grade = 'Excelente'; pts = 40; moral(10); }
  else { grade = 'Sobrevivência'; pts = 25; }
  narrate('A zona de calor ficou para trás. Aqui no espaço, cada grau precisa ser controlado por nós, com energia, tempo e recursos limitados. Na Terra, a atmosfera faz isso sozinha, de graça.');
  const text = `Resultado: ${grade}. Custo para manter a temperatura: ${fmt(th.kwh)} kWh de energia, ${fmt(th.fuel, 0)} kg de combustível. Plantação perdida: ${fmt(th.plantsLost, 0)} kg. Tempo fora da faixa segura: ${fmt(th.outT, 0)} s.`;
  ev.data.grade = grade;
  if (grade === 'Crítico' || th.outT > th.D * 0.3) { S.thermGuide = true; try { Save.data.thermGuide = true; Save.write(); } catch (e) { /* */ } } // errou: da próxima vez, passo a passo
  ev.data.report = { kwh: th.kwh, fuel: th.fuel, plants: th.plantsLost, outT: th.outT, fails: 0, gb: 0 };
  endEvent(grade !== 'Crítico', { text, points: pts, grade, ok: grade !== 'Crítico' });
  S.event.result.points = pts;
}

// ===================== ESTÁGIOS: ESTAÇÃO, PLANETA E MIGRAÇÃO =====================
// give/get: o que sai e o que entra (para o painel mostrar antes → depois)
const TRADES = [
  { id: 'racao', name: '50 GB de dados → 10 kg de ração', give: ['dados', 50], get: ['comida', 10], can: () => S.res.dados >= 50, do: () => { addRes('dados', -50, 'Escambo'); addRes('comida', 10, 'Escambo'); } },
  { id: 'agua', name: '40 GB de dados → 100 L de água', give: ['dados', 40], get: ['agua', 100], can: () => S.res.dados >= 40, do: () => { addRes('dados', -40, 'Escambo'); addRes('agua', 100, 'Escambo'); } },
  { id: 'sementes', name: '1 peça sobressalente → sementes (+8 kg de plantação)', give: ['peças', 1], get: ['plantacao', 8], can: () => S.peças >= 1, do: () => { S.peças--; addRes('plantacao', 8, 'Escambo'); } },
  { id: 'medicos', name: '30 GB de dados → 3 recursos médicos', give: ['dados', 30], get: ['medicos', 3], can: () => S.res.dados >= 30, do: () => { addRes('dados', -30, 'Escambo'); addRes('medicos', 3, 'Escambo'); } },
  { id: 'energia', name: '40 GB de dados → recarga de 30 kWh', give: ['dados', 40], get: ['energia', 30], can: () => S.res.dados >= 40, do: () => { addRes('dados', -40, 'Escambo'); addRes('energia', 30, 'Escambo'); } },
  { id: 'receita', name: '100 GB de dados → receita rara', give: ['dados', 100], getTxt: 'Receita rara', can: () => S.res.dados >= 100 && RECIPES.some(r => !S.food.recipes.includes(r.id)), do: () => { addRes('dados', -100, 'Escambo'); const r = RECIPES.find(x => !S.food.recipes.includes(x.id)); S.food.recipes.push(r.id); toast('Nova receita no livro: ' + r.name); } },
  { id: 'reparo', name: '10 kg de ração → reparo completo da Aviônica', give: ['comida', 10], getTxt: 'Aviônica 100%', can: () => S.res.comida >= 10, do: () => { addRes('comida', -10, 'Escambo'); S.systems.avionica.hp = 100; } },
];
// quanto tempo a ração dura e quantos dias faltam até Pontes-01b
function foodOutlook() {
  const n = alive().filter(c => !c.hibernating).length || 1;
  const per = { pleno: 0.2, reduzido: 0.133, minimo: 0.067 }[S.food.racionamento] || 0.2;
  const perDay = per * 3 * n;
  const cr = cruiseObj() || { speed: 1 };
  const left = Math.ceil((1 - S.progress) * S.totalDays / Math.max(0.3, cr.speed * (S.speedMod || 1)));
  return { perDay, days: S.res.comida / perDay, left, n };
}
ACTIONS.trade = p => { const t = TRADES.find(x => x.id === p.id); if (!t || !t.can()) return; t.do(); S.explore.trades++; toast('Troca feita: ' + t.name, 'good'); };
ACTIONS.analyzeExo = p => {
  if (S.explore.analyzed.includes(p.id)) return;
  const cost = has('lab') ? 5 : 10;
  if (S.res.dados < cost) return toast('Dados insuficientes para a análise.', 'warn');
  addRes('dados', -cost, 'Análise de exoplaneta'); S.explore.analyzed.push(p.id);
};
// Destino livre: o jogador pode escolher qualquer exoplaneta, até os errados (e aprender com as consequências).
// destino: na primeira tentativa qualquer planeta (errar ensina); depois de um erro, só Pontes-01b
ACTIONS.setDest = p => { if (p.id !== 'pontes' && S.explore.wrongOnce) return; if (EXOPLANETS.some(e => e.id === p.id)) S.explore.dest = p.id; };
// guia depois do erro: o botão de Pontes-01b parte direto
ACTIONS.goPontes = () => { if (S.scene !== 'station') return; S.explore.guideAt = 0; S.explore.dest = 'pontes'; ACTIONS.leaveStation(); };
// sem clique em 5 s: a nave segue sozinha para Pontes-01b e vai direto à escolha do local de pouso
function guideAutoPontes() {
  if (!S || S.scene !== 'station' || !S.explore.guideAt || (typeof Net !== 'undefined' && Net.role === 'client')) return;
  if (Date.now() - S.explore.guideAt < 5000) return;
  S.explore.guideAt = 0; S.explore.dest = 'pontes'; S.explore.chosen = 'pontes';
  leaveStation(); S.event = null; S.progress = 1; enterPlanet();
  S.planet = S.planet || { analyzed: [], challenges: [], site: null };
  if (!S.planet.site) S.planet.site = bestSite().id;
  S.stage = 4; S.scene = 'migration';
  narrate('Rota automática para Pontes-01b. Escolha agora o local de pouso da colônia.');
}
ACTIONS.chooseExo = ACTIONS.setDest;
function tripCost(exo, back) {
  const t = exo.trip; const k = back ? 0.9 : 1;
  return { fuel: Math.round(t.fuel * k), o2: Math.round(t.o2 * k), food: Math.round(t.food * k), days: t.days };
}
function applyTripCost(c) {
  addRes('combustivel', -c.fuel, 'Desvio de rota'); addRes('oxigenio', -c.o2, 'Desvio de rota');
  addRes('comida', -c.food, 'Desvio de rota'); addRes('agua', -c.days * 4, 'Desvio de rota');
  S.day += c.days; S.v++;
}
ACTIONS.leaveStation = () => {
  const id = S.explore.dest;
  if (!id) return toast('Escolha primeiro o planeta de destino.', 'warn');
  if (id === 'pontes') {
    if (S.explore.analyzed.includes('pontes') && !S.explore.bonusPaid) { S.explore.bonusPaid = true; addPoints(60, 'Análise científica correta'); }
    narrate('Controle da Missão: rota confirmada para Pontes-01b. Raio parecido com o da Terra, temperatura amena e estrela calma.');
    S.explore.chosen = 'pontes';
    return leaveStation();
  }
  const exo = EXOPLANETS.find(e => e.id === id); if (!exo || !exo.trip) return;
  const c = tripCost(exo);
  if (S.res.combustivel < c.fuel) {
    applyTripCost({ fuel: S.res.combustivel, o2: Math.min(S.res.oxigenio, c.o2), food: Math.min(S.res.comida, c.food), days: c.days });
    return fail(`Você partiu para ${exo.name} sem combustível suficiente (${c.fuel} kg). A nave ficou à deriva. ${L(exo.trip.outcome)}`);
  }
  applyTripCost(c);
  S.explore.wrong = (S.explore.wrong || 0) + 1;
  const gain = addRes('dados', exo.trip.dados, 'Dados de exoplaneta') || 0;
  if (S.res.oxigenio <= 0) return fail(`O oxigênio acabou durante a viagem até ${exo.name}.`);
  if (S.res.comida <= 0) moral(-15);
  moral(exo.trip.moral);
  S.detour = { id, arrivedDay: S.day, dados: Math.round(gain) };
  S.scene = 'detour'; S.stage = 2;
  narrate(`Chegamos a ${exo.name}. Atenção: este não é o destino planejado.`);
};
ACTIONS.detourReturn = () => {
  if (S.scene !== 'detour' || !S.detour) return;
  const exo = EXOPLANETS.find(e => e.id === S.detour.id); const c = tripCost(exo, true);
  if (S.res.combustivel < c.fuel) {
    applyTripCost({ fuel: S.res.combustivel, o2: Math.min(S.res.oxigenio, c.o2), food: Math.min(S.res.comida, c.food), days: c.days });
    return fail(`Sem combustível para voltar de ${exo.name} (precisava de ${c.fuel} kg). A nave ficou presa lá, longe de Pontes-01b.`);
  }
  applyTripCost(c);
  if (S.res.oxigenio <= 0) return fail('O oxigênio acabou durante a volta à Estação Ponte-Alfa.');
  if (S.res.comida <= 0) moral(-15);
  S.explore.visited = S.explore.visited || {}; S.explore.visited[exo.id] = true;
  S.explore.dest = null; S.detour = null; S.scene = 'station'; S.stage = 2;
  S.explore.wrongOnce = true; S.explore.guideAt = Date.now(); // trava os outros planetas e destaca Pontes-01b
  moral(-3);
  addPoints(10, 'Lição aprendida: dados de um exoplaneta real');
  narrate('De volta à Estação Ponte-Alfa. Escolha o próximo destino com mais cuidado, Comandante.');
};

ACTIONS.planetAnalyze = p => {
  if (S.planet.analyzed.includes(p.id)) return;
  const an = PLANET_ANALYSES.find(a => a.id === p.id);
  if (S.res.dados < an.cost) return toast('Dados/armazenamento insuficientes.', 'warn');
  if (S.res.energia < 4) return toast('Energia insuficiente.', 'warn');
  addRes('dados', -an.cost * 0.5, 'Análise planetária'); addRes('energia', -4, 'Análise planetária');
  addRes('dados', an.cost * 0.3, 'Dados do planeta');
  let txt = '';
  if (!has('sonda')) {
    const r = d20() + (has('pouso') ? 3 : 0);
    if (r < 7) { damageSys('casco', 8); addRes('combustivel', -10, 'Descida de reconhecimento'); const v = pick(alive().filter(c => c.id !== 'cmd')); if (v) { v.status = 'ferido'; v.statusT = 30; } txt = ' A descida de reconhecimento foi turbulenta: casco danificado e um tripulante ferido.'; }
    else { addRes('combustivel', -10, 'Descida de reconhecimento'); txt = has('pouso') ? ' (Nave auxiliar usada.)' : ' (Sem sonda: a própria nave desceu para coletar.)'; }
  } else txt = ' (Sonda de reconhecimento: sem riscos para a tripulação.)';
  S.planet.analyzed.push(p.id);
  toast(`Análise de ${an.name} concluída.${txt}`, 'good');
};
const CHALLENGES = [
  { id: 'aclimatacao', name: 'Aclimatação ao ar de Pontes-01b', desc: 'O ar tem 19% de O₂ e pressão um pouco menor. A tripulação precisa se adaptar.', need: 9,
    mods: () => [[has('enfermaria') ? 2 : 0, 'enfermaria'], [roleAlive('paramedico') ? 2 : 0, 'paramédico'], [S.planet.analyzed.includes('atmosfera') ? 2 : 0, 'atmosfera analisada'], [moralIndex() < 40 ? -2 : 0, 'moral baixa']],
    fail: () => { moral(-10); const v = pick(alive().filter(c => c.id !== 'cmd')); if (v) { v.status = 'ferido'; v.statusT = 60; } return 'Tonturas e desmaios: um tripulante ferido, moral −10.'; } },
  { id: 'cultivo', name: 'Primeiro cultivo no solo alienígena', desc: 'O solo precisa de microrganismos terrestres para que as plantas cresçam.', need: 11,
    mods: () => [[has('sementes') ? 3 : 0, 'banco de sementes'], [roleAlive('agricultor') ? 2 : 0, 'agricultor'], [S.planet.analyzed.includes('solo') ? 3 : 0, 'solo analisado'], [S.adubo > 5 ? 1 : 0, 'adubo reciclado'], [has('estufa') ? 1 : 0, 'experiência da estufa']],
    fail: () => { addRes('comida', -10, 'Cultivo falhou'); addRes('plantacao', -10, 'Cultivo falhou'); return 'As primeiras mudas morreram. Comida e sementes perdidas.'; } },
  { id: 'abrigo', name: 'Montar abrigo e energia na superfície', desc: 'Painéis, isolamento e um abrigo pressurizado precisam ficar prontos antes da noite.', need: 9,
    mods: () => [[byRole('engenheiro').filter(c => c.alive).length * 2, 'engenheiros'], [S.peças > 0 ? 1 : 0, 'peças sobressalentes'], [S.res.energia > 30 ? 1 : 0, 'energia sobrando'], [has('impressora') ? 2 : 0, 'impressora 3D'], [S.planet.analyzed.includes('radiacao') ? 1 : 0, 'radiação mapeada']],
    fail: () => { addRes('energia', -20, 'Abrigo improvisado'); moral(-6); return 'O abrigo ficou improvisado: energia −20 kWh e moral −6.'; } },
];
ACTIONS.challenge = p => {
  if (S.planet.challenges.find(c => c.id === p.id)) return;
  const ch = CHALLENGES.find(c => c.id === p.id);
  const mod = ch.mods().reduce((s, m) => s + m[0], 0);
  let r = d20();
  if (has('sangue') && r + mod < ch.need && r !== 20) { const r2 = d20(); if (r2 > r) { r = r2; logMsg('Sangue-frio: nova rolagem.'); } }
  const ok = r === 20 || (r !== 1 && r + mod >= ch.need);
  const txt = ok ? 'Sucesso!' : ch.fail();
  S.planet.challenges.push({ id: ch.id, ok, txt });
  if (ok) addPoints(30, ch.name);
  toast(`${ch.name}: ${ok ? 'sucesso' : 'falhou'}. ${ok ? '' : txt}`, ok ? 'good' : 'bad');
};
ACTIONS.toMigration = () => {
  if (S.planet.challenges.length < CHALLENGES.length) return toast('Enfrente todos os desafios de adaptação antes.', 'warn');
  S.stage = 4; S.scene = 'migration';
  narrate('Migração. Decida o destino da expedição e organize a chegada, considerando as investigações e os recursos disponíveis.');
};
ACTIONS.chooseSite = p => { S.planet.site = p.id; };
// atalho: descer para a colônia já, sem enfrentar todos os desafios de órbita (a colônia começa mais difícil)
ACTIONS.landNow = () => {
  if (S.scene !== 'planet' && S.scene !== 'migration') return;
  if (!S.planet.site) S.planet.site = bestSite().id;
  S.stage = 4; S.scene = 'migration';
  ACTIONS.land();
};
ACTIONS.land = () => {
  if (!S.planet.site) return toast('Escolha um local de pouso.', 'warn');
  const site = LANDING_SITES.find(s => s.id === S.planet.site);
  const need = landingFuel();
  const reasons = []; // só o que impede mesmo de pousar; o resto vira dificuldade na colônia
  let score = 0; const det = [];
  for (const k in site.score) { const known = S.planet.analyzed.includes(k); const v = site.score[k]; score += known ? v : Math.min(v, 0) - (known ? 0 : 0.5); det.push(k); }
  score += S.planet.challenges.filter(c => c.ok).length;
  if (has('sementes')) score += 1;
  // pouso de emergência: sem combustível suficiente a nave desce "de barriga" (dano no casco e tripulante ferido)
  if (S.res.combustivel < need) {
    damageSys('casco', 25); moral(-5);
    const v = pick(alive().filter(c => c.id !== 'cmd')); if (v) v.status = 'ferido';
    toast('Pouso de emergência: combustível curto (' + Math.round(S.res.combustivel) + ' de ' + need + ' kg). O casco sofreu e alguém se feriu.', 'bad');
  }
  // local pouco investigado ou hostil: a colônia começa mais difícil, mas começa
  if (score < 3) {
    moral(-4); addRes('energia', -Math.min(S.res.energia, 15), 'Terreno hostil'); addRes('agua', -Math.min(S.res.agua, 80), 'Terreno hostil');
    score = Math.max(1, score);
    toast('Terreno hostil ou pouco investigado: a colônia começa com menos energia e água.', 'warn');
  }
  if (!has('pouso')) {
    const r = d20();
    if (r < 6) { damageSys('casco', 40); addRes('casco', -40, 'Pouso difícil'); const v = pick(alive().filter(c => c.id !== 'cmd')); if (v && d10() <= 3) kill(v, 'pouso difícil'); }
  }
  addRes('combustivel', -Math.min(need, S.res.combustivel), 'Pouso');
  if (S.fail) return;
  if (alive().length < 3) reasons.push('Restaram menos de 3 tripulantes.');
  if (reasons.length) { fail(reasons.join(' ')); return; }
  addPoints(200, 'Chegada a Pontes-01b');
  startColony(site, score); // o jogo continua na superfície de Pontes-01b
};
