// ============================================================
//  ABERTURA ANIMADA (história) e INTRODUÇÃO INTERATIVA POR MODO
//  Falas em data/lang/<idioma>.json ("falas") (story, modes, nodes, modeNames).
// ============================================================
'use strict';

// ---------- abertura: toca assim que o jogo abre ----------
function storyStart() {
  U.screen = 'story'; U.story = { i: 0, t: 0 };
  Narrator.say(NARRATION_INTRO[0]);
}
function storyDur(i) { const t = L(NARRATION_INTRO[i] || ''); return Math.max(5.5, t.length * 0.062 + 2.8); }
function storyTick(dt) {
  const s = U.story; if (!s) return;
  s.t += dt;
  if (s.t > storyDur(s.i)) UIH.storyNext();
}
UIH.storyNext = () => {
  const s = U.story; if (!s) return;
  const full = L(NARRATION_INTRO[s.i] || '');
  if (s.t * 45 < full.length) { s.t = Math.max(s.t, full.length / 45 + 0.01); return; } // completa o texto primeiro
  s.i++; s.t = 0;
  if (s.i >= NARRATION_INTRO.length) return UIH.storySkip();
  Narrator.say(NARRATION_INTRO[s.i]);
};
UIH.storySkip = () => { Narrator.stop(); U.story = null; U.screen = 'title'; Music.play('intro'); };
function storyScreen() {
  const s = U.story; if (!s) return '';
  const full = L(NARRATION_INTRO[s.i] || '');
  const shown = full.slice(0, Math.floor(s.t * 45));
  return `<div class="story"><div class="story-cap"><p>${esc(shown)}<span class="caret">▌</span></p>
    <div class="dots">${NARRATION_INTRO.map((_, i) => `<i class="${i === s.i ? 'on' : i < s.i ? 'done' : ''}"></i>`).join('')}</div></div>
    <div class="row bottom"><button class="btn" data-ui="storySkip">${esc(L('Pular'))} <kbd>Esc</kbd></button><button class="btn primary" data-ui="storyNext">${esc(L('Próximo'))} <kbd>${esc(L('Espaço'))}</kbd></button></div></div>`;
}
function drawStory(dt) {
  const s = U.story; if (!s) return drawTitleBg(dt);
  const t = s.t, i = s.i;
  const fade = Math.min(1, t * 1.5);
  spaceBg();
  if (i === 0) { // a Terra em colapso
    drawStars(0.5, dt);
    const d = 140 + t * 5;
    drawPlanet('earthPoll', 240, 140, Math.round(d), R.t * 0.4);
    for (let k = 0; k < 18; k++) { const a = k * 0.35 + R.t * 0.2, r = d / 2 + 6 + (k % 4) * 5; cx.fillStyle = `rgba(110,90,60,${0.25 + 0.1 * Math.sin(R.t + k)})`; cx.beginPath(); cx.arc(240 + Math.cos(a) * r, 140 + Math.sin(a) * r * 0.9, 6 + (k % 3) * 2, 0, 7); cx.fill(); }
    if (Math.floor(R.t * 2) % 2) text('⚠ 2091', 18, 16, '#ff5a3a', 16);
  } else if (i === 1) { // observatórios
    const g = cx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#04061a'); g.addColorStop(1, '#1b1440'); cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
    drawStars(0, dt);
    cx.fillStyle = '#0a0a14'; cx.fillRect(0, 220, VW, 50);
    [90, 240, 390].forEach((x, k) => {
      cx.fillStyle = '#2a2f48'; cx.fillRect(x - 22, 196, 44, 26);
      cx.fillStyle = '#4a5478'; cx.beginPath(); cx.arc(x, 196, 22, Math.PI, 0); cx.fill();
      const a = -Math.PI / 2 + Math.sin(R.t * 0.6 + k) * 0.7;
      cx.strokeStyle = 'rgba(122,216,255,0.35)'; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(x, 186); cx.lineTo(x + Math.cos(a) * 260, 186 + Math.sin(a) * 260); cx.stroke(); cx.lineWidth = 1;
    });
    if (t > 2) { const r = 6 + Math.sin(R.t * 5) * 2; cx.strokeStyle = '#ffd34c'; cx.beginPath(); cx.arc(330, 60, r + 4, 0, 7); cx.stroke(); cx.fillStyle = '#fff'; cx.fillRect(329, 59, 3, 3); }
  } else if (i === 2) { // Pontes-01b
    drawStars(0.3, dt);
    const d = Math.round(Math.min(190, 20 + t * 45));
    drawPlanet('pontes', 240, 135, d, R.t * 0.5);
    cx.strokeStyle = 'rgba(122,216,255,0.6)'; cx.beginPath(); cx.ellipse(240, 135, d * 0.75, d * 0.2, -0.2, 0, 7); cx.stroke();
    if (t > 2) { text('PONTES-01b', 240, 20, '#7ad8ff', 16, 'center'); text('1,04 R⊕ · 268 K · G9', 240, 40, '#ffd34c', 8, 'center'); }
  } else if (i === 3) { // centenas de naves partem
    drawStars(3, dt);
    drawPlanet('earthPoll', 40, 230, 160, R.t * 0.3);
    const n = Math.min(40, Math.floor(t * 8));
    for (let k = 0; k < n; k++) { const p = ((t * 0.18 + k * 0.137) % 1); const x = 60 + p * 460, y = 210 - p * 170 + Math.sin(k * 7.3) * 40; cx.fillStyle = 'rgba(255,148,17,0.5)'; cx.fillRect(Math.round(x - 14), Math.round(y), 12, 1); drawShipExterior(x, y, 0.32, true); }
    text(`${Math.min(999, Math.floor(t * 70))}+`, 460, 16, '#ffd34c', 16, 'right');
  } else if (i === 4) { // perigos
    drawStars(6, dt);
    for (let k = 0; k < 14; k++) { const x = VW - ((R.t * 160 + k * 67) % (VW + 80)), y = 20 + (k * 37) % 230; cx.fillStyle = '#5a4a3a'; cx.beginPath(); cx.arc(x, y, 4 + k % 4, 0, 7); cx.fill(); cx.fillStyle = 'rgba(255,140,40,0.5)'; cx.fillRect(x + 4, y - 1, 14, 2); }
    drawShipExterior(200 + Math.sin(R.t * 3) * 6, 135 + Math.cos(R.t * 2.3) * 8, 1.4, true);
    if (Math.sin(R.t * 2.2) > 0.93) { cx.fillStyle = 'rgba(255,255,255,0.5)'; cx.fillRect(0, 0, VW, VH); }
    cx.strokeStyle = '#ff4a5a'; cx.beginPath(); for (let x = 0; x < 140; x++) { const ph = (x + R.t * 60) % 40; const y = 250 - (ph > 18 && ph < 22 ? (ph - 18) * 6 : ph > 22 && ph < 25 ? -8 : 0); x ? cx.lineTo(10 + x, y) : cx.moveTo(10, y); } cx.stroke();
  } else { // um só final
    drawStars(1, dt);
    drawPlanet('pontes', 400, 135, 150, R.t * 0.4);
    const x = 40 + Math.min(1, t / 6) * 230; drawShipExterior(x, 140, 1, true);
    if (t > 1.5) text(L('UM SÓ FINAL'), 140, 40, '#ff4a5a', 16, 'center');
  }
  if (fade < 1) { cx.fillStyle = `rgba(0,0,0,${1 - fade})`; cx.fillRect(0, 0, VW, VH); }
}

// ---------- introdução por modo (cena 'intro' da partida) ----------
const MAP_NODES = { terra: [48, 205], montagem: [120, 150], viagem: [205, 112], crew: [205, 112], estacao: [290, 82], orbita: [372, 104], colonia: [432, 168] };
const MAP_ORDER = ['terra', 'montagem', 'viagem', 'estacao', 'orbita', 'colonia'];
function modeSlides() { const m = U.mintro; return m ? ((FALAS.modes || {})[m.mode] || []) : []; }
function modeIntroStart(mode) {
  U.mintro = { mode, i: 0, t: 0, sx: MAP_NODES.terra[0], sy: MAP_NODES.terra[1] };
  const sl = modeSlides(); if (sl[0]) Narrator.say(sl[0].t);
}
UIH.mNext = () => { const m = U.mintro; if (!m) return; const sl = modeSlides(); if (m.i >= sl.length - 1) return UIH.introSkip(); m.i++; m.t = 0; Narrator.say(sl[m.i].t); };
UIH.mPrev = () => { const m = U.mintro; if (!m || m.i === 0) return; m.i--; m.t = 0; Narrator.say(modeSlides()[m.i].t); };
UIH.mGo = i => { const m = U.mintro; if (!m) return; m.i = +i; m.t = 0; Narrator.say(modeSlides()[m.i].t); };
// ---------- animação dos controles (no lugar do "como jogar") ----------
const HOWTO = [
  { k: ['←', '→'], t: 'Andar', mode: 'walk' },
  { k: ['Shift'], t: 'Correr', mode: 'run' },
  { k: ['J'], t: K('Pular', 'Jump', 'Saltar'), mode: 'jump' },
  { k: ['E'], t: 'Usar estações e conversar', mode: 'use' },
  { k: ['H'], t: 'Computador de bordo: peça ajuda', mode: 'help' },
];
const HOWTO_STEP = 2.8;
function drawHowto(dt) {
  const h = U.howto; h.t += dt;
  const i = Math.floor(h.t / HOWTO_STEP);
  if (i >= HOWTO.length) { UIH.introSkip(); return; }
  const st = HOWTO[i], lt = h.t - i * HOWTO_STEP;
  spaceBg(); drawStars(0.3, dt);
  const fl = 158, cons = 330;
  // chão da nave e um console
  cx.fillStyle = '#1c2550'; cx.fillRect(60, fl, 360, 6); cx.fillStyle = '#2b376e'; cx.fillRect(60, fl + 6, 360, 3);
  cx.fillStyle = '#3a4a86'; cx.fillRect(cons - 9, fl - 26, 18, 26);
  const lit = st.mode === 'use' && lt > 1.2;
  cx.fillStyle = lit ? (Math.floor(R.t * 6) % 2 ? '#7dffb0' : '#3fbf6a') : '#16303a'; cx.fillRect(cons - 6, fl - 22, 12, 7);
  const av = (S && S.crew[0] && S.crew[0].avatar) || DEFAULT_AVATAR;
  let x = 200, jy = 0, face = 1, fr = 0;
  if (st.mode === 'walk') { x = 200 + Math.sin(lt * 1.7) * 70; face = Math.cos(lt * 1.7) >= 0 ? 1 : -1; fr = Math.floor(R.t * 8); }
  if (st.mode === 'run') { x = 200 + Math.sin(lt * 3.4) * 95; face = Math.cos(lt * 3.4) >= 0 ? 1 : -1; fr = Math.floor(R.t * 14); }
  if (st.mode === 'jump') { const p = (lt % 1.2) / 1.2; jy = Math.sin(p * Math.PI) * 34; }
  if (st.mode === 'use') { x = 200 + Math.min(1, lt / 1.1) * (cons - 222); fr = lt < 1.1 ? Math.floor(R.t * 8) : 0; }
  drawChar(av, 'suit', x, fl - jy, face, fr, 'happy');
  if (lit) { // painel da estação abre
    const a = Math.min(1, (lt - 1.2) * 3); cx.globalAlpha = a;
    cx.fillStyle = 'rgba(8,14,44,0.95)'; cx.fillRect(cons - 40, fl - 92, 80, 44); cx.strokeStyle = '#2f5bd7'; cx.strokeRect(cons - 40, fl - 92, 80, 44);
    cx.fillStyle = '#3fbf6a'; cx.fillRect(cons - 32, fl - 80, 50, 4); cx.fillStyle = '#ffd34c'; cx.fillRect(cons - 32, fl - 70, 34, 4); cx.fillStyle = '#7ad8ff'; cx.fillRect(cons - 32, fl - 60, 42, 4);
    cx.globalAlpha = 1;
  }
  if (st.mode === 'help') { // o computador responde
    const a = Math.min(1, lt * 2); cx.globalAlpha = a;
    cx.fillStyle = '#fff'; cx.fillRect(x + 10, fl - 70, 70, 26); cx.fillStyle = '#fff'; cx.fillRect(x + 14, fl - 44, 6, 5);
    cx.fillStyle = '#16303a'; cx.fillRect(x + 16, fl - 66, 14, 10); cx.fillStyle = '#7dffb0'; cx.fillRect(x + 18, fl - 64, 10, 6);
    for (let k = 0; k < Math.min(3, Math.floor(lt * 3)); k++) { cx.fillStyle = '#2f5bd7'; cx.fillRect(x + 36 + k * 12, fl - 60, 8, 3); }
    cx.globalAlpha = 1;
  }
}
function howtoScreen() {
  const h = U.howto; const i = Math.min(HOWTO.length - 1, Math.floor(h.t / HOWTO_STEP)); const st = HOWTO[i];
  const press = Math.floor(R.t * 3) % 2 === 0;
  return `<div class="howto"><div class="howkeys">${st.k.map(k => `<kbd class="${press ? 'on' : ''}">${esc(L(k))}</kbd>`).join('')}</div>
    <div class="howcap">${esc(L(st.t))}</div>
    <div class="dots">${HOWTO.map((_, j) => `<i class="${j === i ? 'on' : j < i ? 'done' : ''}"></i>`).join('')}</div>
    <div class="row"><button class="btn primary" data-ui="introSkip">${esc(L('Começar'))} ▶</button></div></div>`;
}
function drawModeIntro(dt) {
  if (U.howto) return drawHowto(dt);
  const m = U.mintro; spaceBg(); drawStars(0.6, dt);
  if (!m) return;
  const sl = modeSlides(); const cur = sl[m.i]; const used = sl.map(s => s.node === 'crew' ? 'viagem' : s.node);
  m.t += dt;
  // passo a passo automático: depois de escrever e falar o texto, avança sozinho (o botão Próximo continua valendo)
  if (cur) {
    const len = String(L(cur.t)).length, speaking = 'speechSynthesis' in window && speechSynthesis.speaking && Save.data.settings.narration;
    if (m.t > len / 50 + 1.5 && m.t > Math.max(4, len / 17) && !speaking) { UIH.mNext(); return; }
  }
  // rota tracejada
  cx.setLineDash([3, 4]); cx.strokeStyle = 'rgba(143,163,214,0.55)'; cx.beginPath();
  MAP_ORDER.forEach((k, j) => { const [x, y] = MAP_NODES[k]; j ? cx.lineTo(x, y) : cx.moveTo(x, y); }); cx.stroke(); cx.setLineDash([]);
  // nós
  MAP_ORDER.forEach(k => {
    const [x, y] = MAP_NODES[k]; const on = used.includes(k); const active = cur && (cur.node === k || (cur.node === 'crew' && k === 'viagem'));
    cx.globalAlpha = on ? 1 : 0.35;
    if (k === 'terra') drawPlanet('earthPoll', x, y, 34, R.t * 0.3);
    else if (k === 'orbita') drawPlanet('pontes', x, y, 34, R.t * 0.3);
    else if (k === 'colonia') { drawPlanet('pontes', x, y + 8, 40, 0); cx.fillStyle = '#e8e8f0'; cx.beginPath(); cx.arc(x, y - 10, 9, Math.PI, 0); cx.fill(); }
    else if (k === 'estacao') { cx.strokeStyle = '#cfd6e6'; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(x, y, 18, 6, 0, 0, 7); cx.stroke(); cx.lineWidth = 1; cx.fillStyle = '#cfd6e6'; cx.fillRect(x - 2, y - 12, 4, 24); }
    else if (k === 'montagem') { cx.fillStyle = '#ffd34c'; for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4 + R.t; cx.fillRect(Math.round(x + Math.cos(an) * 10) - 2, Math.round(y + Math.sin(an) * 10) - 2, 4, 4); } cx.fillStyle = '#8a93ad'; cx.beginPath(); cx.arc(x, y, 8, 0, 7); cx.fill(); }
    else if (k === 'viagem') { cx.fillStyle = 'rgba(122,216,255,0.25)'; cx.beginPath(); cx.arc(x, y, 14, 0, 7); cx.fill(); }
    if (active) { cx.strokeStyle = '#ffd34c'; cx.lineWidth = 2; cx.beginPath(); cx.arc(x, y, 24 + Math.sin(R.t * 4) * 2, 0, 7); cx.stroke(); cx.lineWidth = 1; }
    cx.globalAlpha = 1;
  });
  // nave voa até o nó atual
  if (cur) { const [tx, ty] = MAP_NODES[cur.node]; m.sx += (tx - m.sx) * Math.min(1, dt * 2.5); m.sy += (ty - 22 - m.sy) * Math.min(1, dt * 2.5); drawShipExterior(m.sx - 20, m.sy, 0.55, true); }
}
function introScreen() {
  if (U.howto) return howtoScreen();
  const m = U.mintro; if (!m) return '';
  const sl = modeSlides(); const cur = sl[m.i]; if (!cur) return '';
  const full = L(cur.t); const shown = full.slice(0, Math.floor(m.t * 50));
  const names = FALAS.nodes || {};
  const used = sl.map((s, j) => [s.node, j]);
  const btns = used.map(([n, j]) => { const [x, y] = MAP_NODES[n]; return `<button class="mnode ${j === m.i ? 'on' : ''}" style="left:${x / VW * 100}%;top:${(y + 26) / VH * 100}%" data-ui="mGo" data-arg="${j}">${esc(L(names[n] || n))}</button>`; }).join('');
  const crew = cur.node === 'crew' ? `<div class="mcrew">${ROLES.map(r => { const c = S && S.crew.find(x => x.role === r.id); return `<div><img src="${spriteURL(c ? c.avatar : DEFAULT_AVATAR, 'suit', 'happy', 2)}" alt=""><b>${esc(T(c ? c.roleName : r.name))}</b></div>`; }).join('')}</div>` : '';
  return `<div class="mintro"><h2 class="mtitle">🎬 ${esc(L((FALAS.modeNames || {})[m.mode] || m.mode))}</h2>${btns}
    <div class="mcap">${crew}<p>${esc(shown)}<span class="caret">▌</span></p><div class="dots">${sl.map((_, j) => `<i class="${j === m.i ? 'on' : j < m.i ? 'done' : ''}"></i>`).join('')}</div>
    <div class="row"><button class="btn" data-ui="introSkip">${esc(L('Pular'))} <kbd>Esc</kbd></button>${m.i ? `<button class="btn" data-ui="mPrev">◀</button>` : ''}<button class="btn primary" data-ui="mNext">${m.i < sl.length - 1 ? esc(L('Próximo')) : esc(L('Começar'))} ▶ <kbd>${esc(L('Espaço'))}</kbd></button></div></div></div>`;
}
