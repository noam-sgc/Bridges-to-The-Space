// ============================================================
//  "FOTOS" DOS PLANETAS — imagens realistas geradas no navegador
//  (esfera iluminada pela cor da própria estrela, relevo, oceanos,
//  gelo, lava, nuvens e brilho da atmosfera). Não há fotos reais
//  desses exoplanetas: são impressões baseadas nos dados.
// ============================================================
'use strict';

const PLANET_LOOK = {
  //       paleta do solo (baixo → alto)                   mar      nuvens  atmosfera     luz da estrela  extras
  pontes:  { pal: ['#1d4f8c', '#2d6fb0', '#c9b27a', '#4f8a3a', '#2f6a2a', '#8a7a5a', '#f2f2f2'], sea: 0.48, cloud: 0.55, atm: '#7fb8ff', light: '#fff1d8', seed: 7 },
  proxb:   { pal: ['#3a2218', '#5a3424', '#7a4a32', '#93603e', '#a8774e', '#6a4030'], cloud: 0, atm: null, light: '#ff9a6a', seed: 11, craters: 1 },
  trap1e:  { pal: ['#24364a', '#2f4c66', '#6a6f78', '#8a8070', '#c9d6e0', '#eef4f8'], sea: 0.42, cloud: 0.25, atm: '#ff9f80', light: '#ff7a50', seed: 23 },
  k442b:   { pal: ['#1c3f5e', '#2a5c7a', '#6e7f52', '#4a6a3a', '#7a6a4a', '#d8d8d0'], sea: 0.5, cloud: 0.5, atm: '#a8c8ff', light: '#ffd0a0', seed: 31 },
  lhs1140b:{ pal: ['#7aa6c8', '#a8c8e0', '#d6e6f2', '#eef6fb', '#ffffff'], cloud: 0.2, atm: '#c8a0ff', light: '#ff8a60', seed: 41, cracks: 1 },
  teeb:    { pal: ['#4a2a1a', '#6a3a22', '#8a5030', '#a86a40', '#c08050'], cloud: 0.1, atm: '#ffb090', light: '#ff7048', seed: 53, locked: 1 },
  k452b:   { pal: ['#24507a', '#3a6a90', '#b8a070', '#8a7a48', '#6a6a3a', '#e8e0d0'], sea: 0.4, cloud: 0.7, atm: '#cfe0ff', light: '#fff4e0', seed: 61 },
  cnc55e:  { pal: ['#0e0b0a', '#1c1512', '#2a1f1a', '#3a2a22'], cloud: 0, atm: '#ff6a20', light: '#fff0d0', seed: 71, lava: 1 },
};

const _ppCache = {};
function planetPic(id, size) {
  size = size || 128;
  const key = id + ':' + size; if (_ppCache[key]) return _ppCache[key];
  const look = PLANET_LOOK[id] || PLANET_LOOK.proxb;
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const cx = cv.getContext('2d'); const img = cx.createImageData(size, size); const D = img.data;
  // ruído 3D com semente
  const seed = look.seed;
  const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const sm = t => t * t * (3 - 2 * t);
  const noise = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
    const l = (a, b, t) => a + (b - a) * t;
    const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
    return l(l(l(c(0, 0, 0), c(1, 0, 0), xf), l(c(0, 1, 0), c(1, 1, 0), xf), yf), l(l(c(0, 0, 1), c(1, 0, 1), xf), l(c(0, 1, 1), c(1, 1, 1), xf), yf), zf);
  };
  const fbm = (x, y, z, o) => { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f, z * f); n += a; a *= 0.5; f *= 2.03; } return s / n; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const pal = look.pal.map(hex), lightC = hex(look.light).map(v => 0.45 + 0.55 * v / 255), atm = look.atm ? hex(look.atm) : null;
  const palAt = t => { t = Math.max(0, Math.min(0.999, t)) * (pal.length - 1); const i = Math.floor(t), f = t - i; const a = pal[i], b = pal[Math.min(pal.length - 1, i + 1)]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
  const R = size * 0.42, C = size / 2;
  const Lx = -0.62, Ly = -0.42, Lz = 0.66; // luz vindo de cima à esquerda
  const tilt = 0.35, ct = Math.cos(tilt), st = Math.sin(tilt);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const k = (j * size + i) * 4;
    const dx = (i + 0.5 - C) / R, dy = (j + 0.5 - C) / R, d2 = dx * dx + dy * dy;
    let r = 0, g = 0, b = 0;
    // fundo: espaço com estrelas fracas
    const sh = hash(i, j, 999); if (sh > 0.996) { const v = 120 + sh * 135 * (sh - 0.996) / 0.004; r = g = b = v; }
    if (d2 <= 1) {
      const nz = Math.sqrt(1 - d2);
      // gira a esfera (eixo inclinado) para a textura não ficar "chapada"
      const px = dx * ct - dy * st, py = dx * st + dy * ct, pz = nz;
      const lit = dx * Lx + dy * Ly + nz * Lz;
      const day = Math.max(0, Math.min(1, (lit + 0.12) / 0.5));
      let h = fbm(px * 2.2 + 5, py * 2.2 + 3, pz * 2.2 + 1, 6);
      let col;
      if (look.locked) { // rotação travada: lado da estrela queimado, lado escuro gelado
        const side = dx * Lx + dy * Ly + nz * Lz;
        col = side > 0.05 ? palAt(h * 1.7 - 0.35) : [200 + h * 40, 215 + h * 30, 235];
        if (Math.abs(side - 0.05) < 0.08) { const t = (side + 0.03) / 0.16; col = [col[0] * t + 210 * (1 - t), col[1] * t + 220 * (1 - t), col[2] * t + 235 * (1 - t)]; }
      } else if (look.sea != null && h < look.sea) {
        const dpt = h / look.sea; col = [pal[0][0] * (0.6 + 0.4 * dpt), pal[0][1] * (0.6 + 0.4 * dpt), pal[0][2] * (0.7 + 0.3 * dpt)];
        if (dpt > 0.92) col = [col[0] * 0.5 + pal[1][0] * 0.5, col[1] * 0.5 + pal[1][1] * 0.5, col[2] * 0.5 + pal[1][2] * 0.5];
      } else col = palAt(look.sea != null ? 0.2 + (h - look.sea) / (1 - look.sea) * 0.8 : h * 1.15 - 0.05);
      // calotas polares
      { const cap = Math.abs(py) - 0.84 - (fbm(px * 6, py * 6, pz * 6, 3) - 0.5) * 0.35; if (look.sea != null && cap > 0) { const t = Math.min(1, cap * 12); col = [col[0] + (236 - col[0]) * t, col[1] + (242 - col[1]) * t, col[2] + (248 - col[2]) * t]; } }
      if (look.craters) { const cr = fbm(px * 7, py * 7, pz * 7, 3); if (cr > 0.66) col = col.map(v => v * 0.72); if (cr > 0.62 && cr < 0.66) col = col.map(v => Math.min(255, v * 1.25)); }
      if (look.cracks) { const cr = Math.abs(fbm(px * 4, py * 4, pz * 4, 4) - 0.5); if (cr < 0.025) col = [150, 120, 100]; }
      let em = 0;
      if (look.lava) { const cr = Math.abs(fbm(px * 3.5, py * 3.5, pz * 3.5, 5) - 0.5); em = Math.max(0, 1 - cr / 0.07); col = col.map(v => v); }
      // nuvens
      let cl = 0;
      if (look.cloud) { const c = fbm(px * 3 + 40, py * 5 + 40, pz * 3 + 40, 5); cl = Math.max(0, Math.min(1, (c - (1 - look.cloud) * 0.75 - 0.18) * 3)); }
      col = [col[0] + (245 - col[0]) * cl, col[1] + (245 - col[1]) * cl, col[2] + (248 - col[2]) * cl];
      // luz da estrela + brilho do mar
      const shade = 0.06 + day * 0.94;
      r = col[0] * shade * lightC[0]; g = col[1] * shade * lightC[1]; b = col[2] * shade * lightC[2];
      if (look.sea != null && h < look.sea && cl < 0.3) { const hx = Lx, hy = Ly, hz = Lz + 1; const hn = Math.hypot(hx, hy, hz); const spec = Math.pow(Math.max(0, (dx * hx + dy * hy + nz * hz) / hn), 60) * 160 * day; r += spec; g += spec; b += spec * 0.95; }
      if (em) { const glow = em * (0.55 + 0.45 * (1 - day)); r += 255 * glow; g += 110 * glow; b += 20 * glow; }
      // borda da atmosfera
      if (atm) { const rim = Math.pow(1 - nz, 2.2) * (0.25 + day * 0.9); r += atm[0] * rim * 0.7; g += atm[1] * rim * 0.7; b += atm[2] * rim * 0.7; }
      const limb = 0.75 + 0.25 * nz; r *= limb; g *= limb; b *= limb;
    } else if (atm && d2 < 1.16) { // halo da atmosfera fora do disco
      const t = 1 - (Math.sqrt(d2) - 1) / 0.077; const a = Math.max(0, t) ** 2 * Math.max(0.1, ((dx * Lx + dy * Ly) / Math.sqrt(d2) + 0.3));
      r += atm[0] * a * 0.75; g += atm[1] * a * 0.75; b += atm[2] * a * 0.75;
    }
    const q = v => Math.round(Math.min(255, v) / 24) * 24; // poucas cores, cara de pixel art
    D[k] = q(r); D[k + 1] = q(g); D[k + 2] = q(b); D[k + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  return (_ppCache[key] = cv.toDataURL());
}
// <img> pronta para os painéis
// pixel art: desenha em baixa resolução (≈ 1/3) e o CSS amplia sem suavizar
function planetImg(id, size, cls) { return `<img class="ppic ${cls || ''}" src="${planetPic(id, Math.max(32, Math.round(size / 3)))}" alt="" draggable="false">`; }
