// ============================================================
//  MENOS POLUIÇÃO NA TELA + TEMPO AUTOMÁTICO
//  • Durante um desafio só ficam o painel do evento e a rotina:
//    some a barra de dicas do computador, o "Você sabia?" e o
//    aviso de fome (voltam quando o desafio acaba).
//  • Sem nada para fazer por 5 s na nave ou na colônia (sem desafio,
//    painel, tarefa pendente ou fome), o tempo vai para 10x até o
//    próximo evento, sem aviso — mesmo andando pela nave.
// ============================================================
'use strict';

const IDLE_FAST_AFTER = 5; // segundos parado
const inChallenge = () => !!(S && S.event && S.event.phase !== 'result');

(function () {
  // ---------- foco no desafio ----------
  const _assist = assistMini;
  assistMini = function () { return inChallenge() ? '' : _assist(); };
  const _lesson = lessonCard;
  lessonCard = function () { return inChallenge() ? '' : _lesson(); };
  const _hItem = hungerItem;
  hungerItem = function () { return inChallenge() ? null : _hItem(); };
  const _hTick = hungerTick;
  hungerTick = function () { if (!inChallenge()) _hTick(); }; // o aviso de fome espera o desafio acabar
  // começou um desafio: some o aviso de fome que estava na tela (ele volta depois do desafio)
  const _start = startEvent;
  startEvent = function (t) {
    _start(t);
    if (!S || !S.event) return;
    const tx = S.toast && String(L(S.toast.text) || '');
    if (tx && /🍴/.test(tx)) S.toast = null;
    for (const c of alive()) if (c.hungryWarned && c.saciedade < HUNGRY) c.hungryWarned = false;
  };

  // ---------- tempo automático: nada para fazer por 5 s → 10x até o próximo evento ----------
  // (andar não interrompe; só um desafio, uma tarefa, a fome ou um painel aberto. Shift+S para o normal vale até o próximo evento.)
  document.addEventListener('keydown', e => { if (S && e.code === 'KeyS' && e.shiftKey) { S.autoFast = false; setTimeout(() => { if (S && !S.fast) S.fastOptOut = true; }, 0); } }, true);
  document.addEventListener('pointerdown', e => { const t = e.target && e.target.closest && e.target.closest('[data-ui=fast]'); if (t && S) { S.autoFast = false; setTimeout(() => { if (S && !S.fast) S.fastOptOut = true; }, 0); } }, true);
  const routinePending = () => { const r = S.routine; return !!(r && r.day === S.day && r.items.some(x => !x.done)); };
  let idleSince = null;
  setInterval(() => {
    if (!S || U.screen !== 'game' || S.paused || (typeof Net !== 'undefined' && Net.role === 'client')) { idleSince = null; return; }
    if (inChallenge()) { S.autoFast = false; S.fastOptOut = false; idleSince = null; return; } // o evento chegou: volta ao normal
    const m = me();
    const busy = !['ship', 'colony'].includes(S.scene) || U.panel || U.help || U.qmenu || U.qset || (typeof Chat !== 'undefined' && Chat.open)
      || (m && (m.task || m.ctask || (m.saciedade != null && m.saciedade < 40 && S.scene === 'ship')))
      || (S.scene === 'ship' && routinePending());
    if (busy) { idleSince = null; if (S.autoFast && S.fast) { S.fast = 0; S.autoFast = false; } return; }
    if (S.fast || S.fastOptOut) return;
    const now = performance.now(); if (idleSince == null) idleSince = now;
    if ((now - idleSince) / 1000 >= IDLE_FAST_AFTER) { S.fast = 10; S.autoFast = true; }
  }, 500);
})();
