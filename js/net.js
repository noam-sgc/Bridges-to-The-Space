// ============================================================
//  MULTIPLAYER — até 6 jogadores na tripulação (+ Comandante/host)
//  O host simula tudo; os tripulantes enviam posição e ações.
//  Servidor: node server/server.js
// ============================================================
'use strict';

// Transporte:
//  • "p2p" (padrão): WebRTC via PeerJS — funciona em sites estáticos (Vercel,
//    GitHub Pages) sem servidor próprio e sem VPN. O host vira o "servidor".
//  • "ws": servidor próprio opcional (node server/server.js).
const PEER_PREFIX = 'pontes01-v1-';
const PEER_ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  // relé TURN público (Open Relay Project) para redes que bloqueiam conexão direta
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
];
const roomCode = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 5; i++) c += A[Math.floor(Math.random() * A.length)]; return c; };

const Net = {
  ws: null, peer: null, conn: null, conns: {}, nextPid: 1, mode: null, open: false,
  role: null, room: null, players: {}, myRoleName: null, sendT: 0, posT: 0,
  hubShip: 1, arcas: {}, roster: {}, relay: false, mySh: 1,
  err(t) { U.lobby = Object.assign({}, U.lobby, { err: t, busy: false }); },
  info(t) { U.lobby = Object.assign({}, U.lobby, { err: '', busy: t }); },
  // ---------- envio ----------
  // Comandante de outra Arca (host "por trás" do hub): bcast/to viram mensagens de relé para a sala
  sendRelay(m) {
    if (m.t === 'bcast') this.sendRaw({ t: 'relay', k: 'bcast', msg: m.msg });
    else if (m.t === 'to') this.sendRaw({ t: 'relay', k: 'to', to: m.pid, msg: m.msg });
    else this.sendRaw(m);
  },
  sendRaw(o) {
    if (this.mode === 'ws') { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(o)); }
    else if (this.conn && this.conn.open) { try { this.conn.send(JSON.stringify(o)); } catch (e) { /* */ } }
  },
  send(m) {
    if (this.relay) return this.sendRelay(m);
    if (this.mode === 'ws') { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); return; }
    if (this.mode !== 'p2p') return;
    if (this.role === 'host') {
      if (m.t === 'bcast') { const s = JSON.stringify(m.msg); for (const pid in this.conns) { const c = this.conns[pid]; if (c.open) try { c.send(s); } catch (e) { /* */ } } }
      else if (m.t === 'to') { const c = this.conns[m.pid]; if (c && c.open) try { c.send(JSON.stringify(m.msg)); } catch (e) { /* */ } }
    } else if (this.conn && this.conn.open) { try { this.conn.send(JSON.stringify(m)); } catch (e) { /* */ } }
  },
  ready() { if (this.relay) return this.mode === 'ws' ? !!(this.ws && this.ws.readyState === 1) : !!(this.conn && this.conn.open); return this.mode === 'ws' ? !!(this.ws && this.ws.readyState === 1) : this.mode === 'p2p' && (this.role === 'host' ? !!this.peer && this.open : !!(this.conn && this.conn.open)); },
  // ---------- WebSocket (servidor próprio) ----------
  connectWS(url, onOpen) {
    this.leave(true);
    let ws;
    try { ws = new WebSocket(url); } catch (e) { return this.err(T('URL inválida.')); }
    this.ws = ws; this.mode = 'ws';
    ws.onopen = onOpen;
    ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } this.onMsg(m); };
    ws.onerror = () => this.err(T('Não foi possível conectar ao servidor. Rode “node server/server.js” e abra o jogo por ele.'));
    ws.onclose = () => { if (this.ws === ws) { const was = this.role; const rel = this.relay; this.ws = null; this.role = null; this.relay = false; this.mode = null; if (was === 'client' || rel) { S = null; U.screen = 'lobby'; this.err(T('Conexão encerrada.')); } } };
  },
  // ---------- P2P (PeerJS) ----------
  peerOpts() { return Object.assign({ debug: 0, config: { iceServers: PEER_ICE } }, window.PEER_OPTS || {}); },
  hasPeer() { if (typeof Peer === 'undefined') { this.err(T('Biblioteca de rede não carregou. Verifique a conexão.')); return false; } return true; },
  hostP2P(tries = 0) {
    this.leave(true); if (!this.hasPeer()) return;
    const code = roomCode();
    this.mode = 'p2p'; this.info(T('Criando sala...'));
    const peer = new Peer(PEER_PREFIX + code, this.peerOpts()); this.peer = peer;
    peer.on('open', () => { if (this.peer !== peer) return; this.open = true; this.onMsg({ t: 'room', code }); });
    peer.on('connection', conn => {
      const pid = String(this.nextPid++);
      conn.on('open', () => { this.conns[pid] = conn; });
      conn.on('data', d => {
        let m; try { m = typeof d === 'string' ? JSON.parse(d) : d; } catch (e) { return; }
        if (!m || typeof m !== 'object') return;
        if (m.t === 'join' && Object.keys(this.roster).length >= 27) { try { conn.send(JSON.stringify({ t: 'error', msg: T('Sala cheia.') })); } catch (e) { /* */ } return; }
        m.pid = pid; this.onMsg(m);
      });
      const bye = () => { if (!this.conns[pid]) return; delete this.conns[pid]; this.onMsg({ t: 'leave', pid }); };
      conn.on('close', bye); conn.on('error', bye);
    });
    peer.on('error', e => {
      if (this.peer !== peer) return;
      if (e.type === 'unavailable-id' && tries < 3) return this.hostP2P(tries + 1);
      this.err(T('Erro de conexão online') + ' (' + e.type + ').');
    });
    peer.on('disconnected', () => { if (this.peer === peer && !peer.destroyed) try { peer.reconnect(); } catch (e) { /* */ } });
  },
  joinP2P(code, hello) {
    this.leave(true); if (!this.hasPeer()) return;
    this.mode = 'p2p'; this.info(T('Conectando...'));
    const peer = new Peer(this.peerOpts()); this.peer = peer;
    const timer = setTimeout(() => { if (this.peer === peer && !(this.conn && this.conn.open)) this.err(T('Não foi possível alcançar a sala. Confira o código e tente de novo.')); }, 20000);
    peer.on('open', () => {
      const conn = peer.connect(PEER_PREFIX + code, { reliable: true, serialization: 'json' }); this.conn = conn;
      conn.on('open', () => { clearTimeout(timer); this.room = code; this.send(hello); });
      conn.on('data', d => { let m; try { m = typeof d === 'string' ? JSON.parse(d) : d; } catch (e) { return; } this.onMsg(m); });
      conn.on('close', () => { if (this.conn === conn && (this.role === 'client' || this.relay)) this.onMsg({ t: 'closed' }); });
    });
    peer.on('error', e => {
      if (this.peer !== peer) return;
      clearTimeout(timer);
      this.err(e.type === 'peer-unavailable' ? T('Sala não encontrada.') : T('Erro de conexão online') + ' (' + e.type + ').');
    });
  },
  // ---------- API usada pela interface ----------
  host(url) { if (url) this.connectWS(url, () => this.send({ t: 'host' })); else this.hostP2P(); },
  join(url, code) {
    if (!code) return this.err(T('Digite o código da sala.'));
    const av = Object.assign({}, DEFAULT_AVATAR, Save.data.avatar || {});
    const hello = { t: 'join', code, name: av.name || 'Tripulante', avatar: av, ship: (U.lobby && U.lobby.ship) || 1, role: (U.lobby && U.lobby.role) || '' };
    if (url) this.connectWS(url, () => this.send(hello)); else this.joinP2P(code, hello);
  },
  leave(silent) {
    if (this.ws) { try { this.ws.close(); } catch (e) { /* */ } }
    if (this.conn) { try { this.conn.close(); } catch (e) { /* */ } }
    for (const pid in this.conns) { try { this.conns[pid].close(); } catch (e) { /* */ } }
    if (this.peer) { try { this.peer.destroy(); } catch (e) { /* */ } }
    this.ws = null; this.peer = null; this.conn = null; this.conns = {}; this.open = false; this.mode = null;
    this.role = null; this.room = null; this.players = {}; this.relay = false; this.arcas = {}; this.roster = {}; this.mySh = 1;
    if (typeof S !== 'undefined' && S) S.crew.forEach(c => { if (c.owner && c.owner !== 'host') c.owner = null; });
    if (!silent) U.lobby = null;
  },
  onMsg(m) {
    switch (m.t) {
      case 'room': this.role = 'host'; this.hubShip = (U.lobby && U.lobby.ship) || 1; this.mySh = this.hubShip; this.room = m.code; U.screen = 'lobby'; U.lobby = Object.assign({}, U.lobby, { err: '', busy: false }); break;
      case 'error': this.err(m.msg); break;
      // ---- host ----
      case 'join': {
        if (this.role !== 'host') return;
        const ship = Math.max(1, Math.min(4, +m.ship || 1));
        if (!this.relay && ship !== this.hubShip) return this.joinOther(m, ship); // outra Arca: o 1º vira Comandante dela
        const taken = Object.values(this.players).map(p => p.role);
        const free = ROLES.find(r => r.id === m.role && !taken.includes(r.id)) || ROLES.find(r => !taken.includes(r.id));
        if (!free) { this.send({ t: 'to', pid: m.pid, msg: { t: 'error', msg: 'Sala cheia (6 tripulantes).' } }); return; }
        this.players[m.pid] = { name: String(m.name || 'Tripulante').slice(0, 14), role: free.id, avatar: m.avatar, pid: m.pid };
        if (!this.relay) this.roster[m.pid] = { pid: m.pid, name: this.players[m.pid].name, ship: this.hubShip, roleName: free.name };
        this.send({ t: 'to', pid: m.pid, msg: { t: 'welcome', crew: free.id, roleName: free.name, code: this.room, ship: this.relay ? this.mySh : this.hubShip, cmdName: this.relay ? null : null } });
        if (S) this.assignSeats();
        const nm = this.players[m.pid].name;
        const rn = l => (I18N_DICT[l] && I18N_DICT[l][free.name]) || free.name;
        Chat.sysAll(K(`${nm} entrou como ${free.name}.`, `${nm} joined as ${rn('en')}.`, `${nm} entró como ${rn('es')}.`), 'join');
        if (S) toast(`${nm} entrou como ${free.name}.`);
        break;
      }
      case 'relay': if (this.role === 'host' && !this.relay) this.onRelay(m); break;
      case 'leave': {
        if (!this.relay) {
          const r = this.roster[m.pid]; delete this.roster[m.pid];
          if (r && r.ship !== this.hubShip) { // saiu alguém de outra Arca
            const a = this.arcas[r.ship];
            if (a && a.cmdPid === m.pid) { // o Comandante saiu: a Arca fecha
              a.members.forEach(pid => this.sendTo(pid, { t: 'closed', msg: `O Comandante da Nave-${r.ship} saiu.` }));
              delete this.arcas[r.ship];
              Chat.sysAll(K(`O Comandante da Nave-${r.ship} saiu.`, `The Commander of Spaceship ${r.ship} left.`, `El Comandante de la Nave-${r.ship} salió.`), 'join');
            } else if (a) { a.members = a.members.filter(x => x !== m.pid); this.sendTo(a.cmdPid, { t: 'leave', pid: m.pid }); }
            return;
          }
        }
        const p = this.players[m.pid]; if (!p) return;
        delete this.players[m.pid];
        Chat.sysAll(K(`${p.name} saiu da sala.`, `${p.name} left the room.`, `${p.name} salió de la sala.`), 'join');
        if (S) { const c = p.role ? crewById(p.role) : null; if (c) { c.owner = null; c.task = null; c.ctask = null; } toast(`${p.name} saiu. Um bot assumiu.`); }
        break;
      }
      case 'pos': {
        if (this.forwardToCmd(m)) return;
        const p = this.players[m.pid]; if (!p || !S) return;
        if (m.ex != null) { if (S.scene === 'earth') { S.cityPos = S.cityPos || {}; S.cityPos[p.role] = { x: clamp(+m.ex || 0, 0, EARTH_W), face: m.face > 0 ? 1 : -1, moving: !!m.moving, walkT: +m.walkT || 0, jy: clamp(+m.jy || 0, 0, 40) }; } return; }
        const c = crewById(p.role); if (!c || !c.alive) return;
        Object.assign(c, { x: clamp(+m.x || 0, 20, (S.scene === 'colony' ? COLONY_W : WORLD_W) - 20), deck: m.deck === 'L' ? 'L' : 'U', face: m.face > 0 ? 1 : -1, moving: !!m.moving, walkT: +m.walkT || 0, climb: +m.climb || 0, climbTo: m.climbTo === 'L' ? 'L' : 'U', jy: clamp(+m.jy || 0, 0, 40) });
        c.tx = c.x; c.tdeck = c.deck;
        break;
      }
      case 'act': {
        if (this.forwardToCmd(m)) return;
        const p = this.players[m.pid]; if (!p || !S) return;
        if (typeof m.type !== 'string' || !ACTIONS[m.type]) return;
        const blocked = S.scene === 'colony' ? [] : ['cruise', 'fund', 'trade', 'ration', 'hibernate', 'orbitBurn', 'orbitWait']; // decisões de gestão do Comandante; avançar de etapa (destino, pouso, migração) qualquer jogador pode
        if (blocked.includes(m.type)) return; // decisões do Comandante
        applyAction(m.type, m.p, p.role);
        break;
      }
      case 'chat': if (m.m) Chat.fromNet(m.m); else if (this.role === 'host' && !this.relay) Chat.fromPlayer(m.pid, m.text); break; // o hub redistribui o chat da sala toda
      // ---- cliente ----
      case 'welcome':
        if (m.cmd) { // 1º jogador dessa Arca: vira Comandante e simula a nave dele; a sala só repassa as mensagens
          U.lobby = Object.assign({}, U.lobby, { err: '', busy: false });
          this.role = 'host'; this.relay = true; this.mySh = m.ship; this.room = m.code; this.players = {}; U.me = 'cmd'; this.myRoleName = 'Comandante'; U.screen = 'lobby';
          break;
        }
        if (m.ship) this.mySh = m.ship; this.cmdName = m.cmdName || null;
        U.lobby = Object.assign({}, U.lobby, { err: '', busy: false }); this.role = 'client'; this.room = m.code; U.me = m.crew; this.myRoleName = m.roleName; this.pendingShip = m.pendingShip || null; if (!S) U.screen = 'lobby'; break;
      case 'state': {
        if (this.role !== 'client') return;
        const keep = S && crewById(U.me);
        const local = keep ? { x: keep.x, deck: keep.deck, face: keep.face, moving: keep.moving, walkT: keep.walkT, climb: keep.climb, climbTo: keep.climbTo, tx: keep.tx, tdeck: keep.tdeck, jy: keep.jy, jv: keep.jv, jg: keep.jg } : null;
        const prevScene = S && S.scene;
        S = m.S;
        const mine = crewById(U.me);
        if (local && mine && prevScene === S.scene) { const task = mine.task; Object.assign(mine, local); mine.task = task; }
        U.screen = 'game';
        break;
      }
      case 'closed': { const was = this.role; this.leave(true); if (was === 'client' || this.relay || was === 'host') { if (was === 'client' || was === 'host') { S = null; U.screen = 'lobby'; this.err(m.msg ? T(m.msg) : T('O Comandante fechou a sala.')); } } break; }
    }
  },
  // ---------- várias Arcas na mesma sala ----------
  // O criador da sala (hub) é Comandante da nave que escolheu. O 1º jogador a entrar em cada outra
  // Arca vira Comandante dela: o navegador dele simula a viagem daquela nave (como um "host") e a
  // sala só repassa as mensagens. Os demais jogadores da Arca viram tripulantes.
  rosterName(pid) { const r = this.roster[pid]; return r ? r : null; },
  sendTo(pid, msg) {
    if (this.mode === 'ws') { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify({ t: 'to', pid: (typeof pid === 'string' && /^\d+$/.test(pid)) ? +pid : pid, msg })); return; }
    const c = this.conns[pid]; if (c && c.open) try { c.send(JSON.stringify(msg)); } catch (e) { /* */ }
  },
  sendMembers(pids, msg) {
    if (!pids.length) return;
    if (this.mode === 'ws') { for (const pid of pids) this.sendTo(pid, msg); return; }
    const str = JSON.stringify(msg);
    for (const pid of pids) { const c = this.conns[pid]; if (c && c.open && !(msg.t === 'state' && c.dataChannel && c.dataChannel.bufferedAmount > 150000)) try { c.send(str); } catch (e) { /* */ } } // estado é um retrato completo: se o canal está cheio, pula este (evita fila de atraso)
  },
  // pids (do transporte) dos tripulantes da nave do próprio hub
  shipMembers() { return Object.keys(this.players).map(k => (this.players[k].pid != null ? this.players[k].pid : k)); },
  joinOther(m, ship) {
    const nm = String(m.name || 'Tripulante').slice(0, 14);
    if (Object.keys(this.roster).length >= 27) return this.sendTo(m.pid, { t: 'error', msg: 'Sala cheia (28 pessoas).' });
    const a = this.arcas[ship];
    this.roster[m.pid] = { pid: m.pid, name: nm, ship, avatar: m.avatar };
    if (!a) { // primeira pessoa nessa Arca: vira o Comandante dela
      this.arcas[ship] = { cmdPid: m.pid, members: [], cmdName: nm };
      this.roster[m.pid].cmd = true; this.roster[m.pid].roleName = 'Comandante';
      this.sendTo(m.pid, { t: 'welcome', cmd: true, ship, code: this.room, roleName: 'Comandante' });
      Chat.sysAll(K(`${nm} é o Comandante da Nave-${ship}.`, `${nm} is the Commander of Spaceship ${ship}.`, `${nm} es el Comandante de la Nave-${ship}.`), 'join');
      return;
    }
    this.sendTo(a.cmdPid, { t: 'join', pid: m.pid, name: nm, avatar: m.avatar, role: m.role }); // o Comandante da Arca atribui a função
  },
  // mensagem enviada pelo Comandante de outra Arca para a sua tripulação (m.pid = quem enviou; m.to = destino)
  onRelay(m) {
    const r = this.roster[m.pid]; if (!r || !r.cmd) return;
    const a = this.arcas[r.ship]; if (!a) return;
    if (m.k === 'bcast') return this.sendMembers(a.members, m.msg);
    if (m.k !== 'to' || m.to == null) return;
    const msg = m.msg || {};
    if (msg.t === 'welcome' && msg.crew) { // função atribuída: o jogador passa a fazer parte da Arca
      if (!a.members.includes(m.to)) a.members.push(m.to);
      const rr = this.roster[m.to]; if (rr) rr.roleName = msg.roleName;
      msg.ship = r.ship; msg.cmdName = r.name;
    }
    if (a.members.includes(m.to) || msg.t === 'welcome' || msg.t === 'error') this.sendTo(m.to, msg);
  },
  // hub: mensagem de um tripulante de outra Arca vai para o Comandante dela
  forwardToCmd(m) {
    if (this.relay) return false;
    const r = this.roster[m.pid]; if (!r || r.ship === this.hubShip) return false;
    const a = this.arcas[r.ship]; if (!a || r.cmd) return true;
    this.sendTo(a.cmdPid, m); return true;
  },
  assignSeats() {
    if (!S) return;
    for (const pid in this.players) {
      const p = this.players[pid]; const c = crewById(p.role); if (!c) continue;
      c.owner = pid; c.name = p.name; if (p.avatar) c.avatar = Object.assign({}, DEFAULT_AVATAR, p.avatar, { name: p.name });
    }
  },
  tick(dt) {
    if (!this.ready()) return;
    if (this.role === 'host' && S) {
      this.sendT -= dt;
      if (this.sendT <= 0) { this.sendT = 0.2; if (this.relay) this.send({ t: 'bcast', msg: { t: 'state', S } }); else this.sendMembers(this.shipMembers(), { t: 'state', S }); }
    }
    if (this.role === 'client' && S && S.scene === 'earth' && U.earth) {
      this.posT -= dt;
      if (this.posT <= 0) { this.posT = 0.12; const p = U.earth.p; this.send({ t: 'pos', ex: Math.round(p.x), face: p.face, moving: !!p.moving, walkT: p.walkT || 0, jy: Math.round((p.jy || 0) * 10) / 10 }); }
    }
    if (this.role === 'client' && S && (S.scene === 'ship' || S.scene === 'colony')) {
      this.posT -= dt;
      const c = crewById(U.me);
      if (this.posT <= 0 && c) { this.posT = 0.1; this.send({ t: 'pos', x: c.x, deck: c.deck, face: c.face, moving: c.moving, walkT: c.walkT, climb: c.climb, climbTo: c.climbTo, jy: Math.round((c.jy || 0) * 10) / 10 }); }
    }
  },
};
