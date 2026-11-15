// ============================================================
//  INTERFACE — telas HTML sobre o canvas
// ============================================================
'use strict';

const U = {
  screen: 'title', panel: null, tab: null, setupStep: 0, avatarDraft: null, paintColor: '#ff0734', paintOn: false,
  introIdx: 0, introT: 0, earth: null, comms: 0, launchT: 0, cook: [], autopilot: null, cache: {}, lastNarr: null,
  lastToast: null, me: 'cmd', avatarDirty: true, setupDirty: true, settingsOpen: false, confirmQuit: false, lobby: null,
};
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const J = o => esc(JSON.stringify(o));

function act(type, p) {
  Sfx.click();
  if (Net.role === 'client') Net.send({ t: 'act', type, p });
  else applyAction(type, p, U.me);
}
function me() { return S ? crewById(U.me) : null; }

const _spriteURL = new Map();
function spriteURL(av, outfit = 'suit', mood = 'happy', scale = 3) {
  const key = avatarKey(av) + outfit + mood + scale;
  if (_spriteURL.has(key)) return _spriteURL.get(key);
  const c = document.createElement('canvas'); c.width = SPR_W * scale; c.height = SPR_H * scale;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(getSprite(av, outfit, mood, 0), 0, 0, c.width, c.height);
  const url = c.toDataURL();
  if (_spriteURL.size > 300) _spriteURL.clear();
  _spriteURL.set(key, url); return url;
}
function bar(v, max, cls = '', inverse = false) {
  const p = clamp(max ? v / max : 0, 0, 1);
  const lvl = inverse ? (p > 0.7 ? 'bad' : p > 0.4 ? 'warn' : 'ok') : (p < 0.2 ? 'bad' : p < 0.4 ? 'warn' : 'ok');
  return `<span class="bar ${cls} ${lvl}"><i style="width:${(p * 100).toFixed(1)}%"></i></span>`;
}
// o foco que fica num botão depois do clique faria Espaço/Enter apertarem o botão de novo em vez de agir no jogo
function dropFocus() { const a = document.activeElement; if (a && a !== document.body && !['INPUT', 'SELECT', 'TEXTAREA'].includes(a.tagName)) a.blur(); }
function setHTML(id, html) {
  if (id === 'modal' && U.modalOverride) html = U.modalOverride; // menu/config da barra rápida por cima de tudo
  if (U.cache[id] === html) return;
  const el = document.getElementById(id);
  // não redesenha enquanto o jogador arrasta um controle deslizante ou escolhe numa lista (senão o controle "escapa" do mouse)
  const ae = document.activeElement;
  if (el && ae && el.contains(ae) && ((U.dragging && ae.type === 'range') || ae.tagName === 'SELECT')) return;
  U.cache[id] = html;
  if (el) {
    // guarda a rolagem dos painéis: o conteúdo é trocado a cada atualização e o scroll voltaria ao topo
    const SCR = '.panel, .scroll, .evp, .stage-panel, .modal-bg, .side, .report-list, .evlog';
    const keep = []; el.querySelectorAll(SCR).forEach((n, i) => { if (n.scrollTop > 0) keep.push([i, n.className, n.scrollTop]); });
    const top0 = el.scrollTop;
    el.innerHTML = pixelEmoji(I18n.dom(html));
    if (keep.length) { const list = el.querySelectorAll(SCR); for (const [i, cls, t] of keep) { const n = list[i] && list[i].className === cls ? list[i] : null; if (n) n.scrollTop = t; } }
    if (top0) el.scrollTop = top0;
    const od = U.openDet; // mantém abertas as seções "Mais opções" etc. entre atualizações
    if (od) el.querySelectorAll('details').forEach(d => { const s = d.querySelector('summary'); if (s && od[s.textContent.trim()]) d.open = true; });
  }
}
document.addEventListener('toggle', e => { const d = e.target; if (d && d.tagName === 'DETAILS' && typeof U !== 'undefined') { const s = d.querySelector('summary'); if (s) (U.openDet = U.openDet || {})[s.textContent.trim()] = d.open; } }, true);

// ---------- ícones pixelados: cada emoji vira uma imagem 12×12 ampliada sem suavização ----------
const EMOJI_RE = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F?))*\uFE0F?/gu;
const _pxEmoji = new Map();
function pxEmojiURL(e) {
  if (_pxEmoji.has(e)) return _pxEmoji.get(e);
  const N = 12, c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d');
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${N - 1}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  g.fillText(e, N / 2, N / 2 + 1);
  const img = g.getImageData(0, 0, N, N), d = img.data;
  for (let i = 0; i < d.length; i += 4) { // sem meio-tons: alfa binário e cores reduzidas
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    const a = d[i + 3] / 255; d[i + 3] = 255;
    for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, Math.round((d[i + k] / a) / 40) * 40);
  }
  g.putImageData(img, 0, 0);
  const url = c.toDataURL();
  _pxEmoji.set(e, url); return url;
}
function pixelEmoji(html) {
  if (!html || !EMOJI_RE.test(html)) return html;
  EMOJI_RE.lastIndex = 0;
  const tpl = document.createElement('template'); tpl.innerHTML = html;
  const walk = n => {
    if (n.nodeType === 3) {
      const v = n.nodeValue; EMOJI_RE.lastIndex = 0; if (!EMOJI_RE.test(v)) return; EMOJI_RE.lastIndex = 0;
      const frag = document.createDocumentFragment(); let last = 0, m;
      while ((m = EMOJI_RE.exec(v))) {
        if (m.index > last) frag.appendChild(document.createTextNode(v.slice(last, m.index)));
        const im = document.createElement('img'); im.className = 'pxe'; im.alt = m[0]; im.src = pxEmojiURL(m[0]); frag.appendChild(im);
        last = m.index + m[0].length;
      }
      if (last < v.length) frag.appendChild(document.createTextNode(v.slice(last)));
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'SELECT' && n.tagName !== 'OPTION') [...n.childNodes].forEach(walk);
  };
  [...tpl.content.childNodes].forEach(walk);
  return tpl.innerHTML;
}

// =============== TELAS SEM PARTIDA ===============
function titleScreen() {
  const cr = Save.data.credits;
  return `<div class="title-screen">
    <div class="tbox tl"><div class="lbl">TERRA</div><div class="red">⚠ INABITÁVEL</div><div class="sep"></div><div class="lbl">MARTE</div><div class="green">✓ COLÔNIA ATIVA</div></div>
    <div class="tbox tc"><p>A Terra está se tornando inabitável.<br>Os humanos já conquistaram colônias em <span class="orange">Marte</span>,<br>e agora precisamos de um novo lar.<br>Nosso destino é desconhecido...<br>...mas uma esperança nos guia: <span class="cyan">Pontes01</span>.</p></div>
    <div class="tbox tr"><div class="lbl cyan">▣ MISSÃO ATUAL</div><div class="small">Explorar o planeta</div><div class="cyan">Pontes01</div></div>
    <div class="logo"><h1>PONTES<span>01</span></h1><div class="sub">— EXPLORAÇÃO ESPACIAL —</div></div>
    <div class="menu">
      ${U.playMenu ? `<button class="mbtn" data-ui="journey">✦ NOVA JORNADA</button>
      ${(() => { const sv = GameSave.summary(); return sv ? `<button class="mbtn" data-ui="continueGame">▶ ${esc(L('CONTINUAR'))}</button>` : ''; })()}
      ${GameSave.list().length ? `<button class="mbtn" data-ui="saves">📂 ${esc(L(K('JOGOS SALVOS', 'SAVED GAMES', 'PARTIDAS GUARDADAS')))} <small>${GameSave.list().length}</small></button>` : ''}
      <button class="mbtn" data-ui="playMenu">◀ ${esc(L('VOLTAR'))}</button>` : `<button class="mbtn primary" data-ui="playMenu">▶ ${esc(L('JOGAR'))}</button>
      <button class="mbtn" data-ui="lobby">👥 MULTIPLAYER</button>
      <button class="mbtn" data-ui="avatar">🧑‍🚀 CRIAR AVATAR</button>
      <button class="mbtn" data-ui="quiz">🛰 ${esc(L(K('QUIZ', 'QUIZ', 'QUIZ')))}</button>
      <button class="mbtn" data-ui="shop">✦ LOJA <small>${cr} créditos</small></button>
      <button class="mbtn" data-ui="settings">⚙ CONFIGURAÇÕES</button>`}
    </div>
    <div class="tfoot">UM NOVO MUNDO NOS ESPERA...<b>PONTES01</b></div>
  </div>`;
}
function journeyScreen() {
  return `<div class="panel center wide">
    <h2>NOVA JORNADA</h2>
    <p class="muted">Escolha o tamanho da expedição. Os 6 tripulantes que não forem jogadores são controlados por bots.</p>
    <div class="cards two">
      <button class="card big" data-ui="startGame" data-arg="completa"><h3>🚀 Jornada Completa</h3><p>≈ 30 dias de viagem · 9 desafios · as 5 etapas da campanha.</p><p class="muted">Cada dia dura 30 s. Recomendado para a experiência completa.</p></button>
      <button class="card big quick" data-ui="startGame" data-arg="curta"><i class="qtag">⚡ PARTIDA RÁPIDA</i><h3>⚡ Jornada Curta</h3><p>≈ 12 dias · 4 desafios.</p><p class="muted">Para jogar rápido: se errar um desafio, o jogo mostra a solução.</p></button>
    </div>
    <div class="row"><button class="btn" data-ui="title">◀ Voltar</button></div>
  </div>`;
}
function historyScreen() {
  return `<div class="panel center wide scroll">
    <h2>HISTÓRIA</h2>
    ${NARRATION_INTRO.map(t => `<p>${esc(L(t))}</p>`).join('')}
    <h3>As 5 etapas</h3>
    <ol><li><b>Preparação:</b> montar a expedição com verba limitada.</li><li><b>Partida e viagem:</b> controlar a nave e enfrentar os problemas espaciais.</li><li><b>Exploração científica:</b> analisar dados reais de exoplanetas.</li><li><b>O novo mundo:</b> investigar Pontes-01b e se adaptar.</li><li><b>Migração:</b> escolher onde a humanidade vai recomeçar.</li></ol>
    <p class="quote">“Na Terra, a atmosfera regula a temperatura de graça. Numa nave, tudo isso tem custo. Por isso é mais fácil manter a Terra habitável do que habitar outro planeta.”</p>
    <div class="row"><button class="btn" data-ui="title">◀ Voltar</button></div>
  </div>`;
}
function settingsScreen(inGame) {
  const st = Save.data.settings;
  return `<div class="panel center">
    <h2>CONFIGURAÇÕES</h2>
    <div class="row"><button class="btn ${st.mute ? '' : 'on'}" data-ui="qAudio">${st.mute ? '🔇' : '🔊'} ${esc(L(K('Áudio (música e voz)', 'Audio (music and voice)', 'Audio (música y voz)')))}: <b>${esc(L(st.mute ? 'DESLIGADO' : 'LIGADO'))}</b></button><button class="btn ${st.sfxOff ? '' : 'on'}" data-ui="qSfx">${st.sfxOff ? '🔕' : '🔔'} ${esc(L(K('Efeitos sonoros', 'Sound effects', 'Efectos de sonido')))}: <b>${esc(L(st.sfxOff ? 'DESLIGADO' : 'LIGADO'))}</b></button></div>
    <label class="field">Música <input type="range" min="0" max="1" step="0.05" value="${st.music}" data-set="music"></label>
    <label class="field">Efeitos <input type="range" min="0" max="1" step="0.05" value="${st.sfx}" data-set="sfx"></label>
    <label class="check"><input type="checkbox" data-set="narration" ${st.narration ? 'checked' : ''}> Narração por voz</label>
    <label class="field">${esc(L('Voz'))} <select data-set="voice"><option value="">${esc(L('Automática (a mais natural)'))}</option>${Narrator.voices().map(v => `<option value="${esc(v.name)}" ${(st.voices || {})[I18n.lang] === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select> <button class="btn small" data-ui="voiceTest">🔊</button></label>
    <label class="field">${esc(L('Velocidade da voz'))} <input type="range" min="0.7" max="1.3" step="0.05" value="${st.voiceRate || 1}" data-set="voiceRate"></label>
    <label class="field">🔈 ${esc(L(K('Volume da narração', 'Narration volume', 'Volumen de la narración')))} <input type="range" min="0" max="1" step="0.05" value="${st.voiceVol != null ? st.voiceVol : 1}" data-set="voiceVol"></label>
    <label class="check"><input type="checkbox" data-set="curios" ${st.curios !== false ? 'checked' : ''}> ${esc(L('Curiosidades do computador de bordo (texto e voz)'))}</label>
    <label class="check"><input type="checkbox" data-set="showDice" ${st.showDice ? 'checked' : ''}> Modo professor: mostrar as rolagens dos dados</label>
    <div class="row"><button class="btn" data-ui="${inGame ? 'closePanel' : 'title'}">◀ Voltar</button></div>
  </div>`;
}
function shopScreen() {
  const cats = [['lazer', 'Lazer (moral)'], ['produtividade', 'Produtividade (eficiência)'], ['upgrade', 'Peças e upgrades']];
  const b = shopBonus();
  return `<div class="panel center wide scroll">
    <h2>LOJA <span class="credits">✦ ${Save.data.credits} créditos</span></h2>
    <p class="muted">${L(K(`Cada fase vencida dá pontos. Itens de lazer aumentam a <b>moral</b>; itens de produtividade aumentam a <b>eficiência</b> da tripulação. Bônus atuais: moral +${b.moral}% · eficiência +${b.eff}%.`, `Every phase you clear gives points. Leisure items raise crew <b>morale</b>; productivity items raise crew <b>efficiency</b>. Current bonuses: morale +${b.moral}% · efficiency +${b.eff}%.`, `Cada fase superada da puntos. Los artículos de ocio aumentan la <b>moral</b>; los de productividad aumentan la <b>eficiencia</b> de la tripulación. Bonos actuales: moral +${b.moral}% · eficiencia +${b.eff}%.`))}</p>
    ${cats.map(([c, n]) => `<h3>${n}</h3><div class="shopgrid">${SHOP.filter(i => i.cat === c).map(i => {
      const owned = Save.owns(i.id);
      return `<div class="shopitem ${owned ? 'owned' : ''}"><b>${esc(i.name)}</b><span>${esc(i.desc)}</span>${owned ? `<em>✔ ${esc(L(K('adquirido', 'purchased', 'adquirido')))}</em>` : `<button class="btn small" data-ui="buy" data-arg="${i.id}" ${Save.data.credits < i.price ? 'disabled' : ''}>✦ ${i.price}</button>`}</div>`;
    }).join('')}</div>`).join('')}
    <div class="row"><button class="btn" data-ui="title">◀ Voltar</button></div>
  </div>`;
}

// ---------- criador de avatar ----------
function avatarScreen() {
  const a = U.avatarDraft;
  const sw = (key, list, cur, isPair) => list.map((c, i) => `<button class="sw ${cur === i ? 'on' : ''}" style="background:${isPair ? c[0] : c}" data-ui="av" data-arg="${key}:${i}"></button>`).join('');
  const swc = (key, list, cur) => list.map(c => `<button class="sw ${cur === c ? 'on' : ''}" style="background:${c}" data-ui="avc" data-arg="${key}:${c}"></button>`).join('');
  const opts = (key, obj, cur, names) => Object.keys(obj).map(k => `<button class="chip ${cur === k ? 'on' : ''}" data-ui="avs" data-arg="${key}:${k}">${names[k] || k}</button>`).join('');
  const hairNames = { careca: 'Careca', lateral: 'Repartido', curto: 'Curto', franja: 'Franja', longo: 'Longo', moicano: 'Moicano', blackpower: 'Black power', coque: 'Coque', raspado: 'Raspado', topete: 'Topete', rabo: 'Rabo de cavalo', trancas: 'Tranças', chanel: 'Chanel', cacheado: 'Cacheado', chiquinhas: 'Maria-chiquinha', ondulado: 'Ondulado', franjaLonga: 'Longo com franja' };
  const accNames = { nenhum: 'Nenhum', oculos: 'Óculos escuros', oculosRedondos: 'Óculos', barba: 'Barba', bigode: 'Bigode', cicatriz: 'Cicatriz', fone: 'Headset', bone: 'Boné', bandana: 'Bandana', sardas: 'Sardas', laco: 'Laço', tiara: 'Tiara', flor: 'Flor', presilha: 'Presilha' };
  return `<div class="avatar-screen">
    <div class="av-topbtns"><button class="btn" data-ui="avRandom">🎲 Aleatório</button><button class="btn primary" data-ui="avSave">✔ Salvar</button><button class="btn" data-ui="title">◀ Voltar <kbd>Esc</kbd></button></div>
    <div class="av-left">
      <h2>CRIADOR DE AVATAR</h2>
      <div class="previews two"><div><canvas id="pv-civil" width="80" height="124"></canvas><small>${esc(L('Terra (sem traje)'))}</small></div><div><canvas id="pv-suit" width="80" height="124"></canvas><small>${esc(L('Nave (traje)'))}</small></div></div>
      <p class="muted small">${esc(L('O capacete é padrão para toda a tripulação.'))}</p>
    </div>
    <div class="av-right scroll">
      <label class="field">Nome <input id="av-name" maxlength="14" value="${esc(a.name)}"></label>
      <div class="grp"><b>Estilo rápido</b><button class="chip" data-ui="avPreset" data-arg="fem">♀ Feminino</button><button class="chip" data-ui="avPreset" data-arg="masc">♂ Masculino</button><button class="chip" data-ui="avRandom">🎲 Aleatório</button></div>
      <div class="grp"><b>Pele</b>${sw('skin', SKIN_TONES, a.skin)}</div>
      <div class="grp"><b>Cabelo</b>${opts('hair', HAIR, a.hair, hairNames)}</div>
      <div class="grp"><b>Cor do cabelo</b>${sw('hairColor', HAIR_COLORS, a.hairColor)}</div>
      <div class="grp"><b>Olhos</b>${sw('eyes', EYE_COLORS, a.eyes, true)}</div>
      <div class="grp"><b>Rosto</b><button class="chip ${a.lashes ? 'on' : ''}" data-ui="avt" data-arg="lashes">Cílios</button><button class="chip ${a.blush ? 'on' : ''}" data-ui="avt" data-arg="blush">Blush</button><button class="chip ${a.earrings ? 'on' : ''}" data-ui="avt" data-arg="earrings">Brincos</button></div>
      <div class="grp"><b>Batom</b><button class="chip ${!a.lips ? 'on' : ''}" data-ui="avc" data-arg="lips:">Nenhum</button>${swc('lips', LIP_COLORS, a.lips)}</div>
      <div class="grp"><b>Acessório</b>${opts('acc', ACCESSORIES, a.acc, accNames)}</div>
      <div class="grp"><b>Cor do acessório</b>${swc('accColor', ['#e03030', '#2f7fff', '#ffd34c', '#2fa84f', '#7a3cff', '#151515', '#ffffff'], a.accColor)}</div>
      <div class="grp"><b>Camiseta</b>${sw('shirt', CLOTH_COLORS, a.shirt)} <button class="chip ${a.longSleeve ? 'on' : ''}" data-ui="avt" data-arg="longSleeve">Manga longa</button></div>
      <div class="grp"><b>Parte de baixo</b>${[['calca', 'Calça'], ['short', 'Short'], ['saia', 'Saia'], ['vestido', 'Vestido']].map(([k, n]) => `<button class="chip ${avBottom(a) === k ? 'on' : ''}" data-ui="avs" data-arg="bottom:${k}">${n}</button>`).join('')}</div>
      <div class="grp"><b>Cor da calça / saia</b>${sw('pants', CLOTH_COLORS, a.pants)}</div>
      <div class="grp"><b>Traje espacial</b>${sw('suit', SUIT_COLORS, a.suit)}</div>
      <div class="grp"><b>Mochila de O₂</b>${swc('pack', ['#ff9411', '#e8e8e8', '#38e07b', '#ff4fa3', '#24c3ff', '#ffd34c'], a.pack)}</div>
      <div class="grp"><b>Insígnia</b>${swc('badge', ['#20a04f', '#e03030', '#2f7fff', '#ffd34c', '#7a3cff'], a.badge)}</div>
    </div>
  </div>`;
}
function drawAvatarPreviews() {
  const a = U.avatarDraft; if (!a) return;
  const frame = Math.floor(R.t * 6) % 4;
  [['pv-civil', 'civil'], ['pv-suit', 'suit']].forEach(([id, of]) => {
    const c = document.getElementById(id); if (!c) return;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
    g.drawImage(getSprite(a, of, 'happy', [0, 1, 0, 2][frame]), 0, 0, c.width, c.height);
  });
  return;
  const p = document.getElementById('paint'); if (!p) return;
  const g = p.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#1a2040'; g.fillRect(0, 0, 200, 310);
  for (let y = 0; y < SPR_H; y++) for (let x = 0; x < SPR_W; x++) if ((x + y) % 2) { g.fillStyle = '#20284c'; g.fillRect(x * 10, y * 10, 10, 10); }
  g.drawImage(getSprite(a, 'suit', 'happy', 0), 0, 0, 200, 310);
  g.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let x = 0; x <= SPR_W; x++) { g.beginPath(); g.moveTo(x * 10 + 0.5, 0); g.lineTo(x * 10 + 0.5, 310); g.stroke(); }
  for (let y = 0; y <= SPR_H; y++) { g.beginPath(); g.moveTo(0, y * 10 + 0.5); g.lineTo(200, y * 10 + 0.5); g.stroke(); }
}

// ---------- lobby multiplayer ----------
const arcaHint = n => K('Nave-' + n + ': quem entra primeiro nessa nave vira o Comandante dela; os próximos entram na tripulação. Cada Nave faz a sua própria jornada (até 28 pessoas no total).', 'Spaceship ' + n + ': whoever enters this ship first becomes its Commander; the next ones join the crew. Each Spaceship makes its own journey (up to 28 people in total).', 'Nave-' + n + ': quien entra primero en esta nave se vuelve su Comandante; los siguientes se unen a la tripulación. Cada Nave hace su propio viaje (hasta 28 personas en total).');
const shipLabel = n => L(K('Nave-' + n, 'Spaceship ' + n, 'Nave-' + n));
const arcaJoinLabel = n => K('Entrar na Nave-' + n, 'Join Spaceship ' + n, 'Entrar en la Nave-' + n);
const roleChips = LB => `<div class="grp"><b>${esc(L(K('Sua função', 'Your role', 'Su función')))}</b><button class="chip ${!LB.role ? 'on' : ''}" data-ui="netRole" data-arg="">${esc(L(K('Qualquer', 'Any', 'Cualquiera')))}</button>${ROLES.map(r => `<button class="chip ${LB.role === r.id ? 'on' : ''}" data-ui="netRole" data-arg="${r.id}">${esc(L(r.short))}</button>`).join('')}</div>`;
const shipChips = LB => `<div class="grp"><b>${esc(L(K('Escolha sua Nave', 'Choose your Spaceship', 'Elija su Nave')))}</b>${[1, 2, 3, 4].map(n => `<button class="chip ${(LB.ship || 1) === n ? 'on' : ''}" data-ui="netShip" data-arg="${n}">${esc(shipLabel(n))}</button>`).join('')}</div><p class="small muted">${esc(L(arcaHint(LB.ship || 1)))}</p>`;
function lobbyScreen() {
  const LB = U.lobby || {};
  if (Net.role === 'host' && Net.room) {
    return `<div class="panel center wide">
      <h2>SALA <span class="code">${esc(Net.room)}</span> · ${esc(shipLabel(Net.mySh || 1))}</h2>
      <p class="small yellow">${esc(L(K('Você é o Comandante da Nave-' + (Net.mySh || 1) + '.', 'You are the Commander of Spaceship ' + (Net.mySh || 1) + '.', 'Usted es el Comandante de la Nave-' + (Net.mySh || 1) + '.')))}</p>
      <p class="muted">Passe o código para até 6 amigos. Cada um assume um tripulante; os lugares vazios ficam com bots.</p>
      ${!Net.relay ? `<p class="small cyan">${esc(L(K('Outras Naves: quem entrar com este código escolhendo outra Nave vira o Comandante dela (jornada própria). Até 28 pessoas: 4 Naves × (Comandante + 6).', 'Other Spaceships: whoever joins with this code and picks another Spaceship becomes its Commander (own journey). Up to 28 people: 4 Spaceships × (Commander + 6).', 'Otras Naves: quien entre con este código eligiendo otra Nave se vuelve su Comandante (viaje propio). Hasta 28 personas: 4 Naves × (Comandante + 6).')))}</p>
      ${[1, 2, 3, 4].filter(n => n !== Net.hubShip).map(n => { const a = Net.arcas[n]; return `<div class="alert ${a ? 'good' : 'info'}"><b>${esc(shipLabel(n))}</b> — ${a ? '🎮 ' + esc(a.cmdName || '') + ' · ' + a.members.length + '/6 ' + esc(L(K('tripulantes', 'crew', 'tripulantes'))) : esc(L(K('livre (o 1º que entrar vira Comandante)', 'free (the first to join becomes Commander)', 'libre (el primero en entrar será Comandante)')))}</div>`; }).join('')}` : ''}
      <p class="small cyan">${Net.mode === 'p2p' ? '🌐 Sala online (P2P): funciona pela internet, sem servidor e sem VPN. Mantenha esta aba aberta.' : '🖧 Servidor próprio'}</p>
      <div class="seats">${ROLES.map(r => { const p = Object.values(Net.players).find(x => x.role === r.id); return `<div class="seat ${p ? 'human' : ''}"><b>${r.name}</b><span>${p ? '🎮 ' + esc(p.name) : '🤖 Bot'}</span></div>`; }).join('')}</div>
      <div class="cards two">
        <button class="card" data-ui="startGame" data-arg="completa"><h3>🚀 Jornada Completa</h3></button>
        <button class="card" data-ui="startGame" data-arg="curta"><h3>⚡ Jornada Curta</h3></button>
      </div>
      <div class="row"><button class="btn" data-ui="netLeave">◀ Fechar sala</button>${GameSave.list().length ? `<button class="btn" data-ui="saves">📂 ${esc(L(K('Abrir jogo salvo', 'Open saved game', 'Abrir partida guardada')))}</button>` : ''}</div>
    </div>`;
  }
  if (Net.role === 'client') {
    return `<div class="panel center"><h2>CONECTADO</h2><p>Sala <span class="code">${esc(Net.room || '')}</span>. ${esc(shipLabel(Net.mySh || 1))}${Net.cmdName ? ' · ' + esc(L(K('Comandante: ', 'Commander: ', 'Comandante: '))) + esc(Net.cmdName) : ''}. Você será: <b>${esc(L(Net.myRoleName || '...'))}</b>.</p><p class="muted">Aguardando o Comandante iniciar a jornada e montar a nave...</p>${ROLE_DUTIES[U.me] ? `<p class="small cyan">${esc(L('Sua função:'))} ${esc(L(ROLE_DUTIES[U.me]))}</p><p class="small muted">${esc(L('Quando chamarem a sua função, aparece um aviso 📢: vá até a estação e pressione E. Se não for em 45 s, um bot assume.'))}</p>` : ''}<div class="row"><button class="btn" data-ui="netLeave">◀ Sair</button></div></div>`;
  }
  return `<div class="panel center">
    <h2>MULTIPLAYER</h2>
    <p class="muted">${esc(L(K('Até 28 jogadores: 4 Naves, cada uma com um Comandante e 6 tripulantes. Quem cria a sala é o Comandante da Nave que escolher.', 'Up to 28 players: 4 Spaceships, each with a Commander and 6 crew. Whoever creates the room is the Commander of the Spaceship they choose.', 'Hasta 28 jugadores: 4 Naves, cada una con un Comandante y 6 tripulantes. Quien crea la sala es el Comandante de la Nave que elija.')))} ${esc(L('Funciona online direto pelo navegador: não precisa de servidor nem de VPN.'))}</p>
    ${shipChips(LB)}
    ${roleChips(LB)}
    <div class="row"><button class="btn primary" data-ui="netHost" ${LB.busy ? 'disabled' : ''}>${esc(L(K('Criar sala (Comandante da Nave-' + (LB.ship || 1) + ')', 'Create room (Commander of Spaceship ' + (LB.ship || 1) + ')', 'Crear sala (Comandante de la Nave-' + (LB.ship || 1) + ')')))}</button></div>
    <label class="field">Código da sala <input id="net-code" maxlength="5" value="${esc(LB.code || '')}" style="text-transform:uppercase" autocomplete="off"></label>
    <div class="row"><button class="btn" data-ui="netJoin" ${LB.busy ? 'disabled' : ''}>${esc(L(arcaJoinLabel(LB.ship || 1)))}</button></div>
    ${LB.busy ? `<p class="cyan">⏳ ${esc(LB.busy)}</p>` : ''}
    <p class="err">${esc(LB.err || '')}</p>
    <details class="small"${LB.url ? ' open' : ''}><summary>Avançado: servidor próprio</summary>
      <p class="muted">Deixe em branco para usar a conexão online (P2P). Para usar o servidor incluído, rode <code>node server/server.js</code> e informe o endereço, ex.: ws://localhost:8080/ws</p>
      <label class="field">Servidor <input id="net-url" value="${esc(LB.url || '')}" placeholder="ws://localhost:8080/ws" autocomplete="off"></label>
    </details>
    <div class="row"><button class="btn" data-ui="title">◀ Voltar</button></div>
  </div>`;
}

// =============== CENAS DA PARTIDA ===============
function earthScreen() { return cityScreen(); }
function commsScreen() {
  if (U.comms === 1) return `<div class="modal-bg"><div class="panel center comm"><div class="blink red">● TRANSMISSÃO PRIORITÁRIA</div><h2>COMUNICADO</h2><p class="big">Você foi selecionado para uma missão espacial para salvar o futuro da humanidade.</p><div class="row"><button class="btn primary" data-ui="comms2">Continuar ▶</button></div></div></div>`;
  return `<div class="modal-bg"><div class="panel center comm wide"><div class="blink red">● PRÓXIMO COMUNICADO</div>
    <p>${L(K(`Você tem uma <b>verba limitada (${setupBudget()} pontos)</b> e <b>5 espaços de módulo</b> para montar uma nave de exploração. Não é possível comprar tudo: cada escolha é um sacrifício. Pontos não gastos viram um <b>fundo de contingência</b>.`, `You have a <b>limited budget (${setupBudget()} points)</b> and <b>5 module slots</b> to build an exploration ship. You cannot buy everything: every choice is a sacrifice. Unspent points become a <b>contingency fund</b>.`, `Tiene un <b>presupuesto limitado (${setupBudget()} puntos)</b> y <b>5 espacios de módulo</b> para armar una nave de exploración. No se puede comprar todo: cada elección es un sacrificio. Los puntos sin gastar se convierten en un <b>fondo de contingencia</b>.`))}</p>
    <p class="muted">${L('A nave precisa cuidar de: sanidade dos 6 tripulantes, plantações e estoque de alimentos, medicamentos e recursos clínicos, combustível, água, oxigênio, descarte de lixo e reciclagem, comunicação e equipamentos científicos.')}</p>
    <div class="seats sprites">${ROLES.map(r => { const c = S.crew.find(x => x.role === r.id); return `<div class="seat"><img src="${spriteURL(c ? c.avatar : DEFAULT_AVATAR, 'suit', 'happy', 2)}" alt=""><b>${esc(c ? c.roleName : r.name)}</b><span>${esc(L(ROLE_FN[r.id] || ''))}</span></div>`; }).join('')}</div>
    <div class="row"><button class="btn primary" data-ui="toSetup">Montar a nave ▶</button></div></div></div>`;
}

// ---------- montagem ----------
// ícone de cada item da montagem (cards mais visuais, menos texto)
const ITEM_ICON = { estufa: '🌱', reciclaAgua: '💧', biorreator: '🦠', reciclaLixo: '♻', hibernacao: '😴', solar: '☀', fusao: '⚛', escudoMag: '🧲', lab: '🔬', radar: '📡', sonda: '🛰', pouso: '🛬', mineradora: '⛏', sementes: '🌾', enfermaria: '✚', bemestar: '🧘', cupula: '🔭', impressora: '🖨', drone: '🚁', ia: '🤖',
  tanqueExtra: '⛽', baterias: '🔋', cisterna: '🚰', cilindros: '🫁', sementesEstoque: '🌰', kitMedico: '🩹', pecas: '⚙', armazenamento: '💾', racaoExtra: '🍱', filtroReserva: '🧯', casco1: '🛡', geladeira: '🧊', antena: '📶' };
function setupScreen() {
  const st = S.setup; const step = SETUP_STEPS[U.setupStep];
  const spent = setupCost(st), budget = setupBudget(), slots = setupSlots(st);
  const left = budget - spent;
  const item = (it, list, extra = '') => {
    const on = st[list].includes(it.id);
    const locked = it.req && !st[list].includes(it.req);
    const slotFull = list === 'modules' && !on && slots + it.slots > SLOTS;
    const cant = !on && (it.pts > left || locked || slotFull);
    const sug = (S.citySug || []).includes(it.id);
    return `<button class="opt ${on ? 'on' : ''} ${cant ? 'cant' : ''} ${sug ? 'sug' : ''}" data-ui="setToggle" data-arg="${list}:${it.id}" title="${esc(T(it.desc))}"><b>${sug ? '💡 ' : ''}${ITEM_ICON[it.id] || '▪'} ${esc(it.name)}</b><span class="idesc">${esc(it.desc)}</span><em>${it.pts} pts${typeof massOfItem === 'function' && massOfItem(it.id) ? ' · ' + massOfItem(it.id) + ' kg' : ''}${it.slots ? ' · ' + it.slots + ' slot' + (it.slots > 1 ? 's' : '') : ''}${locked ? ' · requer anterior' : ''}${extra}</em></button>`;
  };
  let body = '';
  switch (step.id) {
    case 'mission': body = `<h4>🧭 ${esc(T('Rota'))}</h4><div class="opts">${ROUTES.map(r => `<button class="opt ${st.route === r.id ? 'on' : ''}" data-ui="setRoute" data-arg="${r.id}"><b>${{ rapida: '⚡', equilibrada: '⚖', segura: '🛡' }[r.id] || ''} ${r.name}</b><span>${r.desc}</span>${typeof ROUTE_DV !== 'undefined' ? `<em>Δv ${ROUTE_DV[r.id]} m/s</em>` : ''}</button>`).join('')}</div>
      <h4>👤 ${esc(T('Origem do Comandante'))}: <b>${esc(T((ORIGINS.find(o => o.id === st.origin) || {}).name || ''))}</b></h4><div class="opts">${ORIGINS.map(o => `<button class="opt ${st.origin === o.id ? 'on' : ''}" data-ui="setOrigin" data-arg="${o.id}"><b>${o.name}</b><span>${o.bonus}</span></button>`).join('')}</div>`; break;
    case 'modules': body = `<p class="muted small">${esc(L('5 slots · o reator de fusão ocupa 2'))}</p><div class="opts">${MODULES.map(m => item(m, 'modules')).join('')}</div>`; break;
    case 'supplies': body = `<div class="opts">${RESERVES.map(r => item(r, 'reserves')).join('')}${ESSENTIALS.map(([list, id]) => { const cat = list === 'pantry' ? PANTRY : UPGRADES; const it = cat.find(x => x.id === id); return it ? item(it, list) : ''; }).join('')}</div>`; break;
    case 'report': body = `<div class="fund"><div class="bignum">${left}</div><p class="small">${L('pontos sobrando viram <b>fundo de contingência</b> para emergências na viagem.')}</p></div><div class="report-list">${(() => { const bad = readinessAlerts().filter(a => a[0] === 'bad').slice(0, 3); return bad.length ? bad.map(a => `<div class="alert bad">${esc(a[1])}</div>`).join('') : `<div class="alert good">✔ ${esc(L('Nave pronta para decolar.'))}</div>`; })()}</div><div class="row"><button class="btn primary big" data-ui="launch">🚀 DECOLAR</button></div>`; break;
  }
  return `<div class="setup">
    <div class="setup-side">
      <h3>MONTAGEM</h3>
      <div class="budget"><div>Verba <b class="${left < 0 ? 'red' : ''}">${left}</b> / ${budget}${S.earthBonus ? ` <small class="green">(📦 +${S.earthBonus})</small>` : ''}</div><div>Slots <b>${slots}</b> / ${SLOTS}</div></div>
      <ol class="steps">${SETUP_STEPS.map((s, i) => `<li class="${i === U.setupStep ? 'on' : ''} ${i < U.setupStep ? 'done' : ''}" data-ui="setStep" data-arg="${i}">${s.title}</li>`).join('')}</ol>
      <div class="muted small">Jornada ${S.journey === 'curta' ? 'Curta' : 'Completa'}</div>
    </div>
    <div class="setup-main scroll">
      <h2>${U.setupStep + 1}. ${step.title}</h2>
      ${body}
    </div>
    <div class="setup-nav">${U.setupStep > 0 ? '<button class="btn" data-ui="setPrev">◀ Voltar</button>' : '<span></span>'}${U.setupStep < SETUP_STEPS.length - 1 ? '<button class="btn primary" data-ui="setNext">Próximo ▶</button>' : ''}</div>
  </div>`;
}
function readinessAlerts() {
  const st = S.setup; const h = id => st.modules.includes(id) || st.upgrades.includes(id) || st.reserves.includes(id) || st.skills.includes(id) || st.pantry.includes(id) || st.gadgets.includes(id) || st.training.includes(id);
  const a = [];
  const days = Math.round((S.journey === 'curta' ? 12 : 30) * ROUTES.find(r => r.id === st.route).days);
  const food = Math.ceil(0.4 * 7 * days * (S.journey === 'curta' ? 0.93 : 1.08)) + (h('racaoExtra') ? 30 : 0);
  if (!h('filtroReserva')) a.push(['bad', 'Sem filtro de ar reserva: risco alto em falhas do Suporte à Vida.']);
  if (!h('enfermaria')) a.push(['bad', 'Sem enfermaria: feridos graves podem morrer.']);
  if (st.route === 'rapida' && !h('tanqueExtra')) a.push(['warn', 'Combustível justo para a rota rápida.']);
  if (h('fusao')) a.push(['warn', 'Reator instalado: energia sobrando, mas atenção ao calor.']);
  const skillPts = st.skills.reduce((s, id) => s + SKILLS.find(x => x.id === id).pts, 0);
  if (skillPts >= 12 && st.modules.length <= 1) a.push(['bad', 'Líder excelente, nave frágil: qualquer falha grave pode ser fatal.']);
  if (!['estufa', 'reciclaAgua', 'biorreator', 'reciclaLixo', 'hibernacao'].some(h)) a.push(['bad', 'Nenhum módulo de sobrevivência: risco crítico de fome e sede.']);
  if (food / 4.2 < days && !h('estufa') && !h('biorreator')) a.push(['bad', `Comida para ≈ ${Math.floor(food / 4.2)} dias numa viagem de ≈ ${days} dias. Será preciso racionar ou trocar.`]);
  if (h('sangue')) a.push(['good', 'Comandante com Sangue-frio: uma segunda chance por fase.']);
  if (h('solar') && !h('casco1')) a.push(['warn', 'Painéis solares sem blindagem: asteroides podem danificá-los.']);
  if (h('escudoMag') && h('biorreator')) a.push(['warn', 'Escudo magnético + Biorreator: os dois gastam energia constante e podem deixar a nave no vermelho.']);
  if (h('estufa') && h('reciclaAgua')) a.push(['good', 'Sinergia: Estufa + Reciclador de água — ciclo fechado.']);
  if (h('reciclaLixo') && h('impressora')) a.push(['good', 'Sinergia: lixo vira peças de reparo.']);
  if (h('lab') && h('sonda')) a.push(['good', 'Sinergia: Laboratório + Sonda dobram os dados.']);
  if (h('radar') && h('ia')) a.push(['good', 'Sinergia: Radar + Copiloto de IA — pistas ainda mais claras.']);
  if (h('enfermaria') && h('hibernacao')) a.push(['good', 'Sinergia: feridos se recuperam bem mais rápido.']);
  if (!h('sonda') && !h('pouso')) a.push(['warn', 'Sem sonda nem nave de pouso: investigar Pontes-01b vai arriscar a nave principal.']);
  const left = setupBudget() - setupCost(st);
  if (left < 0) a.push(['bad', 'Verba estourada! Remova itens para decolar.']);
  else a.push(['info', `Fundo de contingência: ${left} ponto(s).`]);
  return a;
}

// ---------- HUD da nave ----------
// HUD enxuto: 4 barras (oxigênio, fome, humor, armazenamento). ▾ mostra todos os recursos.
function storagePct() {
  const ks = ['agua', 'comida', 'energia', 'combustivel', 'medicos'];
  const f = ks.map(k => clamp(S.cap[k] ? S.res[k] / S.cap[k] : 1, 0, 1));
  return { avg: f.reduce((a, b) => a + b, 0) / f.length * 100, low: ks.filter((k, i) => f[i] < 0.2) };
}
function hudTop() {
  const r = S.res, c = S.cap;
  const crewA = alive().filter(x => !x.hibernating);
  const fome = crewA.length ? crewA.reduce((a, x) => a + x.saciedade, 0) / crewA.length : 0;
  const st = storagePct(); const mo = moralIndex();
  const big = (ic, name, v, max, txt, title, extra) => `<div class="rb big" title="${esc(title)}"><span class="ic">${ic}</span><span class="nm">${esc(L(name))}</span>${bar(v, max)}<span class="v">${txt}</span>${extra || ''}</div>`;
  const low = st.low.map(k => RES_META.find(m => m.id === k).icon).join('');
  let items = [
    big('🫁', 'Oxigênio', r.oxigenio, c.oxigenio, `${fmt(r.oxigenio, 0)}<small>kg</small>`, `O₂: ${fmt(r.oxigenio)} kg`),
    (() => { const fo = foodOutlook(); const d = fo.days; const m = me(); const v = m && m.alive && !m.hibernating ? m.saciedade : fome; return big('🍱', 'Fome', v, 100, `${fmt(v, 0)}<small>%</small>${d < 5 ? `<b class="${d < 2 ? 'red blink' : 'orange'}" style="margin-left:.3em">${fmt(d, 0)}d</b>` : ''}`, L('Sua fome') + ' · ' + L('média da tripulação: ') + fmt(fome, 0) + '% · ' + fmt(r.comida) + ' kg · ' + L('dura') + ' ≈ ' + fmt(d, 0) + ' ' + L('dias')); })(),
    // mesmo número do Dormitório: o seu humor/sono (a média da tripulação vai na dica)
    (() => { const m = me(); const v = m && m.alive && !m.hibernating ? m.humor : mo; return big('😴', 'Humor/Sono', v, 100, `${fmt(v, 0)}`, L('Seu humor e sono: cai sem dormir; durma nos Dormitórios') + ' · ' + L('média da tripulação: ') + fmt(mo, 0)); })(),
    big('📦', 'Armazenamento', st.avg, 100, `${fmt(st.avg, 0)}<small>%</small>`, ['agua', 'comida', 'energia', 'combustivel', 'medicos'].map(k => { const m = RES_META.find(x => x.id === k); return `${T(m.name)}: ${fmt(r[k], 0)} ${m.unit}`; }).join(' · '), low ? `<b class="lowres blink">${low}</b>` : ''),
  ].join('');
  if (U.hudFull) items += '<div class="hudfull">' + RES_META.map(m => { const v = r[m.id], cap = m.id === 'lixo' ? 30 : c[m.id]; return `<div class="rb" title="${m.name}: ${fmt(v)} ${m.unit}"><span class="ic">${m.icon}</span>${bar(v, cap, '', m.inverse)}<span class="v">${fmt(v, v < 10 ? 1 : 0)}<small>${m.unit}</small></span></div>`; }).join('') + '</div>';
  const hh = Math.floor(S.dayT / S.dayLen * 24), mm = Math.floor((S.dayT / S.dayLen * 24 * 60) % 60);
  const stageNames = ['Preparação', 'Partida e viagem', 'Exploração científica', 'O novo mundo', 'Migração'];
  const fastBtn = `<button class="btn tiny ${S.fast ? 'on' : ''}" data-ui="fast" title="Shift+S">${S.fast ? '⏩ ' + S.fast + 'x' : '⏩'}</button>`;
  return `<div class="hud-top slim"><div class="bars">${items}<button class="btn tiny more" data-ui="hudFull" title="${esc(L('Todos os recursos'))}">${U.hudFull ? '▴' : '▾'}</button></div><div class="clock"><b>DIA ${S.day}</b> ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${fastBtn}<br><small>${stageNames[Math.min(S.stage, 4)]}</small>${S.commDown > 0 ? '<br><small class="red">📡 sem comunicação</small>' : ''}${S.cylinders ? '<br><small class="orange">🫁 cilindros de O₂</small>' : ''}</div></div>`;
}
function hudBottom() {
  const m = me(); const near = m && m.alive ? stationNear(m) : null;
  let prompt = '';
  const ev = S.event;
  if (near) {
    const step = ev && ev.phase === 'run' ? ev.steps.find(s => !s.done && s.station === near && (s === curStep(ev) || s.optional)) : null;
    prompt = step ? `<b>E</b> — ${esc(step.label)}` : `<b>E</b> — ${STATIONS[near].name}`;
  }
  if (ev && ev.type === 'lixo' && ev.phase === 'run' && m && S.trash.some(t => t.deck === m.deck && Math.abs(t.x - m.x) < 16)) prompt = '<b>E</b> — recolher lixo';
  if (m && m.task) prompt = `⏳ ${esc(m.task.label)} — fique na estação`;
  // chamado recebido (multiplayer): a função é sua — vá até a estação
  let call = '';
  if (m && m.task && m.task.called && !atStation(m, m.task.station, 20)) {
    const left = Math.max(0, Math.ceil(CALL_TIMEOUT - (m.task.wait || 0)));
    call = `<div class="callbar"><b class="blink">📢</b> ${esc(L('Você foi chamado(a):'))} <b>${esc(T(m.task.label))}</b> → ${esc(T(STATIONS[m.task.station].name))} <button class="btn small primary" data-ui="goto" data-arg="${m.task.station}">${esc(L('Ir até lá'))}</button></div>`;
  }
  const p = S.progress;
  return call + `<div class="hud-bottom">
    <div class="track"><span class="lbl">TERRA</span><div class="line"><i style="width:${p * 100}%"></i><em class="mk st" style="left:50%">◆</em><em class="ship" style="left:${p * 100}%">▶</em></div><span class="lbl cyan">PONTES-01b</span></div>
    ${prompt ? `<button class="prompt big-prompt" data-ui="interactNow" ${m && m.task ? 'disabled' : ''}>${prompt}</button>` : '<div class="prompt"></div>'}
    <div class="btns"><button class="btn small" data-ui="panel" data-arg="report">[R] Relatório</button><button class="btn small" data-ui="panel" data-arg="crew">[T] Tripulação</button><button class="btn small" data-ui="panel" data-arg="fund">[F] Fundo ${S.fund}</button><button class="btn small" data-ui="panel" data-arg="menu">☰</button></div>
  </div>`;
}
// ---------- painel de evento ----------
// painel de desafio: menos texto, mais visual (ícones, barras e um passo de cada vez)
const SYS_IC = { casco: '▣', termico: '🛡', propulsao: '🔥', tanques: '⛽', avionica: '🖥', suporte: '🫁', comunicacao: '📡', acoplamento: '🚪' };
function eventPanel() {
  const ev = S.event; if (!ev) return '';
  const info = EVENT_INFO[ev.type];
  const sysChips = info.systems.map(s => `<div class="schip" title="${esc(T(SYSTEMS[s].name))}"><span>${SYS_IC[s] || '⚙'}</span>${bar(sysHp(s), 100)}<em class="dmg ${SYSTEMS[s].dmg}">−${DMG_PCT[SYSTEMS[s].dmg]}%</em></div>`).join('');
  const head = (cls) => `<div class="evhead ${cls || ''}"><span class="evic">${info.icon}</span><div>${cls === 'warn' ? `<div class="blink red small">⚠ ${esc(L('ALERTA'))}</div>` : ''}<h2>${info.title}</h2></div></div>`;
  if (ev.phase === 'warn') {
    return `<div class="evp warn compact">${head('warn')}<div class="schips">${sysChips}${info.energy ? `<div class="schip"><span>⚡</span>${bar(S.res.energia, S.cap.energia)}</div>` : ''}</div>
      <details class="evinfo"><summary>ℹ ${esc(L('O que está acontecendo?'))}</summary><p class="small">${info.desc}</p></details>
      ${ev.type === 'termico' && (S.thermGuide || Save.data.thermGuide) ? thermalGuideHTML(-1) : ''}
      <div class="row"><b class="yellow big">⏱ ${esc(L('Começa em'))} ${Math.ceil(ev.warnT)}s</b></div></div>`;
  }
  if (ev.phase === 'result') {
    const r = ev.result;
    return `<div class="evp result compact ${r.ok ? 'ok' : 'bad'}">${head()}<div class="bigres ${r.ok ? 'green' : 'red'}">${r.ok ? '✔' : '✖'} ${r.grade || (r.ok ? 'SUCESSO' : 'FALHA')}</div>
      ${r.points > 0 ? `<p class="cyan">+${r.points} pontos</p>` : ''}
      ${r.ok ? (r.text ? `<details class="evinfo"><summary>ℹ ${esc(L('Detalhes'))}</summary><p class="small">${esc(r.text)}</p></details>` : '') : `<div class="alert bad small"><b>⚠ ${esc(L('Consequência'))}:</b> <span>${esc(r.text || L('a nave sofreu danos.'))}</span>${r.delay ? `<br><span>⏳ ${esc(L('A missão atrasou.'))}</span>` : ''}</div>`}
      ${ev.type === 'termico' && !r.ok ? `<p class="small yellow">${esc(L(K('Da próxima vez, o painel mostra o passo a passo:', 'Next time, the panel shows the step by step:', 'La próxima vez, el panel muestra el paso a paso:')))}</p>${thermalGuideHTML(null)}` : ''}
      <div class="row"><button class="btn primary" data-act="eventClose">Continuar ▶</button></div></div>`;
  }
  if (ev.type === 'termico') return thermalPanel();
  const cs = curStep(ev);
  const active = ev.steps.filter(s => !s.done && (s === cs || s.optional));
  const card = s => {
    let btns = '';
    if (s.station) {
      btns = `<button class="btn tiny primary" data-ui="goto" data-arg="${s.station}">📍 ${esc(T(STATIONS[s.station].name))}</button>`;
      if (s.role || s.optional) { const rn = s.role === 'engenheiro' ? 'engenheiro' : (ROLES.find(r => r.id === s.role) || {}).short || 'tripulante'; const who = pickForRole(s.role || 'engenheiro') || pickBotForRole(s.role || 'engenheiro'); btns += `<button class="btn tiny" data-act="callRole" data-p='${J({ step: s.id, role: s.role || 'engenheiro' })}'>${who ? `<img class="mini" src="${spriteURL(who.avatar, 'suit', 'happy', 1)}" alt="">` : ''}${esc(L('Chamar'))} ${esc(T(rn).toLowerCase())}${who && isHumanCrew(who) ? ' 🎮' : ''}</button>`; }
      if (s.claimed) { const c = crewById(s.claimed); btns = `<em class="small">${esc(c ? c.name : '')} ⏳</em>`; }
    }
    return `<div class="stepcard ${s === cs ? 'cur' : ''}"><b>▶ ${esc(s.label)}</b>${s.optional ? ' <small>(opcional)</small>' : ''}<div class="row">${btns}</div></div>`;
  };
  const chips = ev.steps.map((s, i) => `<span class="dot ${s.done ? 'done' : s === cs ? 'cur' : ''}" title="${esc(T(s.label))}">${s.done ? '✔' : i + 1}</span>`).join('');
  let extra = '';
  if (ev.type === 'tempestade') extra = `<div class="row"><button class="btn primary" data-act="shelter">🛏 ${esc(L('Todos ao abrigo'))}</button><b class="${ev.data.storm ? 'red' : 'orange'}">☀ ${ev.data.storm ? '!!!' : Math.max(0, Math.ceil(ev.t - ev.data.stormAt)) + 's'}</b></div>`;
  if (ev.type === 'lixo') extra = `<p class="small">🗑 <b>E</b> / ${esc(L('Espaço'))} ${esc(L('perto do lixo flutuante'))}</p>`;
  if (ev.type === 'traje' && ev.data.victim) { const v = crewById(ev.data.victim); extra = `<p class="small red"><img class="mini" src="${spriteURL(v.avatar, 'broken', 'sad', 1)}" alt=""> ${esc(v.name)} 🫁!</p>`; }
  if (ev.type === 'doenca' && ev.data.victim) { const v = crewById(ev.data.victim); extra = `<p class="small"><img class="mini" src="${spriteURL(v.avatar, 'suit', 'sick', 1)}" alt=""> 🤒 <b>${esc(v.name)}</b> · 💊 ${S.day > S.meds.validUntil ? '<span class="red">✖</span>' : '✔'}</p>`; }
  return `<div class="evp run compact">${head()}
    <div class="timer">${bar(ev.t, ev.dur, 'time')}<b>${Math.ceil(ev.t)}s</b></div>
    <div class="dots-row">${chips}</div>${active.map(card).join('')}${extra}
    ${ev.puzzle ? puzzleHTML(ev) : ''}</div>`;
}

const AGUA_ORDER = ['Destilação', 'Filtração', 'Oxidação', 'Desinfecção'];
const AGUA_ICON = { 'Destilação': '♨', 'Filtração': '🧽', 'Oxidação': '🫧', 'Desinfecção': '☀' };
const AGUA_WHAT = { 'Destilação': 'ferver e condensar', 'Filtração': 'tirar a sujeira', 'Oxidação': 'quebrar químicos', 'Desinfecção': 'matar germes (UV)' };
const MED_ICON = { analgesico: '💊', antiemetico: '🍋', antialergico: '🌼', antibiotico: '🦠', oxigenio: '😮‍💨' };
const solBox = t => `<div class="solbox">💡 ${esc(L('Solução'))}: <b>${esc(t)}</b></div>`;
function puzzleHTML(ev) {
  const pz = ev.puzzle;
  if (pz.by && me() && pz.by !== me().id) { const o = crewById(pz.by); return `<div class="puzzle"><p class="small">🔒 ${esc(o ? o.name : '')} ${esc(L(K('chegou primeiro e está resolvendo este passo.', 'got here first and is solving this step.', 'llegó primero y está resolviendo este paso.')))}</p></div>`; }
  if (pz.kind === 'filtros') {
    // um clique: o filtro com menos ar passando é o entupido
    return `<div class="puzzle vis"><h4>💨 ${esc(L('Filtros de ar'))}</h4><p class="pzhow">👆 ${esc(L('Clique no filtro com MENOS ar passando'))}</p><div class="filters">${Array.from({ length: pz.n }, (_, i) => {
      const seen = pz.seen.includes(i); const bad = i === pz.bad; const sol = pz.hint && bad; const fl = bad ? 8 : pz.flow[i];
      return `<button class="filter fbtn ${seen && !bad ? 'ok' : ''} ${sol ? 'sol' : ''}" data-act="puzzle" data-p='${J({ op: 'swap', i })}' ${seen && !bad ? 'disabled' : ''}><span class="fic">${bad ? '🟫' : '⬜'}</span><span class="flow"><i style="height:${fl}%"></i></span><em>${fl}%</em><small>F${i + 1}</small></button>`;
    }).join('')}</div>${pz.hint ? solBox(L('Troque o filtro') + ' F' + (pz.bad + 1)) : ''}</div>`;
  }
  if (pz.kind === 'mapa') {
    return `<div class="puzzle vis"><h4>⭐ ${esc(L('Mapa estelar'))}</h4><p class="pzhow">👆 ${esc(L('Clique nas setas tortas para apontar para cima ↑'))}</p><div class="map3">${pz.tiles.map((t, i) => `<button class="tile ${t ? 'bent' : 'okt'}" data-act="puzzle" data-p='${J({ i })}'><span style="display:inline-block;transform:rotate(${t * 90}deg)">↑</span></button>`).join('')}</div>${pz.hint ? solBox(L('Só clique nas setas que não apontam para cima ↑')) : ''}</div>`;
  }
  if (pz.kind === 'radio') {
    const msg = RADIO_MESSAGES[pz.msgIdx];
    const fixed = ev.data.fixed || has('antena');
    const dist = Math.abs(pz.freq - pz.target);
    const q = clamp(1 - dist / (fixed ? 40 : 28), 0, 1);
    let s = pz.seed;
    const shown = [...T(msg.full)].map(ch => { s = (s * 9301 + 49297) % 233280; return (ch === ' ' || s / 233280 < q) ? ch : (s % 3 ? '█' : '~'); }).join('');
    // faixa de sintonia: clique onde as ondas são mais altas
    const bands = Array.from({ length: 20 }, (_, i) => { const f = i * 5 + 2; const h = clamp(1 - Math.abs(f - pz.target) / 40, 0.08, 1); const on = Math.abs(pz.freq - f) <= 2; return `<button class="band ${on ? 'on' : ''}" data-act="puzzle" data-p='${J({ op: 'set', f })}'><i style="height:${Math.round(h * 100)}%"></i></button>`; }).join('');
    return `<div class="puzzle vis"><h4>📻 ${esc(L('Rádio'))} — ${fmt(100 + pz.freq * 0.5, 1)} MHz</h4><p class="pzhow">👆 ${esc(L('Clique onde a onda é mais alta'))}</p><div class="bands">${bands}</div>
      <div class="signal">${bar(q, 1)}<b>${q > 0.85 ? 'sinal limpo' : q > 0.4 ? 'chiado' : 'só ruído'}</b></div>
      <div class="radiomsg">${esc(shown)}</div>
      ${q < 0.5 ? '' : `<p class="pzhow">❓ ${esc(L('O que a base está tentando avisar?'))}</p><div class="opts1">${shuffleStable(msg.options, pz.seed).map(o => `<button class="btn pzbig" data-act="puzzle" data-p='${J({ op: 'answer', answer: o })}'>${esc(o)}</button>`).join('')}</div>`}</div>`;
  }
  if (pz.kind === 'agua') {
    const slots = AGUA_ORDER.map((o, i) => { const d = pz.order[i]; return `<div class="wslot ${d ? 'on' : ''}"><b>${i + 1}</b>${d ? `<span>${AGUA_ICON[d]}</span><small>${esc(T(d))}</small>` : '<span>?</span>'}</div>`; }).join('<i class="warr">→</i>');
    return `<div class="puzzle vis"><h4>💧 ${esc(L('Limpar a água'))}</h4><p class="pzhow">👆 ${esc(L('Clique nas etapas na ordem: 1 → 4'))}</p><div class="wslots">${slots}</div><div class="wopts">${pz.options.map(o => `<button class="wopt ${pz.order.includes(o) ? 'used' : ''} ${pz.hint && o === AGUA_ORDER[pz.order.length] ? 'sol' : ''}" data-act="puzzle" data-p='${J({ stage: o })}' ${pz.order.includes(o) ? 'disabled' : ''}><span>${AGUA_ICON[o]}</span><b>${esc(T(o))}</b><small>${esc(L(AGUA_WHAT[o]))}</small></button>`).join('')}</div>${pz.hint ? solBox(AGUA_ORDER.map((o, i) => `${i + 1}. ${T(o)}`).join(' → ')) : ''}</div>`;
  }
  if (pz.kind === 'remedio') {
    const expired = S.day > S.meds.validUntil;
    const dis = DISEASES.find(d => d.id === ev.data.disease) || {}; const rd = dis.readings || {};
    // os aparelhos simples já mostram a leitura; escolher o remédio é um clique
    const reading = k => esc(I18n.lang === 'en' ? T(rd[k] || '').replace(/(\d),(\d)/g, '$1.$2') : T(rd[k] || ''));
    const vit = [['temp', '🌡'], ['spo2', '🫁'], ['pressao', '❤'], ['esteto', '🩺']].map(([k, ic]) => `<div class="vital"><span>${ic}</span><b>${reading(k)}</b></div>`).join('');
    return `<div class="puzzle vis"><h4>🩺 ${esc(L('Paciente'))}</h4><div class="vitals">${vit}</div>
      ${expired ? `<div class="solbox">⚠ ${esc(L('Remédios vencidos!'))} <button class="btn pzbig" data-act="puzzle" data-p='${J({ op: 'replace' })}'>🔄 ${esc(L('Trocar lote'))}</button></div>` : ''}
      <p class="pzhow">👆 ${esc(L('Clique no remédio certo'))}</p><div class="meds">${MEDICINES.map(m => `<button class="med ${pz.hint && !expired && m.id === dis.med ? 'sol' : ''}" data-act="puzzle" data-p='${J({ op: 'give', med: m.id })}'><span>${MED_ICON[m.id] || '💊'}</span><b>${esc(T(m.name))}</b></button>`).join('')}</div>
      <div class="medref">🔥 ${esc(L('febre'))} → 🦠 · 🫁 ${esc(L('SpO₂ baixo'))} → 😮‍💨 O₂ · ❤ ${esc(L('pressão alta'))} → 💊 · 🌀 ${esc(L('náusea'))} → 🍋 · 🤧 ${esc(L('chiado'))} → 🌼</div>
      ${pz.hint ? solBox(expired ? L('Primeiro troque o lote vencido, depois dê o remédio.') : L('Dê este remédio') + ': ' + T((MEDICINES.find(m => m.id === dis.med) || {}).name || '')) : ''}</div>`;
  }
  if (pz.kind === 'substituto') {
    const v = S.event.data.victim;
    return `<div class="puzzle"><h4>Quem vai substituir?</h4><div class="opts1">${S.crew.filter(c => c.alive && c.id !== v && !c.hibernating).map(c => `<button class="btn pzbig" data-act="puzzle" data-p='${J({ id: c.id })}' ${available(c) || c.id === 'cmd' ? '' : 'disabled'}>${esc(c.roleName)} ${esc(c.name)}${roleMatches(c, 'engenheiro') ? ' ★' : ''}</button>`).join('')}</div><p class="small muted">★ engenheiro: termina o reparo com segurança.</p></div>`;
  }
  if (pz.kind === 'rota') {
    return `<div class="puzzle"><h4>Rotas calculadas pela Terra</h4><div class="opts1">
      <button class="btn pzbig" data-act="puzzle" data-p='${J({ opt: 'gravidade' })}'><span>🪐</span> Assistência gravitacional: −15% de combustível, +2 dias</button>
      <button class="btn pzbig" data-act="puzzle" data-p='${J({ opt: 'economico' })}'><span>🐢</span> Cruzeiro econômico: −30% de combustível, mais lento</button>
      <button class="btn pzbig" data-act="puzzle" data-p='${J({ opt: 'manter' })}'><span>➡</span> Manter a rota atual (moral −3)</button></div></div>`;
  }
  if (pz.kind === 'pilot') return `<div class="puzzle"><h4>Pilotagem</h4><p>Use ↑/↓ (W/S) para desviar. ${Math.ceil(pz.t)} s · impactos: ${pz.hits}</p><div class="row"><button class="btn pzbig" data-ui="pilot" data-arg="-1">▲</button><button class="btn pzbig" data-ui="pilot" data-arg="1">▼</button></div></div>`;
  return '';
}
function shuffleStable(arr, seed) { const a = arr.slice(); let s = seed; for (let i = a.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// passo a passo da Regulação Térmica (aparece depois de errar uma vez)
const TH_STEPS = [
  { sc: 0, t: K('Alerta de calor: o interior ainda está bom (18–26 °C). Deixe os DOIS desligados e economize energia.', 'Heat alert: the interior is still fine (18–26 °C). Leave BOTH off and save energy.', 'Alerta de calor: el interior aún está bien (18–26 °C). Deje AMBOS apagados y ahorre energía.') },
  { sc: 2, t: K('A estrela se aproxima (lado do Sol a +120 °C): LIGUE o resfriador ❄.', 'The star gets closer (sun side at +120 °C): turn the cooler ON ❄.', 'La estrella se acerca (lado del Sol a +120 °C): ENCIENDA el enfriador ❄.') },
  { sc: 4, t: K('Sobrecarga elétrica: os equipamentos esquentam a nave. MANTENHA o resfriador ligado.', 'Electrical overload: the equipment heats the ship. KEEP the cooler on.', 'Sobrecarga eléctrica: los equipos calientan la nave. MANTENGA el enfriador encendido.') },
  { sc: 5, t: K('Entrada na sombra: vai esfriar rápido. DESLIGUE o resfriador e LIGUE o aquecedor 🔥.', 'Entering the shadow: it will cool fast. Turn the cooler OFF and the heater ON 🔥.', 'Entrada en la sombra: se enfriará rápido. APAGUE el enfriador y ENCIENDA el calentador 🔥.') },
];
function thermalGuideHTML(cur) {
  const idx = cur == null ? -1 : TH_STEPS.reduce((a, s, i) => (cur >= s.sc ? i : a), 0);
  return `<div class="thguide"><b>📋 ${esc(L(K('Passo a passo', 'Step by step', 'Paso a paso')))}</b><ol>${TH_STEPS.map((s, i) => `<li class="${i === idx ? 'now' : i < idx ? 'done' : ''}">${i === idx ? '▶ ' : i < idx ? '✔ ' : ''}${esc(L(s.t))}</li>`).join('')}</ol>
    <p class="small muted">${esc(L(K('Dica: nunca deixe a energia cair abaixo de 9 kWh — cada aparelho ligado gasta energia o tempo todo.', 'Tip: never let energy fall below 9 kWh — every device that is on keeps draining it.', 'Consejo: nunca deje que la energía baje de 9 kWh — cada aparato encendido gasta energía todo el tiempo.')))}</p></div>`;
}
function thermalPanel() {
  const th = S.thermal; if (!th) return '';
  const tcol = th.T > 26 ? 'red' : th.T < 18 ? 'cyan' : 'green';
  const scene = th.scene >= 5 ? 'Entrada na sombra' : th.scene >= 4 ? 'Sobrecarga elétrica' : th.scene >= 2 ? 'A estrela se aproxima' : 'Alerta de calor';
  const thermo = (label, v, min, max, cls) => `<div class="thermo"><div class="tube"><i class="${cls}" style="height:${clamp((v - min) / (max - min), 0, 1) * 100}%"></i></div><b>${fmt(v, 0)}°</b><small>${esc(L(label))}</small></div>`;
  // o que deveria estar ligado agora vem do calor de fora (não da leitura do momento),
  // então desligar quando o selo pede não deixa a nave errada de novo
  const want = th.want || { cool: false, heat: false };
  const hint = want.cool ? ['red', '🔥 ' + L('Lá fora está quente: deixe o resfriador LIGADO.')] : want.heat ? ['cyan', '❄ ' + L('Lá fora está frio: deixe o aquecedor LIGADO.')] : ['green', '✔ ' + L('Lá fora está ameno: deixe os dois DESLIGADOS.')];
  const ctrl = k => { const c = TH_CTRL[k]; const on = th.on[k]; const todo = on !== want[k];
    const tag = todo ? `<i class="thtodo blink">▶ ${esc(L(want[k] ? 'LIGUE' : 'DESLIGUE'))}</i>` : '';
    return `<button class="thc onoff ${on ? 'on' : ''} ${todo ? 'todo' : ''}" data-act="thToggle" data-p='${J({ k })}'>${tag}<span class="ic">${c.icon}</span><b>${esc(L(c.name))}</b><em class="onsw"><span class="led"></span>${on ? L('LIGADO') : L('DESLIGADO')}</em></button>`; };
  // jornada curta: fora da faixa, a solução aparece bem grande
  const need = want.cool && !th.on.cool ? L('LIGUE O RESFRIADOR ❄') : want.heat && !th.on.heat ? L('LIGUE O AQUECEDOR 🔥') : (!want.cool && th.on.cool) || (!want.heat && th.on.heat) ? L('DESLIGUE') + ' ' + (th.on.cool ? L('o resfriador') : L('o aquecedor')) : '';
  const fix = need ? `<div class="solbox blink">💡 ${esc(need)}</div>` : `<div class="solbox okbox">✔ ${esc(L('Certo! Mantenha assim.'))}</div>`;
  return `<div class="evp thermal simple">
    <h2>🌡 ${esc(L('Regulação Térmica'))} <small>${esc(L(scene))}</small></h2>
    <div class="timer">${bar(S.event.t, th.D, 'time')}<b>${Math.floor(S.event.t / 60)}:${String(Math.floor(S.event.t % 60)).padStart(2, '0')}</b></div>
    <div class="thermos">${thermo('Sol', th.sun, -160, 130, 'hot')}${thermo('Sombra', th.shade, -160, 130, 'cold')}<div class="thermo main"><div class="tube"><i class="${tcol}" style="height:${clamp((th.T - 0) / 50, 0, 1) * 100}%"></i><span class="band-safe"></span></div><b class="${tcol}">${fmt(th.T, 1)}°</b><small>${esc(L('Interior'))}</small></div>
      <div class="thres"><div><span>⚡ ${esc(L('Energia'))}</span>${bar(S.res.energia, S.cap.energia)}<b>${fmt(S.res.energia, 1)} kWh</b></div><p class="small">${L('Meta: manter o interior entre <b>18 °C e 26 °C</b>.')}</p><p class="small ${hint[0]}">${esc(hint[1])}</p></div></div>
    ${fix}${S.thermGuide || Save.data.thermGuide ? thermalGuideHTML(th.scene) : ''}<div class="thctrls two">${ctrl('heat')}${ctrl('cool')}</div>
    <div class="evlog">${th.msgs.slice(-3).map(m => `<div>${esc(m)}</div>`).join('')}</div>
  </div>`;
}

// ---------- painéis das estações ----------
function repairRow(sys) {
  const hp = sysHp(sys);
  return `<div class="sysline"><span>${SYSTEMS[sys].name}</span>${bar(hp, 100)}<b>${fmt(hp, 0)}%</b>
    ${hp < 100 ? `<button class="btn tiny" data-act="repair" data-p='${J({ sys })}'>Reparar</button><button class="btn tiny" data-act="repair" data-p='${J({ sys, call: true })}'>Chamar eng.</button>` : ''}</div>`;
}
function stationPanel(id) {
  const st = STATIONS[id]; let body = '';
  const peç = `<p class="small muted">Reparo: usa 1 peça sobressalente (você tem ${S.peças}) ou 5 kWh.</p>`;
  switch (id) {
    case 'ponte': {
      const cr = cruiseObj();
      const daysLeft = (1 - S.progress) * S.totalDays / (cr.speed * S.speedMod);
      body = `<h4>Navegação</h4><div class="opts">${[['economico', 'Econômico', '−30% combustível · 15% mais lento'], ['normal', 'Normal', 'equilíbrio'], ['acelerado', 'Acelerado', '+50% combustível · 20% mais rápido']].map(([k, n, d]) => `<button class="opt ${S.cruise === k ? 'on' : ''}" data-act="cruise" data-p='${J({ mode: k })}'><b>${n}</b><span>${d}</span></button>`).join('')}</div>
        <div class="kv"><span>Progresso</span><b>${fmt(S.progress * 100, 0)}%</b><span>Dias restantes (estim.)</span><b>${fmt(daysLeft, 1)}</b><span>Rota</span><b>${routeObj().name}</b><span>Combustível</span><b>${fmt(S.res.combustivel, 0)} kg</b></div>
        ${has('radar') ? `<h4>Radar de longo alcance</h4><p>${S.schedule[0] ? `Próximo evento previsto: <b>${EVENT_INFO[S.schedule[0].type].title}</b> no dia ${Math.ceil(S.schedule[0].day)}.` : 'Nenhum evento detectado.'}</p>` : ''}`;
      break;
    }
    case 'motor': body = repairRow('propulsao') + `<p class="small">Consumo de cruzeiro: ${fmt(8 * routeObj().fuel * cruiseObj().fuel, 1)} kg/dia${sysHp('propulsao') < 50 ? ' <span class="red">(+30% por dano)</span>' : ''}.</p>` + peç; break;
    case 'antena': body = repairRow('comunicacao') + `<h4>Mensagens da Terra</h4><div class="evlog">${S.log.filter(l => l.kind === 'earth' || l.kind === 'ai').slice(-5).map(l => `<div>${esc(l.text)}</div>`).join('') || '<div class="muted">Sem mensagens recentes.</div>'}</div>` + peç; break;
    case 'lab': body = `<div class="kv"><span>Dados coletados</span><b>${fmt(S.res.dados, 0)} GB</b><span>Laboratório</span><b>${has('lab') ? 'instalado' : 'básico'}</b></div>
      <label class="check"><input type="checkbox" data-actcheck="research" ${S.researchOn ? 'checked' : ''}> Pesquisa ligada (gasta energia, gera dados)</label>`; break;
    case 'enfermaria': body = `<div class="kv"><span>Recursos médicos</span><b>${fmt(S.res.medicos, 0)}</b><span>Remédios válidos até</span><b class="${S.day > S.meds.validUntil ? 'red' : ''}">dia ${S.meds.validUntil}${S.day > S.meds.validUntil ? ' (VENCIDOS)' : ''}</b></div>
      <div class="row"><button class="btn small" data-act="replaceMeds">Trocar lote de remédios (2 recursos)</button></div>
      <h4>Tripulação</h4>${S.crew.map(c => `<div class="sysline"><span>${esc(c.roleName)} ${esc(c.name)}</span><em>${!c.alive ? '☠' : c.sickness ? 'doente' : c.status}</em>${c.alive && (c.status !== 'ok' || c.sickness) ? `<button class="btn tiny" data-act="treat" data-p='${J({ id: c.id })}'>Tratar</button>` : ''}</div>`).join('')}
      <p class="small muted">Aparelhos: kit de primeiros socorros, termômetro, oxímetro, medidor de pressão, máscara e tanque de O₂, scanner médico, estetoscópio, kit de remédios e maca.</p>`; break;
    case 'avionica': body = Object.keys(SYSTEMS).map(repairRow).join('') + peç; break;
    case 'termico': body = repairRow('termico') + `<div class="kv"><span>Espessura do escudo</span><b>${fmt(S.res.escudo, 1)} mm</b></div><p class="small">No espaço o calor só sai por radiação. O cobertor multicamadas (MLI) e os radiadores mantêm a nave entre 18 °C e 26 °C.</p>`; break;
    case 'tanqueAux': case 'bomba': body = repairRow('tanques') + `<div class="kv"><span>Combustível</span><b>${fmt(S.res.combustivel, 0)} / ${S.cap.combustivel} kg</b></div>` + peç; break;
    case 'suporte': {
      const n = alive().length;
      body = repairRow('suporte') + `<h4>Dados do suporte à vida (referência ISS)</h4><div class="kv">
        <span>Consumo de O₂</span><b>${fmt(NASA.o2PorPessoaDia * n, 2)} kg/dia (0,84 kg/pessoa)</b><span>Eletrólise (OGS)</span><b>+${fmt(NASA.ogsO2Dia * sysHp('suporte') / 100, 1)} kg/dia de O₂</b>
        <span>Reciclagem de água</span><b>${has('reciclaAgua') ? '98% (ciclo fechado)' : '70% (básico)'}</b><span>Uso de água</span><b>${fmt(NASA.aguaPorPessoaDia * n, 1)} L/dia</b>
        <span>CO₂ produzido</span><b>${fmt(NASA.co2PorPessoaDia * n, 1)} kg/dia</b></div>` + peç;
      break;
    }
    case 'lixo': {
      const tm = trashMode(), rec = has('reciclaLixo'), imp = has('impressora');
      const opts = [['reciclar', 'Reciclar', rec ? '1,4 kg/dia → adubo' + (imp ? ' e peças (6 kg = 1 peça)' : '') + ' · gasta energia' : 'precisa do Reciclador de lixo', !rec], ['compostar', 'Compostar', '0,7 kg/dia → metade vira adubo', false], ['ejetar', 'Ejetar', 'joga fora pela Eclusa acima de 8 kg · nada é reaproveitado', false]];
      body = `<div class="kv"><span>Lixo a bordo</span><b>${fmt(S.res.lixo, 1)} kg</b><span>Reciclador</span><b>${rec ? 'instalado' : 'não'}</b><span>Oficina 3D</span><b>${imp ? 'instalada' : 'não'}</b><span>Adubo</span><b>${fmt(S.adubo, 1)} kg</b><span>Peças</span><b>${S.peças}</b></div>
      <h4>Destino do lixo</h4><div class="opts">${opts.map(([k, n, d, off]) => `<button class="opt ${tm === k ? 'on' : ''} ${off ? 'cant' : ''}" ${off ? '' : `data-act="trashMode" data-p='${J({ mode: k })}'`}><b>${n}</b><span>${d}</span></button>`).join('')}</div>
      <div class="row"><button class="btn small" data-act="processTrash">Processar agora (3 kg · 2 kWh)</button></div>
      <h4>Como o lixo é reaproveitado</h4><p class="small">${esc(L('Lixo'))} → <b>${esc(L('adubo'))}</b> ${esc(L('(use na Estufa: nutrientes a 100% e mais colheita)'))} ${rec && imp ? '→ <b>' + esc(L('peças de reparo')) + '</b> (' + esc(L('Oficina 3D')) + ')' : ''}. ${esc(L('Restos de comida, cascas e plantas estragadas também viram lixo. Sem reaproveitar, o lixo vira peso e tira humor da tripulação.'))}</p>
      <p class="small">${esc(L('O lixo é o espelho da poluição que expulsou a humanidade da Terra. Acima de 15 kg ele tira humor da tripulação.'))}</p>`;
      break;
    }
    case 'eclusa': body = repairRow('acoplamento') + `<div class="row"><button class="btn small" data-act="ejectTrash">Ejetar lixo (${fmt(S.res.lixo, 1)} kg)</button></div>`; break;
    case 'dormitorio': { const me_ = me(); body = `<p class="small">${esc(L('Dormir e descansar recuperam o humor e o sono.'))}</p>
      <div class="sysline"><span>${esc(L('Você'))}</span>${bar(me_ ? me_.humor : 100, 100)}<b>${fmt(me_ ? me_.humor : 100, 0)}</b><button class="btn tiny primary" data-act="sleep">😴 ${esc(L('Dormir'))}</button><button class="btn tiny" data-act="rest">${esc(L('Descansar'))}</button></div>
      <h4>${esc(L('Tripulação'))}</h4>${S.crew.filter(c => c.alive && c.id !== U.me).map(c => `<div class="sysline"><span>${esc(c.name)}</span><small>😴</small>${bar(c.humor, 100)}<b>${fmt(c.humor, 0)}</b><button class="btn tiny" data-act="sleep" data-p='${J({ id: c.id })}'>${esc(L('Dormir'))}</button><button class="btn tiny" data-act="rest" data-p='${J({ id: c.id })}'>${esc(L('Descansar'))}</button>${has('hibernacao') ? `<button class="btn tiny" data-act="hibernate" data-p='${J({ id: c.id })}'>${c.hibernating ? 'Acordar' : 'Hibernar'}</button>` : ''}</div>`).join('')}
      <h4>Itens de lazer</h4><p class="small">${SHOP.filter(i => Save.owns(i.id) && i.moral).map(i => i.name).join(', ') || 'Nenhum (compre na Loja da tela inicial).'}</p>`; break; }
    case 'estufa': body = farmPanel(); break;
    case 'cozinha': body = kitchenPanel(); break;
  }
  return `<div class="modal-bg" data-ui="closePanel"><div class="panel station" data-stop="1"><button class="x" data-ui="closePanel">✕</button><h2>${st.name}</h2>${body}</div></div>`;
}
function farmPanel() {
  if (!S.trays.length) return '<p>Sem estufa hidropônica nem kit de ervas. Não há bandejas de cultivo a bordo.</p>';
  const sel = U.farmSel == null ? 0 : U.farmSel;
  const t = S.trays[sel];
  const grid = S.trays.map((tr, i) => `<button class="tray ${i === sel ? 'sel' : ''} ${tr.state}" data-ui="farmSel" data-arg="${i}">${tr.crop ? `<b style="color:${CROPS[tr.crop].color}">${CROPS[tr.crop].name.split(' ')[0]}</b><span>${tr.state === 'pronto' ? esc(L(K('COLHER', 'HARVEST', 'COSECHAR'))) + ' ' + Math.ceil(tr.readyT) + 's' : tr.state === 'estragado' ? esc(L(K('estragou', 'spoiled', 'estropeado'))) : Math.floor(tr.g * 100) + '%'}</span>` : '<span>vazia</span>'}</button>`).join('');
  let detail = '';
  if (!t.crop) detail = `<h4>Plantar na bandeja ${sel + 1}</h4><div class="opts">${Object.entries(CROPS).map(([k, c]) => `<button class="opt" data-act="plant" data-p='${J({ i: sel, crop: k })}'><b>${c.name}</b><span>${c.days} dias · ${c.yield} kg · ${c.water} L${c.needs ? ' · requer biorreator' : ''}</span></button>`).join('')}</div>`;
  else if (t.state === 'crescendo') detail = `<h4>${CROPS[t.crop].name} — ${Math.floor(t.g * 100)}%</h4>${['luz', 'agua', 'nutr'].map(w => `<div class="sysline"><span>${{ luz: 'Luz', agua: 'Água', nutr: 'Nutrientes' }[w]}</span>${bar(t[w], 100)}<button class="btn tiny" data-act="care" data-p='${J({ i: sel, what: w })}'>+</button></div>`).join('')}<div class="row"><button class="btn tiny" data-act="sacrificeTray" data-p='${J({ i: sel })}'>Sacrificar bandeja (economiza água)</button></div>`;
  else detail = `<div class="row"><button class="btn primary" data-act="harvest" data-p='${J({ i: sel })}'>${t.state === 'pronto' ? 'Colher agora' : 'Limpar bandeja'}</button></div>`;
  return `<p class="small">${L('Mantenha luz, água e nutrientes no verde. A janela de colheita dura 1 minuto: colher tarde estraga. Diversificar protege contra pragas.')} ${roleAlive('agricultor') ? L('O agricultor cuida das plantas quando pode.') : ''}</p>
    <div class="trays">${grid}</div><div class="row"><button class="btn tiny" data-act="careAll">Cuidar de todas</button></div>${detail}
    <div class="kv"><span>Plantação (biomassa)</span><b>${fmt(S.res.plantacao, 1)} kg</b><span>Adubo</span><b>${fmt(S.adubo, 1)} kg</b></div>`;
}
// cozinha simples: comer e escolher o tamanho das porções
function kitchenPanel() {
  const fd = S.food; const fo = foodOutlook(); const mm = me();
  const ok = fo.days >= fo.left;
  const eat = mm && mm.alive ? `<div class="kbig"><div class="kbar"><span>🍴 ${esc(L('Sua fome'))}</span>${bar(mm.saciedade, 100)}<b>${fmt(mm.saciedade, 0)}%</b></div><button class="btn primary big" data-act="eat">🍴 ${esc(L('Comer agora'))}</button></div>` : '';
  const food = `<div class="foodstat ${fo.days < 2 ? 'bad' : ok ? 'ok' : 'warn'}"><b class="big">🍱 ${fmt(S.res.comida, 0)} kg</b> · ${esc(L('dura'))} ≈ <b>${fmt(fo.days, 0)}</b> ${esc(L('dias'))}${S.stage === 1 ? ` · ${esc(L('viagem restante'))} ≈ <b>${fo.left}</b> ${esc(L('dias'))} ${ok ? '✔' : '⚠'}` : ''}</div>`;
  const opts = [['pleno', '🍲', 'Normal', 1], ['reduzido', '🥣', 'Média', 1.5], ['minimo', '🥄', 'Mínima', 3]].map(([k, ic, n, mult]) => {
    const days = S.res.comida / (0.6 * fo.n) * mult; const reach = days >= fo.left;
    return `<button class="opt port ${fd.racionamento === k ? 'on' : ''}" data-act="ration" data-p='${J({ level: k })}'><b>${ic} ${esc(L(n))}</b><span class="big">≈ ${fmt(days, 0)} ${esc(L('dias'))}</span>${S.stage === 1 ? `<span class="${reach ? 'green' : 'red'}">${reach ? '✔ ' + esc(L('chega a Pontes-01b')) : '✖ ' + esc(L('acaba antes de chegar'))}</span>` : ''}<small>${esc(L(k === 'pleno' ? 'tripulação mais feliz' : k === 'reduzido' ? 'equilibrada' : 'humor cai muito · risco de desmaio'))}</small></button>`;
  }).join('');
  return eat + food + `<h4>${esc(L('Tamanho das porções'))}</h4><div class="opts portions">${opts}</div>`;
}

// ---------- relatório, tripulação, fundo, menu ----------
function reportPanel() {
  const tab = U.tab || 'recursos';
  const tabs = `<div class="tabs">${[['recursos', 'Recursos'], ['sistemas', 'Sistemas'], ['tripulacao', 'Tripulação']].map(([k, n]) => `<button class="chip ${tab === k ? 'on' : ''}" data-ui="tab" data-arg="${k}">${n}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'recursos') {
    body = `<table class="rep"><tr><th>Recurso</th><th>Atual</th><th>Disp.</th><th>Entradas (hoje)</th><th>Saídas (hoje)</th><th>Saldo total</th></tr>${RES_META.map(m => {
      const fd = S.flowsDay[m.id] || {}, ft = S.flowsTotal[m.id] || {};
      const inD = Object.values(fd).filter(v => v > 0).reduce((a, b) => a + b, 0), outD = Object.values(fd).filter(v => v < 0).reduce((a, b) => a + b, 0);
      const tot = Object.values(ft).reduce((a, b) => a + b, 0);
      const cap = m.id === 'lixo' ? null : S.cap[m.id];
      const reasons = Object.entries(ft).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 8).map(([k, v]) => `<div><span>${esc(k)}</span><b class="${v >= 0 ? 'green' : 'red'}">${v >= 0 ? '+' : ''}${fmt(v, 1)}</b></div>`).join('');
      return `<tr><td><details><summary>${m.icon} ${m.name}</summary><div class="reasons">${reasons || '<i>sem movimento</i>'}</div></details></td><td>${fmt(S.res[m.id], 1)} ${m.unit}</td><td>${cap ? fmt(S.res[m.id] / cap * 100, 0) + '%' : '—'}</td><td class="green">+${fmt(inD, 1)}</td><td class="red">${fmt(outD, 1)}</td><td>${tot >= 0 ? '+' : ''}${fmt(tot, 1)}</td></tr>`;
    }).join('')}</table><p class="small muted">Clique no nome de um recurso para ver as entradas e saídas por origem.</p>`;
  }
  if (tab === 'sistemas') body = Object.keys(SYSTEMS).map(k => `<div class="sysline"><span title="${esc(SYSTEMS[k].desc)}">${SYSTEMS[k].name}</span><em class="dmg ${SYSTEMS[k].dmg}">Dano ${SYSTEMS[k].dmg} (−${DMG_PCT[SYSTEMS[k].dmg]}%)</em>${bar(sysHp(k), 100)}<b>${fmt(sysHp(k), 0)}%</b></div><p class="small muted">${esc(SYSTEMS[k].desc)}</p>`).join('');
  if (tab === 'tripulacao') body = crewList();
  return `<div class="modal-bg" data-ui="closePanel"><div class="panel station wide" data-stop="1"><button class="x" data-ui="closePanel">✕</button><h2>Relatório da nave</h2>${tabs}${body}</div></div>`;
}
function crewList() {
  return `<div class="crewlist">${S.crew.map(c => `<div class="crew ${c.alive ? '' : 'dead'}"><img src="${spriteURL(c.avatar, 'suit', c.alive && c.humor >= 40 ? 'happy' : 'sad', 2)}" alt=""><div><b>${esc(c.name)}</b>${c.alive ? '' : ' 💀'} <small>${esc(c.roleName)}</small> ${c.owner && c.owner !== 'bot' ? '<span class="tag">🎮 jogador</span>' : '<span class="tag">🤖 bot</span>'}<br>
    ${c.alive ? `<div class="meters"><span>${esc(L('Humor e sono'))}</span>${bar(c.humor, 100)}<span>Saciedade</span>${bar(c.saciedade, 100)}<span>Nutrição</span>${bar(c.nutricao, 100)}<span>☢ ${esc(L('Radiação'))}</span>${bar(Math.min(c.rad || 0, 300), 300, '', true)}<small class="${(c.rad || 0) >= 250 ? 'red' : (c.rad || 0) >= 100 ? 'orange' : 'muted'}">${fmt(c.rad || 0, 0)} mSv</small><span class="nutr" title="${esc(L(NUTR_NAMES[0]))} / ${esc(L(NUTR_NAMES[1]))} / ${esc(L(NUTR_NAMES[2]))}">${(c.nut || [80, 80, 80]).map((v, i) => `<i class="n${i} ${v < 25 ? 'low' : ''}" style="height:${Math.round(v)}%"></i>`).join('')}</span></div>${c.nut && c.nut[2] < 25 ? `<small class="orange">${esc(L('Faltam vitaminas: sirva comida fresca.'))}</small><br>` : ''}<small><span>${c.hibernating ? '💤 ' + esc(L('hibernando')) : c.sickness ? '🤒 ' + esc(L('doente')) : c.status === 'ok' ? '✔ ok' : '✚ ' + esc(T(c.status))}</span>${c.task ? ' · <span>' + esc(T(c.task.label)) + '</span>' : ''} · ❤ ${esc(tagNames(c.likes))}${c.allergy.length ? ' · ' + esc(L('alergia')) + ': ' + esc(tagNames(c.allergy)) : ''}</small>` : '☠ morto'}</div></div>`).join('')}</div>`;
}
function fundPanel() {
  const o = S.scene === 'colony'
    ? [['peca', 'Peça de reposição', 2], ['medico', 'Tratamento médico urgente (todos)', 3], ['energia', 'Baterias de emergência (+20 kWh)', 2], ['agua', 'Água de emergência (+100 L)', 2], ['comida', 'Ração de emergência (+20 kg)', 2]]
    : [['peca', 'Peça de reposição', 2], ['medico', 'Tratamento médico urgente (todos)', 3], ['energia', 'Baterias de emergência (+20 kWh)', 2], ['oxigenio', 'Oxigênio de emergência (+15 kg)', 2]];
  return `<div class="modal-bg" data-ui="closePanel"><div class="panel station" data-stop="1"><button class="x" data-ui="closePanel">✕</button><h2>Fundo de contingência: ${S.fund} pts</h2><div class="opts">${o.map(([k, n, c]) => `<button class="opt ${S.fund < c ? 'cant' : ''}" data-act="fund" data-p='${J({ kind: k })}'><b>${n}</b><em>${c} pts</em></button>`).join('')}</div></div></div>`;
}
function menuPanel() {
  return `<div class="modal-bg" data-ui="closePanel"><div class="panel center" data-stop="1"><h2>PAUSA</h2>
    <div class="menu"><button class="mbtn" data-ui="closePanel">▶ Continuar</button><button class="mbtn" data-ui="qSettingsOpen">⚙ Configurações</button>${Net.role !== 'client' ? `<button class="mbtn" data-ui="saveNow">💾 ${esc(L('Salvar progresso'))}</button>` : ''}<button class="mbtn" data-ui="fullscreen">⛶ ${esc(L('Tela cheia'))}</button>
    ${U.confirmQuit ? '<button class="mbtn red" data-ui="quit">Confirmar: sair para o título</button>' : '<button class="mbtn" data-ui="quitAsk">⏏ Sair para o título</button>'}</div>
    <div class="row" style="justify-content:center">${LANGS.map(l => `<button class="chip ${I18n.lang === l.id ? 'on' : ''}" data-ui="setLang" data-arg="${l.id}">${l.label}</button>`).join('')}</div>
    <p class="small muted keyshelp">${esc(L('← → andar · ↑ ↓ escadas · Shift correr · E / Espaço interagir · J pular · H computador de bordo · R relatório · T tripulação · Esc menu'))}</p>
    <p class="small muted">Pontos desta jornada: ${S.points} · Créditos: ${Save.data.credits}</p></div></div>`;
}

// ---------- zona de trocas da Ponte-Alfa ----------
const TRADE_RES = { dados: ['💾', 'Dados científicos', 'GB'], comida: ['🍱', 'Ração', 'kg'], agua: ['💧', 'Água', 'L'], energia: ['⚡', 'Energia', 'kWh'], medicos: ['✚', 'Recursos médicos', 'un'], plantacao: ['🌱', 'Plantação', 'kg'], peças: ['⚙', 'Peças', 'un'] };
const tradeHave = k => k === 'peças' ? S.peças : S.res[k];
function tradeZone() {
  const fo = foodOutlook(); const short = fo.days < fo.left; const tight = !short && fo.days < fo.left * 1.25;
  const stock = Object.entries(TRADE_RES).map(([k, [ic, nm, u]]) => `<div class="tz-res ${k === 'comida' ? (short ? 'bad' : tight ? 'warn' : 'ok') : ''}"><span>${ic}</span><small>${esc(L(nm))}</small><b>${fmt(tradeHave(k), 0)} ${u}</b></div>`).join('');
  const verdict = short ? `<div class="alert bad">🍱 ${esc(L('A ração NÃO chega a Pontes-01b'))}: ${esc(L('dura'))} ≈ <b>${fmt(fo.days, 0)}</b> ${esc(L('dias'))}, ${esc(L('faltam'))} ≈ <b>${fo.left}</b> ${esc(L('dias de viagem'))}. ${esc(L('Faltam'))} ≈ <b>${fmt(Math.ceil((fo.left - fo.days) * fo.perDay), 0)} kg</b>. ${esc(L('Troque dados por ração ou racione na Cozinha.'))}</div>`
    : `<div class="alert ${tight ? 'warn' : 'good'}">🍱 ${esc(L('Ração para'))} ≈ <b>${fmt(fo.days, 0)}</b> ${esc(L('dias'))} · ${esc(L('viagem restante'))} ≈ <b>${fo.left}</b> ${esc(L('dias'))}${tight ? ' — ' + esc(L('margem apertada')) : ' — ' + esc(L('suficiente'))}</div>`;
  const card = t => {
    const [gk, gn] = t.give; const [ic, nm, u] = TRADE_RES[gk]; const have = tradeHave(gk); const ok = t.can();
    let getHtml;
    if (t.get) { const [rk, rn] = t.get; const [ric, rnm, ru] = TRADE_RES[rk]; getHtml = `<span class="tz-get">+${rn} ${ru} ${ric} ${esc(L(rnm))}<small>${fmt(tradeHave(rk), 0)} → ${fmt(tradeHave(rk) + rn, 0)}</small></span>`; }
    else getHtml = `<span class="tz-get">${esc(L(t.getTxt))}</span>`;
    let note = '';
    if (!ok) note = have < gn ? `<em class="red">${esc(L('Falta'))} ${fmt(gn - have, 0)} ${u}</em>` : `<em class="muted">${esc(L('indisponível'))}</em>`;
    else if (t.id === 'racao' && short) note = `<em class="yellow">★ ${esc(L('recomendado'))}</em>`;
    else if (gk === 'comida' && (S.res.comida - gn) / fo.perDay < fo.left) note = `<em class="red">⚠ ${esc(L('a ração não chegaria ao destino'))}</em>`;
    return `<button class="tz-card ${ok ? '' : 'cant'} ${t.id === 'racao' && short ? 'rec' : ''}" data-act="trade" data-p='${J({ id: t.id })}'><span class="tz-give">−${gn} ${u} ${ic} ${esc(L(nm))}<small>${ok ? fmt(have, 0) + ' → ' + fmt(have - gn, 0) : fmt(have, 0)}</small></span><span class="tz-arrow">➜</span>${getHtml}${note}</button>`;
  };
  return `<div class="tradezone"><h4>${esc(L('Seu estoque'))}</h4><div class="tz-stock">${stock}</div>${verdict}
    <h4>${esc(L('Ofertas da estação'))} <small class="muted">${esc(L('você dá → você recebe'))}</small></h4><div class="tz-list">${TRADES.map(card).join('')}</div>
    <p class="small muted">${esc(L('Dados valem pontos de ciência, mas comida mantém a tripulação viva.'))} ${esc(L('Trocas feitas'))}: ${S.explore.trades}</p></div>`;
}

// ---------- estágios finais ----------
function stationScreen() {
  const tab = U.tab || 'exo';
  const tabs = `<div class="tabs">${[['exo', 'Exploração científica'], ['escambo', 'Escambo']].map(([k, n]) => `<button class="chip ${tab === k ? 'on' : ''}" data-ui="tab" data-arg="${k}">${n}</button>`).join('')}</div>`;
  let body = '';
  const dest = S.explore.dest; const dexo = EXOPLANETS.find(e => e.id === dest);
  if (tab === 'exo') {
    body = `<p class="small">${esc(L(K('Compare exoplanetas reais com Pontes-01b. Cada análise custa ' + (has('lab') ? 5 : 10) + ' GB. Só Pontes-01b pode receber a tripulação: escolha-o como destino.', 'Compare real exoplanets with Pontes-01b. Each analysis costs ' + (has('lab') ? 5 : 10) + ' GB. Only Pontes-01b can host the crew: pick it as the destination.', 'Compare exoplanetas reales con Pontes-01b. Cada análisis cuesta ' + (has('lab') ? 5 : 10) + ' GB. Solo Pontes-01b puede recibir a la tripulación: elíjalo como destino.')))}</p>
      <div class="exos">${EXOPLANETS.map(e => {
        const an = S.explore.analyzed.includes(e.id); const vis = S.explore.visited && S.explore.visited[e.id];
        const dist = typeof e.dist === 'number' ? fmt(e.dist, 1) + ' ' + L('anos-luz') : L('na rota');
        return `<div class="exo ${dest === e.id ? 'on' : ''} ${vis ? 'visited' : ''} ${S.explore.wrongOnce ? (e.id === 'pontes' ? 'guide' : 'locked') : ''}">${planetImg(e.id, 96, 'thumb')}<b>${e.name}</b>${vis ? ` <em class="red">✖ ${esc(L('visitado: inabitável'))}</em>` : ''}${an || vis ? `<div class="kv small"><span>${esc(L('Distância'))}</span><b>${dist}</b><span>${esc(L('Raio/massa'))}</span><b>${I18n.lang === 'en' ? e.radius.replace(/(\d),(\d)/g, '$1.$2').replace('massa mín.', 'min. mass') : e.radius}</b><span>${esc(L('Gravidade'))}</span><b>${EXO_GRAV[e.id] ? (I18n.lang === 'en' ? EXO_GRAV[e.id].replace(',', '.') : EXO_GRAV[e.id]) : '—'}</b><span>${esc(L('Temp. de equilíbrio'))}</span><b>${e.teq} K</b><span>${esc(L('Ano'))}</span><b>${e.period} ${esc(L('dias'))}</b><span>${esc(L('Distância orbital'))}</span><b>${e.sma} ${I18n.lang === 'en' ? 'AU' : 'UA'}</b><span>${esc(L('Descoberta'))}</span><b>${esc(T(e.disc))}</b><span>${esc(L('Estrela'))}</span><b>${esc(T(e.star))}</b><span>ESI</span><b>${e.esi}</b></div><p class="small muted">${esc(T(e.issues))}</p>` : `<button class="btn tiny" data-act="analyzeExo" data-p='${J({ id: e.id })}'>${esc(L('Analisar'))}</button>`}
        ${S.explore.wrongOnce
          ? (e.id === 'pontes' ? `${S.explore.guideAt ? '<div class="bigarrow">⬇</div>' : ''}<button class="btn primary ${S.explore.guideAt ? 'must' : ''}" data-act="goPontes">🚀 ${esc(L('Ir para Pontes-01b'))}</button>` : '')
          : `<button class="btn tiny ${dest === e.id ? 'primary' : ''}" data-act="setDest" data-p='${J({ id: e.id })}'>${dest === e.id ? '✔ ' : ''}${esc(L('Destino'))}</button>`}</div>`;
      }).join('')}</div>`;
  } else body = tradeZone();
  let foot = '';
  if (dexo && dexo.id !== 'pontes') {
    const c = tripCost(dexo);
    const short = S.res.combustivel < c.fuel;
    foot = `<div class="alert ${short ? 'bad' : 'warn'}">${esc(L('Destino'))}: <b>${dexo.name}</b> — ⛽ ${c.fuel} kg · O₂ ${c.o2} kg · 🍱 ${c.food} kg · ${c.days} ${esc(L('dias'))}${short ? ' — ' + esc(L('COMBUSTÍVEL INSUFICIENTE: a nave ficará à deriva!')) : ' — ' + esc(L('este não é o planeta planejado. Tem certeza?'))}</div>`;
  } else if (dexo) foot = `<div class="alert good">${esc(L('Destino'))}: <b>Pontes-01b</b> — ${esc(L('na rota, sem custo extra'))}</div>`;
  else foot = `<div class="alert info">${esc(L('Escolha um planeta de destino para partir.'))}</div>`;
  return `<div class="stage-panel"><h2>ESTAÇÃO PONTE-ALFA</h2>${miniRes()}${tabs}<div class="scroll">${body}</div>${foot}
    <div class="row"><button class="btn primary" data-act="leaveStation" ${dest ? '' : 'disabled'}>${esc(L('Partir ▶'))}</button></div></div>`;
}
function detourScreen() {
  const d = S.detour; const exo = EXOPLANETS.find(e => e.id === d.id); const c = tripCost(exo, true);
  const short = S.res.combustivel < c.fuel;
  const kv = (a, b) => `<span>${esc(L(a))}</span><b>${b}</b>`;
  return `<div class="stage-panel"><h2>${esc(L('DESVIO DE ROTA: '))}${exo.name}</h2>${miniRes()}<div class="scroll">
    <div class="alert bad">⚠ ${esc(L('Este não é Pontes-01b. A viagem custou combustível, oxigênio, comida e dias — e a moral caiu.'))}</div>
    <div class="phero">${planetImg(exo.id, 220, 'hero')}<div><h4>${esc(L('O que a tripulação encontrou'))}</h4><p>${esc(L(exo.trip.outcome))}</p></div></div>
    <h4>${esc(L('Dados'))}</h4>
    <div class="kv small">${kv('Distância', typeof exo.dist === 'number' ? fmt(exo.dist, 1) + ' ' + L('anos-luz') : '—')}${kv('Raio/massa', exo.radius)}${kv('Temp. de equilíbrio', exo.teq + ' K')}${kv('Ano', exo.period + ' ' + L('dias'))}${kv('Estrela', esc(T(exo.star)))}${kv('Descoberta', esc(T(exo.disc)))}${kv('ESI', exo.esi)}</div>
    <p class="green">+${d.dados} GB ${esc(L('de dados científicos coletados.'))}</p>
    </div><div class="alert ${short ? 'bad' : 'warn'}">${esc(L('Voltar à Estação Ponte-Alfa custa'))}: ⛽ ${c.fuel} kg · O₂ ${c.o2} kg · 🍱 ${c.food} kg · ${c.days} ${esc(L('dias'))}${short ? ' — ' + esc(L('combustível insuficiente!')) : ''}</div>
    <div class="row"><button class="btn primary big" data-act="detourReturn">↩ ${esc(L('Voltar à Estação Ponte-Alfa'))}</button></div></div>`;
}
function miniRes() { return `<div class="minires">${['energia', 'combustivel', 'agua', 'oxigenio', 'comida', 'dados'].map(k => { const m = RES_META.find(x => x.id === k); return `<span>${m.icon} ${fmt(S.res[k], 0)} ${m.unit}</span>`; }).join('')}<span>✚ ${fmt(S.res.medicos, 0)}</span><span>⚙ ${S.peças} peças</span></div>`; }
// órbita de Pontes-01b em 3 passos: analisar → preparar a tripulação → escolher onde pousar
const KEY_ANALYSES = ['atmosfera', 'agua', 'solo', 'radiacao'];
function planetScreen() {
  const P = S.planet;
  const nA = KEY_ANALYSES.filter(id => P.analyzed.includes(id)).length;
  const nC = P.challenges.length, allC = nC >= CHALLENGES.length;
  const step = (n, done, title, sub, body) => `<div class="pstep ${done ? 'done' : ''}"><div class="pnum">${done ? '✔' : n}</div><div><b>${esc(L(title))}</b><small>${esc(L(sub))}</small>${body}</div></div>`;
  const an = KEY_ANALYSES.map(id => { const a = PLANET_ANALYSES.find(x => x.id === id); const d = P.analyzed.includes(id); return d ? `<div class="pres">✔ <b>${esc(T(a.name))}</b> <span>${esc(T(a.result))}</span></div>` : `<button class="btn" data-act="planetAnalyze" data-p='${J({ id })}'>🔬 ${esc(T(a.name))}</button>`; }).join('');
  const ch = allC ? P.challenges.map(c => { const d = CHALLENGES.find(x => x.id === c.id); return `<div class="pres ${c.ok ? '' : 'bad'}">${c.ok ? '✔' : '✖'} <b>${esc(T(d.name))}</b>${c.ok ? '' : ` <span>${esc(T(c.txt))}</span>`}</div>`; }).join('')
    : `<button class="btn" data-act="prepCrew" ${nA < KEY_ANALYSES.length ? 'disabled' : ''}>🧑‍🚀 ${esc(L('Preparar a tripulação'))}</button>`;
  return `<div class="stage-panel"><h2>${esc(L('O NOVO MUNDO: PONTES-01b'))}</h2>${miniRes()}<div class="scroll">
    <div class="phero">${planetImg('pontes', 220, 'hero')}<p class="lead">${esc(L('Antes de descer, descubra se o planeta é seguro e prepare a tripulação.'))}</p></div>
    ${step(1, nA >= KEY_ANALYSES.length, 'Analise o planeta', `${nA}/${KEY_ANALYSES.length} · ` + L('cada análise gasta dados e energia'), `<div class="pbtns">${an}</div>`)}
    ${step(2, allC, 'Prepare a tripulação', 'aclimatação ao ar, primeira plantação e abrigo na superfície', `<div class="pbtns">${ch}</div>`)}
    ${step(3, false, 'Escolha onde pousar', 'o computador indica o melhor lugar', `<div class="pbtns"><button class="btn primary" data-act="toMigration" ${allC ? '' : 'disabled'}>🛬 ${esc(L('Escolher o local de pouso'))} ▶</button></div>`)}
    <details class="evinfo"><summary>⚙ ${esc(L('Órbita (opcional)'))}</summary><!--orbit--></details>
    </div></div>`;
}
// prepara a tripulação: os 3 testes de adaptação de uma vez
ACTIONS.prepCrew = () => { if (S.scene !== 'planet') return; for (const ch of CHALLENGES) if (!S.planet.challenges.find(c => c.id === ch.id)) ACTIONS.challenge({ id: ch.id }); };

function migrationScreen() {
  return `<div class="stage-panel"><h2>MIGRAÇÃO</h2>${miniRes()}<div class="scroll"><p class="small">Escolha onde a expedição vai pousar. O que você analisou aparece em detalhes; o resto é risco.</p>
    <div class="opts">${LANDING_SITES.map(s => `<button class="opt ${S.planet.site === s.id ? 'on' : ''} ${s.id === bestSite().id ? 'rec' : ''}" data-act="chooseSite" data-p='${J({ id: s.id })}'><b>${s.name}${s.id === bestSite().id ? ` <em class="yellow">★ ${esc(L('ideal'))}</em>` : ''}</b><span>✔ ${s.pros}</span><span>✖ ${s.cons}</span><em>${Object.keys(s.score).map(k => S.planet.analyzed.includes(k) ? `${T(PLANET_ANALYSES.find(a => a.id === k).name)}: ${T(s.score[k] > 0 ? 'bom' : s.score[k] < 0 ? 'ruim' : 'neutro')}` : `${T(PLANET_ANALYSES.find(a => a.id === k).name)}: ?`).join(' · ')}</em></button>`).join('')}</div>
    <p class="small">Pouso ${has('pouso') ? 'com a nave auxiliar (40 kg de combustível)' : 'com a nave principal — arriscado (80 kg de combustível)'}.</p></div>
    <div class="row"><button class="btn primary big" data-act="land">🛬 POUSAR</button></div></div>`;
}
// mensagem final em destaque: as linhas aparecem uma a uma
function endImpact(ok) {
  const lines = ok ? [
    ['Mas há uma coisa que você precisa saber:', ''],
    ['Pontes-01b não existe.', 'huge'],
    ['Ele é fictício. Os outros exoplanetas deste jogo são reais — e nenhum deles poderia receber a humanidade.', ''],
    ['Não existe planeta B.', 'huge red'],
    ['Na Terra, o solo, a chuva, a atmosfera e os polinizadores fazem de graça tudo o que, na nave, custou energia, tempo e vidas.', ''],
    ['A única Pontes-01b que temos é a Terra. Cuide dela.', 'big cyan'],
  ] : [
    ['Lá fora, cada grau, cada litro e cada quilo custam energia, tempo e vidas.', ''],
    ['Na Terra, tudo isso é de graça.', 'big'],
    ['É mais fácil manter a Terra habitável do que habitar outro planeta.', 'huge red'],
    ['Não existe planeta B. Cuide da Terra.', 'big cyan'],
  ];
  return `<div class="impact">${lines.map(([t, c], i) => `<p class="${c}" style="animation-delay:${(0.6 + i * 1.6).toFixed(1)}s">${esc(L(t))}</p>`).join('')}</div>`;
}
function endScreen() {
  const e = S.ending || { ok: false, reason: S.fail };
  const fl = S.flowsTotal;
  const spent = k => Math.abs(Object.values(fl[k] || {}).filter(v => v < 0).reduce((a, b) => a + b, 0));
  const fd = S.food;
  const humorAvg = alive().length ? alive().reduce((s, c) => s + c.humor, 0) / alive().length : 0;
  return `<div class="panel center wide scroll end ${e.ok ? 'ok' : 'bad'}">
    <h1>${e.ok ? (e.colony && !e.note ? esc(L('PONTES-01b: A COLÔNIA ESTÁ DE PÉ')) : 'CHEGAMOS A PONTES-01b') : 'MISSÃO FRACASSADA'}</h1>
    ${e.ok && e.note ? `<div class="alert good">${esc(L('A jornada terminou em Pontes-01b:'))} ${esc(T(e.note))}</div>` : ''}
    <p class="big">${e.ok ? (e.colony && !e.note ? esc(L(K('Em ' + e.site + ', a base cresceu, a Terra recebeu os dados e três naves trouxeram os primeiros colonos. A humanidade tem um novo começo — que custou caro.', 'At ' + e.site + ' the base grew, Earth received the data and three ships brought the first colonists. Humanity has a new beginning — and it came at a high cost.', 'En ' + e.site + ' la base creció, la Tierra recibió los datos y tres naves trajeron a los primeros colonos. La humanidad tiene un nuevo comienzo, que costó caro.'))) : `A expedição pousou no ${esc(e.site)}. A humanidade tem um novo começo — que custou caro.`) : esc(e.reason)}</p>
    ${endImpact(e.ok)}
    ${retryBlock()}
    <div class="homage">🇧🇷 ${esc(L(K('Em homenagem a Marcos Pontes, o primeiro astronauta brasileiro, que em 30 de março de 2006 partiu para a Estação Espacial Internacional na Missão Centenário.', 'In tribute to Marcos Pontes, the first Brazilian astronaut, who left for the International Space Station on March 30, 2006, on the Centenary Mission.', 'En homenaje a Marcos Pontes, el primer astronauta brasileño, que el 30 de marzo de 2006 partió hacia la Estación Espacial Internacional en la Misión Centenario.')))}</div>
    <div class="row"><button class="btn" data-ui="saveReport">💾 ${esc(L(K('Salvar relatório completo', 'Save full report', 'Guardar informe completo')))}</button></div>
    <div class="row"><button class="btn ${S.fail ? '' : 'primary'}" data-ui="journey">Jogar novamente</button><button class="btn" data-ui="saves">📂 ${esc(L(K('Jogos salvos', 'Saved games', 'Partidas guardadas')))}</button><button class="btn" data-ui="shop">✦ Loja (${Save.data.credits})</button><button class="btn" data-ui="quit">Título</button></div></div>`;
}

// relatório completo (números, perdas, desafios e o que foi aprendido): vai para um arquivo
function endDetails() {
  const e = S.ending || { ok: false, reason: S.fail };
  const fl = S.flowsTotal;
  const spent = k => Math.abs(Object.values(fl[k] || {}).filter(v => v < 0).reduce((a, b) => a + b, 0));
  const fd = S.food;
  const humorAvg = alive().length ? alive().reduce((s, c) => s + c.humor, 0) / alive().length : 0;
  return `${e.ok && e.colony && S.colony ? `<div class="kv"><span>${esc(L('População final'))}</span><b>${colonyPop()}</b><span>${esc(L('Dias na colônia'))}</span><b>${S.colony.day}</b><span>${esc(L('Construções'))}</span><b>${S.colony.built}</b><span>${esc(L('Pacotes de dados enviados à Terra'))}</span><b>${S.colony.txCount}</b><span>${esc(L('Exoplanetas visitados por engano'))}</span><b>${(S.explore && S.explore.wrong) || 0}</b></div>` : ''}
    <div class="kv"><span>Dias de viagem</span><b>${S.day}</b><span>Tripulantes vivos</span><b>${alive().length}/7</b><span>Pontos</span><b>${S.points}</b><span>Energia gasta</span><b>${fmt(spent('energia'), 0)} kWh</b><span>Combustível gasto</span><b>${fmt(spent('combustivel'), 0)} kg</b><span>Água consumida</span><b>${fmt(spent('agua'), 0)} L</b><span>Oxigênio respirado</span><b>${fmt(spent('oxigenio'), 0)} kg</b>
      <span>Comida produzida / desperdiçada</span><b>${fmt(fd.produced, 1)} / ${fmt(fd.wasted, 1)} kg</b><span>kWh e litros por kg de comida</span><b>${fd.produced > 0 ? fmt(S.stats.kwhFood / fd.produced, 1) + ' kWh · ' + fmt(S.stats.waterFood / fd.produced, 1) + ' L' : '—'}</b><span>Receitas descobertas</span><b>${fd.recipes.length}/${RECIPES.length}</b><span>Dias de mesa completa</span><b>${fd.mesaDays}</b><span>Humor médio</span><b>${fmt(humorAvg, 0)}</b>
      <span>${esc(L('Dose média de radiação'))}</span><b>${fmt(typeof avgDose === 'function' ? avgDose() : 0, 0)} mSv</b><span>Custo da regulação térmica</span><b>${fmt(S.stats.thermalKwh, 1)} kWh · ${fmt(S.stats.thermalFuel, 0)} kg</b></div>
    ${S.dead.length ? `<h4>Perdas</h4><p>${S.dead.map(d => `${esc(d.role)} ${esc(d.name)} (dia ${d.day}, ${esc(d.cause)})`).join('<br>')}</p>` : ''}
    <h4>Desafios</h4><p>${S.stats.events.map(x => `${EVENT_INFO[x.type].icon} ${EVENT_INFO[x.type].title}: <b class="${x.ok ? 'green' : 'red'}">${x.grade}</b>`).join('<br>') || '—'}</p>
    ${lessonReport()}`;
}

// =============== RENDERIZAÇÃO ===============
function renderUI() {
  let scr = '', hud = '', side = '', modal = '';
  if (!S || U.screen !== 'game') {
    const map = { saves: savesScreen, story: storyScreen, title: titleScreen, journey: journeyScreen, history: historyScreen, settings: () => settingsScreen(false), shop: shopScreen, quiz: quizScreen, avatar: () => U.avatarDirty ? avatarScreen() : U.cache.scr, lobby: lobbyScreen };
    scr = (map[U.screen] || titleScreen)();
    U.avatarDirty = false;
  } else if (Net.role === 'client' && !['earth', 'ship', 'station', 'detour', 'planet', 'migration', 'colony', 'end'].includes(S.scene)) {
    scr = `<div class="panel center"><h2>AGUARDANDO O COMANDANTE</h2><p class="muted">${{ intro: 'Narração da introdução', earth: 'Caminhando pela Terra poluída', setup: 'Montando a nave com a verba limitada', launch: 'Decolagem!' }[S.scene] || '...'}</p><p>Você é: <b>${esc(Net.myRoleName || '')}</b></p></div>`;
  } else {
    switch (S.scene) {
      case 'intro': scr = introScreen(); break;
      case 'earth': scr = earthScreen(); break;
      case 'setup': scr = U.setupDirty ? setupScreen() : U.cache.scr; U.setupDirty = false; break;
      case 'launch': scr = ''; break;
      case 'ship':
        hud = hudTop() + assistMini() + routineBox() + lessonCard() + hudBottom();
        side = eventPanel();
        if (U.panel === 'report') modal = reportPanel();
        else if (U.panel === 'crew') modal = `<div class="modal-bg" data-ui="closePanel"><div class="panel station wide" data-stop="1"><button class="x" data-ui="closePanel">✕</button><h2>Tripulação</h2>${crewList()}</div></div>`;
        else if (U.panel === 'fund') modal = fundPanel();
        else if (U.panel === 'menu') modal = menuPanel();
        else if (U.panel === 'settings') modal = `<div class="modal-bg">${settingsScreen(true)}</div>`;
        else if (U.panel && STATIONS[U.panel]) modal = stationPanel(U.panel);
        break;
      case 'station': scr = stationScreen(); break;
      case 'detour': scr = S.detour ? detourScreen() : ''; break;
      case 'colony':
        hud = colonyHud() + assistMini() + lessonCard();
        if (S.colony.tut === 0) modal = colonyIntro();
        else if (U.panel === 'fund') modal = fundPanel();
        else if (U.panel === 'menu') modal = menuPanel();
        else if (U.panel === 'settings') modal = `<div class="modal-bg">${settingsScreen(true)}</div>`;
        else if (U.panel === 'crew') modal = `<div class="modal-bg" data-ui="closePanel"><div class="panel station wide" data-stop="1"><button class="x" data-ui="closePanel">✕</button><h2>Tripulação</h2>${crewList()}</div></div>`;
        else if (U.panel && U.panel.startsWith('c:') && CBUILD[U.panel.slice(2)]) modal = colonyPanel(U.panel.slice(2));
        break;
      case 'planet': scr = planetScreen(); break;
      case 'migration': scr = migrationScreen(); break;
      case 'end': scr = endScreen(); break;
    }
  }
  if (S && U.screen === 'game' && !hud && !['intro', 'launch', 'end'].includes(S.scene) && !(S.scene === 'earth' && U.comms)) hud = assistMini() + lessonCard();
  if (U.help && S && U.screen === 'game') modal = helpPanel();
  // a configuração fica na barra rápida da esquerda (sem botão ⚙ isolado)
  if (U.settingsOpen && S && U.screen === 'game') modal = `<div class="modal-bg">${settingsScreen(true).replace('data-ui="closePanel"', 'data-ui="gearClose"').replace('</h2>', '</h2><div class="row" style="justify-content:center">' + LANGS.map(l => `<button class="chip ${I18n.lang === l.id ? 'on' : ''}" data-ui="setLang" data-arg="${l.id}">${l.label}</button>`).join('') + '</div>')}</div>`;
  if (U.voicePick) modal = voicePickPanel();
  sitePlayMode();
  const gameEl = document.getElementById('game'); const sc = S && U.screen === 'game' ? S.scene : 'menu'; if (gameEl.dataset.scene !== sc) gameEl.dataset.scene = sc;
  { const ov = (!!modal || !!U.help || !!(U.earth && S && S.scene === 'earth' && (U.earth.panel || U.earth.dialog || U.earth.diary || U.comms))) ? '1' : ''; if (gameEl.dataset.ov !== ov) gameEl.dataset.ov = ov; }
  setHTML('scr', scr); setHTML('hud', hud); setHTML('side', side); setHTML('modal', modal);
  document.getElementById('side').className = S && S.event && S.event.type === 'termico' && S.event.phase === 'run' ? 'wide' : '';
  // toast
  const tt = S && S.toast;
  const th = tt ? `<div class="toast ${tt.kind}">${esc(L(tt.text))}${tt.tip ? '<br>💡 ' + esc(L(tt.tip)) : ''}</div>` : '';
  setHTML('toast', th);
  if (tt && U.lastToast !== tt.id) { U.lastToast = tt.id; if (tt.kind === 'bad') Sfx.bad(); else if (tt.kind === 'good') Sfx.ok(); }
  if (S && S.narration && U.lastNarr !== S.narration.id) { U.lastNarr = S.narration.id; Narrator.say(L(S.narration.text)); }
}

// =============== HANDLERS ===============
const UIH = {};
UIH.saveReport = () => {
  if (!S) return;
  const e = S.ending || { ok: false, reason: S.fail };
  const title = e.ok ? 'Pontes01 — Relatório da jornada' : 'Pontes01 — Relatório da missão';
  const date = new Date();
  const body = I18n.dom(`<h1>${esc(L(title))}</h1><p>${esc(date.toLocaleString())} · ${esc(L(S.journey === 'curta' ? 'Jornada Curta' : 'Jornada Completa'))}</p>
    <h2>${e.ok ? esc(L('Resultado')) + ': ✔' : esc(L('Resultado')) + ': ✖ ' + esc(T(e.reason || ''))}</h2>${e.note ? `<p>${esc(T(e.note))}</p>` : ''}${endDetails()}`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(L(title))}</title><style>body{font-family:system-ui,sans-serif;max-width:760px;margin:24px auto;padding:0 16px;background:#0b1026;color:#e8ecf6}.kv{display:grid;grid-template-columns:1fr auto;gap:4px 16px;margin:12px 0}.green{color:#46e08a}.red{color:#ff6a6a}h4{margin-top:18px}</style></head><body>${body}</body></html>`;
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    a.download = 'pontes01-relatorio-' + date.toISOString().slice(0, 10) + '.html';
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toastLocal(K('Relatório salvo.', 'Report saved.', 'Informe guardado.'));
  } catch (er) { toastLocal(K('Não foi possível salvar o relatório.', 'Could not save the report.', 'No se pudo guardar el informe.')); }
};
UIH.voiceTest = () => { Narrator.voice = null; Narrator.say('Olá, Comandante. Esta é a voz da missão Pontes-01b.'); };
UIH.hudFull = () => { U.hudFull = !U.hudFull; };
UIH.playMenu = () => {
  // primeira vez: vai direto à jornada (curta) e ao passo a passo, sem escolher opções
  if (!Save.data.firstPlayed && !Save.data.runs && !GameSave.list().length && !U.playMenu) { Save.data.firstPlayed = true; Save.write(); U.playMenu = false; return UIH.startGame('curta'); }
  U.playMenu = !U.playMenu;
};
UIH.title = () => { U.playMenu = false; U.screen = 'title'; Music.play('intro'); };
UIH.journey = () => { U.screen = 'journey'; S = null; };
UIH.history = () => { U.screen = 'history'; };
UIH.settings = () => { U.screen = 'settings'; };
UIH.gearOpen = () => { U.settingsOpen = true; };
UIH.gearClose = () => { U.settingsOpen = false; };
// clicar na barra de interação = apertar E
UIH.interactNow = () => { if (S && S.scene === 'earth') cityInteract(); else interact(); };
UIH.shop = () => { U.screen = 'shop'; S = S && S.scene === 'end' ? null : S; };
UIH.lobby = () => { U.screen = 'lobby'; };
UIH.buy = id => { const it = SHOP.find(i => i.id === id); if (!it || Save.owns(id) || Save.data.credits < it.price) return; Save.data.credits -= it.price; Save.data.owned.push(id); Save.write(); Sfx.ok(); };
UIH.avatar = () => { U.screen = 'avatar'; U.avatarDraft = JSON.parse(JSON.stringify(Object.assign({}, DEFAULT_AVATAR, Save.data.avatar || {}))); if (U.avatarDraft.name === 'Comandante') U.avatarDraft.name = 'Commander'; U.avatarDirty = true; };
UIH.av = arg => { const [k, v] = arg.split(':'); U.avatarDraft[k] = +v; U.avatarDirty = true; };
UIH.avc = arg => { const i = arg.indexOf(':'); U.avatarDraft[arg.slice(0, i)] = arg.slice(i + 1) || null; U.avatarDirty = true; };
UIH.avs = arg => { const [k, v] = arg.split(':'); U.avatarDraft[k] = v; U.avatarDirty = true; };
UIH.avt = k => { U.avatarDraft[k] = !U.avatarDraft[k]; U.avatarDirty = true; };
UIH.avPreset = g => {
  const n = U.avatarDraft.name, keep = { skin: U.avatarDraft.skin, suit: U.avatarDraft.suit, name: n };
  U.avatarDraft = Object.assign(randomAvatar(Math.random, g === 'fem'), keep);
  U.avatarDirty = true;
};
UIH.avRandom = () => { const n = U.avatarDraft.name; U.avatarDraft = Object.assign(randomAvatar(), { name: n, suit: Math.floor(Math.random() * SUIT_COLORS.length) }); U.avatarDirty = true; };
UIH.paintColor = c => { U.paintColor = c; U.avatarDirty = true; };
UIH.paintClear = () => { U.avatarDraft.paint = {}; };
UIH.avSave = () => { if (U.avatarDraft) { delete U.avatarDraft.paint; U.avatarDraft.visor = DEFAULT_AVATAR.visor; } const n = $('#av-name'); if (n) U.avatarDraft.name = n.value.trim() || 'Commander'; Save.data.avatar = U.avatarDraft; Save.write(); Sfx.ok(); UIH.title(); };
function enterGameFullscreen() {
  try { if (screen.orientation && screen.orientation.lock && matchMedia('(pointer: coarse)').matches) screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* */ }
  const el = document.documentElement;
  try { if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) { /* sem permissão: o CSS já ocupa a janela */ }
}
function exitGameFullscreen() { try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) { /* */ } }
UIH.setLang = l => { const was = I18n.lang; I18n.set(l); if (l !== was) U.voicePick = true; };
// escolha da voz depois de trocar o idioma (as vozes do navegador variam muito de qualidade)
function voicePickPanel() {
  const st = Save.data.settings; const cur = (st.voices || {})[I18n.lang] || '';
  const list = Narrator.voices().slice(0, 10);
  const row = (name, label) => `<div class="vrow ${cur === name ? 'on' : ''}"><span>${esc(label)}</span><button class="btn tiny" data-ui="voiceTry" data-arg="${esc(name)}">▶ ${esc(L('Ouvir'))}</button><button class="btn tiny ${cur === name ? 'primary' : ''}" data-ui="voiceUse" data-arg="${esc(name)}">${cur === name ? '✔ ' : ''}${esc(L('Usar esta'))}</button></div>`;
  return `<div class="modal-bg"><div class="panel center voicepick" data-stop="1"><button class="x" data-ui="voiceClose">✕</button>
    <h2>🔊 ${esc(L('Escolha a voz do jogo'))}</h2><p class="small muted">${esc(L('Ouça e escolha a voz mais natural para este idioma. Dá para mudar depois nas configurações.'))}</p>
    ${list.length ? row('', L('Automática (a mais natural)')) + list.map(v => row(v.name, v.name + (v.localService ? '' : ' ☁'))).join('') : `<p class="orange">${esc(L('Este navegador não tem vozes para este idioma.'))}</p>`}
    <div class="row" style="justify-content:center"><button class="btn primary" data-ui="voiceClose">${esc(L('Pronto'))}</button></div></div></div>`;
}
UIH.voiceTry = name => {
  const v = name ? Narrator.voices().find(x => x.name === name) : null;
  Narrator.voice = v || null; if (!v) Narrator.pickVoice();
  const keep = Narrator.pickVoice; if (v) Narrator.pickVoice = () => v; // só para este teste
  Narrator.say(K('Olá, Comandante. Esta é a voz do computador de bordo.', 'Hello, Commander. This is the onboard computer voice.', 'Hola, Comandante. Esta es la voz de la computadora de a bordo.'));
  Narrator.pickVoice = keep;
};
UIH.voiceUse = name => { const st = Save.data.settings; st.voices = st.voices || {}; st.voices[I18n.lang] = name; Save.write(); Narrator.voice = null; Narrator.pickVoice(); };
UIH.voiceClose = () => { U.voicePick = false; };
UIH.fullscreen = () => { if (document.fullscreenElement) exitGameFullscreen(); else enterGameFullscreen(); };
UIH.startGame = journey => {
  enterGameFullscreen();
  const mode = Net.role === 'host' ? 'host' : 'solo';
  newGame(journey, mode);
  if (Net.role === 'host') Net.assignSeats();
  U.screen = 'game'; U.panel = null; U.me = 'cmd'; U.help = false; S.arca = Net.role ? Net.mySh : 1;
  S.scene = 'intro'; Music.play('intro');
  modeIntroStart(Net.role === 'host' ? 'multi' : journey); // introdução interativa do modo escolhido
};
UIH.introNext = () => UIH.mNext();
// depois da apresentação do caminho vem a animação dos controles; pular de novo entra no jogo
UIH.introSkip = () => {
  Narrator.stop();
  if (S.scene === 'intro' && !U.howto && U.mintro) { U.mintro = null; U.howto = { t: 0 }; return; }
  U.mintro = null; U.howto = null; S.scene = 'earth'; cityInit();
};
UIH.comms2 = () => { U.comms = 2; Narrator.say(F('comms.next')); };
UIH.toSetup = () => { S.earthBonus = cityBoxes(); S.toast = null; S.scene = 'setup'; U.setupStep = 0; U.setupDirty = true; Music.play('fase'); };
UIH.setStep = i => { U.setupStep = +i; U.setupDirty = true; };
UIH.setNext = () => { U.setupStep = Math.min(SETUP_STEPS.length - 1, U.setupStep + 1); U.setupDirty = true; };
UIH.setPrev = () => { U.setupStep = Math.max(0, U.setupStep - 1); U.setupDirty = true; };
UIH.setOrigin = id => { S.setup.origin = id; U.setupDirty = true; };
UIH.setRoute = id => { S.setup.route = id; U.setupDirty = true; };
UIH.setToggle = arg => {
  const [list, id] = arg.split(':'); const arr = S.setup[list];
  const cat = { skills: SKILLS, modules: MODULES, upgrades: UPGRADES, reserves: RESERVES, training: TRAINING, gadgets: GADGETS, pantry: PANTRY }[list];
  const it = cat.find(x => x.id === id);
  if (arr.includes(id)) {
    arr.splice(arr.indexOf(id), 1);
    cat.filter(x => x.req === id).forEach(x => { if (arr.includes(x.id)) arr.splice(arr.indexOf(x.id), 1); });
  } else {
    const left = setupBudget() - setupCost(S.setup);
    if (it.pts > left) { Sfx.bad(); return; }
    if (it.req && !arr.includes(it.req)) { Sfx.bad(); return; }
    if (list === 'modules' && setupSlots(S.setup) + it.slots > SLOTS) { Sfx.bad(); return; }
    arr.push(id);
  }
  U.setupDirty = true;
};
UIH.launch = () => {
  if (setupCost(S.setup) > setupBudget()) { Sfx.bad(); return; }
  applySetup(); S.scene = 'launch'; U.launchT = 0; Sfx.noise(2, 0.08);
};
UIH.panel = p => {
  U.panel = p; U.tab = null; U.confirmQuit = false;
  if (p === 'report' && S.tutorial === 2) act('tut', { n: 3 });
};
UIH.closePanel = () => { U.panel = null; U.tab = null; U.cook = []; };
UIH.tab = t => { U.tab = t; };
UIH.goto = st => { U.autopilot = st; };
UIH.gotoC = bid => { if (typeof CBUILD !== 'undefined' && CBUILD[bid]) U.clickTarget = { x: CBUILD[bid].x }; };
UIH.farmSel = i => { U.farmSel = +i; };
UIH.cookToggle = k => { const i = U.cook.indexOf(k); if (i >= 0) U.cook.splice(i, 1); else if (U.cook.length < 3) U.cook.push(k); };
UIH.cookClear = () => { U.cook = []; };
UIH.cook = () => { act('cook', { ing: U.cook.slice() }); U.cook = []; };
UIH.pilot = d => act('puzzle', { op: 'move', d: +d * 0.08 });
UIH.quitAsk = () => { U.confirmQuit = true; };
UIH.quit = () => { exitGameFullscreen(); Narrator.stop(); if (Net.role) Net.leave(); S = null; U.screen = 'title'; U.panel = null; Music.play('intro'); };
UIH.netHost = () => { const el = $('#net-url'); const url = el ? el.value.trim() : ''; U.lobby = { url, ship: (U.lobby && U.lobby.ship) || 1 }; Net.host(url); };
UIH.netJoin = () => { enterGameFullscreen(); const el = $('#net-url'); const url = el ? el.value.trim() : ''; const code = $('#net-code').value.trim().toUpperCase(); U.lobby = { url, code, ship: (U.lobby && U.lobby.ship) || 1, role: (U.lobby && U.lobby.role) || '' }; Net.join(url, code); };
UIH.netLeave = () => { Net.leave(); U.screen = 'lobby'; };
ACTIONS.tut = p => { if (S.tutorial < p.n) S.tutorial = p.n; };

function bindUI() {
  const layer = document.getElementById('ui-layer');
  const handle = (e) => {
    const t = e.target.closest('[data-ui],[data-act]');
    if (!t || t.disabled) return;
    if (t.dataset.ui === 'closePanel' && e.target.closest('[data-stop]') && !e.target.closest('.x')) return;
    Music.unlock(); Sfx.ensure();
    if (t.dataset.act) { let p = {}; try { p = t.dataset.p ? JSON.parse(t.dataset.p) : {}; } catch (er) { /* */ } act(t.dataset.act, p); }
    else { const fn = UIH[t.dataset.ui]; if (fn) { Sfx.click(); fn(t.dataset.arg); } }
    e.preventDefault(); dropFocus();
  };
  // mouse: age ao pressionar. Toque: age ao soltar, se o dedo não rolou (assim rolar uma lista não aperta botões)
  let tap = null;
  const runSig = (sig) => {
    Music.unlock(); Sfx.ensure();
    if (sig.act) { let p = {}; try { p = sig.p ? JSON.parse(sig.p) : {}; } catch (er) { /* */ } act(sig.act, p); }
    else { const fn = UIH[sig.ui]; if (fn) { Sfx.click(); fn(sig.arg); } }
  };
  layer.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('input,select,textarea,summary,label')) return;
    if (e.target.closest('details') && !e.target.closest('[data-ui],[data-act]')) return; // botões dentro de seções recolhíveis funcionam
    if (e.pointerType === 'mouse') return handle(e);
    const t = e.target.closest('[data-ui],[data-act]');
    if (!t || t.disabled) { tap = null; return; }
    if (t.dataset.ui === 'closePanel' && e.target.closest('[data-stop]') && !e.target.closest('.x')) { tap = null; return; }
    tap = { id: e.pointerId, x: e.clientX, y: e.clientY, sig: { ui: t.dataset.ui, act: t.dataset.act, arg: t.dataset.arg, p: t.dataset.p }, at: performance.now() };
  });
  layer.addEventListener('pointermove', e => { if (tap && e.pointerId === tap.id && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 12) tap = null; });
  layer.addEventListener('pointercancel', () => { tap = null; });
  layer.addEventListener('pointerup', e => { if (tap && e.pointerId === tap.id) { const s = tap.sig; tap = null; runSig(s); e.preventDefault(); dropFocus(); } });
  layer.addEventListener('click', e => { if (e.detail === 0) handle(e); });
  // controles deslizantes: marca o arraste e solta o foco no fim, para o painel voltar a se atualizar
  document.addEventListener('pointerdown', e => { if (e.target && e.target.type === 'range') U.dragging = true; }, true);
  const endDrag = () => { if (U.dragging) { U.dragging = false; const a = document.activeElement; if (a && a.type === 'range') a.blur(); } };
  document.addEventListener('pointerup', endDrag, true); document.addEventListener('pointercancel', endDrag, true);
  layer.addEventListener('change', e => { const t = e.target; if (t && t.tagName === 'SELECT' && t.dataset.set) setTimeout(() => t.blur(), 0); });
  layer.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'av-name' && U.avatarDraft) U.avatarDraft.name = t.value;
    if (t.dataset.set) { const st = Save.data.settings; if (t.dataset.set === 'voice') { st.voices = st.voices || {}; st.voices[I18n.lang] = t.value; } else st[t.dataset.set] = t.type === 'checkbox' ? t.checked : t.tagName === 'SELECT' ? t.value : +t.value; Save.write(); if (t.dataset.set === 'voice') Narrator.voice = null; Music.refreshVolume(); if (t.dataset.set === 'narration' && !t.checked) Narrator.stop(); }
  });
  layer.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.actsel === 'menu') act('menu', { slot: +t.dataset.slot, item: t.value });
    if (t.dataset.actcheck === 'research') act('research', { on: t.checked });
  });
  // pintura do avatar
  const paintAt = e => {
    const c = e.target; if (c.id !== 'paint') return;
    const r = c.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / r.width * SPR_W), y = Math.floor((e.clientY - r.top) / r.height * SPR_H);
    if (x < 0 || y < 0 || x >= SPR_W || y >= SPR_H) return;
    U.avatarDraft.paint = Object.assign({}, U.avatarDraft.paint, { [x + ',' + y]: U.paintColor });
  };
  layer.addEventListener('pointerdown', e => { if (e.target.id === 'paint') { U.paintOn = true; paintAt(e); } });
  layer.addEventListener('pointermove', e => { if (U.paintOn) paintAt(e); });
  window.addEventListener('pointerup', () => { U.paintOn = false; });
  layer.addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') e.stopPropagation(); });
}
