// ============================================================
//  CENÁRIOS — desenho em pixel art no canvas (480x270)
// ============================================================
'use strict';

const VW = 480, VH = 270;
let cv, cx;
const R = { t: 0, camX: 0, stars: [], earthCam: 0 };

function initCanvas() {
  cv = document.getElementById('cv');
  cv.width = VW; cv.height = VH;
  cx = cv.getContext('2d');
  cx.imageSmoothingEnabled = false;
  for (let i = 0; i < 220; i++) R.stars.push({ x: Math.random() * VW, y: Math.random() * VH, z: 0.2 + Math.random() * 1.6, c: pick(['#ffffff', '#cfe8ff', '#ffe9c4', '#9fc6ff']) });
}

// ---------- ruído para planetas ----------
function hash(x, y, s) { let h = x * 374761393 + y * 668265263 + s * 982451653; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { v += a * vnoise(x * f, y * f, s + i * 17); a *= 0.5; f *= 2; } return v; }

const _planetCache = {};
// tipo: earthPoll, earth, mars, pontes, gas
function planetCanvas(type, d, rot) {
  const key = type + d + '|' + Math.floor(rot);
  if (_planetCache[key]) return _planetCache[key];
  const c = document.createElement('canvas'); c.width = c.height = d;
  const g = c.getContext('2d'); const img = g.createImageData(d, d);
  const r = d / 2;
  for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
    const dx = (x - r + 0.5) / r, dy = (y - r + 0.5) / r; const dd = dx * dx + dy * dy;
    if (dd > 1) continue;
    const z = Math.sqrt(1 - dd);
    const lon = Math.atan2(dx, z) + rot * 0.05, lat = Math.asin(dy);
    const nx = lon * 2.2, ny = lat * 2.2;
    let n = fbm(nx + 10, ny + 10, 3), cl = fbm(nx * 1.7 + 50, ny * 2.5, 9);
    let col;
    if (type === 'mars') { col = n > 0.55 ? [196, 98, 52] : n > 0.42 ? [170, 76, 40] : [130, 58, 36]; if (Math.abs(dy) > 0.85) col = [230, 220, 210]; }
    else if (type === 'rock') { col = n > 0.55 ? [150, 140, 128] : n > 0.42 ? [118, 108, 100] : [88, 80, 78]; if (cl > 0.7) col = [170, 160, 150]; }
    else if (type === 'ocean') { col = n > 0.6 ? [200, 220, 235] : n > 0.4 ? [40, 96, 170] : [28, 66, 140]; if (cl > 0.62) col = [225, 235, 245]; }
    else if (type === 'lava') { col = n > 0.5 ? [255, 150, 40] : n > 0.4 ? [200, 70, 24] : [70, 24, 20]; }
    else if (type === 'gas') { const b = Math.sin(dy * 14 + fbm(nx, ny * 6, 2) * 3); col = b > 0.3 ? [214, 180, 140] : b > -0.3 ? [186, 140, 100] : [150, 104, 78]; }
    else if (type === 'pontes') {
      col = n > 0.56 ? (n > 0.66 ? [96, 150, 84] : [62, 132, 92]) : n > 0.52 ? [210, 200, 140] : [36, 92, 170];
      if (cl > 0.6) col = [235, 240, 250];
    } else if (type === 'earthPoll') {
      col = n > 0.55 ? (n > 0.65 ? [120, 104, 70] : [98, 108, 60]) : [40, 70, 110];
      if (cl > 0.55) col = [150, 130, 100]; if (cl > 0.68) col = [120, 100, 76];
    } else {
      col = n > 0.55 ? [70, 140, 70] : [40, 90, 180]; if (cl > 0.6) col = [240, 240, 250];
    }
    // luz
    const light = clamp(0.25 + 0.95 * (dx * -0.55 + dy * -0.35 + z * 0.75), 0.12, 1.15);
    const dith = ((x + y) & 1) ? 0.03 : 0;
    const q = v => clamp(Math.round((v * (light + dith)) / 16) * 16, 0, 255);
    const i = (y * d + x) * 4;
    img.data[i] = q(col[0]); img.data[i + 1] = q(col[1]); img.data[i + 2] = q(col[2]); img.data[i + 3] = 255;
    if (dd > 0.9) { // atmosfera
      const atm = type === 'mars' ? [255, 160, 110] : type === 'earthPoll' ? [200, 150, 90] : type === 'lava' ? [255, 120, 40] : type === 'rock' ? [150, 140, 130] : [120, 190, 255];
      img.data[i] = (img.data[i] + atm[0]) >> 1; img.data[i + 1] = (img.data[i + 1] + atm[1]) >> 1; img.data[i + 2] = (img.data[i + 2] + atm[2]) >> 1;
    }
  }
  g.putImageData(img, 0, 0);
  const keys = Object.keys(_planetCache); if (keys.length > 40) delete _planetCache[keys[0]];
  return (_planetCache[key] = c);
}
function drawPlanet(type, x, y, d, rot = 0) { cx.drawImage(planetCanvas(type, d, rot), Math.round(x - d / 2), Math.round(y - d / 2)); }

function drawStars(speed = 0, dt = 0, tint) {
  for (const s of R.stars) {
    s.x -= speed * s.z * dt; if (s.x < 0) { s.x += VW; s.y = Math.random() * VH; }
    const tw = (Math.sin(R.t * 3 + s.y) > 0.92) ? 1 : 0;
    cx.fillStyle = s.c;
    const w = speed > 60 ? Math.max(1, Math.round(s.z * speed / 120)) : 1;
    cx.fillRect(Math.round(s.x), Math.round(s.y), w + tw, 1 + tw * 0);
  }
}
function spaceBg() {
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#05061a'); g.addColorStop(0.6, '#0b0f2e'); g.addColorStop(1, '#160b30');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  // nebulosa
  cx.globalAlpha = 0.18;
  for (let i = 0; i < 6; i++) { cx.fillStyle = i % 2 ? '#5a2ca0' : '#2c4aa0'; cx.beginPath(); cx.ellipse(340 + i * 18, 70 + i * 22, 120 - i * 10, 30, -0.4, 0, 7); cx.fill(); }
  cx.globalAlpha = 1;
}

function text(t, x, y, col = '#fff', size = 8, align = 'left', font = 'Silkscreen') {
  t = T(t);
  cx.font = `${size}px "${font}", monospace`; cx.textAlign = align; cx.textBaseline = 'top';
  cx.fillStyle = '#000'; cx.fillText(t, x + 1, y + 1);
  cx.fillStyle = col; cx.fillText(t, x, y);
}

// ---------- nave exterior ----------
function drawShipExterior(x, y, s = 1, flame = true) {
  cx.save(); cx.translate(Math.round(x), Math.round(y)); cx.scale(s, s);
  const r = (a, b, w, h, c) => { cx.fillStyle = c; cx.fillRect(a, b, w, h); };
  if (flame) { const f = 6 + Math.sin(R.t * 30) * 3; r(-14 - f, -3, 14 + f, 6, '#ff9411'); r(-10 - f / 2, -2, 10 + f / 2, 4, '#ffe066'); r(-14 - f, -10, 10 + f, 4, '#2fb6ff'); r(-14 - f, 6, 10 + f, 4, '#2fb6ff'); }
  r(-6, -12, 8, 24, '#3a3f5c'); r(-4, -10, 4, 6, '#14182c'); r(-4, 4, 4, 6, '#14182c');
  r(0, -9, 46, 18, '#cfd6e6'); r(0, -9, 46, 2, '#ffffff'); r(0, 7, 46, 2, '#8a93ad');
  r(46, -7, 10, 14, '#cfd6e6'); r(56, -5, 6, 10, '#b8c1d6'); r(62, -3, 4, 6, '#9aa3bb');
  r(48, -5, 8, 5, '#2fd7ff'); r(50, -4, 4, 2, '#bff6ff');
  r(6, -4, 34, 2, '#1f5bff'); r(6, 2, 34, 2, '#1f5bff');
  for (let i = 0; i < 5; i++) r(8 + i * 7, -1, 3, 2, (Math.floor(R.t * 2) + i) % 3 ? '#2fd7ff' : '#ffffff');
  r(14, -15, 18, 6, '#8a93ad'); r(14, 9, 18, 6, '#8a93ad'); r(16, -14, 14, 1, '#2f5bd7'); r(16, 13, 14, 1, '#2f5bd7');
  if (S && has('solar')) { r(18, -26, 10, 11, '#2341a8'); r(18, 15, 10, 11, '#2341a8'); cx.fillStyle = '#5a7cff'; for (let i = 0; i < 3; i++) { cx.fillRect(19, -25 + i * 4, 8, 1); cx.fillRect(19, 16 + i * 4, 8, 1); } }
  cx.restore();
}

// ---------- TERRA POLUÍDA ----------
const EARTH_W = 2150, GROUND = 222; // cidade compacta
let earthLayout = null;
function buildEarth() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const far = [], near = [], props = [], npcs = [];
  for (let x = 0; x < EARTH_W + 200; x += 18 + rnd() * 20) far.push({ x, w: 16 + rnd() * 26, h: 40 + rnd() * 70 });
  for (let x = 40; x < EARTH_W; x += 70 + rnd() * 60) near.push({ x, w: 40 + rnd() * 40, h: 70 + rnd() * 70, chim: rnd() < 0.4, col: pick(['#3b3328', '#2f2a24', '#46392a', '#353038']) });
  const signs = ['AR PÉSSIMO • IQA 312', 'ÁGUA: RACIONAMENTO NÍVEL 4', 'TEMPERATURA: 46 °C', 'USE MÁSCARA', 'CO₂: 420+ ppm', 'MAR: +10 cm DESDE 1993', 'COLÔNIA EM MARTE: VAGAS ESGOTADAS', '6.000+ EXOPLANETAS CONFIRMADOS', 'PROJETO PONTES-01b: ALISTAMENTO'];
  // placas nos vãos entre os prédios da cidade (longe das portas e das pessoas)
  const signX = [40, 255, 525, 820, 1070, 1265, 1515, 1765, 1885];
  signs.forEach((t, i) => props.push({ type: 'sign', x: signX[i] != null ? signX[i] : 120 + i * 372, t }));
  for (let i = 0; i < 38; i++) props.push({ type: 'trash', x: 40 + rnd() * (EARTH_W - 80) });
  // cidade mais impactante: montes de lixo, sacos, tambores pegando fogo e carros abandonados
  for (let i = 0; i < 14; i++) props.push({ type: 'pile', x: 60 + rnd() * (EARTH_W - 120), w: 22 + rnd() * 30, h: 8 + rnd() * 12, s: rnd() });
  for (let i = 0; i < 25; i++) props.push({ type: 'bag', x: 30 + rnd() * (EARTH_W - 60), c: pick(['#1c1c1c', '#2a3a2a', '#3a3a46', '#4a3a1c']) });
  for (let i = 0; i < 9; i++) props.push({ type: 'barrel', x: 150 + rnd() * (EARTH_W - 300) });
  for (let i = 0; i < 4; i++) props.push({ type: 'car', x: 120 + rnd() * (EARTH_W - 240), c: pick(['#6a3a2a', '#3a4a5a', '#5a5a3a', '#4a2a3a']) });
  for (let i = 0; i < 10; i++) props.push({ type: 'tree', x: 120 + rnd() * (EARTH_W - 240) });
  for (let i = 0; i < 6; i++) npcs.push({ x: 100 + rnd() * (EARTH_W - 200), dir: rnd() < 0.5 ? -1 : 1, av: randomAvatar(rnd), t: rnd() * 5 });
  props.sort((a, b) => ['car', 'pile', 'barrel', 'tree', 'bag', 'trash', 'sign'].indexOf(a.type) - ['car', 'pile', 'barrel', 'tree', 'bag', 'trash', 'sign'].indexOf(b.type));
  const dust = []; for (let i = 0; i < 60; i++) dust.push({ x: rnd() * VW, y: rnd() * VH, v: 6 + rnd() * 18 });
  earthLayout = { far, near, props, npcs, smoke: [], dust };
}
function drawEarth(dt, player) {
  if (!earthLayout) buildEarth();
  const L = earthLayout;
  R.earthCam = clamp(player.x - VW / 2, 0, EARTH_W - VW);
  const cam = Math.round(R.earthCam);
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#5e4a33'); g.addColorStop(0.5, '#9a7a4a'); g.addColorStop(1, '#b48c55');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  cx.fillStyle = '#e8b86a'; cx.globalAlpha = 0.55; cx.beginPath(); cx.arc(380 - cam * 0.05, 60, 22, 0, 7); cx.fill(); cx.globalAlpha = 1;
  // prédios distantes
  cx.fillStyle = '#6e5a42';
  for (const b of L.far) { const x = b.x - cam * 0.35; if (x > -60 && x < VW + 10) cx.fillRect(Math.round(x), GROUND - 30 - b.h, Math.round(b.w), b.h + 30); }
  // smog
  for (let i = 0; i < 3; i++) { cx.fillStyle = `rgba(120,100,70,${0.18 + i * 0.05})`; const off = (R.t * (6 + i * 4)) % 200; for (let x = -200; x < VW + 200; x += 100) cx.fillRect(Math.round(x - off), 110 + i * 25, 90, 14 + i * 4); }
  // prédios próximos
  for (const b of L.near) {
    const x = Math.round(b.x - cam * 0.7); if (x < -100 || x > VW + 20) continue;
    cx.fillStyle = b.col; cx.fillRect(x, GROUND - b.h, Math.round(b.w), b.h);
    for (let wy = GROUND - b.h + 6; wy < GROUND - 8; wy += 9) for (let wx = x + 4; wx < x + b.w - 5; wx += 8) { cx.fillStyle = hash(wx, wy, 1) > 0.7 ? '#d8b04a' : '#1e1a16'; cx.fillRect(wx, wy, 4, 5); }
    if (b.chim) {
      cx.fillStyle = '#2a2420'; cx.fillRect(x + 6, GROUND - b.h - 18, 7, 18);
      if (Math.random() < dt * 4) L.smoke.push({ x: b.x + 9, y: GROUND - b.h - 20, r: 3, a: 0.6, par: 0.7 });
    }
  }
  for (const s of L.smoke) { s.y -= dt * 12; s.x += dt * 6; s.r += dt * 2.5; s.a -= dt * 0.08; }
  L.smoke = L.smoke.filter(s => s.a > 0);
  for (const s of L.smoke) { cx.fillStyle = `rgba(60,52,44,${s.a})`; cx.beginPath(); cx.arc(Math.round(s.x - cam * s.par), Math.round(s.y), s.r, 0, 7); cx.fill(); }
  // chão
  cx.fillStyle = '#3a3128'; cx.fillRect(0, GROUND, VW, VH - GROUND);
  cx.fillStyle = '#4a3f33'; for (let x = -(cam % 24); x < VW; x += 24) cx.fillRect(x, GROUND, 12, 2);
  cx.fillStyle = '#2a231c'; cx.fillRect(0, GROUND + 18, VW, 2);
  // plataforma de lançamento ao fundo
  const px = EARTH_W - 80 - cam;
  if (px < VW + 40) {
    cx.fillStyle = '#555'; cx.fillRect(px - 20, GROUND - 6, 60, 6); cx.fillStyle = '#777'; cx.fillRect(px + 30, GROUND - 90, 4, 84);
    cx.fillStyle = '#ddd'; cx.fillRect(px, GROUND - 80, 14, 74); cx.fillStyle = '#c33'; cx.fillRect(px, GROUND - 86, 14, 6); cx.fillRect(px + 3, GROUND - 92, 8, 6);
    cx.fillStyle = '#1f5bff'; cx.fillRect(px + 2, GROUND - 50, 10, 3);
    text('PONTES-01b', px - 10, GROUND - 104, '#ffd34c');
    const nr = U.earth && Math.abs(rocketX() - U.earth.p.x) < 45;
    if (nr) { cx.strokeStyle = '#ffd34c'; cx.lineWidth = 1; cx.strokeRect(px - 4.5, GROUND - 96.5, 22, 92); }
    else { cx.fillStyle = '#ffd34c'; cx.fillRect(px + 6, GROUND - 120 + Math.round(Math.sin(R.t * 4) * 2), 2, 6); cx.fillRect(px + 6, GROUND - 112 + Math.round(Math.sin(R.t * 4) * 2), 2, 2); }
  }
  // props
  for (const p of L.props) {
    const x = Math.round(p.x - cam); if (x < -80 || x > VW + 80) continue;
    if (p.type === 'trash') { cx.drawImage(getItemSprite('lata'), x, GROUND - 6); cx.drawImage(getItemSprite('garrafa'), x + 8, GROUND - 8); cx.drawImage(getItemSprite('papel'), x + 16, GROUND - 5); }
    if (p.type === 'pile') {
      const w = Math.round(p.w), h = Math.round(p.h);
      cx.fillStyle = '#2a241c'; cx.beginPath(); cx.moveTo(x - w / 2, GROUND); cx.lineTo(x - w / 4, GROUND - h); cx.lineTo(x + w / 5, GROUND - h - 3); cx.lineTo(x + w / 2, GROUND); cx.fill();
      for (let k = 0; k < 7; k++) { cx.fillStyle = ['#8a8a8a', '#c43a2a', '#2f78c8', '#d8c86a', '#3a6a3a', '#e8e8e8', '#6a4a2a'][(k + Math.floor(p.s * 7)) % 7]; cx.fillRect(Math.round(x - w / 2 + 3 + (k * 37 % (w - 6))), Math.round(GROUND - 2 - (k * 13 % h)), 3, 2); }
      if (Math.random() < dt * 0.6) L.smoke.push({ x: p.x, y: GROUND - h, r: 2, a: 0.35, par: 1 });
    }
    if (p.type === 'bag') { cx.fillStyle = p.c; cx.beginPath(); cx.arc(x, GROUND - 4, 4, 0, 7); cx.fill(); cx.fillRect(x - 1, GROUND - 9, 2, 2); }
    if (p.type === 'barrel') {
      cx.fillStyle = '#5a3a24'; cx.fillRect(x - 5, GROUND - 14, 10, 14); cx.fillStyle = '#3a2416'; cx.fillRect(x - 5, GROUND - 10, 10, 1); cx.fillRect(x - 5, GROUND - 5, 10, 1);
      for (let k = 0; k < 4; k++) { const fl = Math.sin(R.t * 12 + k * 2) * 2; cx.fillStyle = k % 2 ? '#ffd23f' : '#ff6a1a'; cx.fillRect(x - 4 + k * 2, GROUND - 18 - Math.abs(fl) - k % 3, 2, 5 + Math.abs(fl)); }
      cx.fillStyle = 'rgba(255,140,40,0.12)'; cx.beginPath(); cx.arc(x, GROUND - 16, 18, 0, 7); cx.fill();
      if (Math.random() < dt * 3) L.smoke.push({ x: p.x, y: GROUND - 22, r: 2, a: 0.5, par: 1 });
    }
    if (p.type === 'car') { cx.fillStyle = p.c; cx.fillRect(x - 16, GROUND - 10, 32, 7); cx.fillRect(x - 9, GROUND - 16, 18, 6); cx.fillStyle = '#1a1a22'; cx.fillRect(x - 7, GROUND - 15, 6, 4); cx.fillRect(x + 1, GROUND - 15, 6, 4); cx.fillStyle = '#111'; cx.fillRect(x - 12, GROUND - 4, 6, 4); cx.fillRect(x + 6, GROUND - 4, 6, 4); cx.fillStyle = '#7a4a2a'; cx.fillRect(x + 4, GROUND - 9, 6, 3); }
    if (p.type === 'tree') { cx.fillStyle = '#2a1e14'; cx.fillRect(x, GROUND - 30, 3, 30); cx.fillRect(x - 6, GROUND - 26, 6, 2); cx.fillRect(x + 3, GROUND - 22, 7, 2); cx.fillRect(x - 3, GROUND - 32, 2, 4); }
  }
  // letreiros: mais altos que os prédios e desenhados ANTES deles (ficam atrás dos prédios e dos nomes das pessoas)
  for (const p of L.props) if (p.type === 'sign') drawStreetSign(p, Math.round(p.x - cam));
  drawCity(dt, cam);
  // poeira e fuligem no ar + neblina tóxica
  for (const d of L.dust) { d.x -= d.v * dt; d.y += Math.sin(R.t + d.v) * dt * 4; if (d.x < -2) { d.x = VW + 2; } cx.fillStyle = 'rgba(70,58,40,0.55)'; cx.fillRect(Math.round(d.x), Math.round(d.y), 1, 1); }
  const haze = cx.createLinearGradient(0, 120, 0, VH); haze.addColorStop(0, 'rgba(140,110,60,0)'); haze.addColorStop(1, 'rgba(120,96,56,0.28)'); cx.fillStyle = haze; cx.fillRect(0, 120, VW, VH - 120);
  if (R.cityBubble) { const b = R.cityBubble; R.cityBubble = null; bubble(b.text, b.x, b.y, 170, 9); }
  // NPCs com máscara
  for (const n of L.npcs) {
    n.t += dt; n.x += n.dir * 14 * dt; if (n.x < 40 || n.x > EARTH_W - 60) n.dir *= -1;
    const x = Math.round(n.x - cam); if (x < -30 || x > VW + 30) continue;
    drawChar(n.av, 'civil', x, GROUND, n.dir, Math.floor(n.t * 6) % 4, 'sad', true);
  }
  return cam;
}

function signLines(t) {
  cx.font = '8px "Silkscreen", monospace';
  const words = T(t).split(' '); const lines = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (cur && cx.measureText(n).width > 92) { lines.push(cur); cur = w; } else cur = n; }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}
function drawStreetSign(p, x) {
  if (x < -80 || x > VW + 80) return;
  const lines = signLines(p.t);
  cx.font = '8px "Silkscreen", monospace';
  const w = Math.ceil(Math.max(...lines.map(l => cx.measureText(l).width))) + 10, h = lines.length * 9 + 6;
  const top = GROUND - 104 - h; // acima do prédio mais alto (84 px)
  cx.fillStyle = '#1a1612'; cx.fillRect(x - 1, top + h, 3, GROUND - top - h);           // poste
  cx.fillStyle = '#ffb03a'; cx.fillRect(x - w / 2 - 2, top - 2, w + 4, h + 4);             // moldura
  cx.fillStyle = '#16120e'; cx.fillRect(x - w / 2, top, w, h);
  cx.fillStyle = (Math.floor(R.t * 2) % 2) ? '#ff5a3a' : '#ffb03a'; cx.fillRect(x - w / 2, top, w, 1);
  lines.forEach((l, i) => text(l, x, top + 4 + i * 9, '#ffcf6a', 8, 'center'));
}

// ---------- corpo de tripulante morto: deitado, apagado e com caveira ----------
const SKULL = ['..WWWWW..', '.WWWWWWW.', 'WWWWWWWWW', 'WKKWWWKKW', 'WKKWWWKKW', 'WWWWKWWWW', '.WWWWWWW.', '..WKWKW..', '..WWWWW..'];
function drawSkull(x, y, s = 1) {
  const X = Math.round(x - 4.5 * s), Y = Math.round(y);
  for (let j = 0; j < SKULL.length; j++) for (let i = 0; i < 9; i++) { const ch = SKULL[j][i]; if (ch === '.') continue; cx.fillStyle = ch === 'W' ? '#f2f2f2' : '#14141c'; cx.fillRect(X + i * s, Y + j * s, s, s); }
  cx.fillStyle = 'rgba(0,0,0,0.5)'; cx.fillRect(X - 1, Y + 9 * s, 9 * s + 2, 1);
}
function drawCorpse(c, x, floorY, label = true) {
  const spr = getSprite(c.avatar, 'suit', 'sad', 0);
  cx.save();
  cx.translate(Math.round(x), Math.round(floorY));
  cx.rotate(-Math.PI / 2 * (c.face < 0 ? -1 : 1)); // deitado
  cx.globalAlpha = 0.62;
  cx.drawImage(spr, -SPR_W / 2, -SPR_H);
  cx.globalAlpha = 1; cx.restore();
  cx.fillStyle = 'rgba(40,44,60,0.45)'; cx.fillRect(Math.round(x - SPR_H / 2), Math.round(floorY - SPR_W - 1), SPR_H, SPR_W + 1); // sombra acinzentada
  drawSkull(x, floorY - SPR_W - 30 + Math.sin(R.t * 2 + x) * 1.5, 2);
  if (label) text(c.name, Math.round(x), Math.round(floorY - SPR_W - 42), '#ff7a8a', 8, 'center');
}

// ---------- personagem ----------
function drawChar(av, outfit, x, floorY, face, walkFrame, mood, mask) {
  const wf = [0, 1, 0, 2][walkFrame % 4];
  const spr = getSprite(av, outfit, mood, wf);
  const X = Math.round(x - SPR_W / 2), Y = Math.round(floorY - SPR_H);
  if (face < 0) { cx.save(); cx.translate(X + SPR_W, Y); cx.scale(-1, 1); cx.drawImage(spr, 0, 0); cx.restore(); }
  else cx.drawImage(spr, X, Y);
  if (mask && outfit === 'civil') { cx.fillStyle = '#e8e8e8'; cx.fillRect(X + 6, Y + 11, 8, 3); cx.fillStyle = '#9a9a9a'; cx.fillRect(X + 5, Y + 11, 1, 1); cx.fillRect(X + 14, Y + 11, 1, 1); }
}
function bubble(str, x, y, maxW = 120, maxLines = 4) {
  str = T(L(str));
  cx.font = '8px "Silkscreen", monospace';
  const words = str.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (cur && cx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, maxLines);
  const w = Math.min(maxW + 8, Math.max(...shown.map(l => cx.measureText(l).width)) + 8), h = shown.length * 9 + 5;
  const off = -cx.getTransform().e / (cx.getTransform().a || 1); // compensa a câmera (coordenadas do mundo)
  let bx = Math.round(clamp(x - w / 2, off + 2, off + VW - w - 2)), by = Math.round(y - h - 6);
  if (by < 2) by = 2;
  cx.fillStyle = '#000'; cx.fillRect(bx - 1, by - 1, w + 2, h + 2);
  cx.fillStyle = '#f4f7ff'; cx.fillRect(bx, by, w, h);
  cx.fillStyle = '#f4f7ff'; cx.fillRect(Math.round(x) - 2, by + h, 4, 3);
  cx.textAlign = 'left'; cx.textBaseline = 'top'; cx.fillStyle = '#10142a';
  shown.forEach((l, i) => cx.fillText(l, bx + 4, by + 3 + i * 9));
}

// ---------- INTERIOR DA NAVE ----------
function stationStatusColor(id) {
  const st = STATIONS[id];
  if (st.sys) { const hp = sysHp(st.sys); return hp > 70 ? '#38e07b' : hp > 40 ? '#ffd23f' : '#ff4a4a'; }
  return '#2fd7ff';
}
function drawShipInterior(dt, me) {
  const cam = R.camX = Math.round(clamp(me.x - VW / 2, 0, WORLD_W - VW));
  spaceBg();
  const travel = S.stage === 1 && !(S.event && S.event.stopShip) ? 40 * (S.speedMod || 1) : 2;
  drawStars(travel, dt);
  cx.save();
  let shake = 0; if (S.shake > 0) { S.shake -= dt; shake = Math.round((Math.random() - 0.5) * 4); }
  cx.translate(-cam + shake, 0);
  // casco externo
  const hullTop = 52, hullBot = 232;
  cx.fillStyle = '#0b0f20'; cx.fillRect(36, hullTop - 4, 1112, hullBot - hullTop + 8);
  cx.fillStyle = '#3d4a70'; cx.fillRect(40, hullTop, 1104, hullBot - hullTop);
  cx.fillStyle = '#56648f'; cx.fillRect(40, hullTop, 1104, 4); cx.fillStyle = '#28304d'; cx.fillRect(40, hullBot - 4, 1104, 4);
  for (let x = 48; x < 1140; x += 32) { cx.fillStyle = '#34405f'; cx.fillRect(x, hullTop + 6, 1, 8); cx.fillRect(x, hullBot - 14, 1, 8); }
  // nariz
  for (let i = 0; i < 40; i++) { cx.fillStyle = '#3d4a70'; cx.fillRect(1144 + i, hullTop + i * 1.6, 1, hullBot - hullTop - i * 3.2); }
  cx.fillStyle = '#0b0f20'; for (let i = 0; i < 40; i++) { cx.fillRect(1144 + i, hullTop + i * 1.6 - 2, 1, 2); cx.fillRect(1144 + i, hullBot - i * 1.6, 1, 2); }
  // motores
  const f = 10 + Math.sin(R.t * 28) * 4;
  for (const yy of [90, 180]) {
    cx.fillStyle = '#22283f'; cx.fillRect(14, yy - 14, 26, 28);
    if (S.stage === 1 && S.res.combustivel > 0) { cx.fillStyle = '#2fb6ff'; cx.fillRect(14 - f * 2, yy - 8, f * 2, 16); cx.fillStyle = '#cfefff'; cx.fillRect(14 - f, yy - 4, f, 8); }
  }
  // decks
  for (const room of ROOMS) drawRoom(room);
  // escadas
  for (const lx of LADDERS) { cx.fillStyle = '#6b7799'; cx.fillRect(lx - 6, DECKS.U.floor, 2, DECKS.L.floor - DECKS.U.floor); cx.fillRect(lx + 4, DECKS.U.floor, 2, DECKS.L.floor - DECKS.U.floor); for (let y = DECKS.U.floor + 4; y < DECKS.L.floor; y += 6) cx.fillRect(lx - 6, y, 12, 1); cx.fillStyle = '#1b2036'; cx.fillRect(lx - 8, DECKS.U.floor, 16, 3); }
  // estações
  const ev = S.event;
  const targets = new Set();
  if (ev && ev.phase === 'run') for (const st of ev.steps) if (!st.done && st.station) { if (!st.optional && st !== curStep(ev)) continue; targets.add(st.station); }
  for (const id in STATIONS) drawStation(id, targets.has(id));
  // brecha no casco: rachadura com ar escapando e resina na Eclusa
  if (S.event && S.event.type === 'brecha' && S.event.phase === 'run') {
    const ev = S.event, st = STATIONS[ev.data.at], sealed = ev.steps[1].done;
    const bx = st.x + 26, by = DECKS[st.deck].top + 18;
    cx.fillStyle = sealed ? '#9a8a6a' : '#000'; for (let i = 0; i < 6; i++) cx.fillRect(bx + (i % 2 ? 2 : -1), by + i * 4, 2, 4);
    if (!sealed) for (let i = 0; i < 8; i++) { const t = (R.t * 1.6 + i / 8) % 1; cx.fillStyle = `rgba(200,235,255,${1 - t})`; cx.fillRect(Math.round(bx + 2 + t * 26), Math.round(by + 10 - t * 14 + Math.sin(i) * 3), 2, 2); }
    if (!ev.steps[0].done) { const e = STATIONS.eclusa; cx.drawImage(getItemSprite('resina'), e.x - 20, DECKS[e.deck].floor - 34 + Math.round(Math.sin(R.t * 4) * 2)); }
  }
  // lixo flutuante
  for (const t of S.trash) { const y = DECKS[t.deck].floor - 14 + Math.sin(R.t * 2 + t.ph) * 4; cx.drawImage(getItemSprite(t.kind), Math.round(t.x - 4), Math.round(y)); }
  if (typeof drawJumpHazards === 'function') drawJumpHazards();
  // tripulação
  const list = S.crew.slice().sort((a, b) => (a === me) - (b === me));
  for (const c of list) {
    if (!c.alive) { drawCorpse(c, c.x, DECKS[c.deck].floor); continue; }
    if (c.eva) { drawEVA(c); continue; }
    const floor = c.climb > 0 ? DECKS.U.floor + (DECKS.L.floor - DECKS.U.floor) * (c.climbTo === 'L' ? (1 - c.climb / 0.7) : c.climb / 0.7) : DECKS[c.deck].floor;
    const outfit = S.cylinders ? 'helmet' : c.outfit;
    const mood = c.sickness ? 'sick' : (c.humor < 40 || c.status !== 'ok') ? 'sad' : 'happy';
    if (c.hibernating) { cx.globalAlpha = 0.5; }
    drawChar(c.avatar, outfit, c.x, floor - (c.jy || 0), c.face, c.moving ? Math.floor(c.walkT * 8) : 0, mood);
    cx.globalAlpha = 1;
    if (c.status !== 'ok') { cx.fillStyle = c.status === 'ferido' ? '#ff8a3a' : '#ff3a3a'; cx.fillRect(Math.round(c.x) - 2, floor - 36, 5, 2); cx.fillRect(Math.round(c.x), floor - 38, 1, 6); }
    if (c.task) { const p = clamp(c.task.t / c.task.dur, 0, 1); cx.fillStyle = '#000'; cx.fillRect(Math.round(c.x) - 11, floor - 40, 22, 4); cx.fillStyle = '#38e07b'; cx.fillRect(Math.round(c.x) - 10, floor - 39, Math.round(20 * p), 2); }
    const near = Math.abs(c.x - me.x) < 60 && Math.abs(c.x - me.x) > 26 && c.deck === me.deck;
    if (c === me || near) text(c === me ? 'VOCÊ' : c.name.toUpperCase(), Math.round(c.x), floor - 46 - (c.task ? 4 : 0), c === me ? '#ffd34c' : (c.owner && c.owner !== 'bot' ? '#7fffd0' : '#bcd3ff'), 8, 'center');
  }
  for (const c of S.crew) if (c.alive && c.bubble) { const floor = DECKS[c.deck].floor; bubble(c.bubble.text, c.x, floor - 48); }
  cx.restore();
  // iluminação
  if (S.alarm) { cx.fillStyle = `rgba(255,0,0,${0.08 + 0.08 * Math.sin(R.t * 6)})`; cx.fillRect(0, 0, VW, VH); }
  if (S.thermal) { const T = S.thermal.T; if (T > 26) { cx.fillStyle = `rgba(255,120,0,${Math.min(0.3, (T - 26) * 0.02)})`; cx.fillRect(0, 0, VW, VH); } if (T < 18) { cx.fillStyle = `rgba(80,160,255,${Math.min(0.3, (18 - T) * 0.02)})`; cx.fillRect(0, 0, VW, VH); } }
  if (S.blackout) { cx.fillStyle = 'rgba(0,0,10,0.55)'; cx.fillRect(0, 0, VW, VH); }
  if (me.sickness) { const g = cx.createRadialGradient(VW / 2, VH / 2, 60, VW / 2, VH / 2, 260); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,0,30,0.75)'); cx.fillStyle = g; cx.fillRect(0, 0, VW, VH); }
}

function drawRoom(room) {
  const d = DECKS[room.deck];
  const x0 = room.x0 + 2, w = room.x1 - room.x0 - 4, y0 = d.top, h = d.floor - d.top;
  cx.fillStyle = '#121833'; cx.fillRect(x0, y0, w, h);
  cx.fillStyle = '#18204a'; for (let x = x0 + 8; x < x0 + w; x += 24) cx.fillRect(x, y0 + 2, 12, h - 10);
  cx.fillStyle = '#0e1330'; cx.fillRect(x0, y0, w, 3);
  cx.fillStyle = '#2a3460'; cx.fillRect(x0, d.floor - 2, w, 4);
  cx.fillStyle = '#4b5a8f'; cx.fillRect(x0, d.floor + 2, w, 2);
  // luzes de teto
  cx.fillStyle = S.blackout ? '#30304a' : '#cfe9ff'; for (let x = x0 + 18; x < x0 + w - 10; x += 46) cx.fillRect(x, y0 + 3, 10, 1);
  text(room.name, x0 + 3, y0 + 5, '#7f93d9', 8);
  const id = room.id, fl = d.floor;
  const r = (a, b, ww, hh, c) => { cx.fillStyle = c; cx.fillRect(Math.round(a), Math.round(b), ww, hh); };
  if (id === 'propulsao') { r(x0 + 54, fl - 46, 48, 44, '#2a2f48'); r(x0 + 60, fl - 40, 36, 32, '#141826'); const p = 0.6 + 0.4 * Math.sin(R.t * 5); r(x0 + 70, fl - 32, 16, 16, `rgba(47,182,255,${p})`); r(x0 + 74, fl - 28, 8, 8, '#e0f7ff'); }
  if (id === 'comunicacao') { r(x0 + 90, fl - 50, 46, 28, '#0b1a12'); for (let i = 0; i < 40; i++) { const v = S.commDown > 0 ? (Math.random() * 20) : Math.sin(R.t * 4 + i * 0.5) * 8; r(x0 + 93 + i, fl - 36 + v * 0.6, 1, 1, '#38e07b'); } r(x0 + 120, y0 - 8, 2, 10, '#8a93ad'); }
  if (id === 'laboratorio') { for (let i = 0; i < 4; i++) { r(x0 + 90 + i * 12, fl - 30, 6, 18, '#2a3460'); r(x0 + 91 + i * 12, fl - 22, 4, 9, ['#38e07b', '#ff6ad5', '#2fd7ff', '#ffd23f'][i]); } r(x0 + 84, fl - 12, 56, 4, '#5a6489'); }
  if (id === 'enfermaria') { r(x0 + 96, fl - 14, 50, 6, '#e8e8f0'); r(x0 + 96, fl - 8, 4, 8, '#8a93ad'); r(x0 + 142, fl - 8, 4, 8, '#8a93ad'); r(x0 + 120, fl - 50, 22, 26, '#e8e8f0'); r(x0 + 129, fl - 46, 4, 14, '#e03030'); r(x0 + 124, fl - 41, 14, 4, '#e03030'); }
  if (id === 'avionica') { for (let i = 0; i < 3; i++) { r(x0 + 8 + i * 22, fl - 56, 18, 54, '#1c2240'); for (let j = 0; j < 8; j++) r(x0 + 11 + i * 22 + (j % 2) * 8, fl - 52 + j * 6, 3, 2, Math.sin(R.t * 7 + i * 3 + j) > 0 ? '#38e07b' : '#1d3b2a'); } }
  if (id === 'ponte') {
    r(x0 + w - 70, y0 + 10, 66, 40, '#000'); cx.save(); cx.beginPath(); cx.rect(x0 + w - 68, y0 + 12, 62, 36); cx.clip();
    for (let i = 0; i < 30; i++) { const sx = x0 + w - 68 + ((i * 37 + R.t * 60 * (S.stage === 1 ? 1 : 0.05)) % 62); r(x0 + w - 68 + ((i * 37 + R.t * 60) % 62) * 0 + (sx - (x0 + w - 68)), y0 + 12 + (i * 13) % 36, 1, 1, '#fff'); }
    if (S.progress > 0.85) drawPlanet('pontes', x0 + w - 20, y0 + 30, 18 + Math.round((S.progress - 0.85) * 120), R.t);
    cx.restore();
    r(x0 + w - 74, y0 + 8, 74, 2, '#8a93ad');
    r(x0 + 60, fl - 16, 10, 14, '#3a3f5c'); r(x0 + 56, fl - 26, 4, 14, '#3a3f5c');
  }
  if (id === 'tanques') { for (let i = 0; i < 2; i++) { r(x0 + 2 + i * 30 + 6, fl - 50, 22, 48, '#5a6489'); r(x0 + 2 + i * 30 + 10, fl - 46, 14, 40, '#2a3048'); const lvl = clamp(S.res.combustivel / S.cap.combustivel, 0, 1); r(x0 + 2 + i * 30 + 10, fl - 6 - Math.round(40 * lvl), 14, Math.round(40 * lvl), '#ff9411'); } }
  if (id === 'suporte') { r(x0 + 4, y0 + 18, w - 8, 3, '#6b7799'); r(x0 + 4, y0 + 24, w - 8, 2, '#3b9bd6'); for (let i = 0; i < 3; i++) cx.drawImage(getItemSprite('pote'), x0 + 120 + i * 14, fl - 22); for (let i = 0; i < 4; i++) cx.drawImage(getItemSprite('filtro'), x0 + 170 + i * 8, fl - 40); }
  if (id === 'estufa') {
    r(x0, y0 + 3, w, 3, `rgba(200,80,255,${0.5 + 0.2 * Math.sin(R.t * 2)})`);
    const trays = S.trays.length ? S.trays : [];
    for (let i = 0; i < 12; i++) {
      const col = i % 4, row = Math.floor(i / 4); const tx = x0 + 30 + col * 38 + (row === 1 ? 6 : 0), ty = fl - 54 + row * 16;
      if (row === 2 && col > 1) continue;
      r(tx, ty + 8, 30, 3, '#5a6489');
      const t = trays[i]; if (!t) { if (!S.trays.length || i >= S.trays.length) { r(tx, ty + 8, 30, 3, '#2a3048'); } continue; }
      if (t.crop) { const cr = CROPS[t.crop]; const hgt = Math.max(1, Math.round(7 * Math.min(1, t.g))); for (let p = 0; p < 5; p++) r(tx + 2 + p * 6, ty + 8 - hgt, 3, hgt, t.state === 'estragado' ? '#6b4a2a' : (p % 2 ? cr.color : '#3fae4f')); if (t.state === 'pronto' && Math.sin(R.t * 6) > 0) r(tx + 13, ty - 2, 4, 2, '#ffd34c'); }
    }
  }
  if (id === 'cozinha') { r(x0 + 90, fl - 18, 60, 4, '#8a6a4a'); r(x0 + 96, fl - 14, 3, 14, '#5a4a3a'); r(x0 + 140, fl - 14, 3, 14, '#5a4a3a'); r(x0 + 6, fl - 30, 40, 28, '#3a3f5c'); r(x0 + 10, fl - 26, 12, 8, has('cozinha') ? '#ff6a3a' : '#22283f'); }
  if (id === 'eclusa') { cx.fillStyle = '#5a6489'; cx.beginPath(); cx.arc(x0 + 120, fl - 30, 20, 0, 7); cx.fill(); cx.fillStyle = '#1a1f36'; cx.beginPath(); cx.arc(x0 + 120, fl - 30, 15, 0, 7); cx.fill(); r(x0 + 106, fl - 31, 28, 2, '#8a93ad'); for (let i = 0; i < 2; i++) { r(x0 + 30 + i * 18, fl - 46, 12, 26, '#e8e8f0'); r(x0 + 32 + i * 18, fl - 44, 8, 6, '#4cfcff'); } }
  if (id === 'dormitorio') { for (let i = 0; i < 2; i++) { r(x0 + 30, fl - 18 - i * 24, 70, 5, '#5a6489'); r(x0 + 32, fl - 21 - i * 24, 66, 3, '#7a5ab0'); } }
}
function drawStation(id, target) {
  const st = STATIONS[id], fl = DECKS[st.deck].floor;
  const x = st.x;
  cx.fillStyle = '#0b0f20'; cx.fillRect(x - 8, fl - 26, 16, 24);
  cx.fillStyle = '#4b5a8f'; cx.fillRect(x - 7, fl - 25, 14, 22);
  const sc = stationStatusColor(id);
  cx.fillStyle = '#081018'; cx.fillRect(x - 5, fl - 22, 10, 7);
  cx.fillStyle = sc; cx.fillRect(x - 4, fl - 21, (Math.floor(R.t * 3) % 3) + 3, 1); cx.fillRect(x - 4, fl - 18, 8, 1);
  cx.fillStyle = Math.sin(R.t * 5 + x) > 0 ? sc : '#203040'; cx.fillRect(x - 5, fl - 12, 2, 2);
  cx.fillStyle = '#ffd23f'; cx.fillRect(x + 1, fl - 12, 2, 2);
  if (target) {
    const by = fl - 62 + Math.round(Math.sin(R.t * 6) * 3);
    cx.fillStyle = '#ffd23f'; cx.fillRect(x - 4, by, 9, 3); cx.fillRect(x - 2, by + 3, 5, 2); cx.fillRect(x - 1, by + 5, 3, 2);
    cx.strokeStyle = '#ffd23f'; cx.strokeRect(x - 9.5, fl - 27.5, 19, 26);
  }
}
function drawEVA(c) {
  // tripulante do lado de fora do casco, perto da eclusa
  const x = STATIONS.eclusa.x + 10, y = 252;
  drawChar(c.avatar, 'broken', x, y, 1, 0, 'sad');
  for (let i = 0; i < 6; i++) { const t = (R.t * 2 + i * 0.3) % 1; cx.fillStyle = `rgba(200,240,255,${1 - t})`; cx.fillRect(x + 8 + t * 20, y - 20 - t * 12 + i, 2, 2); }
  cx.strokeStyle = '#cfd6e6'; cx.beginPath(); cx.moveTo(x, y - 18); cx.lineTo(x - 6, 232); cx.stroke();
}

// ---------- minigame de pilotagem (chuva de meteoros) ----------
function drawPilot(pz) {
  spaceBg(); drawStars(180, 1 / 60);
  const sx = VW * 0.15, sy = pz.y * VH;
  drawShipExterior(sx - 30, sy, 0.9, true);
  for (const r of pz.rocks) {
    const x = r.x * VW, y = r.y * VH, rad = Math.max(4, r.r * VH);
    cx.fillStyle = '#5a4a3a'; cx.beginPath(); cx.arc(x, y, rad, 0, 7); cx.fill();
    cx.fillStyle = '#7a6a54'; cx.beginPath(); cx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.5, 0, 7); cx.fill();
    cx.fillStyle = 'rgba(255,140,40,0.6)'; cx.fillRect(x + rad, y - 1, rad * 1.5, 2);
  }
  // radar
  cx.fillStyle = 'rgba(0,30,20,0.8)'; cx.fillRect(VW - 70, 8, 62, 62); cx.strokeStyle = '#38e07b'; cx.strokeRect(VW - 69.5, 8.5, 61, 61);
  for (const r of pz.rocks) { cx.fillStyle = '#38e07b'; cx.fillRect(VW - 70 + r.x * 60, 8 + r.y * 60, 2, 2); }
  cx.fillStyle = '#ffd23f'; cx.fillRect(VW - 70 + 0.15 * 60, 8 + pz.y * 60, 3, 3);
  text(`DESVIE! ${Math.ceil(pz.t)}s  IMPACTOS: ${pz.hits}`, 10, 10, '#ffd23f', 16);
  text('↑ / ↓  (ou W / S) para pilotar', 10, 30, '#bcd3ff', 8);
}

// ---------- telas de fundo ----------
function drawTitleBg(dt) {
  spaceBg(); drawStars(8, dt);
  drawPlanet('mars', 70, 120, 120, R.t * 0.5);
  drawPlanet('pontes', 420, 220, 180, R.t * 0.4);
  // estação orbital perto de Marte
  const sx = 110 + Math.sin(R.t * 0.3) * 6, sy = 70;
  cx.strokeStyle = '#9aa3bb'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(sx, sy, 22, 7, -0.2, 0, 7); cx.stroke(); cx.lineWidth = 1;
  cx.fillStyle = '#cfd6e6'; cx.fillRect(sx - 3, sy - 10, 6, 20);
  drawShipExterior(150 + Math.sin(R.t * 0.7) * 10, 160 + Math.sin(R.t) * 4, 1.1, true);
  // moldura de janela
  cx.fillStyle = '#0b0f20'; cx.fillRect(0, 0, VW, 6); cx.fillRect(0, VH - 34, VW, 34); cx.fillRect(0, 0, 8, VH); cx.fillRect(VW - 8, 0, 8, VH);
  cx.fillStyle = '#1b2650'; cx.fillRect(0, VH - 34, VW, 2); cx.fillStyle = '#2f5bd7'; for (let x = 20; x < VW; x += 60) cx.fillRect(x, VH - 26, 30, 3);
  for (let x = 30; x < VW; x += 60) { cx.fillStyle = Math.sin(R.t * 3 + x) > 0 ? '#2fd7ff' : '#174070'; cx.fillRect(x, VH - 16, 14, 6); }
}
function drawIntroBg(dt) {
  spaceBg(); drawStars(4, dt);
  drawPlanet('earthPoll', VW / 2, VH / 2 + 10, 150, R.t * 0.6);
}
function drawSetupBg(dt) {
  cx.fillStyle = '#0a1a3a'; cx.fillRect(0, 0, VW, VH);
  cx.fillStyle = '#123064'; for (let x = 0; x < VW; x += 12) cx.fillRect(x, 0, 1, VH); for (let y = 0; y < VH; y += 12) cx.fillRect(0, y, VW, 1);
  cx.save(); cx.globalAlpha = 0.9; drawShipExterior(150, 130, 3, false); cx.restore();
}
function drawLaunch(dt, t) {
  const g = cx.createLinearGradient(0, 0, 0, VH); const k = clamp(t / 6, 0, 1);
  g.addColorStop(0, k > 0.5 ? '#05061a' : '#5e4a33'); g.addColorStop(1, k > 0.6 ? '#1a1030' : '#b48c55');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  if (k > 0.4) drawStars(0, 0);
  const ry = 200 - Math.pow(t, 2.2) * 12;
  cx.fillStyle = '#3a3128'; cx.fillRect(0, 222 + t * 30, VW, 60);
  cx.fillStyle = '#ddd'; cx.fillRect(232, ry - 70, 16, 70); cx.fillStyle = '#c33'; cx.fillRect(232, ry - 78, 16, 8); cx.fillRect(236, ry - 84, 8, 6);
  cx.fillStyle = '#1f5bff'; cx.fillRect(234, ry - 40, 12, 3);
  const f = 14 + Math.random() * 8; cx.fillStyle = '#ff9411'; cx.fillRect(234, ry, 12, f); cx.fillStyle = '#ffe066'; cx.fillRect(237, ry, 6, f * 0.6);
  for (let i = 0; i < 12; i++) { cx.fillStyle = `rgba(200,190,180,${0.5 - i * 0.03})`; cx.beginPath(); cx.arc(240 + Math.sin(i * 3 + t) * i * 3, ry + f + i * 8, 6 + i * 1.5, 0, 7); cx.fill(); }
  text('DECOLAGEM', VW / 2, 20, '#ffd34c', 16, 'center');
  text('T+' + t.toFixed(1) + 's', VW / 2, 42, '#bcd3ff', 8, 'center');
}
function drawStationBg(dt) {
  spaceBg(); drawStars(2, dt);
  drawPlanet('gas', 400, 60, 140, R.t * 0.3);
  const cxs = 220, cys = 150;
  cx.strokeStyle = '#9aa3bb'; cx.lineWidth = 6; cx.beginPath(); cx.ellipse(cxs, cys, 90, 28, 0, 0, 7); cx.stroke();
  cx.strokeStyle = '#cfd6e6'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(cxs, cys, 90, 28, 0, 0, 7); cx.stroke(); cx.lineWidth = 1;
  cx.fillStyle = '#cfd6e6'; cx.fillRect(cxs - 8, cys - 50, 16, 100); cx.fillStyle = '#2fd7ff'; for (let i = 0; i < 8; i++) cx.fillRect(cxs - 5, cys - 44 + i * 12, 3, 3);
  for (let i = 0; i < 4; i++) { cx.fillStyle = '#2341a8'; cx.fillRect(cxs - 60 + i * 30, cys - 70, 20, 12); }
  drawShipExterior(cxs + 40, cys + 52, 1.2, false);
  text('ESTAÇÃO ORBITAL PONTE-ALFA', 12, 10, '#9fd0ff', 8);
}
function drawPlanetBg(dt) {
  spaceBg(); drawStars(1, dt);
  drawPlanet('pontes', 180, 150, 220, R.t * 0.5);
  const a = R.t * 0.4; const ox = 180 + Math.cos(a) * 140, oy = 150 + Math.sin(a) * 40;
  if (Math.sin(a) < 0 || true) drawShipExterior(ox, oy, 0.7, false);
  text('ÓRBITA DE PONTES-01b', 12, 10, '#9fd0ff', 8);
}
function drawSurface(dt, colony) {
  const g = cx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#3a6ab0'); g.addColorStop(0.6, '#9cc6e8'); g.addColorStop(1, '#f2d9a8');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  cx.fillStyle = '#fff2c0'; cx.beginPath(); cx.arc(380, 60, 18, 0, 7); cx.fill();
  cx.fillStyle = '#5a8a6a'; for (let x = 0; x < VW; x += 2) cx.fillRect(x, 150 + Math.sin(x * 0.03) * 10, 2, 120);
  cx.fillStyle = '#3f7a54'; for (let x = 0; x < VW; x += 2) cx.fillRect(x, 180 + Math.sin(x * 0.05 + 1) * 8, 2, 100);
  cx.fillStyle = '#2b6ab0'; cx.fillRect(0, 214, VW, 4); cx.fillStyle = '#5aa0e0'; for (let x = 0; x < VW; x += 16) cx.fillRect((x + R.t * 10) % VW, 215, 6, 1);
  cx.fillStyle = '#6a9a4a'; cx.fillRect(0, 218, VW, 52);
  if (colony) {
    cx.fillStyle = '#e8e8f0'; cx.beginPath(); cx.arc(120, 220, 26, Math.PI, 0); cx.fill(); cx.fillStyle = '#2fd7ff'; cx.fillRect(110, 204, 20, 4);
    cx.fillStyle = '#2341a8'; cx.fillRect(170, 200, 24, 12); cx.fillRect(200, 200, 24, 12);
    drawShipExterior(320, 200, 1, false);
    const a = alive(); a.forEach((c, i) => drawChar(c.avatar, 'helmet', 150 + i * 22, 240, 1, Math.floor(R.t * 4) + i, 'happy'));
  }
}

// ---------- seta-guia: aponta o próximo objetivo, mesmo fora da tela ----------
function guideTarget() {
  if (!S) return null;
  const next = typeof assistNext === 'function' ? assistNext() : null;
  if (S.scene === 'earth' && U.earth && !U.comms) {
    const x = next && next.go && next.go.earth != null ? next.go.earth : rocketX();
    return { x, y: GROUND - 64, cam: R.earthCam };
  }
  if (S.scene === 'ship') {
    const ev = S.event; let st = null, drawn = false;
    if (ev && ev.phase === 'run') {
      const cs = curStep(ev) || ev.steps.find(s => !s.done && s.station && s.optional);
      if (cs && cs.station) { st = cs.station; drawn = true; }
    } else if (next && next.go && next.go.st) st = next.go.st;
    if (!st || !STATIONS[st]) return null;
    const P = STATIONS[st];
    return { x: P.x, y: DECKS[P.deck].floor - 62, cam: R.camX, drawn };
  }
  if (S.scene === 'colony' && typeof CBUILD !== 'undefined' && next && next.go && next.go.b && CBUILD[next.go.b]) return { x: CBUILD[next.go.b].x, y: CGROUND - 80, cam: R.colCam || 0 };
  return null;
}
function drawGuide() {
  const g = guideTarget(); if (!g) return;
  const sx = Math.round(g.x - g.cam), bob = Math.round(Math.sin(R.t * 6) * 3);
  const N = 11; // seta grande (11 px de altura) com contorno preto
  const tri = (x, y, dir, col) => { // dir 1 = direita, -1 = esquerda, 0 = para baixo
    cx.fillStyle = col;
    for (let i = 0; i < N; i++) {
      const h = 2 * (N - 1 - i) + 1;
      if (dir === 0) cx.fillRect(x - (N - 1 - i), y + i, h, 1);
      else cx.fillRect(dir > 0 ? x - (N - 1) + i : x + (N - 1) - i, y - (N - 1 - i), 1, h);
    }
  };
  const draw = (x, y, dir) => { tri(x + 2, y + 2, dir, 'rgba(0,0,0,0.75)'); tri(x, y, dir, '#ffd23f'); tri(x, y + (dir === 0 ? 1 : 0), dir, (Math.floor(R.t * 3) % 2) ? '#ffd23f' : '#fff6a8'); };
  if (sx < 20 || sx > VW - 20) {
    const right = sx > VW - 20, ex = right ? VW - 8 + bob : 8 - bob, ey = clamp(g.y + 30, 34, VH - 34);
    draw(ex, ey, right ? 1 : -1);
  } else if (!g.drawn) draw(sx, g.y - 8 + bob, 0);
}
