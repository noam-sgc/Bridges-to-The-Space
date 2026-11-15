// ============================================================
//  SONO, FOME E COLONOS NA COLÔNIA
//  • Dormir nos quartos dos habitats instalados e comer na colônia.
//  • Fome (saciedade) cai 2x mais rápido que o sono (humor/sono).
//  • Quando um cargueiro de colonos (Colonial-1, 2, 3) pousa, as
//    pessoas descem como bots.
// ============================================================
'use strict';

const SLEEP_DECAY = 5;              // sono (humor) por dia, acordado
const HUNGER_DECAY = SLEEP_DECAY; // a fome cai no mesmo ritmo do sono
const SLEEP_DUR = 9;                // segundos dormindo
const ARCA_COLORS = { 2: '#46d8ff', 3: '#ffd34c', 4: '#ff7ac8' };
const colonyAll = () => S.crew.concat((S.colony && S.colony.people) || []);
const isPerson = c => !!c && c.role === 'colono';
const habLv = () => (S && S.colony ? S.colony.b.habitat : 0);
// centro de cada cúpula do habitat (mesma conta do desenho)
const domeX = (i, lv) => CBUILD.habitat.x + (-28 + i * 40 - (lv - 1) * 8 + 8);

function rngSeed(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const _pav = new Map();
function personAvatar(p) {
  if (p.avatar) return p.avatar;
  let a = _pav.get(p.seed);
  if (!a) { a = Object.assign(randomAvatar(rngSeed(p.seed), FEM_NAMES.includes(p.name)), { name: p.name }); if (_pav.size > 300) _pav.clear(); _pav.set(p.seed, a); }
  return a;
}

// ---------- colonos descem da nave ----------
function spawnColonists(sh) {
  const C = S.colony; C.people = C.people || []; C.pid = C.pid || 0;
  const names = shuffle(CREW_NAMES.slice());
  const px = CBUILD.pista.x;
  for (let i = 0; i < sh.size; i++) {
    C.people.push({
      id: 'k' + (++C.pid), ship: sh.n + 1, // Arca-2 = nave 1, Arca-3 = nave 2, Arca-4 = nave 3
      seed: Math.floor(Math.random() * 1e9), name: names[i % names.length], role: 'colono', roleName: 'Colono · ' + sh.name,
      alive: true, status: 'ok', statusT: 0, humor: 70 + Math.random() * 25, saciedade: 65 + Math.random() * 30,
      x: px + (Math.random() * 60 - 30), deck: 'L', face: Math.random() < 0.5 ? 1 : -1, walkT: 0, moving: false, owner: null, spawnT: i * 0.5, idleT: Math.random() * 3, jy: 0,
    });
  }
}
function arcaLanded(sh) {
  spawnColonists(sh);
}

// ---------- dormir ----------
function sleepRoomFree(room) { return colonyAll().filter(c => c.alive && c.csleep && c.csleep.room === room).length < 2; }
function startSleep(c, room, quiet) {
  const lv = habLv(); if (lv < 1) return false;
  if (!(room >= 0 && room < lv) || !sleepRoomFree(room)) { room = -1; for (let i = 0; i < lv; i++) if (sleepRoomFree(i)) { room = i; break; } }
  if (room < 0) return false;
  c.csleep = { room, t: 0, dur: SLEEP_DUR + (c.owner && c.owner !== 'bot' ? 0 : Math.random() * 4) };
  c.x = domeX(room, lv); c.moving = false; c.ctask = null; c.eatT = 0; c.goal = null; c.jy = 0;
  return true;
}
function wakeUp(c) {
  if (!c || !c.csleep) return;
  const lv = habLv(); const room = c.csleep.room; c.csleep = null;
  c.x = clamp(domeX(room, lv) + (c.face || 1) * 26, 24, COLONY_W - 24); c.moving = false;
  if (c.humor > 80 && !isPerson(c) && Math.random() < 0.5) say(c, K('Dormi muito bem!', 'Slept great!', '¡Dormí muy bien!'));
}
ACTIONS.cSleep = (p, actor) => {
  const C = S.colony; if (!C || S.scene !== 'colony' || !actor || !actor.alive) return;
  if (habLv() < 1) return toast(K('Construa um habitat para ter quartos.', 'Build a habitat to get bedrooms.', 'Construya un hábitat para tener habitaciones.'), 'warn');
  if (Math.abs(actor.x - CBUILD.habitat.x) > 130) return toast(K('Vá até o habitat para dormir.', 'Go to the habitat to sleep.', 'Vaya al hábitat para dormir.'), 'warn');
  if (actor.csleep) return;
  if (actor.ctask) return toast(K('Termine a tarefa antes de dormir.', 'Finish your task before sleeping.', 'Termine la tarea antes de dormir.'), 'warn');
  if (actor.humor >= 95) return toast(K('Você não está com sono.', 'You are not sleepy.', 'No tiene sueño.'), 'info');
  const room = p && p.room != null ? +p.room : -1;
  if (!startSleep(actor, room)) return toast(K('Os quartos estão cheios (2 camas por cúpula).', 'The rooms are full (2 beds per dome).', 'Las habitaciones están llenas (2 camas por cúpula).'), 'warn');
  S.v++;
};
ACTIONS.cWake = (p, actor) => { if (actor && actor.csleep) { wakeUp(actor); S.v++; } };

// ---------- comer ----------
ACTIONS.cEat = (p, actor) => {
  if (!S.colony || S.scene !== 'colony' || !actor || !actor.alive) return;
  if (!['nave', 'habitat', 'estufa'].some(id => Math.abs(actor.x - CBUILD[id].x) < 130)) return toast(K('Vá ao refeitório (nave, habitat ou estufa) para comer.', 'Go to the mess (ship, habitat or greenhouse) to eat.', 'Vaya al comedor (nave, hábitat o invernadero) para comer.'), 'warn');
  if (actor.csleep) return;
  const before = actor.saciedade;
  ACTIONS.eat(p, actor);
  if (actor.saciedade > before) { actor.eatT = 2.5; actor.moving = false; }
};

// ---------- simulação: fome, sono e comportamento dos bots ----------
function arcaTick(dt) {
  const C = S.colony; if (!C) return;
  C.people = C.people || [];
  const f = dt / C.dayLen;
  const fr = C.dayT / C.dayLen; const night = fr > 0.78 || fr < 0.08;
  const lv = C.b.habitat;
  for (const c of colonyAll()) {
    if (!c.alive) continue;
    if (c.spawnT > 0) { c.spawnT -= dt; continue; }
    if (c.eatT > 0) { c.eatT -= dt; if (c.eatT <= 0 && c.owner == null) c.saciedade = clamp(c.saciedade + 70, 0, 100); }
    // fome sempre cai (2x o sono); o sono só cai acordado
    c.saciedade = clamp(c.saciedade - HUNGER_DECAY * f, 0, 100);
    if (c.csleep) {
      c.csleep.t += dt; c.humor = clamp(c.humor + (50 / c.csleep.dur) * dt, 0, 100);
      if (c.csleep.t >= c.csleep.dur) wakeUp(c);
      continue;
    }
    c.humor = clamp(c.humor - SLEEP_DECAY * f, 0, 100);
    if (c.saciedade <= 0) c.humor = clamp(c.humor - 5 * f, 0, 100); // sem comer o ânimo despenca
    const human = c.owner && c.owner !== 'bot';
    if (human) continue;
    // bots: vão comer e dormir sozinhos
    if (c.ctask || c.eatT > 0) continue;
    if (c.goal) {
      const g = c.goal;
      if (moveToward(c, g.x, dt, 46)) {
        if (g.k === 'eat') { c.eatT = 2.5; c.face = 1; } else if (g.k === 'sleep') startSleep(c, g.room);
        c.goal = null;
      }
      continue;
    }
    if (c.saciedade < 35) { const id = pick(['nave', 'habitat', 'estufa']); c.goal = { k: 'eat', x: CBUILD[id].x + (Math.random() * 40 - 20) }; c.wx = null; continue; }
    if (lv >= 1 && (c.humor < 30 || (night && c.humor < 70))) { const room = Math.floor(Math.random() * lv); if (sleepRoomFree(room)) { c.goal = { k: 'sleep', room, x: domeX(room, lv) }; c.wx = null; continue; } }
  }
}

// ---------- desenho ----------
function drawEatIcon(x, y) {
  cx.fillStyle = '#e8e8e8'; cx.fillRect(x - 4, y, 8, 2); cx.fillStyle = '#c4672a'; cx.fillRect(x - 3, y - 2, 6, 2);
  cx.fillStyle = 'rgba(255,255,255,0.7)'; const o = Math.floor(R.t * 4) % 3; cx.fillRect(x - 2 + o, y - 6, 1, 2); cx.fillRect(x + 1 - o, y - 8, 1, 2);
}
function drawSleepers(cam) {
  const C = S.colony; const lv = C.b.habitat; if (lv < 1) return;
  const seen = {};
  for (const c of colonyAll()) {
    if (!c.alive || !c.csleep || c.spawnT > 0) continue;
    const i = c.csleep.room; const n = (seen[i] = (seen[i] || 0) + 1) - 1;
    const x = Math.round(domeX(i, lv) - cam) + (n ? 7 : -7), y = CGROUND - 6;
    if (x < -30 || x > VW + 30) continue;
    // interior iluminado da cúpula + cama
    cx.fillStyle = 'rgba(255,233,160,0.38)'; cx.beginPath(); cx.arc(Math.round(domeX(i, lv) - cam), CGROUND, 18, Math.PI, 0); cx.fill();
    cx.fillStyle = '#8a4a6a'; cx.fillRect(x - 8, y + 2, 16, 3); cx.fillStyle = '#f2f2f2'; cx.fillRect(x - 8, y - 1, 5, 3);
    const spr = getSprite(isPerson(c) ? personAvatar(c) : c.avatar, 'suit', 'happy', 0);
    cx.save(); cx.translate(x + 1, y + 2); cx.rotate(-Math.PI / 2); cx.scale(0.5, 0.5); cx.drawImage(spr, -SPR_W / 2, -SPR_H + 6); cx.restore();
    cx.fillStyle = '#cfa070'; cx.fillRect(x - 6, y - 1, 2, 2);
    const zt = (R.t * 1.2 + n) % 3;
    text('z', x + 6 + zt * 3, y - 14 - zt * 5, '#bcd3ff', 7 + Math.floor(zt) * 2, 'center');
    if (c.id === U.me) text(L(K('Zzz… (E acorda)', 'Zzz… (E wakes)', 'Zzz… (E despierta)')), VW / 2, 64, '#fff', 8, 'center');
  }
}
function drawPeople(cam) {
  const C = S.colony; const near = (me() || S.crew[0]);
  for (const p of (C.people || []).slice().sort((a, b) => a.x - b.x)) {
    if (!p.alive || p.spawnT > 0 || p.csleep) continue;
    const x = Math.round(p.x - cam); if (x < -30 || x > VW + 30) continue;
    drawChar(personAvatar(p), 'suit', x, CGROUND + 15 - (p.jy || 0), p.face, p.moving ? Math.floor(p.walkT * 8) : 0, p.humor < 35 ? 'sad' : 'happy');
    cx.fillStyle = ARCA_COLORS[p.ship] || '#fff'; cx.fillRect(x - 1, CGROUND + 15 - SPR_H - 5, 3, 3); // cor da nave de origem
    const human = p.owner && p.owner !== 'bot'; const mine = p.id === U.me;
    if (human || mine || (near && Math.abs(near.x - p.x) < 45)) text(p.name, x, CGROUND + 15 - SPR_H - 12, mine ? '#ffd34c' : human ? '#7dffb0' : '#bcd3ff', 7, 'center');
    if (p.eatT > 0) drawEatIcon(x + 9, CGROUND + 15 - 12);
    if (p.bubble) bubble(p.bubble.text, x, CGROUND + 15 - SPR_H - 12);
  }
}

// ---------- interface ----------
function needBars(c) {
  if (!c) return '';
  const lowH = c.saciedade < 30, lowS = c.humor < 30;
  return `<div class="rb big needs" title="${esc(L(K('A fome cai no mesmo ritmo do sono', 'Hunger drops at the same pace as sleep', 'El hambre baja al mismo ritmo que el sueño')))}"><span class="ic">🍱</span><span class="nm">${esc(L(K('Fome', 'Hunger', 'Hambre')))}</span>${bar(c.saciedade, 100)}<span class="v ${lowH ? 'red blink' : ''}">${fmt(c.saciedade, 0)}</span>
    <span class="ic">😴</span><span class="nm">${esc(L(K('Sono', 'Sleep', 'Sueño')))}</span>${bar(c.humor, 100)}<span class="v ${lowS ? 'red blink' : ''}">${fmt(c.humor, 0)}</span></div>`;
}
function eatBlock() {
  const m = me(); if (!m) return '';
  const near = ['nave', 'habitat', 'estufa'].some(id => Math.abs(m.x - CBUILD[id].x) < 130);
  return `<h4>${esc(L(K('Refeitório', 'Mess', 'Comedor')))}</h4><div class="sysline"><span>🍱 ${esc(L(K('Sua fome', 'Your hunger', 'Su hambre')))}</span>${bar(m.saciedade, 100)}<b>${fmt(m.saciedade, 0)}%</b><button class="btn tiny primary" data-act="cEat" ${near && m.saciedade < 85 && !m.csleep ? '' : 'disabled'}>🍴 ${esc(L(K('Comer', 'Eat', 'Comer')))}</button></div>`;
}
function sleepBlock() {
  const C = S.colony, lv = C.b.habitat, m = me(); if (!m) return '';
  if (lv < 1) return `<h4>${esc(L(K('Quartos', 'Bedrooms', 'Habitaciones')))}</h4><p class="muted small">${esc(L(K('Instale o habitat para dormir.', 'Install the habitat to sleep.', 'Instale el hábitat para dormir.')))}</p>`;
  const rooms = []; for (let i = 0; i < lv; i++) { const occ = colonyAll().filter(c => c.alive && c.csleep && c.csleep.room === i).length; rooms.push(`<button class="opt ${occ >= 2 || m.csleep ? 'cant' : ''}" ${occ >= 2 || m.csleep ? '' : `data-act="cSleep" data-p='${esc(JSON.stringify({ room: i }))}'`}><b>😴 ${esc(L(K('Quarto', 'Bedroom', 'Habitación')))} ${i + 1}</b><span>${occ}/2 ${esc(L(K('camas ocupadas', 'beds taken', 'camas ocupadas')))}</span></button>`); }
  return `<h4>${esc(L(K('Quartos (entre para dormir)', 'Bedrooms (go in to sleep)', 'Habitaciones (entre para dormir)')))}</h4><div class="sysline"><span>😴 ${esc(L(K('Seu sono', 'Your sleep', 'Su sueño')))}</span>${bar(m.humor, 100)}<b>${fmt(m.humor, 0)}%</b></div><div class="opts">${rooms.join('')}</div>`;
}
function arcaPanelExtra(id) { // anexado aos painéis nave / habitat / estufa
  if (id === 'habitat') return sleepBlock() + eatBlock();
  if (id === 'nave' || id === 'estufa') return eatBlock();
  return '';
}
function arcaPeopleBlock() {
  const C = S.colony; const by = {}; (C.people || []).forEach(p => { by[p.ship] = by[p.ship] || 0; by[p.ship]++; });
  const rows = CSHIPS.map(s => { const n = by[s.n + 1]; const st = (C.ships.find(x => x.n === s.n) || {}).state; return `<div class="alert ${n ? 'good' : 'info'}"><span style="color:${ARCA_COLORS[s.n + 1]}">■</span> <b>${s.name}</b> — ${n ? `${n} ${esc(L(K('colonos', 'colonists', 'colonos')))}` : st === 'inbound' ? esc(L(K('a caminho…', 'inbound…', 'en camino…'))) : esc(L(K('ainda não pousou', 'not landed yet', 'aún no aterriza')))}</div>`; }).join('');
  return rows;
}
UIH.netRole = r => { U.lobby = Object.assign({}, U.lobby, { role: r || '' }); };
UIH.netShip = n => { U.lobby = Object.assign({}, U.lobby, { ship: +n }); };
