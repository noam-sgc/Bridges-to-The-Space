// ============================================================
//  COMPUTADOR DE BORDO — próximo passo, lista de tarefas e ajuda (H)
//  + aceleração do tempo (Shift+S / botão ⏩), pulo, corrida e
//  página do site em "modo jogo" (some o texto, aparece a tripulação).
// ============================================================
'use strict';

const RUN_MULT = 1.75; // Shift + andar
// gravidade do pulo por lugar: no espaço o pulo é lento e "flutua"
const JUMP = { ship: { v: 74, g: 120 }, earth: { v: 150, g: 620 }, colony: { v: 145, g: 583 } }; // Pontes-01b: 0,94 g

function jumpStart(o, where) {
  if (!o || (o.jy || 0) > 0.5) return false;
  const j = JUMP[where] || JUMP.earth;
  o.jv = j.v; o.jy = 0.01; o.jg = j.g; o.jHold = true;
  Sfx.tone(where === 'ship' ? 330 : 520, 0.08, 'triangle', 0.05);
  return true;
}
function jumpTick(o, dt) {
  if (!o || !o.jy) return;
  const g = o.jg || 600;
  // pulo dinâmico: soltar a tecla na subida corta o pulo; no espaço, segurar faz flutuar mais
  const holding = keys.Space || keys.KeyJ;
  let gg = g;
  if (o.jv > 0 && !holding) gg = g * 2.2;
  if (o.jv < 0 && holding && g < 200) gg = g * 0.55;
  o.jy += o.jv * dt; o.jv -= gg * dt;
  if (o.jy <= 0) { o.jy = 0; o.jv = 0; }
}

// ---------- aceleração do tempo ----------
UIH.fast = () => {
  if (!S || !['ship', 'colony'].includes(S.scene)) return;
  if (S.event && S.event.phase !== 'result') return toastLocal('Não dá para acelerar durante um desafio.');
  if (Net.role === 'client') return;
  // Shift+S de novo aumenta: 2x → 5x → 10x → normal
  const steps = [0, 2, 5, 10];
  S.fast = steps[(steps.indexOf(S.fast || 0) + 1) % steps.length];
  toastLocal(S.fast ? K(`⏩ Tempo ${S.fast}x até o próximo evento (Shift+S muda).`, `⏩ Time ${S.fast}x until the next event (Shift+S changes it).`, `⏩ Tiempo ${S.fast}x hasta el próximo evento (Shift+S lo cambia).`) : '▶ Tempo normal.');
};
// avança a simulação em passos de no máximo 0,1 s (estável mesmo a 10x)
function stepScaled(fn, dt, k) { let left = dt * k; while (left > 1e-6) { const h = Math.min(0.1, left); fn(h); left -= h; } }
function timeScale() { return S && S.fast && !(S.event && S.event.phase !== 'result') ? S.fast : 1; }
function toastLocal(k) { if (S) { S.toast = { text: k, kind: 'info', t: 3 * Math.max(1, S.fast || 1), id: Math.random() }; } } // dura o mesmo tempo real mesmo acelerado

// ---------- passos por cena ----------
const KS = (pt, en, es) => K(pt, en, es);
function assistSteps() {
  if (!S) return [];
  const list = [];
  const add = (t, done, go, icon, act) => list.push({ t, done: !!done, go, icon: icon || '▫', act });
  switch (S.scene) {
    case 'intro': add('Assista à apresentação do modo de jogo (Espaço avança).', false, null, '🎬'); break;
    case 'earth': {
      const E = U.earth || { read: {} }; const rd = E.read || {};
      add('Converse com a primeira moradora (Ms. Lia).', rd['npc:lia'], { earth: CITY_NPCS[0].x }, '💬');
      add('Vá até o foguete no fim da cidade e embarque (E).', U.comms, { earth: rocketX() }, '🚀');
      break;
    }
    case 'setup': {
      const st = S.setup;
      add('Missão: escolha a origem do Comandante e a rota.', U.setupStep > 0, { setup: 0 }, '🧭');
      add('Módulos: escolha até 5 slots (estufa, reciclador…).', U.setupStep > 1 && st.modules.length > 0, { setup: 1 }, '🧩');
      add('Suprimentos: combustível, água, oxigênio, comida e peças.', U.setupStep > 2, { setup: 2 }, '📦');
      add('Decole!', false, { setup: 3 }, '🚀');
      break;
    }
    case 'ship': {
      // só a progressão principal: desafios aleatórios têm o próprio painel
      const tut = [
        ['Vá à Ponte de comando (andar de cima, à direita).', 'ponte', '🧭', 1],
        ['Selecione a rota no painel.', 'ponte', '🚀', 2],
        ['Defina o cardápio na Cozinha (andar de baixo).', 'cozinha', '🍳', 4],
      ];
      tut.forEach(([t, st, ic, n]) => add(t, S.tutorial >= n, st ? { st } : null, ic));
      add(KS(`Leve a nave até Pontes-01b (${Math.round(S.progress * 100)}%).`, `Take the ship to Pontes-01b (${Math.round(S.progress * 100)}%).`, `Lleve la nave a Pontes-01b (${Math.round(S.progress * 100)}%).`), false, null, '🪐');
      break;
    }
    case 'station':
      add('Analise exoplanetas (dados reais).', S.explore.analyzed.length >= 2, null, '🔭');
      add('Escolha o planeta de destino.', S.explore.dest, null, '🎯');
      add('Parta da estação.', false, null, '🚀', 'leaveStation');
      break;
    case 'detour': add('Este planeta não serve: volte à Estação Ponte-Alfa.', false, null, '↩', 'detourReturn'); break;
    case 'planet':
      // as 4 análises que contam para escolher onde pousar
      [['atmosfera', 'Analise a atmosfera do planeta.'], ['agua', 'Analise a água do planeta.'], ['solo', 'Analise o solo do planeta.'], ['radiacao', 'Analise a radiação do planeta.']].forEach(([id, t]) => add(t, S.planet.analyzed.includes(id), null, '🔬'));
      add('Prepare a tripulação para descer.', S.planet.challenges.length >= CHALLENGES.length, null, '🧑‍🚀', 'prepCrew');
      add('Escolha onde pousar.', false, null, '🛬', 'toMigration');
      break;
    case 'migration':
      add(S.planet.site && S.planet.site !== bestSite().id ? 'O local ideal de pouso é o Vale Equatorial: água, clima ameno e radiação moderada.' : 'Escolha o local de pouso: o ideal é o Vale Equatorial (água, clima ameno e radiação moderada).', S.planet.site === bestSite().id, null, '📍');
      add('Pouse em Pontes-01b.', false, null, '🛬', 'land');
      break;
    case 'colony':
      if (S.colony.tut === 0) add('Leia a missão e comece a construir.', false, null, '📜', 'cTut');
      { const m = me();
        if (m && m.alive && m.saciedade < 35) add(K('Você está com fome: coma no refeitório (nave, habitat ou estufa).', 'You are hungry: eat at the mess (ship, habitat or greenhouse).', 'Tiene hambre: coma en el comedor (nave, hábitat o invernadero).'), false, { b: 'habitat' }, '🍴');
        if (m && m.alive && m.humor < 35) add(K('Você está cansado: durma em um quarto do habitat.', 'You are tired: sleep in a habitat bedroom.', 'Está cansado: duerma en una habitación del hábitat.'), false, { b: 'habitat' }, '😴'); }
      colonyObjectives().forEach(o => add(o.t, o.done, { b: { solar: 'solar', agua: 'agua', estufa: 'estufa', torre: 'torre', tx: 'torre', pista: 'pista', naves: 'pista' }[o.id] }, o.done ? '✔' : '🏗'));
      break;
  }
  return list;
}
// local de pouso com a melhor pontuação (o mesmo cálculo do pouso)
function bestSite() { return LANDING_SITES.slice().sort((a, b) => Object.values(b.score).reduce((x, y) => x + y, 0) - Object.values(a.score).reduce((x, y) => x + y, 0))[0]; }
function assistNext() {
  const n = assistSteps().find(s => !s.done) || null;
  // na nave, depois do tutorial: a rotina do dia vem antes do "siga viagem" (e pausa nos desafios)
  if (S && S.scene === 'ship' && !(n && n.go && n.go.st) && !(S.event && S.event.phase !== 'result') && typeof routineNext === 'function') { const r = routineNext(); if (r) return r; }
  return n;
}
function goStep(s) {
  if (!s || !s.go) return;
  const g = s.go;
  if (g.st && STATIONS[g.st]) U.autopilot = g.st;
  if (g.b && typeof CBUILD !== 'undefined' && CBUILD[g.b]) U.clickTarget = { x: CBUILD[g.b].x };
  if (g.earth != null && U.earth) U.earth.target = g.earth;
  if (g.setup != null) { U.setupStep = g.setup; U.setupDirty = true; }
}
// ---------- computador de bordo interativo ----------
// Não é um tutorial: ele observa a nave, avisa o que está ruim, sugere o
// próximo passo da missão e responde perguntas. (H abre / fecha.)
function pcTips() {
  if (!S || S.scene !== 'ship') return [];
  const t = []; const add = (k, icon, go, lvl) => t.push({ t: k, icon, go, lvl });
  const r = S.res, c = S.cap, m = me();
  const crew = alive().filter(x => !x.hibernating);
  if (r.oxigenio < c.oxigenio * 0.3) add('O₂ baixo: confira o Suporte à vida.', '🫁', { st: 'suporte' }, 3);
  if (r.energia < c.energia * 0.2) add('Energia baixa: economize (plantio e reparos gastam energia).', '⚡', null, 3);
  if (r.agua < c.agua * 0.2) add('Pouca água: o Suporte à vida recicla a água da nave.', '💧', { st: 'suporte' }, 2);
  const fome = crew.length ? crew.reduce((a, x) => a + x.saciedade, 0) / crew.length : 100;
  if (fome < 45) add('A tripulação está com fome: veja o cardápio na Cozinha.', '🍱', { st: 'cozinha' }, 2);
  if (m && m.alive && m.saciedade < 30) add('Você está com fome: coma na Cozinha (Comer agora).', '🍴', { st: 'cozinha' }, 3);
  { const fo = foodOutlook(); if (fo.days < 3) add(K(`A ração acaba em ≈ ${Math.max(0, Math.floor(fo.days))} dia(s)! Racione na Cozinha ou plante na Estufa.`, `Rations run out in ≈ ${Math.max(0, Math.floor(fo.days))} day(s)! Ration in the Kitchen or plant in the Greenhouse.`, `¡La ración se acaba en ≈ ${Math.max(0, Math.floor(fo.days))} día(s)! Raciona en la Cocina o planta en el Invernadero.`), '🍱', { st: 'cozinha' }, 3);
    else if (S.stage === 1 && fo.days < fo.left) add('A ração não chega ao destino: reduza o racionamento ou produza comida.', '🍱', { st: 'cozinha' }, 1); }
  if (m && m.alive && !m.hibernating && m.humor < 35) add('Você está exausto: durma nos Dormitórios.', '😴', { st: 'dormitorio' }, 2);
  else if (crew.some(x => x.id !== U.me && x.humor < 25)) add('Alguém da tripulação precisa dormir: mande descansar nos Dormitórios.', '😴', { st: 'dormitorio' }, 1);
  if (r.lixo > 15) add('Muito lixo a bordo: use o Compactador.', '🗑', { st: 'lixo' }, 1);
  return t.sort((a, b) => b.lvl - a.lvl);
}
const PC_KEYS = {
  earth: '← → andar · Shift correr · E conversar · Esc fechar',
  ship: '← → andar · ↑ ↓ escadas · Shift correr · E usar a estação · Espaço pular · R relatório · T tripulação · Esc fechar',
  colony: '← → andar · Shift correr · E abrir o prédio · Espaço pular · Esc fechar',
};
// perguntas: sc = cenas onde aparecem; a = resposta (lista de frases) e go = "Ir até lá"
const PC_QA = [
  { id: 'now', q: 'O que faço agora?', a: () => { const tp = pcTips()[0], n = assistNext(); const out = []; if (tp) out.push(tp.t); if (n) { out.push((tp ? 'Depois: ' : '') + '@' + n.t); if (n.how) out.push(n.how); } if (!out.length) out.push('Tudo em ordem. Explore ou acelere o tempo (Shift+S).'); return { a: out, go: tp && tp.go ? tp.go : n && n.go, act: !tp && n && n.act }; } },
  { id: 'rocket', sc: ['earth'], q: 'Onde fica o foguete?', a: () => ({ a: ['No fim da rua, à direita. Siga a seta amarela ou use "Pular para o foguete".'], go: { earth: rocketX() } }) },
  { id: 'city', sc: ['earth'], q: 'Por que explorar a cidade?', a: () => ({ a: ['Os prédios mostram por que a Terra ficou inabitável e o que a missão precisa resolver. É opcional, mas ajuda a entender a história.'] }) },
  { id: 'food', sc: ['ship'], q: 'Como consigo comida?', a: () => ({ a: ['A tripulação come sozinha 3 vezes por dia o que estiver no cardápio da Cozinha. Se você estiver com fome, use "Comer agora" na Cozinha. A Estufa produz comida fresca (plante, regue e colha), que traz vitaminas; na Ponte-Alfa dá para trocar dados por ração.'], go: { st: 'cozinha' } }) },
  { id: 'sleep', sc: ['ship'], q: 'Como recupero o humor e o sono?', a: () => ({ a: ['Durma nos Dormitórios (+50). O humor cai sem dormir e com lixo acumulado; refeições na mesa completa ajudam.'], go: { st: 'dormitorio' } }) },
  { id: 'o2', sc: ['ship'], q: 'E se o oxigênio acabar?', a: () => ({ a: ['O Suporte à vida gera O₂ a partir da água, usando energia. Mantenha água e energia; em emergência, a nave usa cilindros de O₂.'], go: { st: 'suporte' } }) },
  { id: 'rot', sc: ['ship'], q: 'O que é a rotina?', a: () => ({ a: ['Todo dia há tarefas pequenas de manutenção (lista no canto). Cada uma melhora um sistema; completar o dia anima a tripulação e dá pontos. Quando chega um desafio, a rotina pausa.'] }) },
  { id: 'ev', sc: ['ship'], q: 'Como funcionam os desafios?', a: () => ({ a: ['Quando o alarme tocar, siga a seta amarela até a estação indicada e cumpra os passos numerados. Chame a pessoa da função certa para ajudar.'] }) },
  { id: 'build', sc: ['colony'], q: 'Como construo a colônia?', a: () => ({ a: ['Siga a seta amarela até o próximo prédio e aperte E para ver as opções. Comece pelo campo solar: sem energia nada funciona.'] }) },
  { id: 'fast', sc: ['ship', 'colony'], q: 'Posso acelerar o tempo?', a: () => ({ a: ['Sim: Shift+S ou o botão ⏩ (2x → 5x → 10x → normal). Ele volta ao normal sozinho nos desafios.'] }) },
  { id: 'curio', q: 'Me conte uma curiosidade', a: () => { const ll = lessonList(); const t = ll.length ? pick(ll) : END_LESSONS[0](); return { a: [t] }; } },
  { id: 'keys', q: 'Quais são os controles?', a: () => ({ a: [PC_KEYS[S.scene] || PC_KEYS.ship] }) },
];
function pcQuestions() { return PC_QA.filter(x => (!x.sc || x.sc.includes(S.scene)) && (x.id !== 'curio' || typeof curiosOn !== 'function' || curiosOn())); }
// frases que começam com @ são textos já traduzíveis vindos de assistSteps
const pcLine = k => typeof k === 'string' ? k.split('@').map(x => esc(L(x))).join('') : esc(L(k));
UIH.help = () => { U.help = !U.help; if (U.help && !(U.pcLog && U.pcLog.scene === S.scene)) U.pcLog = { scene: S.scene, items: [] }; Sfx.click(); };
UIH.pcAsk = id => {
  const qa = PC_QA.find(x => x.id === id); if (!qa) return;
  const r = qa.a(); U.pcLog.items.push({ q: qa.q, a: r.a, go: r.go, act: r.act }); U.pcLog.items = U.pcLog.items.slice(-3);
  Sfx.tone(1320, 0.05, 'square', 0.03);
};
UIH.pcGo = p => {
  if (typeof p === 'string') p = JSON.parse(p);
  U.help = false;
  if (p.act) { if (p.act === 'report') UIH.panel('report'); else act(p.act); return; }
  goStep({ go: p.go });
};
UIH.helpGo = () => { const tp = pcTips()[0], n = assistNext(); if (tp && tp.go) return UIH.pcGo({ go: tp.go }); if (n) UIH.pcGo({ go: n.go, act: n.act }); else U.help = false; };

function assistMini() {
  const tp = pcTips()[0]; const n = assistNext();
  // saudação curta na 1ª vez em cada cena, no lugar de um tutorial
  S.seen = S.seen || {};
  if (!S.seen[S.scene] && Net.role !== 'client') { S.seen[S.scene] = true; if (!['planet', 'migration'].includes(S.scene)) U.greetUntil = R.t + 7; }
  const greet = R.t < (U.greetUntil || 0) && !tp;
  const show = greet ? { t: 'Olá! Sou o computador de bordo. Aperte H e pergunte o que quiser.', icon: '👋' } : tp ? tp : n;
  if (!show) return '';
  const key = JSON.stringify(show.t);
  if (U.lastAssist !== key) {
    U.lastAssist = key; U.assistFlash = R.t + 2.5; if (S.scene !== 'intro') Sfx.tone(1180, 0.06, 'sine', 0.04);
    if (['planet', 'migration'].includes(S.scene) && !greet && typeof Narrator !== 'undefined') Narrator.later(L(show.t)); // no planeta, o computador fala o que fazer
  }
  const flash = R.t < (U.assistFlash || 0) ? 'flash' : '';
  const canGo = !greet && (show.go || show.act);
  return `<div class="assist-mini ${flash} ${tp && !greet ? 'warn' : ''}" data-ui="help" title="${esc(L('Computador de bordo (H)'))}"><span class="pc">💻</span><span class="ic">${show.icon}</span><span class="tx">${esc(L(show.t))}</span>${canGo ? `<button class="btn tiny primary" data-ui="helpGo">▶ ${esc(L('Ir'))}</button>` : ''}<kbd>H</kbd></div>`;
}
function helpPanel() {
  const tips = pcTips(); const all = assistSteps(); const n = all.find(s => !s.done);
  const done = all.filter(s => s.done).length;
  const log = (U.pcLog && U.pcLog.items) || [];
  const goBtn = (go, a) => go || a ? `<button class="btn tiny primary" data-ui="pcGo" data-arg='${J({ go, act: a })}'>📍 ${esc(L('Ir até lá'))}</button>` : '';
  const status = tips.length ? `<span class="${tips[0].lvl >= 3 ? 'red' : 'orange'}">⚠ ${esc(L('Atenção'))}: ${tips.length}</span>` : `<span class="green">✔ ${esc(L('Sistemas estáveis'))}</span>`;
  return `<div class="modal-bg" data-ui="help"><div class="panel station wide pcpanel" data-stop="1"><button class="x" data-ui="help">✕</button>
    <h2>💻 ${esc(L('COMPUTADOR DE BORDO'))} <small>${status}</small></h2>
    <div class="term">
      <div class="ln sys">&gt; ${esc(L('Olá, Comandante. Em que posso ajudar?'))}</div>
      ${tips.map(t => `<div class="ln ${t.lvl >= 3 ? 'red' : 'orange'}">${t.icon} ${esc(L(t.t))} ${goBtn(t.go)}</div>`).join('')}
      ${(() => { const rn = typeof routineNext === 'function' ? routineNext() : null; return rn ? `<div class="ln mis">📋 <small>${esc(L('Rotina'))}:</small> ${esc(L(rn.t))} <small class="muted">— ${esc(L(rn.how))}</small> ${goBtn(rn.go)}</div>` : ''; })()}
      ${n ? `<div class="ln mis">🎯 <small>${esc(L('Missão'))} ${done}/${all.length}:</small> ${esc(L(n.t))} ${goBtn(n.go, n.act)}</div>` : ''}
      ${log.map(e => `<div class="ln q">&gt; ${esc(L(e.q))}</div><div class="ln a">${e.a.map(pcLine).join(' ')} ${goBtn(e.go, e.act)}</div>`).join('')}
      ${(() => { const nl = typeof lessonList === 'function' && curiosOn() ? lessonList() : []; return nl.length ? `<div class="ln sys">📚 ${esc(L('O que você aprendeu'))} (${nl.length})</div>` + nl.map(t => `<div class="ln a">${esc(L(t))}</div>`).join('') : ''; })()}
      <div class="ln cur">_</div>
    </div>
    <div class="qs">${pcQuestions().map((x, i) => `<button class="btn tiny" data-ui="pcAsk" data-arg="${x.id}">${i + 1}. ${esc(L(x.q))}</button>`).join('')}</div>
</div></div>`;
}

// ---------- página do site: modo jogo ----------
let _crewStripKey = '';
function sitePlayMode() {
  const playing = !!(S && U.screen === 'game');
  document.body.classList.toggle('playing', playing);
  const box = document.getElementById('crew-live'); if (!box) return;
  if (!playing) { if (_crewStripKey) { box.innerHTML = ''; _crewStripKey = ''; } return; }
  const key = S.crew.map(c => [c.name, c.roleName, c.alive, c.status, !!c.sickness, Math.round(c.humor / 10), c.hibernating, avatarKey(c.avatar)].join('|')).join(';') + I18n.lang;
  if (key === _crewStripKey) return; _crewStripKey = key;
  box.innerHTML = I18n.dom(S.crew.map(c => {
    const st = !c.alive ? '💀' : c.hibernating ? '💤' : c.sickness ? '🤒' : c.status !== 'ok' ? '✚' : '✔';
    return `<div class="${c.alive ? '' : 'dead'}"><img src="${spriteURL(c.avatar, 'suit', c.alive && c.humor >= 40 ? 'happy' : 'sad', 3)}" alt=""><b>${esc(c.name)}</b><span>${esc(c.roleName)}</span><em>${st} ☺ ${Math.round(c.humor)}</em></div>`;
  }).join(''));
}

