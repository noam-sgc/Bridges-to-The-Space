// ============================================================
//  LOOP PRINCIPAL E CONTROLES
// ============================================================
'use strict';

const keys = {};
let lastT = performance.now();
let lastEventId = null;

function musicFor() {
  if (!S || U.screen !== 'game') return 'intro';
  if (['intro', 'earth'].includes(S.scene)) return 'intro';
  if (S.scene === 'end') return S.ending && S.ending.ok ? 'heroic' : 'fase';
  if (S.event && S.event.phase !== 'result') return 'heroic';
  if (S.scene === 'migration') return 'heroic';
  if (S.scene === 'colony') return S.colony && S.colony.ships.some(s => s.state === 'inbound') ? 'heroic' : 'fase';
  return 'fase';
}

function moveHuman(c, dt) {
  if (!c || !c.alive || c.hibernating || c.eva) return;
  const L = keys.ArrowLeft || keys.KeyA, Rr = keys.ArrowRight || keys.KeyD;
  const up = keys.ArrowUp || keys.KeyW, down = keys.ArrowDown || keys.KeyS;
  const pilot = S.event && S.event.puzzle && S.event.puzzle.kind === 'pilot';
  if (pilot) return;
  if (c.climb > 0) { stepMove(c, dt); if (c.climb <= 0 && U.eAfterClimb) { U.eAfterClimb = false; interact(); } return; }
  if (L || Rr || up || down) { U.autopilot = null; U.clickTarget = null; U.afterArrive = null; } // teclado tem prioridade sobre o mouse
  if (U.autopilot) {
    const st = STATIONS[U.autopilot];
    c.tx = st.x; c.tdeck = st.deck; stepMove(c, dt);
    if (atStation(c, U.autopilot, 2)) { U.autopilot = null; if (U.afterArrive) { const a = U.afterArrive; U.afterArrive = null; if (a.type === 'open') interact(); else act(a.type, a.p); } }
    return;
  }
  if (U.clickTarget) { c.tx = U.clickTarget.x; c.tdeck = U.clickTarget.deck; stepMove(c, dt); if (!c.moving) U.clickTarget = null; return; }
  const sp = (c.status === 'ferido' ? 40 : 70) * (c.sickness ? 0.6 : 1) * (c.stun > 0 ? 0.35 : 1) * (keys.ShiftLeft || keys.ShiftRight ? RUN_MULT : 1);
  let dx = (Rr ? 1 : 0) - (L ? 1 : 0);
  if (dx) { c.x = clamp(c.x + dx * sp * dt, 64, WORLD_W - 70); c.face = dx; c.moving = true; c.walkT += dt; if (Math.floor(c.walkT * 8) % 4 === 0 && Math.random() < 0.05) Sfx.step(); }
  else c.moving = false;
  const lad = LADDERS.find(l => Math.abs(l - c.x) < 9);
  if (lad != null && ((up && c.deck === 'L') || (down && c.deck === 'U'))) { c.x = lad; c.climb = 0.7; c.climbTo = c.deck === 'U' ? 'L' : 'U'; c.tdeck = c.climbTo; c.tx = lad; }
  if (!c.climb) { c.tx = c.x; c.tdeck = c.deck; }
}

function interact() {
  if (S && S.scene === 'colony' && !U.panel) return colonyInteract();
  if (!S || S.scene !== 'ship') return;
  if (U.panel && !STATIONS[U.panel]) UIH.closePanel(); // relatório/tripulação abertos: E vai para o console
  if (U.panel) return;
  const c = me(); if (!c || !c.alive) return;
  if (c.climb > 0) { U.eAfterClimb = true; return; } // na escada: interage ao chegar
  const ev = S.event;
  if (ev && ev.type === 'lixo' && ev.phase === 'run' && S.trash.some(t => t.deck === c.deck && Math.abs(t.x - c.x) < 16)) { act('pickTrash'); Sfx.pick(); return; }
  let near = stationNear(c);
  if (!near) { // nenhum console nesta sala: vai até o mais próximo do mesmo andar e abre
    let bd = 260; for (const id in STATIONS) { const st = STATIONS[id]; if (st.deck !== c.deck) continue; const d = Math.abs(st.x - c.x); if (d < bd) { bd = d; near = id; } }
    if (near) { U.autopilot = near; U.afterArrive = { type: 'open' }; }
    return;
  }
  // durante um desafio, se o console do passo atual fica nesta sala, ele tem prioridade
  if (ev && ev.phase === 'run') {
    const room = ROOMS.find(r => r.deck === c.deck && c.x >= r.x0 && c.x <= r.x1);
    const want = ev.steps.find(s => !s.done && s.station && (s === curStep(ev) || s.optional) && room && STATIONS[s.station].deck === room.deck && STATIONS[s.station].x >= room.x0 && STATIONS[s.station].x <= room.x1);
    if (want) near = want.station;
  }
  if (ev && ev.phase === 'run') {
    const step = ev.steps.find(s => !s.done && s.station === near && (s === curStep(ev) || s.optional));
    if (step) { if (atStation(c, near, 20)) act('doStep', { step: step.id }); else { U.autopilot = near; U.afterArrive = { type: 'doStep', p: { step: step.id } }; } return; }
  }
  if (near === 'termico' && ev && ev.type === 'termico') return;
  U.panel = near; U.tab = null; act('inspect', { st: near });
  if (near === 'ponte' && S.tutorial === 0) act('tut', { n: 1 });
  if (near === 'cozinha' && S.tutorial >= 2 && S.tutorial < 4) act('tut', { n: 4 });
}

function update(dt) {
  R.t += dt;
  Net.tick(dt);
  if (U.screen === 'story') storyTick(dt);
  GameSave.tick(dt);
  if (!S || U.screen !== 'game') return;
  const host = Net.role !== 'client';
  const k = timeScale();
  if (S.crew) jumpTick(me(), dt); // só o próprio jogador pula; os outros chegam pela rede
  if (S.scene === 'earth') {
    if (!U.earth) cityInit(); // quem entrou na sala também explora a cidade
    tickCity(dt);
    if (Net.role && host) { S.cityPos = S.cityPos || {}; const p = U.earth.p; S.cityPos[U.me] = { x: p.x, face: p.face, moving: p.moving, walkT: p.walkT, jy: p.jy || 0 }; }
  }
  if (S.scene === 'colony') {
    const c = me(); if (c) moveColonyHuman(c, dt);
    if (host && !(!Net.role && (U.panel === 'menu' || U.help))) stepScaled(tickColony, dt, k); // só no solo o menu e a ajuda pausam a colônia (no multiplayer o jogo segue para todos)
  }
  if (S.scene === 'launch' && host) {
    U.launchT += dt;
    if (U.launchT > 6.5) {
      S.scene = 'ship'; S.stage = 1;
      narrate('A nave está no espaço. Comandante, assuma o controle: visite os módulos, configure a navegação e cuide dos recursos e da tripulação.');
    }
  }
  if (host && ['ship', 'station', 'detour', 'migration', 'colony'].includes(S.scene)) checkStuck(dt * (['ship', 'colony'].includes(S.scene) ? k : 1));
  if (S.scene === 'ship') {
    const c = me();
    if (c) moveHuman(c, dt);
    if (host && !(Net.role !== 'host' && U.panel === 'menu')) stepScaled(tickGame, dt, k);
    if (S.event && S.event.phase !== 'result') S.fast = 0; // o ⏩ vale até o próximo evento
    // som de alerta em novos eventos
    if (S.event && S.event.id !== lastEventId) { lastEventId = S.event.id; Sfx.alarm(); }
  } else if (host && ['station', 'detour', 'planet', 'migration'].includes(S.scene)) {
    tickCrew(dt);
    if (S.toast) { S.toast.t -= dt; if (S.toast.t <= 0) S.toast = null; }
  }
  if (S.scene === 'ship' && S.event && S.event.puzzle && S.event.puzzle.kind === 'pilot') {
    const up = keys.ArrowUp || keys.KeyW, down = keys.ArrowDown || keys.KeyS;
    if (up || down) { U.pilotAcc = (U.pilotAcc || 0) + dt; if (U.pilotAcc > 0.05) { U.pilotAcc = 0; act('puzzle', { op: 'move', d: up ? -0.035 : 0.035 }); } }
  }
}

function draw(dt) {
  cx.imageSmoothingEnabled = false;
  cv.style.filter = '';
  if (U.screen === 'story') { drawStory(dt); return; }
  if (!S || U.screen !== 'game') { drawTitleBg(dt); if (U.screen === 'avatar') { cx.fillStyle = 'rgba(5,6,26,0.6)'; cx.fillRect(0, 0, VW, VH); } return; }
  switch (S.scene) {
    case 'intro': drawModeIntro(dt); break;
    case 'earth': {
      if (!U.earth) cityInit();
      const p = U.earth.p;
      drawEarth(dt, p);
      // os outros jogadores da sala, no ponto da cidade em que estão
      for (const [id, q] of Object.entries(S.cityPos || {})) {
        if (id === U.me) continue; const o = crewById(id); if (!o) continue;
        const ox = q.x - R.earthCam; if (ox < -30 || ox > VW + 30) continue;
        drawChar(Object.assign({}, o.avatar), 'civil', ox, GROUND - (q.jy || 0), q.face, q.moving ? Math.floor((q.walkT || 0) * 8) : 0, 'happy');
        text(o.name, ox, GROUND - SPR_H - 6, '#7dffb0', 7, 'center');
      }
      const mine = crewById(U.me) || crewById('cmd');
      drawChar(Object.assign({}, mine.avatar), 'civil', p.x - R.earthCam, GROUND - (p.jy || 0), p.face, p.moving ? Math.floor(p.walkT * 8) : 0, 'happy');
      drawGuide();
      break;
    }
    case 'setup': drawSetupBg(dt); break;
    case 'launch': drawLaunch(dt, U.launchT || 0); break;
    case 'ship': {
      const ev = S.event;
      if (ev && ev.puzzle && ev.puzzle.kind === 'pilot') drawPilot(ev.puzzle);
      else { drawShipInterior(dt, me() || S.crew[0]); drawGuide(); }
      const m = me(); if (m && m.sickness) cv.style.filter = 'blur(0.6px)';
      break;
    }
    case 'station': drawStationBg(dt); break;
    case 'detour': drawDetourBg(dt); break;
    case 'colony': drawColony(dt); drawGuide(); break;
    case 'planet': drawPlanetBg(dt); break;
    case 'migration': drawSurface(dt, false); break;
    case 'end': if (S.ending && S.ending.ok) drawSurface(dt, true); else { spaceBg(); drawStars(1, dt); drawShipExterior(220 + Math.sin(R.t * 0.2) * 20, 140, 1.2, false); } break;
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  try { update(dt); draw(dt); renderUI(); if (U.screen === 'avatar') drawAvatarPreviews(); }
  catch (e) { console.error(e); }
  Music.play(musicFor());
  requestAnimationFrame(frame);
}

// ---------- entrada ----------
const shiftOn = () => keys.ShiftLeft || keys.ShiftRight;
// Esc: fecha o que estiver aberto, desmarca seleções e volta
function escAll() {
  if (S && U.screen === 'game' && S.scene === 'colony' && me() && me().csleep) { act('cWake'); return true; } // dormindo: Esc acorda
  if (U.help) { U.help = false; return true; }
  if (Chat.open) { Chat.toggle(false); return true; }
  if (U.screen === 'story') { UIH.storySkip(); return true; }
  if (!S || U.screen !== 'game') { if (U.screen !== 'title') { UIH.title(); return true; } return false; }
  if (S.scene === 'intro') { UIH.introSkip(); return true; }
  if (S.scene === 'earth') { const E = U.earth; if (E && (E.dialog || E.panel || E.diary)) { cityEsc(); return true; } if (E && E.target != null) { E.target = null; return true; } return false; }
  if (U.cook && U.cook.length) { U.cook = []; return true; }
  if (U.farmSel != null && U.panel === 'estufa') { U.farmSel = null; return true; }
  if (U.panel) { UIH.closePanel(); return true; }
  if (U.autopilot || U.clickTarget) { U.autopilot = null; U.clickTarget = null; U.afterArrive = null; return true; }
  if (U.hudFull) { U.hudFull = false; return true; }
  return false;
}
// Pular: tecla J (ou botão ⤒ no toque) — funciona em qualquer lugar, mesmo diante de consoles e prédios
function jumpAction() {
  if (!S) return;
  if (S.scene === 'earth') { const E = U.earth; if (!E || U.comms || E.dialog || E.panel || cityBusy()) return; jumpStart(E.p, 'earth'); return; }
  const c = me(); if (!c || !c.alive || U.panel || c.climb > 0 || c.csleep) return;
  if (S.scene === 'colony' && S.colony.tut === 0) return;
  if (S.scene === 'colony' || S.scene === 'ship') jumpStart(c, S.scene);
}
// Espaço: interage se houver algo perto; senão, pula
function spaceAction() {
  if (!S) return;
  if (S.scene === 'earth') { const E = U.earth; if (U.comms) return; if (E.dialog || cityNear()) return cityInteract(); if (!cityBusy()) jumpStart(E.p, 'earth'); return; }
  const c = me(); if (!c || !c.alive || U.panel) return;
  if (S.scene === 'colony' && c.csleep) return act('cWake');
  if (S.scene === 'colony') { if (S.colony.tut === 0 || nearBuilding(c)) return interact(); jumpStart(c, 'colony'); return; }
  if (S.scene === 'ship') {
    const trash = S.event && S.event.type === 'lixo' && S.event.phase === 'run' && S.trash.some(t => t.deck === c.deck && Math.abs(t.x - c.x) < 16);
    if (trash || stationAt(c)) return interact();
    if (!(c.climb > 0)) jumpStart(c, 'ship');
  }
}
window.addEventListener('keydown', e => {
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
  Music.unlock(); Sfx.ensure();
  keys[e.code] = true;
  const inGame = S && U.screen === 'game';
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) && (inGame || U.screen === 'story')) e.preventDefault();
  if (inGame && ['Space', 'Enter', 'KeyE'].includes(e.code) && e.target && e.target.tagName === 'BUTTON') { e.preventDefault(); e.target.blur(); }
  if (e.code === 'Escape') { escAll() || (inGame && ['ship', 'colony'].includes(S.scene) && UIH.panel('menu')); return; }
  if (U.screen === 'story') { if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) UIH.storyNext(); return; }
  if (!inGame) return;
  if (e.repeat && e.code === 'Space') return;
  if (e.code === 'KeyH' && S.scene !== 'intro') { UIH.help(); return; }
  if (e.code === 'KeyS' && e.shiftKey) { keys.KeyS = false; UIH.fast(); return; }
  if (e.code === 'Enter' && Net.role && S.scene !== 'intro' && !U.comms) { e.preventDefault(); Chat.focus(); return; }
  if (U.help) { if (e.code === 'Space' || e.code === 'Enter') UIH.helpGo(); const d = /^Digit([1-9])$/.exec(e.code); if (d) { const q = pcQuestions()[+d[1] - 1]; if (q) UIH.pcAsk(q.id); } return; }
  if (e.code === 'KeyJ' && S.scene !== 'intro') { if (!e.repeat) jumpAction(); return; }
  if (S.scene === 'intro' && U.howto) { if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) UIH.introSkip(); return; }
  if (S.scene === 'intro') { if (['Space', 'Enter', 'ArrowRight'].includes(e.code)) UIH.mNext(); if (e.code === 'ArrowLeft') UIH.mPrev(); return; }
  if (S.scene === 'earth') {
    if (e.code === 'Space') spaceAction();
    if (e.code === 'KeyE') cityInteract();
    return;
  }
  if (S.scene === 'colony') {
    if ((e.code === 'KeyE' || e.code === 'Space') && me() && me().csleep) { act('cWake'); return; }
    if (e.code === 'Space') { if (U.panel && U.panel !== 'menu') UIH.closePanel(); else if (!U.panel) spaceAction(); }
    if (e.code === 'KeyE') { if (U.panel && U.panel !== 'menu') UIH.closePanel(); else if (!U.panel) interact(); } // qualquer painel aberto: E fecha; sem painel: interage
    if (e.code === 'KeyT') { U.panel === 'crew' ? UIH.closePanel() : UIH.panel('crew'); }
    if (e.code === 'KeyF') { U.panel === 'fund' ? UIH.closePanel() : UIH.panel('fund'); }
    return;
  }
  if (S.scene !== 'ship') return;
  if (e.code === 'Space') { if (U.panel && STATIONS[U.panel]) UIH.closePanel(); else spaceAction(); }
  if (e.code === 'KeyE') { if (U.panel && STATIONS[U.panel]) UIH.closePanel(); else interact(); }
  if (e.code === 'KeyR') { U.panel === 'report' ? UIH.closePanel() : UIH.panel('report'); }
  if (e.code === 'KeyT') { U.panel === 'crew' ? UIH.closePanel() : UIH.panel('crew'); }
  if (e.code === 'KeyF') { U.panel === 'fund' ? UIH.closePanel() : UIH.panel('fund'); }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

function bindCanvas() {
  cv.addEventListener('pointerdown', e => {
    Music.unlock(); Sfx.ensure();
    if (S && S.scene === 'earth' && U.earth && !U.comms && !cityBusy() && Net.role !== 'client') {
      const r0 = cv.getBoundingClientRect();
      U.earth.target = clamp((e.clientX - r0.left) / r0.width * VW + R.earthCam, 20, EARTH_W - 20);
      return;
    }
    if (S && S.scene === 'colony' && !U.panel && S.colony && S.colony.tut) {
      const r0 = cv.getBoundingClientRect();
      U.clickTarget = { x: clamp((e.clientX - r0.left) / r0.width * VW + R.colCam, 24, COLONY_W - 24) };
      return;
    }
    if (!S || S.scene !== 'ship' || U.panel) return;
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * VW + R.camX, y = (e.clientY - r.top) / r.height * VH;
    const deck = y < (DECKS.U.floor + DECKS.L.top) / 2 ? 'U' : 'L';
    // clique numa estação: anda até ela
    const st = Object.keys(STATIONS).find(id => STATIONS[id].deck === deck && Math.abs(STATIONS[id].x - x) < 12);
    if (st) U.autopilot = st; else U.clickTarget = { x: clamp(x, 64, WORLD_W - 70), deck };
  });
  // controles de toque
  // botões de ação do toque: pular, correr (liga/desliga), ajuda, tempo 2x e fechar
  document.querySelectorAll('#touch [data-tact]').forEach(b => {
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); Music.unlock(); Sfx.ensure();
      const a = b.dataset.tact;
      if (a === 'jump') jumpAction();
      else if (a === 'help') UIH.help();
      else if (a === 'fast') UIH.fast();
      else if (a === 'esc') { escAll() || (S && U.screen === 'game' && ['ship', 'colony'].includes(S.scene) && UIH.panel('menu')); }
      else if (a === 'run') { keys.ShiftLeft = !keys.ShiftLeft; b.classList.toggle('on', !!keys.ShiftLeft); }
    });
  });
  document.querySelectorAll('#touch [data-key]').forEach(b => {
    const k = b.dataset.key;
    const on = e => { e.preventDefault(); Music.unlock(); if (k === 'KeyE') (S && S.scene === 'earth' ? cityInteract() : interact()); else keys[k] = true; };
    const off = e => { e.preventDefault(); keys[k] = false; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
}

async function boot() {
  await loadFalas();
  I18n.init();
  const sel = document.getElementById('lang');
  if (sel) { sel.innerHTML = LANGS.map(l => `<option value="${l.id}">${l.flag} ${l.label}</option>`).join(''); sel.value = I18n.lang; sel.addEventListener('change', () => { const was = I18n.lang; I18n.set(sel.value); if (sel.value !== was) U.voicePick = true; }); }
  Chat.init();
  initCanvas();
  bindUI();
  bindCanvas();
  Music.play('intro');
  document.getElementById('fs').addEventListener('click', () => {
    const g = document.getElementById('game');
    if (document.fullscreenElement) document.exitFullscreen(); else if (g.requestFullscreen) g.requestFullscreen();
  });
  const start = document.getElementById('start');
  const go = () => { if (start.classList.contains('hide')) return; start.classList.add('hide'); Music.unlock(); Sfx.ensure(); if (!S) storyStart(); };
  start.addEventListener('pointerdown', go); start.addEventListener('keydown', go);
  document.querySelectorAll('[data-crew-sprite]').forEach(img => { const r = ROLES[+img.dataset.crewSprite]; img.src = spriteURL(Object.assign(randomAvatar(() => ((+img.dataset.crewSprite + 1) * 0.137) % 1), { suit: 0 }), 'suit', 'happy', 3); img.alt = r ? r.name : ''; });
  document.querySelectorAll('[data-sprite]').forEach(img => { img.src = spriteURL(DEFAULT_AVATAR, img.dataset.sprite, 'happy', 4); });
  requestAnimationFrame(frame);
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else window.addEventListener('load', boot);
