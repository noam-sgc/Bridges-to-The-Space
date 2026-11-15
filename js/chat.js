// ============================================================
//  CHAT — multiplayer (jogadores reais) e jornada solo
//  • Multiplayer: o host retransmite as mensagens a todos.
//  • Solo: converse com a tripulação (bots) e com o Controle da
//    Missão (curiosidades e status da nave/colônia).
//  Mensagens do sistema são enviadas em PT/EN/ES e traduzidas
//  no navegador de cada jogador.
// ============================================================
'use strict';

const NASA_FACTS = []; // preenchido por data/lang/<idioma>.json ("falas")

const Chat = {
  log: [], open: false, unread: 0, nid: 1, factT: 70, lastSend: 0, dirty: true, els: null, peekUntil: 0,
  init() {
    const host = document.getElementById('chat'); if (!host) return;
    host.innerHTML = '';
    const btn = document.createElement('button'); btn.className = 'chat-btn'; btn.type = 'button';
    const peek = document.createElement('div'); peek.className = 'chat-peek';
    const box = document.createElement('div'); box.className = 'chat-box';
    const head = document.createElement('div'); head.className = 'chat-head';
    const title = document.createElement('b'); const close = document.createElement('button'); close.type = 'button'; close.textContent = '✕'; close.className = 'chat-x';
    head.append(title, close);
    const list = document.createElement('div'); list.className = 'chat-list';
    const form = document.createElement('form'); form.className = 'chat-form'; form.autocomplete = 'off';
    const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 200; inp.className = 'chat-in';
    const go = document.createElement('button'); go.type = 'submit'; go.textContent = '➤'; go.className = 'chat-go';
    form.append(inp, go); box.append(head, list, form); host.append(peek, box, btn);
    this.els = { host, btn, peek, box, title, list, inp, close };
    btn.addEventListener('click', () => this.toggle());
    close.addEventListener('click', () => this.toggle(false));
    form.addEventListener('submit', e => { e.preventDefault(); const t = inp.value; inp.value = ''; this.send(t); inp.blur(); }); // Enter de novo reabre o campo; o jogo volta a receber as teclas
    inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Escape') { inp.blur(); this.toggle(false); } });
    inp.addEventListener('keyup', e => e.stopPropagation());
    ['pointerdown', 'click'].forEach(ev => host.addEventListener(ev, e => e.stopPropagation()));
    this.render(true);
    setInterval(() => this.tick(), 500);
  },
  // o chat só existe no multiplayer; no modo solo a tripulação fala em balões
  visible() { return !!Net.role && ((typeof S !== 'undefined' && S && U.screen === 'game') || U.screen === 'lobby'); },
  toggle(v) {
    this.open = v == null ? !this.open : v;
    if (this.open) { this.unread = 0; this.dirty = true; }
    this.render(true);
    if (this.open && this.els) setTimeout(() => this.els.inp.focus(), 30);
  },
  focus() { if (typeof keys !== 'undefined') for (const k in keys) keys[k] = false; if (!this.open) this.toggle(true); else this.els.inp.focus(); },
  myName() {
    if (typeof S !== 'undefined' && S) { const c = crewById(U.me); if (c) return c.name; }
    const av = Save.data.avatar; return (av && av.name && av.name !== 'Comandante' ? av.name : null) || (Net.role === 'host' ? 'Commander' : 'Tripulante');
  },
  myRole() { if (typeof S !== 'undefined' && S) { const c = crewById(U.me); if (c) return c.roleName; } return Net.role === 'host' ? 'Comandante' : (Net.myRoleName || ''); },
  // adiciona localmente
  add(m) {
    m.id = this.nid++; m.at = Date.now();
    this.log.push(m); if (this.log.length > 100) this.log.shift();
    if (!this.open && !m.mine) { this.unread++; this.peekUntil = Date.now() + 9000; }
    this.dirty = true; this.render();
  },
  // mensagem do sistema / Controle da Missão (host e solo transmitem a todos)
  sysAll(k, kind) {
    const m = { sys: true, kind: kind || 'mc', k };
    if (typeof Net !== 'undefined' && Net.role === 'client') return; // clientes só recebem
    if (typeof Net === 'undefined' || !Net.role) { // solo: sem chat — curiosidades viram aviso do rádio
      if (kind === 'fact' && typeof S !== 'undefined' && S) S.toast = { text: k, kind: 'info', t: 8, id: Math.random() };
      return;
    }
    this.add(Object.assign({}, m));
    if (typeof Net !== 'undefined' && Net.role === 'host') { if (Net.relay || kind === 'join') Net.send({ t: 'bcast', msg: { t: 'chat', m } }); else Net.sendMembers(Net.shipMembers(), { t: 'chat', m }); } // avisos da nave ficam na nave; entradas/saídas vão para a sala
  },
  // o jogador local digitou algo
  send(text) {
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!text) return;
    const now = Date.now(); if (now - this.lastSend < 350) return; this.lastSend = now;
    if (Net.role === 'client' || Net.relay) { Net.send({ t: 'chat', text }); return; } // o hub devolve a mensagem para a sala toda
    const m = { from: this.myName(), role: 'Arca-' + (Net.mySh || 1) + ' · ' + this.myRole(), rid: U.me, arca: Net.mySh || 1, text };
    this.add(Object.assign({ mine: true }, m));
    if (Net.role === 'host') Net.send({ t: 'bcast', msg: { t: 'chat', m } });
    if (typeof S !== 'undefined' && S && U.screen === 'game') this.botReply(text);
  },
  // host recebe texto de um tripulante
  fromPlayer(pid, text) {
    const p = Net.players[pid] || Net.roster[pid]; if (!p) return;
    const now = Date.now(); if (now - (p.lastChat || 0) < 350) return; p.lastChat = now;
    text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!text) return;
    const r = ROLES.find(x => x.id === p.role);
    const ship = p.ship || Net.hubShip;
    const m = { from: p.name, role: 'Arca-' + ship + ' · ' + (r ? r.name : (p.roleName || '')), rid: p.role || 'cmd', arca: ship, text };
    this.add(Object.assign({}, m));
    Net.send({ t: 'bcast', msg: { t: 'chat', m } });
    if (typeof S !== 'undefined' && S) this.botReply(text, true);
  },
  // cliente recebe
  fromNet(m) { if (!m || typeof m !== 'object') return; const mine = !m.sys && m.rid === U.me && m.from === this.myName() && (m.arca == null || m.arca === (Net.mySh || 1)); this.add(Object.assign({}, m, { mine })); },

  // ---------- respostas dos bots (solo) ----------
  botReply(text, onlyMention) {
    if (!S) return;
    const low = text.toLowerCase();
    const crew = S.crew.filter(c => c.alive && c.id !== U.me && (!c.owner || c.owner === 'bot'));
    let target = crew.find(c => low.includes(c.name.toLowerCase()) || low.includes('@' + c.roleName.toLowerCase().split(' ')[0]) || low.includes(c.roleName.toLowerCase()));
    const mc = /(nasa|terra\b|earth|tierra|controle|control\b|mission|miss[aã]o|misi[oó]n|fato|fact|curios|sabia|did you know|sab[ií]as)/.test(low);
    if (onlyMention && !target && !mc && !/^@/.test(low)) return; // no multiplayer, só responde se for chamado
    const delay = 700 + Math.random() * 900;
    setTimeout(() => {
      if (!S) return;
      const intent = this.intent(low);
      if (mc && !target) return this.reply({ name: 'Controle da Missão', role: 'Terra', mc: true }, this.allLangs(() => this.mcAnswer(low, intent)));
      if (!target) target = crew.length ? pick(crew) : null;
      if (!target) return this.reply({ name: 'Controle da Missão', role: 'Terra', mc: true }, this.allLangs(() => this.mcAnswer(low, intent)));
      this.reply({ name: target.name, role: target.roleName, rid: target.id }, this.allLangs(() => this.crewAnswer(target, intent)));
    }, delay);
  },
  // gera a mesma resposta nos 3 idiomas, para cada jogador ler no seu
  allLangs(fn) {
    const cur = I18n.lang, real = Math.random, vals = []; const out = {};
    try {
      for (const l of ['pt', 'en', 'es']) { I18n.lang = l; let i = 0; Math.random = () => (i < vals.length ? vals[i++] : (vals[i++] = real())); out[l] = fn(); }
    } finally { Math.random = real; I18n.lang = cur; }
    return out.pt ? out : null;
  },
  reply(who, text) {
    if (!text) return;
    const m = { from: who.name, role: who.role, rid: who.rid || 'bot', text, bot: true, mc: !!who.mc };
    this.add(Object.assign({}, m));
    if (Net.role === 'host') Net.send({ t: 'bcast', msg: { t: 'chat', m } });
  },
  intent(low) {
    const has_ = re => re.test(low);
    if (has_(/(ajuda|help|ayuda|comandos|commands)/)) return 'help';
    if (has_(/(oxig|oxyg|o2|o₂)/)) return 'o2';
    if (has_(/([aá]gua|water|agua)/)) return 'agua';
    if (has_(/(comida|food|comer|eat|alimento|fome|hungry|hambre)/)) return 'comida';
    if (has_(/(energia|energy|power|bateria|battery|bater[ií]a)/)) return 'energia';
    if (has_(/(combust|fuel)/)) return 'fuel';
    if (has_(/(moral|humor|mood|[aâ]nimo|feliz|happy)/)) return 'moral';
    if (has_(/(status|situa|situation|estado|como estamos|how are|how is|resumo|summary)/)) return 'status';
    if (has_(/(miss[aã]o|objetivo|objective|mission|o que fa[cç]o|what do i do|qu[eé] hago|pr[oó]ximo|next)/)) return 'goal';
    if (has_(/(piada|joke|chiste)/)) return 'joke';
    if (has_(/(obrigad|thank|gracias|valeu)/)) return 'thanks';
    if (has_(/(\boi\b|ol[aá]|hello|\bhi\b|hola|bom dia|good morning|buenas)/)) return 'hi';
    if (has_(/(planeta|planet|pontes)/)) return 'planet';
    return 'chat';
  },
  statusLine() {
    const r = S.res, f = (k, u) => fmt(r[k], 0) + ' ' + u;
    return `⚡ ${f('energia', 'kWh')} · 💧 ${f('agua', 'L')} · 🍱 ${f('comida', 'kg')} · ⛽ ${f('combustivel', 'kg')} · O₂ ${f('oxigenio', 'kg')} · ☺ ${fmt(moralIndex(), 0)}`;
  },
  goalLine() {
    if (S.scene === 'colony' && S.colony) { const o = colonyObjectives().find(x => !x.done); return o ? L('Próximo objetivo: ') + L(o.t) : L('Todos os objetivos cumpridos!'); }
    if (S.scene === 'ship') return L('Cuide dos recursos, enfrente os desafios e leve a nave até Pontes-01b. Use as estações com E.');
    if (S.scene === 'station') return L('Analise os exoplanetas, escolha o destino com cuidado e parta da Estação Ponte-Alfa.');
    return L('Siga as instruções na tela, Comandante.');
  },
  fact() { Chat._fn = ((Chat._fn || 0) + 1); const all = NASA_FACTS.concat(CFACTS); return L(all[Math.floor(Math.random() * all.length)]); },
  mcAnswer(low, intent) {
    if (['status', 'o2', 'agua', 'comida', 'energia', 'fuel', 'moral'].includes(intent)) return L('Controle da Missão: telemetria recebida — ') + this.statusLine();
    if (intent === 'goal') return L('Controle da Missão: ') + this.goalLine();
    if (intent === 'help') return L('Controle da Missão: pergunte “status”, “oxigênio”, “água”, “objetivo” ou “curiosidade”. Chame um tripulante pelo nome!');
    if (intent === 'hi') return L('Controle da Missão: aqui é a Terra, Comandante. Câmbio!');
    if (intent === 'thanks') return L('Controle da Missão: sempre às ordens. A Terra torce por vocês!');
    return this.fact();
  },
  crewAnswer(c, intent) {
    const role = c.role.startsWith('engenheiro') ? 'eng' : c.role;
    const r = S.res;
    const flavor = (FALAS.crewChat || {})[role] || ['Estou aqui para ajudar.'];
    const pre = `${c.name}: `;
    const resLine = (k, label) => pre + L('Temos ') + fmt(r[k], 0) + ' ' + label + '.';
    switch (intent) {
      case 'status': return pre + this.statusLine();
      case 'o2': return resLine('oxigenio', L('kg de O₂'));
      case 'agua': return resLine('agua', L('litros de água'));
      case 'comida': return resLine('comida', L('kg de comida'));
      case 'energia': return resLine('energia', 'kWh');
      case 'fuel': return resLine('combustivel', L('kg de combustível'));
      case 'moral': return pre + L('A moral da equipe está em ') + fmt(moralIndex(), 0) + '. ' + (c.humor < 40 ? L('Eu mesmo ando meio pra baixo…') : L('Eu estou bem!'));
      case 'goal': return pre + this.goalLine();
      case 'help': return pre + L('Pergunte “status”, “água”, “comida”, “moral”, “objetivo” ou fale com o “Controle” para curiosidades.');
      case 'joke': return pre + pick([L('Por que o astronauta terminou o namoro? Precisava de espaço!'), L('Cuidado com o lixo espacial: é o único que gira em volta da gente!')]);
      case 'thanks': return pre + L('De nada, Comandante!');
      case 'hi': return pre + L('Olá! Pronto para o que der e vier.');
      case 'planet': return pre + L('Pontes-01b tem raio ≈ 1,04 R⊕, água líquida provável e uma estrela calma. A nossa melhor aposta!');
      default: return pre + L(pick(flavor));
    }
  },

  // ---------- interface ----------
  tick() {
    if (!this.els) return;
    const vis = this.visible();
    this.els.host.style.display = vis ? '' : 'none';
    if (!vis) return;
    if (Date.now() < this.peekUntil + 600) this.render();
    // solo: tripulantes comentam em balões de fala
    if (typeof S !== 'undefined' && S && U.screen === 'game' && !Net.role && ['ship', 'colony'].includes(S.scene) && !S.paused && !(S.event && S.event.phase === 'run')) {
      this.talkT = (this.talkT == null ? 25 : this.talkT) - 0.5;
      if (this.talkT <= 0) {
        this.talkT = 30 + Math.random() * 30;
        const crew = S.crew.filter(c => c.alive && c.id !== U.me && !c.bubble && !c.hibernating && !c.eva);
        if (crew.length) { const c = pick(crew); const line = this.crewAnswer(c, Math.random() < 0.25 ? 'status' : 'chat'); if (line) say(c, line.startsWith(c.name + ': ') ? line.slice(c.name.length + 2) : line, 7); }
      }
    }
    // curiosidades automáticas do Controle da Missão (host / solo)
    if (typeof S !== 'undefined' && S && U.screen === 'game' && Net.role !== 'client' && ['ship', 'station', 'detour', 'planet', 'migration'].includes(S.scene) && !S.paused) {
      this.factT -= 0.5;
      if (this.factT <= 0) { this.factT = 85 + Math.random() * 40; this.sysAll(NASA_FACTS[(this._f = ((this._f || 0) + 1)) % NASA_FACTS.length], 'fact'); }
    }
  },
  render(force) {
    const e = this.els; if (!e) return;
    const vis = this.visible(); e.host.style.display = vis ? '' : 'none';
    e.host.classList.toggle('open', this.open);
    const label = L('Chat');
    e.btn.textContent = '💬 ' + label + (this.unread ? ' (' + this.unread + ')' : '');
    e.btn.classList.toggle('new', this.unread > 0);
    e.btn.title = L('Abrir o chat (Enter)');
    e.title.textContent = Net.role ? '💬 ' + L('Chat da sala') + (Net.room ? ' ' + Net.room : '') : '💬 ' + L('Chat com a tripulação e o Controle da Missão');
    e.inp.placeholder = Net.role ? L('Mensagem para a sala… (Enter envia)') : L('Fale com a tripulação ou “Controle”… (“ajuda”)');
    if (!this.dirty && !force) { this.peekRender(); return; }
    this.dirty = false;
    e.list.textContent = '';
    for (const m of this.log) e.list.appendChild(this.line(m));
    e.list.scrollTop = e.list.scrollHeight;
    this.peekRender();
  },
  line(m) {
    const d = document.createElement('div'); d.className = 'cm' + (m.sys ? ' sys ' + (m.kind || '') : '') + (m.mine ? ' mine' : '') + (m.bot ? ' bot' : '') + (m.mc ? ' mcm' : '');
    if (m.sys) { d.textContent = L(m.k); return d; }
    const b = document.createElement('b'); b.textContent = T(m.from) + (m.role && !m.mc ? ' · ' + T(m.role) : '') + ': ';
    b.style.color = this.color(m);
    const txt = typeof m.text === 'object' ? L(m.text) : m.text; const s = document.createElement('span'); s.textContent = m.bot && txt.startsWith(m.from + ': ') ? txt.slice(m.from.length + 2) : txt;
    d.append(b, s); return d;
  },
  color(m) {
    if (m.mc) return '#ffd34c';
    const i = ['cmd', 'paramedico', 'navegador', 'agricultor', 'engenheiro1', 'engenheiro2', 'pesquisador'].indexOf(m.rid);
    return ['#ffd34c', '#7dffb0', '#7ad8ff', '#a6e86a', '#ff9f5a', '#ff7ac8', '#c7a6ff'][i < 0 ? 0 : i];
  },
  peekRender() {
    const e = this.els; if (!e) return;
    if (this.open || Date.now() > this.peekUntil) { e.peek.textContent = ''; return; }
    e.peek.textContent = '';
    this.log.filter(m => Date.now() - m.at < 9000).slice(-3).forEach(m => e.peek.appendChild(this.line(m)));
  },
};
