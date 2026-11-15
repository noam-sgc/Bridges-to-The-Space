// ============================================================
//  DESAFIOS COM PULO — missões em que a tecla J (⤒ no celular) faz diferença
//  • Prateleira rompida: caixas de suprimento ficam no alto; é preciso pular para pegá-las.
//  • Cabos soltos: cabos faiscando no chão; pular por cima evita choque e lentidão.
// ============================================================
'use strict';

EVENT_INFO.prateleira = { title: 'Prateleira rompida', icon: '📦', systems: ['casco', 'suporte'], desc: 'Uma prateleira do compartimento de carga rompeu e as caixas de suprimento ficaram presas no alto, flutuando perto do teto. Pule (J) por baixo delas para pegá-las antes que o tempo acabe.' };
EVENT_INFO.destrocos = { title: 'Cabos soltos e faíscas', icon: '⚡', systems: ['suporte', 'avionica'], desc: 'Um impacto soltou cabos que faíscam pelo chão da nave. Pule (J) sobre eles ao atravessar os corredores: quem pisa leva choque e fica lento. Alguém precisa religar o disjuntor no Suporte à vida.' };
EVENT_INFO.prateleira.systems = ['casco', 'suporte'];

const BOX_GOAL = 6, BOX_TOTAL = 8;
const isHumanC = c => c.owner && c.owner !== 'bot';

EV.prateleira = {
  time: 55, points: 28, tip: 'Pulem para alcançar as caixas no alto (tecla J).', ai: 'pular para pegar as caixas de suprimento.',
  can: () => S.scene === 'ship',
  setup(ev) { ev.steps = [{ id: 'caixas', label: 'Recuperar as caixas de suprimento (pule para pegar!)', station: null, dur: 0 }]; },
  start(ev) {
    S.boxes = [];
    for (let i = 0; i < BOX_TOTAL; i++) {
      const room = ROOMS[i % ROOMS.length];
      S.boxes.push({ id: i, x: room.x0 + 18 + Math.random() * Math.max(10, room.x1 - room.x0 - 36), deck: room.deck, h: 13 + Math.floor(Math.random() * 5), ph: Math.random() * 6 });
    }
    ev.data.got = 0; ev.data.jumped = 0;
    sayRole('engenheiro1', 'As caixas estão presas lá em cima! Dá para alcançar pulando.');
  },
  tick(ev, dt) {
    for (const c of alive()) {
      if (c.hibernating || c.climb > 0) continue;
      for (const b of S.boxes) {
        if (b.got || b.deck !== c.deck || Math.abs(b.x - c.x) > 12) continue;
        if (isHumanC(c)) { if ((c.jy || 0) >= b.h - 5) takeBox(ev, b, c); }
        else if (Math.random() < dt * 0.12) takeBox(ev, b, c); // bots não pulam bem: pegam devagar
      }
    }
    S.boxes = S.boxes.filter(b => !b.got);
    const s = ev.steps[0];
    s.label = `Recuperar as caixas de suprimento (${ev.data.got} de ${BOX_GOAL}) — pule para pegar!`;
    if (!s.done && ev.data.got >= BOX_GOAL) { completeStep(ev, s, null); endEvent(true); }
  },
  customEnd: true,
  success(ev) { S.boxes = []; addRes('comida', 3, 'Caixas recuperadas'); addRes('agua', 20, 'Caixas recuperadas'); S.peças += 1; return 'Caixas recuperadas: +3 kg de ração, +20 L de água e +1 peça de reposição.'; },
  failure(ev) { S.boxes = []; moral(-3); return 'As caixas ficaram presas no alto e parte do estoque se perdeu.'; },
  cleanup() { S.boxes = []; },
};
function takeBox(ev, b, c) {
  if (b.got) return; b.got = true; ev.data.got++; if (isHumanC(c)) ev.data.jumped++;
  addRes('comida', 0.3, 'Caixa de suprimento'); S.v++;
  if (typeof Sfx !== 'undefined' && Sfx.pick) Sfx.pick();
}

EV.destrocos = {
  time: 70, points: 30, tip: 'Pulem sobre os cabos (tecla J) e religuem o disjuntor no Suporte à vida.', ai: 'engenheiro ao disjuntor; todos pulam os cabos.',
  can: () => S.scene === 'ship',
  setup(ev) { ev.steps = [{ id: 'disjuntor', label: 'Engenheiro: religar o disjuntor no Suporte à vida', station: 'suporte', dur: 3, role: 'engenheiro', dc: 8 }]; },
  start(ev) {
    S.hazards = [];
    const xs = [150, 260, 340, 430, 520, 620, 700, 780, 880, 980, 1060];
    xs.forEach((x, i) => S.hazards.push({ id: i, x: x + Math.floor(Math.random() * 30 - 15), deck: i % 2 ? 'U' : 'L', ph: Math.random() * 6 }));
    ev.data.hits = 0; ev.data.cool = {};
    sayRole('engenheiro2', 'Cuidado com os cabos no chão: pulem por cima!');
  },
  tick(ev, dt) {
    for (const c of alive()) {
      if (c.stun > 0) c.stun = Math.max(0, c.stun - dt);
      if (!isHumanC(c) || c.climb > 0 || c.hibernating) continue; // só jogadores pisam nos cabos; bots os contornam
      ev.data.cool[c.id] = Math.max(0, (ev.data.cool[c.id] || 0) - dt);
      if (ev.data.cool[c.id] > 0 || (c.jy || 0) >= 7) continue;
      for (const h of S.hazards) {
        if (h.deck === c.deck && Math.abs(h.x - c.x) < 8) {
          ev.data.hits++; ev.data.cool[c.id] = 1.5; c.stun = 1.6; moral(-1, c); addRes('energia', -1, 'Curto-circuito nos cabos'); S.v++;
          toast(c.name + ' levou um choque! Pule os cabos (J).', 'warn');
          break;
        }
      }
    }
  },
  success(ev) { S.hazards = []; const clean = ev.data.hits === 0; if (clean) { addPoints(15, 'Sem choques: pulos perfeitos'); } return clean ? 'Disjuntor religado e ninguém levou choque: pulos perfeitos!' : `Disjuntor religado. Choques levados: ${ev.data.hits}.`; },
  failure(ev) { S.hazards = []; damageSys('suporte', 10); damageSys('avionica', 8); return 'Os cabos continuaram faiscando e o suporte à vida ficou instável.'; },
  cleanup() { S.hazards = []; },
};

// lições (computador de bordo) e perguntas do Quiz
(function () {
  const add = (key, fact, quiz) => { quiz.l = 'ev:' + key; quiz.cat = 'ship'; QUIZ_BANK.push(quiz); ALL_LESSONS[key] = { fact, quiz }; };
  add('prateleira', K('Em microgravidade nada fica no chão: na Estação Espacial os astronautas prendem tudo com velcro, fitas e bolsas.', 'In microgravity nothing stays on the floor: on the Space Station astronauts fasten everything with Velcro, straps and pouches.', 'En microgravedad nada se queda en el suelo: en la Estación Espacial los astronautas sujetan todo con velcro, cintas y bolsas.'),
    Q('', '', ['Como os astronautas evitam que as coisas flutuem pela Estação Espacial?', 'How do astronauts keep things from floating around the Space Station?', '¿Cómo evitan los astronautas que las cosas floten por la Estación Espacial?'],
      [['Prendem tudo com velcro, fitas e bolsas', 'They fasten everything with Velcro, straps and pouches', 'Sujetan todo con velcro, cintas y bolsas'], ['Colam no teto com cola', 'They glue things to the ceiling', 'Pegan todo al techo con pegamento'], ['Ligam um ímã gigante', 'They turn on a giant magnet', 'Encienden un imán gigante'], ['Deixam flutuar mesmo', 'They just let things float', 'Dejan que floten']], 0,
      ['Um parafuso solto flutua até um ventilador ou o rosto de alguém: organização é segurança.', 'A loose screw floats into a fan or someone\'s face: tidiness is safety.', 'Un tornillo suelto flota hasta un ventilador o la cara de alguien: el orden es seguridad.']));
  add('destrocos', K('Em 1967, uma faísca numa cabine de oxigênio puro causou o incêndio da Apollo 1; desde então fios e materiais são muito mais controlados.', 'In 1967, a spark in a pure-oxygen cabin caused the Apollo 1 fire; since then wiring and materials are far more tightly controlled.', 'En 1967, una chispa en una cabina de oxígeno puro causó el incendio del Apolo 1; desde entonces los cables y materiales se controlan mucho más.'),
    Q('', '', ['Por que fios soltos e faíscas são tão perigosos numa nave?', 'Why are loose wires and sparks so dangerous on a spacecraft?', '¿Por qué los cables sueltos y las chispas son tan peligrosos en una nave?'],
      [['Uma faísca pode iniciar um incêndio difícil de apagar num ambiente fechado com oxigênio', 'A spark can start a fire that is hard to put out in a closed, oxygen-rich space', 'Una chispa puede iniciar un incendio difícil de apagar en un ambiente cerrado con oxígeno'], ['Porque fazem barulho', 'Because they make noise', 'Porque hacen ruido'], ['Porque atraem asteroides', 'Because they attract asteroids', 'Porque atraen asteroides'], ['Não são perigosos', 'They are not dangerous', 'No son peligrosos']], 0,
      ['Naves têm extintores e mantas anti-fogo, mas a melhor defesa é prevenir: cabos presos, etiquetados e conferidos.', 'Ships carry extinguishers and fire blankets, but the best defense is prevention: cables secured, labeled and checked.', 'Las naves llevan extintores y mantas ignífugas, pero la mejor defensa es prevenir: cables sujetos, etiquetados y revisados.']));
})();

// desenho: caixas no alto e cabos faiscando (chamado pela cena da nave)
function drawJumpHazards() {
  for (const b of (S.boxes || [])) {
    const y = DECKS[b.deck].floor - b.h - 12 + Math.sin(R.t * 2 + b.ph) * 2;
    cx.fillStyle = '#7a5a33'; cx.fillRect(Math.round(b.x) - 6, Math.round(y), 12, 10);
    cx.fillStyle = '#c9a063'; cx.fillRect(Math.round(b.x) - 6, Math.round(y), 12, 2); cx.fillRect(Math.round(b.x) - 1, Math.round(y), 2, 10);
    cx.fillStyle = 'rgba(255,235,120,.55)'; cx.fillRect(Math.round(b.x) - 1, Math.round(y) - 5 - Math.round(Math.sin(R.t * 4 + b.ph) * 1), 2, 3); // seta ↑ de "pule"
  }
  for (const h of (S.hazards || [])) {
    const fl = DECKS[h.deck].floor, x = Math.round(h.x);
    cx.fillStyle = '#222'; cx.fillRect(x - 7, fl - 3, 14, 2); cx.fillStyle = '#d33'; cx.fillRect(x - 7, fl - 3, 3, 2); cx.fillStyle = '#36c'; cx.fillRect(x + 4, fl - 3, 3, 2);
    if (Math.sin(R.t * 14 + h.ph) > 0) { cx.fillStyle = '#ffe66a'; cx.fillRect(x - 1 + Math.round(Math.sin(R.t * 9 + h.ph) * 4), fl - 8, 2, 4); cx.fillRect(x + 2, fl - 6, 1, 2); }
  }
}
