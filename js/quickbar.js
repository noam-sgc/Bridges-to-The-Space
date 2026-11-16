// ============================================================
//  BARRA RÁPIDA (sempre visível): áudio, efeitos, configurações e
//  voltar à fase anterior. Vale na cidade, na montagem, no avatar,
//  na nave, no planeta e na colônia.
// ============================================================
'use strict';

const PHASE_SKIP = ['intro', 'launch', 'end'];
const Phases = {
  hist: [], runId: null, last: null,
  // guarda o estado na entrada de cada fase
  tick() {
    if (!S || U.screen !== 'game' || (typeof Net !== 'undefined' && Net.role === 'client')) return;
    if (S.runId !== this.runId) { this.hist = []; this.runId = S.runId; this.last = null; }
    if (S.scene === this.last) return;
    this.last = S.scene;
    if (PHASE_SKIP.includes(S.scene)) return;
    if (this.hist.length && this.hist[this.hist.length - 1].scene === S.scene) return;
    this.hist.push({ scene: S.scene, S: clone(S), comms: U.comms || 0 });
    if (this.hist.length > 10) this.hist.shift();
  },
  // fase anterior à atual (se a atual não está na lista, como o lançamento, a última registrada)
  prev() {
    const n = this.hist.length; if (!S || !n) return null;
    if (this.hist[n - 1].scene !== S.scene) return this.hist[n - 1];
    return n >= 2 ? this.hist[n - 2] : null;
  },
  played() { return !['earth', 'setup', 'avatar'].includes(S.scene) || this.hist.some(h => !['earth', 'setup', 'avatar'].includes(h.scene)); },
  back() {
    const p = this.prev(); if (!p) return;
    const i = this.hist.indexOf(p); this.hist.length = i + 1;
    Narrator.stop();
    GameSave.apply({ S: p.S, U: { comms: 0 } });
    if (S.scene === 'setup') { U.setupStep = 0; U.setupDirty = true; }
    this.last = S.scene; GameSave.lastScene = S.scene;
    const nm = SCENE_NAMES[S.scene] || {};
    toast(K('◀ De volta a: ' + (nm.pt || S.scene), '◀ Back to: ' + (nm.en || S.scene), '◀ De vuelta a: ' + (nm.es || S.scene)), 'good');
  },
};

function quickBar() {
  const st = Save.data.settings;
  return `<div class="qbar">
    <button class="qb ${st.mute ? 'off' : ''}" data-ui="qAudio" title="${esc(L(K('Áudio (música e voz)', 'Audio (music and voice)', 'Audio (música y voz)')))}">${st.mute ? '🔇' : '🔊'}</button>
    <button class="qb ${st.sfxOff ? 'off' : ''}" data-ui="qSfx" title="${esc(L(K('Efeitos sonoros', 'Sound effects', 'Efectos de sonido')))}">${st.sfxOff ? '🔕' : '🔔'}</button>
    <button class="qb" data-ui="qSettings" title="${esc(L(K('Configurações', 'Settings', 'Configuración')))}">⚙</button>
  </div>`;
}
UIH.qAudio = () => { const st = Save.data.settings; st.mute = !st.mute; Save.write(); if (st.mute) Narrator.stop(); Music.refreshVolume(); };
UIH.qSfx = () => { const st = Save.data.settings; st.sfxOff = !st.sfxOff; Save.write(); };
UIH.qSettings = () => { if (S && U.screen === 'game') { U.qmenu = !(U.qmenu || U.qset); U.qset = false; U.confirmQuit = false; } else U.screen = 'settings'; };
UIH.qSettingsOpen = () => { U.qmenu = false; U.qset = true; if (U.panel === 'menu') U.panel = null; };
// link de convite: ?sala=CODIGO (&srv=endereço do servidor) abre o lobby com o código preenchido
(function () {
  try {
    const q = new URLSearchParams(location.search); const sala = q.get('sala');
    if (sala) { U.pendingSala = true; U.lobby = { code: sala.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5), url: q.get('srv') || '', ship: 1 }; }
  } catch (e) { /* link inválido: ignora */ }
})();
(function () {
  const _close = UIH.closePanel; UIH.closePanel = function () { if (U.qset) { U.qset = false; return; } if (U.qmenu) { U.qmenu = false; return; } _close(); };
  const _render = renderUI;
  renderUI = function () {
    Phases.tick();
    if (typeof guideAutoPontes === 'function') guideAutoPontes();
    const g = S && U.screen === 'game';
    U.modalOverride = g && U.qset ? `<div class="modal-bg">${settingsScreen(true)}</div>` : g && U.qmenu ? menuPanel() : null;
    _render();
    setHTML('qbar', quickBar());
    if (U.modalOverride) setHTML('modal', U.modalOverride);
  };
})();
