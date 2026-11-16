// ============================================================
//  ROTINA DO ASTRONAUTA — tarefas pequenas de cada dia na nave.
//  Entre um desafio e outro a tripulação faz manutenção: checar o
//  suporte à vida, cuidar da horta, processar o lixo... O computador
//  de bordo indica onde e como, e a lista fica no canto da tela.
//  Quando um desafio chega a rotina pausa; depois ela continua.
// ============================================================
'use strict';

// on: 'open' = abrir o painel da estação (E); lista = ações que contam
const CHORES = {
  rota:     { st: 'ponte', icon: '🧭', t: 'Conferir a rota na Ponte', how: 'Andar de cima, à direita. Aperte E e veja o progresso e os dias restantes.', on: 'open' },
  suporte:  { st: 'suporte', icon: '🫁', t: 'Checar o Suporte à vida', how: 'Andar de baixo, 2ª sala. Aperte E e confira O₂, água e filtros.', on: 'open', sys: 'suporte' },
  horta:    { st: 'estufa', icon: '🌱', t: 'Cuidar da horta', how: 'Na Estufa, aperte E e clique em "Cuidar de todas", plante ou colha.', on: ['careAll', 'care', 'plant', 'harvest'], need: () => has('estufa') },
  lixo:     { st: 'lixo', icon: '🗑', t: 'Processar o lixo', how: 'No Compactador (andar de baixo), aperte E e clique em "Processar agora".', on: ['processTrash', 'ejectTrash'], need: () => S.res.lixo >= 1 },
  cardapio: { st: 'cozinha', icon: '🍳', t: 'Revisar o cardápio', how: 'Na Cozinha, aperte E e confira o que será servido hoje.', on: 'open' },
  tanques:  { st: 'tanqueAux', icon: '⛽', t: 'Conferir os tanques', how: 'Nos Tanques (andar de baixo, à esquerda), aperte E e veja água e combustível.', on: 'open', sys: 'tanques', alt: ['bomba'] },
  radio:    { st: 'antena', icon: '📡', t: 'Ler as mensagens da Terra', how: 'No Rádio (andar de cima, 2ª sala), aperte E.', on: 'open', sys: 'comunicacao' },
  motor:    { st: 'motor', icon: '🔧', t: 'Inspecionar os motores', how: 'Na Propulsão (andar de cima, à esquerda), aperte E e veja o estado do motor.', on: 'open', sys: 'propulsao' },
  saude:    { st: 'enfermaria', icon: '✚', t: 'Check-up da tripulação', how: 'Na Enfermaria (andar de cima), aperte E e veja quem precisa de cuidado.', on: 'open' },
  pesquisa: { st: 'lab', icon: '🔬', t: 'Ligar a pesquisa no Laboratório', how: 'No Laboratório, aperte E e marque "Pesquisa ligada".', on: ['research'], need: () => !S.researchOn },
  dormir:   { st: 'dormitorio', icon: '😴', t: 'Descansar', how: 'Nos Dormitórios (andar de baixo, à direita), aperte E e clique em Dormir.', on: ['sleep', 'rest'], need: () => { const m = me(); return m && m.humor < 70; } },
};
// o que acontece se a tarefa não for feita até o fim do dia
const CHORE_MISS = {
  rota: () => { S.progress = Math.max(0, S.progress - 0.005); }, suporte: () => damageSys('suporte', 6),
  horta: () => (S.trays || []).forEach(t => { if (t.crop) t.agua = Math.max(0, (t.agua || 0) - 25); }), lixo: () => { addRes('lixo', 1, 'Lixo acumulado'); moral(-2); },
  cardapio: () => moral(-2), tanques: () => damageSys('tanques', 6), radio: () => damageSys('comunicacao', 5), motor: () => damageSys('propulsao', 6),
  saude: () => moral(-3), pesquisa: () => addRes('dados', -5, 'Pesquisa parada'), dormir: () => { const m = me(); if (m) m.humor = clamp(m.humor - 6, 0, 100); },
};
const CHORE_MISS_TXT = { rota: 'a nave desviou um pouco', suporte: 'o Suporte à vida desgastou', horta: 'as plantas ficaram sem água', lixo: 'o lixo acumulou', cardapio: 'a tripulação reclamou da comida', tanques: 'os tanques desgastaram', radio: 'a comunicação desgastou', motor: 'o motor desgastou', saude: 'a moral caiu', pesquisa: 'perdemos dados', dormir: 'você está mais cansado' };
function routinePenalty() {
  const r = S && S.routine; if (!r || r.day !== S.day || S.scene !== 'ship' || S.tutorial < 4 || Net.role === 'client') return;
  if (r.hadEvent || evActive()) return; // dia com missão: a rotina estava pausada
  const miss = r.items.filter(x => !x.done);
  miss.forEach(x => CHORE_MISS[x.id] && CHORE_MISS[x.id]());
  if (miss.length) toast('⚠ Rotina incompleta: ' + miss.map(x => CHORE_MISS_TXT[x.id]).join(' · '), 'warn');
}
{ const _nd = newDay; newDay = function () { routinePenalty(); _nd(); }; }
const ROUTINE_DAY1 = ['suporte', 'horta', 'lixo', 'radio'];
const ROUTINE_SIZE = 3;

// ---------- comer: quando o jogador fica com fome, aparece a tarefa de ir à Cozinha ----------
const HUNGRY = 40;
function hungerTick() {
  if (!S || S.scene !== 'ship' || Net.role === 'client') return;
  for (const c of alive().filter(x => isHumanCrew(x) && !x.hibernating)) {
    if (c.saciedade < HUNGRY && !c.hungryWarned) { c.hungryWarned = true; if (S.fast) S.fast = 0; toast(`🍴 ${c.name} está com fome: vá à Cozinha e clique em Comer agora.`, 'info'); }
  }
}
function hungerItem() {
  const m = me(); if (!m || !m.alive || m.hibernating || m.saciedade >= HUNGRY) return null;
  return { t: 'Comer na Cozinha', icon: '🍴', how: 'Você está com fome. Na Cozinha, aperte E e clique em "Comer agora".' };
}

// missão (desafio) em andamento: a rotina fica pausada
const evActive = () => !!(S && S.event && S.event.phase !== 'result');
function routineNew() {
  if (!S || Net.role === 'client') return;
  // se um desafio tomou o dia, o que ficou pendente continua no dia seguinte (sem punição)
  const prev = S.routine;
  if (prev && prev.hadEvent && prev.day < S.day) {
    const left = prev.items.filter(x => !x.done);
    if (left.length) { S.routine = { day: S.day, items: left.map(x => ({ id: x.id, done: false })), bonus: false, carried: true }; return; }
  }
  const ok = id => !CHORES[id].need || CHORES[id].need();
  let ids;
  if (S.day <= 1) ids = ROUTINE_DAY1.filter(ok);
  else {
    // o que está precisando entra primeiro; o resto é sorteado
    const urgent = [];
    if (S.res.lixo >= 5) urgent.push('lixo');
    { const m = me(); if (m && m.humor < 50) urgent.push('dormir'); }
    if (has('estufa') && S.trays && S.trays.some(t => t.crop && (t.state !== 'crescendo' || t.agua < 60 || t.luz < 60 || t.nutr < 60))) urgent.push('horta');
    const rest = Object.keys(CHORES).filter(id => !urgent.includes(id) && ok(id)).sort(() => Math.random() - 0.5);
    ids = urgent.filter(ok).concat(rest);
  }
  while (ids.length < ROUTINE_SIZE) { const extra = ['rota', 'cardapio', 'tanques', 'motor', 'saude'].find(x => !ids.includes(x)); if (!extra) break; ids.push(extra); }
  // jornada curta: 1 tarefa por dia; longa: de 0 a 2 (no 1º dia, 2 para ensinar)
  const size = S.day <= 1 ? 0 : S.journey === 'curta' ? 1 : Math.floor(Math.random() * 3); // dia 1: só o tutorial
  S.routine = { day: S.day, items: ids.slice(0, size).map(id => ({ id, done: false })), bonus: false };
  // o ⏩ para quando chega tarefa nova, como nos desafios
  if (size && S.fast) { const auto = S.autoFast; S.fast = 0; S.autoFast = false; if (!auto) toast('⏸ Nova tarefa da rotina: tempo normal.', 'info'); }
}
function routineGet() {
  if (!S || S.scene !== 'ship') return null;
  if ((!S.routine || S.routine.day !== S.day) && Net.role !== 'client') routineNew();
  if (S.routine && evActive() && Net.role !== 'client') S.routine.hadEvent = true;
  hungerTick();
  return S.routine;
}
// chamado pelo host depois de cada ação (e quando alguém abre o painel de uma estação)
function routineHook(type, p, actor) {
  const r = S && S.routine; if (!r || S.scene !== 'ship' || r.day !== S.day || evActive()) return;
  for (const it of r.items) {
    if (it.done) continue;
    const ch = CHORES[it.id]; if (!ch) continue;
    const hit = ch.on === 'open' ? type === 'inspect' && (p.st === ch.st || (ch.alt || []).includes(p.st))
      : ch.on.includes(type) && (type !== 'research' || p.on) && (!['sleep', 'rest'].includes(type) || !p.id || (actor && p.id === actor.id));
    if (!hit) continue;
    it.done = true; it.by = actor ? actor.id : null;
    if (ch.sys && S.systems[ch.sys]) S.systems[ch.sys].hp = clamp(S.systems[ch.sys].hp + 3, 0, 100); // manutenção preventiva
    toast('✔ Rotina: ' + ch.t, 'good');
  }
  if (!r.bonus && r.items.length && r.items.every(x => x.done)) {
    r.bonus = true;
    alive().forEach(c => c.humor = clamp(c.humor + 3, 0, 100));
    addPoints(10, 'Rotina do dia completa');
    toast(K('🌟 Rotina do dia completa! A tripulação ficou mais animada.', '🌟 Daily routine done! The crew feels better.', '🌟 ¡Rutina del día completa! La tripulación se animó.'), 'good');
  }
}
ACTIONS.inspect = (p, actor) => routineHook('inspect', p, actor);
{ // todas as ações passam pelo gancho da rotina
  const _apply = applyAction;
  applyAction = function (type, p, actorId) { _apply(type, p, actorId); if (S && type !== 'inspect') routineHook(type, p || {}, crewById(actorId || 'cmd')); };
}
function routineNext() {
  const r = routineGet(); if (!r) return null;
  const hu = hungerItem(); if (hu && !evActive()) return { t: hu.t, how: hu.how, icon: hu.icon, go: { st: 'cozinha' }, routine: true };
  const it = r.items.find(x => !x.done); if (!it) return null;
  const ch = CHORES[it.id];
  return { t: ch.t, how: ch.how, icon: ch.icon, go: { st: ch.st }, routine: true };
}

// lista no canto: tutorial do 1º dia + rotina do dia; pausa durante desafios
function routineBox() {
  if (!S || S.scene !== 'ship' || U.help) return '';
  const r = routineGet(); if (!r) return '';
  const ev = S.event && S.event.phase !== 'result' ? S.event : null;
  const rows = [];
  if (S.tutorial < 4) assistSteps().filter(x => x.go && x.go.st).forEach(x => rows.push({ t: x.t, icon: x.icon, done: x.done, how: TUT_HOW[x.go.st] }));
  const hu = hungerItem();
  r.items.forEach(it => { const ch = CHORES[it.id]; rows.push({ t: ch.t, icon: ch.icon, done: it.done, how: ch.how }); });
  if (hu) rows.unshift({ t: hu.t, icon: hu.icon, done: false, how: hu.how });
  const cur = ev ? null : rows.find(x => !x.done);
  const done = r.items.filter(x => x.done).length;
  return `<div class="goals routine ${ev ? 'paused' : ''}"><b>${ev ? '⚠ ' + esc(L('EMERGÊNCIA')) : esc(L('ROTINA')) + ' · ' + esc(L('DIA')) + ' ' + S.day} <small>${done}/${r.items.length}</small></b>
    ${ev ? `<div class="evline">${esc(T((EVENT_INFO[ev.type] || {}).title || ''))}</div><div class="muted small">${esc(L('Rotina pausada: resolva o desafio primeiro.'))}</div>` : ''}
    ${rows.map(x => `<div class="${x.done ? 'done' : x === cur ? 'cur' : ''}">${x.done ? '☑' : x === cur ? '▶' : '☐'} ${x.icon} ${esc(L(x.t))}${x === cur && x.how ? `<div class="how">${esc(L(x.how))}</div>` : ''}</div>`).join('')}
    ${!ev && r.hadEvent && !r.bonus && r.items.length ? `<div class="muted small">⏸ ${esc(L('Hoje teve missão: o que faltar passa para amanhã.'))}</div>` : ''}
    ${!ev && !r.bonus && !r.hadEvent && S.tutorial >= 4 ? `<div class="muted small">⏳ ${Math.max(0, Math.floor(24 - S.dayT / S.dayLen * 24))}h · ${esc(L('o que não for feito hoje tem consequência'))}</div>` : ''}
    ${!ev && !r.items.length ? `<div class="muted small">☕ ${esc(L('Nenhuma tarefa hoje.'))}</div>` : ''}
    ${!ev && r.bonus ? `<div class="green small">✔ ${esc(L('Rotina completa.'))}</div>` : ''}</div>`;
}
const TUT_HOW = { ponte: 'Suba a escada e vá até a Ponte, à direita. Aperte E no painel.', cozinha: 'Desça até a Cozinha e aperte E para montar o cardápio.' };
