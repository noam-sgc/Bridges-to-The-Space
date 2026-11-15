// ============================================================
//  AS ARCAS SE ENCONTRAM EM PONTES-01b (multiplayer)
//  Cada Arca faz a própria viagem (simulada pelo seu Comandante).
//  Quando uma Arca pousa, a tripulação dela desce na colônia da
//  Arca do criador da sala (hub): todos passam a jogar no mesmo
//  planeta. Se a Arca do hub ainda não pousou, a outra Arca segue
//  na própria colônia e se junta assim que a do hub chegar.
// ============================================================
'use strict';

ARCA_COLORS[1] = ARCA_COLORS[1] || '#7dffb0';
Net.pendingArcas = {};
Net.arrivedSent = false;

// ---------- lado da Arca que pousou (Comandante em modo relé) ----------
function arcaArrivalData() {
  return {
    crew: S.crew.filter(c => c.alive).map(c => ({
      id: c.id, name: c.name, avatar: c.avatar, roleName: c.roleName, humor: c.humor, saciedade: c.saciedade,
      owner: c.id === 'cmd' ? 'SELF' : (c.owner && c.owner !== 'bot' ? c.owner : null),
    })),
    res: { comida: S.res.comida, agua: S.res.agua, oxigenio: S.res.oxigenio, medicos: S.res.medicos },
  };
}

// ---------- lado do hub: recebe a Arca e coloca o pessoal na colônia ----------
function arcaArrive(pid, data) {
  const r = Net.roster[pid]; if (!r || !r.cmd || !data || !Array.isArray(data.crew)) return;
  Net.pendingArcas[r.ship] = { cmdPid: pid, data };
  if (S && S.scene === 'colony' && S.colony) return arcaMergeAll();
  Net.sendTo(pid, { t: 'arcaWait', hub: Net.hubShip });
  Chat.sysAll(K(`🛬 A Nave-${r.ship} pousou em Pontes-01b! Ela se junta à colônia quando a Nave-${Net.hubShip} pousar.`, `🛬 Spaceship ${r.ship} landed on Pontes-01b! It joins the colony once Spaceship ${Net.hubShip} lands.`, `🛬 ¡La Nave-${r.ship} aterrizó en Pontes-01b! Se une a la colonia cuando aterrice la Nave-${Net.hubShip}.`), 'join');
}
function arcaMergeAll() { for (const ship of Object.keys(Net.pendingArcas)) arcaMerge(+ship, Net.pendingArcas[ship]); }
function arcaMerge(ship, rec) {
  const C = S.colony; if (!C) return;
  C.people = C.people || []; C.pid = C.pid || 0;
  const px = CBUILD.pista.x; let n = 0;
  rec.data.crew.forEach((c, i) => {
    const id = 'a' + ship + '_' + c.id; if (C.people.find(p => p.id === id)) return;
    const owner = c.owner === 'SELF' ? rec.cmdPid : (c.owner && Net.roster[c.owner] ? c.owner : null);
    C.people.push({
      id, ship, seed: Math.floor(Math.random() * 1e9), name: String(c.name || 'Tripulante').slice(0, 14), avatar: c.avatar,
      role: 'colono', roleName: 'Nave-' + ship + ' · ' + (c.roleName || ''), alive: true, status: 'ok', statusT: 0,
      humor: clamp(+c.humor || 70, 0, 100), saciedade: clamp(+c.saciedade || 70, 0, 100),
      x: px + (Math.random() * 80 - 40), deck: 'L', face: Math.random() < 0.5 ? 1 : -1, walkT: 0, moving: false,
      owner: owner || null, spawnT: i * 0.4, idleT: 1 + Math.random() * 3, jy: 0,
    });
    n++;
    if (owner) {
      Net.players[owner] = { name: c.name, role: id, avatar: c.avatar, pid: owner };
      const rr = Net.roster[owner]; if (rr) rr.merged = true;
      Net.sendTo(owner, { t: 'welcome', merged: true, crew: id, roleName: 'Nave-' + ship + ' · ' + (c.roleName || ''), code: Net.room, ship });
    }
  });
  // o que sobrou nos porões da Arca vai para o estoque da colônia
  const res = rec.data.res || {};
  for (const k of ['comida', 'agua', 'oxigenio', 'medicos']) { const v = +res[k] || 0; if (v > 0) addRes(k, v, 'Suprimentos das Naves'); }
  delete Net.arcas[ship]; delete Net.pendingArcas[ship];
  const msg = K(`🚀 A Nave-${ship} chegou à colônia: ${n} pessoas se juntaram a vocês em Pontes-01b!`, `🚀 Spaceship ${ship} reached the colony: ${n} people joined you on Pontes-01b!`, `🚀 ¡La Nave-${ship} llegó a la colonia: ${n} personas se unieron a ustedes en Pontes-01b!`);
  Chat.sysAll(msg, 'join'); toast(msg, 'good');
  S.v++;
}

// ---------- ganchos na rede ----------
{
  const _onRelay = Net.onRelay;
  Net.onRelay = function (m) { if (m.k === 'arrive') return arcaArrive(m.pid, m.data); return _onRelay.call(this, m); };
  // depois de juntar, as mensagens de quem veio de outra Arca vão para o hub (não mais para o Comandante dela)
  const _fwd = Net.forwardToCmd;
  Net.forwardToCmd = function (m) { const r = this.roster[m.pid]; if (r && r.merged) return false; return _fwd.call(this, m); };
  const _onMsg = Net.onMsg;
  Net.onMsg = function (m) {
    if (m && m.t === 'leave' && !this.relay) { const r = this.roster[m.pid]; if (r && r.merged) r.ship = this.hubShip; }
    if (m && m.t === 'arcaWait') { toast(K(`Pouso concluído! Assim que a Nave-${m.hub} pousar, as duas tripulações vão se encontrar na mesma colônia.`, `Landing complete! As soon as Spaceship ${m.hub} lands, both crews will meet in the same colony.`, `¡Aterrizaje completo! En cuanto aterrice la Nave-${m.hub}, ambas tripulaciones se encontrarán en la misma colonia.`), 'good'); return; }
    if (m && m.t === 'welcome' && m.merged) { // virou morador da colônia do hub
      this.relay = false; this.players = {}; this.role = 'client'; this.arrivedSent = true;
      if (m.ship) this.mySh = m.ship;
      U.me = m.crew; this.myRoleName = m.roleName; U.panel = null; U.help = false;
      toast(K('🤝 Vocês chegaram à colônia compartilhada de Pontes-01b!', '🤝 You reached the shared colony on Pontes-01b!', '🤝 ¡Llegaron a la colonia compartida de Pontes-01b!'), 'good');
      return;
    }
    return _onMsg.call(this, m);
  };
  const _tick = Net.tick;
  Net.tick = function (dt) {
    _tick.call(this, dt);
    if (!this.ready() || !S) return;
    // Comandante de outra Arca: avisa a sala quando pousa
    if (this.relay && this.role === 'host' && S.scene === 'colony' && S.colony && !this.arrivedSent) { this.arrivedSent = true; this.sendRaw({ t: 'relay', k: 'arrive', data: arcaArrivalData() }); }
    // hub: quando a própria Arca pousa, recebe quem estava esperando
    if (this.role === 'host' && !this.relay && S.scene === 'colony' && S.colony && Object.keys(this.pendingArcas).length) arcaMergeAll();
  };
  const _leave = Net.leave;
  Net.leave = function (silent) { this.pendingArcas = {}; this.arrivedSent = false; return _leave.call(this, silent); };
}
