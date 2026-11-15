// ============================================================
//  A TERRA EM COLAPSO — cidade explorável (história inicial)
//  8 edifícios com painéis educativos (dados reais), 8 NPCs com
//  diálogos; o foguete no fim da rua começa a missão.
// ============================================================
'use strict';

const CITY_BUILDINGS = [
  { id: 'casa', x: 140, w: 84, h: 66, col: '#5a4a3a', roof: '#3a2f26', icon: '🏠', name: 'Seu apartamento',
    tabs: [
      { t: 'Noticiário', b: 'O telejornal repete: IQA 312, 46 °C, racionamento de água nível 4. Cientistas lembram que satélites observam a Terra todos os dias — do CO₂ no ar ao gelo nos polos. A atmosfera tem hoje mais de 420 ppm de CO₂, contra ≈ 280 ppm antes da era industrial.' },
      { t: 'Janela', b: 'Da janela, a névoa cobre os prédios. Desde o fim do século XIX a temperatura média global subiu ≈ 1,2 °C, e o nível do mar sobe cerca de 3,4 mm por ano em média desde 1993 — hoje mais rápido. O gelo do Ártico no fim do verão diminui ≈ 12% por década.' },
      { t: 'Mochila', b: 'Você separa o que levar: uma foto, uma semente, o rádio antigo. Colocar 1 kg em órbita custa milhares de dólares — por isso, numa nave, tudo precisa ter função. Quanto mais leve a carga, mais longe a nave chega.' },
    ] },
  { id: 'missao', x: 262, w: 92, h: 70, col: '#2f4a5e', roof: '#1c3040', icon: '🛰', name: K('Centro de Design de Missões', 'Mission Design Center', 'Centro de Diseño de Misiones'),
    tabs: [
      { t: K('Fases da missão', 'Mission phases', 'Fases de la misión'), b: K('Uma missão espacial segue um ciclo de vida: Pré-Fase A (estudos de conceito), Fase A (conceito e desenvolvimento de tecnologia), Fase B (projeto preliminar), Fase C (projeto final e construção), Fase D (integração, testes e lançamento), Fase E (operações) e Fase F (encerramento).', 'A space mission follows a lifecycle: Pre-Phase A (concept studies), Phase A (concept and technology development), Phase B (preliminary design), Phase C (final design and build), Phase D (integration, test and launch), Phase E (operations) and Phase F (closeout).', 'Una misión espacial sigue un ciclo de vida: Pre-Fase A (estudios de concepto), Fase A (concepto y desarrollo tecnológico), Fase B (diseño preliminar), Fase C (diseño final y construcción), Fase D (integración, pruebas y lanzamiento), Fase E (operaciones) y Fase F (cierre).') },
      { t: K('Revisões', 'Reviews', 'Revisiones'), b: K('Entre as fases existem revisões, como a PDR (Revisão Preliminar de Projeto) e a CDR (Revisão Crítica de Projeto). Elas funcionam como portões: se o projeto não está maduro, a missão não avança. Errar no papel é barato; errar no espaço, não.', 'Between phases there are reviews, like the PDR (Preliminary Design Review) and CDR (Critical Design Review). They work as gates: if the design is not mature, the mission does not move on. Mistakes on paper are cheap; in space they are not.', 'Entre fases hay revisiones, como la PDR (Revisión Preliminar de Diseño) y la CDR (Revisión Crítica de Diseño). Son puertas: si el diseño no está maduro, la misión no avanza. Errar en papel es barato; en el espacio, no.') },
      { t: K('Da ciência à nave', 'From science to spacecraft', 'De la ciencia a la nave'), b: K('Tudo começa com perguntas científicas. Delas saem os objetivos, os requisitos e, só então, os instrumentos e a nave. Os engenheiros mantêm margens de massa, energia e orçamento — porque imprevistos acontecem. É a mesma lógica do seu fundo de contingência!', 'It all starts with science questions. From them come objectives, requirements and only then the instruments and spacecraft. Engineers keep margins of mass, power and budget — because surprises happen. It is the same logic as your contingency fund!', 'Todo empieza con preguntas científicas. De ellas salen los objetivos, los requisitos y solo después los instrumentos y la nave. Los ingenieros mantienen márgenes de masa, energía y presupuesto — porque ocurren imprevistos. ¡Es la misma lógica de su fondo de contingencia!') },
    ] },
  { id: 'mercado', x: 383, w: 100, h: 58, col: '#4a5a6a', roof: '#2a3a52', icon: '💧', name: 'Mercado da Água',
    tabs: [
      { t: 'A fila', b: 'Racionamento nível 4: 20 litros por pessoa por dia, para beber, cozinhar e se lavar. Na ISS a água também é contada gota a gota — mas lá ela é reciclada: em 2023 o sistema alcançou 98% de recuperação, transformando até suor e urina em água potável.' },
      { t: 'Aquíferos', b: 'Os satélites GRACE e GRACE-FO medem minúsculas variações na gravidade para descobrir quanta água subterrânea e gelo cada região ganha ou perde. A Groenlândia perde cerca de 270 bilhões de toneladas de gelo por ano; a Antártida, cerca de 150 bilhões.' },
      { t: 'Peso da água', b: '1 litro de água pesa 1 kg. Levar 600 litros numa nave significa 600 kg a mais para lançar e frear. Por isso quem recicla viaja mais longe: no jogo, o reciclador de ciclo fechado vale ouro.' },
    ] },
  { id: 'observatorio', x: 652, w: 96, h: 78, col: '#3a4468', roof: '#24304f', icon: '🔭', name: 'Observatório Pontes',
    tabs: [
      { t: 'Trânsito', b: 'Quando um planeta passa na frente da estrela, o brilho cai um pouquinho. Foi assim que o telescópio Kepler (2009–2018) encontrou mais de 2.600 planetas. O satélite TESS (2018) continua a busca em estrelas próximas.' },
      { t: 'Velocidade radial', b: 'A gravidade do planeta faz a estrela “balançar”, e a cor da luz muda de leve (efeito Doppler). Assim foi achado Proxima Centauri b, em 2016, a 4,2 anos-luz. Com a tecnologia atual, uma sonda como a Voyager 1 levaria cerca de 75 mil anos para chegar lá.' },
      { t: 'Zona habitável', b: 'É a faixa em que a água pode ficar líquida na superfície. Mas não basta: contam a atmosfera, o campo magnético e as erupções da estrela. O Exoplanet Archive já lista mais de 6.000 exoplanetas confirmados — poucos parecem habitáveis.' },
      { t: 'Pontes-01b', b: 'Os observatórios do mundo se uniram e encontraram Pontes-01b: raio ≈ 1,04 vezes o da Terra, temperatura de equilíbrio ≈ 268 K e uma estrela calma. O telescópio James Webb estuda a luz que atravessa atmosferas distantes para descobrir seus gases. Pontes-01b é a nossa melhor — e única — esperança.' },
    ] },
  { id: 'clinica', x: 921, w: 92, h: 62, col: '#6a5a5a', roof: '#4a3a3a', icon: '✚', name: 'Clínica Respira',
    tabs: [
      { t: 'O ar da cidade', b: 'Índice de qualidade do ar acima de 300 é “perigoso”. Satélites medem poluentes do espaço — o instrumento TEMPO (lançado em 2023) faz uma medição por hora sobre a América do Norte. Na nave, o ar também é um recurso: a filtragem precisa ser vigiada.' },
      { t: 'Corpo sem peso', b: 'Sem gravidade os ossos perdem de 1% a 1,5% de massa por mês e os músculos enfraquecem; os fluidos sobem para a cabeça (rosto inchado, dor de cabeça). Por isso os astronautas treinam cerca de 2 horas por dia. O paramédico da sua nave vai lidar com isso.' },
      { t: 'Radiação', b: 'Na Terra recebemos ≈ 3 mSv por ano. Na ISS, um astronauta recebe cerca de 80 mSv em 6 meses; fora da proteção do campo magnético da Terra é ainda mais. Tempestades solares exigem um abrigo blindado — no jogo, os dormitórios.' },
    ] },
  { id: 'controle', x: 1190, w: 108, h: 80, col: '#34506a', roof: '#1e3248', icon: '📡', name: 'Centro de Controle da Missão',
    tabs: [
      { t: 'Rede de Espaço Profundo', b: 'A DSN tem três complexos — Goldstone (EUA), Madri (Espanha) e Canberra (Austrália) — separados por ≈ 120° de longitude. Assim, enquanto a Terra gira, sempre há uma antena gigante enxergando a sua nave.' },
      { t: 'Atraso do sinal', b: 'O rádio viaja à velocidade da luz, mas o espaço é enorme: de Marte o sinal leva de 3 a 22 minutos; da Voyager 1, quase um dia inteiro. Por isso a nave precisa de autonomia: a Terra aconselha, mas o Comandante decide.' },
      { t: 'Sua tripulação', b: 'Seis especialistas vão com você: paramédico, navegador, agricultor/engenheiro genético, dois engenheiros e o pesquisador chefe. Cada um tem gostos, alergias e humor. Cuide de todos: tripulantes felizes trabalham melhor — e nesta missão, mortes derrubam a moral de todo mundo.' },
    ] },
  { id: 'recicla', x: 1446, w: 100, h: 56, col: '#3e5a44', roof: '#2a4030', icon: '♻', name: 'Central de Reciclagem',
    tabs: [
      { t: 'Ciclo fechado', b: 'No espaço não existe “jogar fora”. O sistema de suporte à vida da ISS (ECLSS) recicla água e gera oxigênio; o que sobra vira insumo. Numa viagem longa, cada átomo precisa dar mais de uma volta.' },
      { t: 'Lixo espacial', b: 'O lixo da ISS vai embora em naves de carga, como a Cygnus, que queimam na reentrada. Numa nave de longo alcance isso não é possível: restos de comida viram adubo, plástico vira filamento para impressão 3D, e o resto é compactado — ou ejetado.' },
      { t: 'Oxigênio', b: 'Um astronauta respira cerca de 0,84 kg de O₂ por dia. A ISS o produz quebrando a água por eletrólise. Em Marte, o instrumento MOXIE (rover Perseverance) fez O₂ a partir do CO₂ da atmosfera: 122 gramas no total, entre 2021 e 2023.' },
    ] },
  { id: 'sementes', x: 1695, w: 104, h: 54, col: '#4a6a4a', roof: '#35523a', icon: '🌱', name: 'Banco de Sementes',
    tabs: [
      { t: 'Alface no espaço', b: 'Em 2015, no experimento Veggie, astronautas da ISS comeram alface cultivada em órbita. Plantas dão comida, oxigênio e ainda ajudam o psicológico de quem passa meses longe de casa.' },
      { t: 'Pimentas', b: 'Em 2021 astronautas colheram pimentas Hatch na ISS (Plant Habitat-04). A comida da nave é sem graça; um toque de pimenta melhora o humor — e no jogo, o Navegador adora apimentado!' },
      { t: 'Sem gravidade, sem solo', b: 'Sem gravidade a água não escorre: as raízes precisam de luz LED, nutrientes e ventilação controlados. E em outro mundo o solo pode ser tóxico — o solo de Marte tem percloratos, detectados pela sonda Phoenix em 2008. Por isso levamos um banco de sementes.' },
    ] },
  { id: 'alistamento', x: 1958, w: 110, h: 84, col: '#3a4f7a', roof: '#22345a', icon: '🚀', name: 'Centro de Alistamento Pontes-01b',
    tabs: [
      { t: 'A missão', b: 'Centenas de naves partem ao mesmo tempo. A sua tem destino Pontes-01b. Você vai gerenciar recursos, tripulação e rota, enfrentar asteroides, radiação, falhas e o estresse de todos a bordo.' },
      { t: 'Verba e bônus', b: 'Você terá 30 pontos de verba e 5 espaços de módulo: não dá para ter tudo. Quem explora a cidade, lê os painéis e conversa com as pessoas chega mais preparado: cada 10 descobertas no Diário do Explorador rendem +1 ponto de verba (máx. +3).' },
    ] },
];

// tom de voz de cada morador (síntese de voz)
const NPC_VOICE = { lia: 1.15, teo: 0.85, mari: 1.45, ramos: 0.75, bia: 1.15, gui: 0.95, nina: 1.1, beto: 0.8 };
// moradores: posição na cidade. Nome, função e falas ficam em data/lang/<idioma>.json ("falas")
const CITY_NPCS = [
  { id: 'lia', x: 102, seed: 11, name: '', role: '', say: [] },
  { id: 'teo', x: 575, seed: 23, name: '', role: '', say: [] },
  { id: 'mari', x: 473, seed: 37, name: '', role: '', say: [] },
  { id: 'ramos', x: 774, seed: 41, name: '', role: '', say: [] },
  { id: 'bia', x: 1010, seed: 53, name: '', role: '', say: [] },
  { id: 'gui', x: 1318, seed: 61, name: '', role: '', say: [] },
  { id: 'nina', x: 1561, seed: 71, name: '', role: '', say: [] },
  { id: 'beto', x: 1817, seed: 83, name: '', role: '', say: [] },
];

const CITY_TOTAL = CITY_BUILDINGS.reduce((s, b) => s + b.tabs.length, 0) + CITY_NPCS.length;
const cityCount = () => (U.earth ? Object.keys(U.earth.read).length : 0);
const cityBonus = () => Math.min(3, Math.floor(cityCount() / 10));

function cityInit() {
  U.earth = { t: 0, limit: 240, p: { x: 80, face: 1, moving: false, walkT: 0 }, read: {}, panel: null, tab: 0, dialog: null, diary: false };
  U.comms = 0;
}
// foguete da missão no fim da cidade: embarcar nele começa a jornada
const rocketX = () => EARTH_W - 73;
function cityNear() {
  const E = U.earth, px = E.p.x;
  let best = null, bd = 44;
  for (const b of CITY_BUILDINGS) { const d = Math.abs(b.x - px); if (d < bd) { bd = d; best = { type: 'b', o: b }; } }
  for (const n of CITY_NPCS) { const d = Math.abs(n.x - px); if (d < Math.min(bd, 34)) { bd = d; best = { type: 'n', o: n }; } }
  if (Math.abs(rocketX() - px) < 45) best = { type: 'r' };
  return best;
}
// o cartão da casa fica no canto e não trava a caminhada; só diálogo e diário param o jogador
function cityBusy() { const E = U.earth; return !!(E && (E.dialog || E.diary)); }
function tickCity(dt) {
  const E = U.earth; if (!E || U.comms) return;
  if (E.panel) { const b = CITY_BUILDINGS.find(x => x.id === E.panel); if (!b || Math.abs(E.p.x - b.x) > 80) E.panel = null; }
  // ao passar por um prédio, o conteúdo abre sozinho no canto (se fechar, só reabre depois de se afastar)
  if (E.autoClosed) { const b = CITY_BUILDINGS.find(x => x.id === E.autoClosed); if (!b || Math.abs(E.p.x - b.x) > 80) E.autoClosed = null; }
  if (!E.panel && !E.dialog && !U.comms) { const n = cityNear(); if (n && n.type === 'b' && E.autoClosed !== n.o.id) { E.panel = n.o.id; E.tab = 0; E.read[n.o.id + ':0'] = 1; } }
  jumpTick(E.p, dt);
  // a primeira moradora puxa conversa logo no começo
  if (!E.greeted && E.t > 1.2 && !cityBusy()) { E.greeted = true; E.dialog = { id: CITY_NPCS[0].id, i: 0 }; E.read['npc:' + CITY_NPCS[0].id] = 1; E.target = CITY_NPCS[0].x - 26; }
  if (!cityBusy()) {
    E.t += dt;
    const p = E.p; let dx = ((keys.ArrowRight || keys.KeyD) ? 1 : 0) - ((keys.ArrowLeft || keys.KeyA) ? 1 : 0);
    if (dx) E.target = null; // teclado tem prioridade sobre o mouse
    else if (E.target != null) { const d = E.target - p.x; if (Math.abs(d) < 3) E.target = null; else dx = Math.sign(d); }
    const sp = 62 * (keys.ShiftLeft || keys.ShiftRight ? RUN_MULT : 1);
    if (dx) { p.x = clamp(p.x + dx * sp * dt, 20, EARTH_W - 20); p.face = dx; p.moving = true; p.walkT += dt * (sp / 62); } else p.moving = false;
  } else { E.p.moving = false; if (E.target != null && E.dialog) { const d = E.target - E.p.x; if (Math.abs(d) > 3) { E.p.x += Math.sign(d) * 62 * dt; E.p.face = Math.sign(d); E.p.moving = true; E.p.walkT += dt; } else E.target = null; } }
}
function cityComms() {
  if (typeof Net !== 'undefined' && Net.role === 'client') { if (S) S.toast = { text: 'O Comandante embarca todos no foguete quando estiver pronto.', kind: 'info', t: 3, id: Math.random() }; return; } // só o Comandante decide a partida
  U.comms = 1; U.earth.panel = null; U.earth.dialog = null; U.earth.diary = false; Sfx.alarm();
  Narrator.say(F('comms.selected'));
}
function cityInteract() {
  const E = U.earth; if (!E || U.comms) return;
  if (E.dialog) return UIH.cityNext();
  if (E.panel || E.diary) return;
  const n = cityNear(); if (!n) return;
  Sfx.click();
  if (n.type === 'r') return cityComms();
  if (n.type === 'b') { E.panel = n.o.id; E.tab = 0; E.read[n.o.id + ':0'] = 1; learnMark(n.o.id + ':0'); }
  else { E.dialog = { id: n.o.id, i: 0 }; E.read['npc:' + n.o.id] = 1; }
}
function cityEsc() { const E = U.earth; if (!E) return; if (E.dialog) E.dialog = null; else if (E.panel) { E.autoClosed = E.panel; E.panel = null; } else if (E.diary) E.diary = false; }

// ---------- desenho ----------
function drawCity(dt, cam) {
  const E = U.earth; const near = cityNear();
  for (const b of CITY_BUILDINGS) {
    const x = Math.round(b.x - cam); if (x < -90 || x > VW + 90) continue;
    const G = GROUND; const r = (a, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x + a), Math.round(y), w, h); };
    const hw = Math.round(b.w / 2);
    r(-hw, G - b.h, b.w, b.h, b.col); r(-hw - 3, G - b.h - 5, b.w + 6, 6, b.roof); r(-hw, G - b.h, b.w, 2, 'rgba(255,255,255,0.12)');
    // janelas
    for (let wy = G - b.h + 10; wy < G - 24; wy += 12) for (let wx = -hw + 8; wx < hw - 8; wx += 14) { if (Math.abs(wx) < 10 && wy > G - 40) continue; r(wx, wy, 7, 6, hash(wx + b.x, wy, 3) > 0.5 ? '#e8c660' : '#1e1a16'); }
    // porta iluminada
    r(-8, G - 24, 16, 24, '#171310'); r(-6, G - 22, 12, 22, '#ffd98a'); r(-1, G - 22, 2, 22, '#9a7a40');
    const hot = near && near.type === 'b' && near.o === b;
    if (hot) { cx.strokeStyle = '#ffd34c'; cx.lineWidth = 1; cx.strokeRect(x - hw - 2.5, G - b.h - 7.5, b.w + 5, b.h + 8); }
    // adornos
    if (b.id === 'observatorio') { cx.fillStyle = '#5a6a98'; cx.beginPath(); cx.arc(x, G - b.h - 5, 26, Math.PI, 0); cx.fill(); cx.fillStyle = '#0c1020'; cx.fillRect(x - 3, G - b.h - 31, 6, 26); cx.fillStyle = '#cfd6e6'; cx.fillRect(x + 8, G - b.h - 40 + Math.sin(R.t) * 2, 3, 22); }
    if (b.id === 'clinica') { r(-hw + 8, G - b.h + 6, 18, 18, '#fff'); r(-hw + 15, G - b.h + 8, 4, 14, '#e03030'); r(-hw + 10, G - b.h + 13, 14, 4, '#e03030'); }
    if (b.id === 'controle') { r(hw - 18, G - b.h - 26, 2, 22, '#aaa'); cx.fillStyle = '#e8ecf6'; cx.beginPath(); cx.ellipse(x + hw - 17, G - b.h - 28, 14, 6, -0.4, 0, 7); cx.fill(); r(-hw + 6, G - b.h + 6, 30, 16, '#0a1a2e'); r(-hw + 8, G - b.h + 8, 26, 12, (Math.floor(R.t * 2) % 2) ? '#2fd7ff' : '#1a8ab0'); }
    if (b.id === 'mercado') { for (let i = 0; i < 8; i++) r(-hw + i * 13, G - 36, 13, 10, i % 2 ? '#2f78c8' : '#e8e8f0'); r(-hw + 6, G - 14, 12, 14, '#3a5a8a'); r(-hw + 8, G - 12, 8, 3, '#6fb4ff'); }
    if (b.id === 'recicla') { for (let i = 0; i < 3; i++) { r(-hw + 6 + i * 16, G - 16, 12, 16, ['#2f8a4a', '#2f78c8', '#d8b030'][i]); } r(hw - 26, G - b.h - 18, 6, 18, '#2a3a2a'); r(hw - 30, G - b.h - 22, 14, 6, '#5fd35f'); }
    if (b.id === 'sementes') { r(-hw + 4, G - b.h + 8, b.w - 8, b.h - 12, 'rgba(160,230,255,0.18)'); for (let i = 0; i < 6; i++) { r(-hw + 10 + i * 15, G - 14 - (i * 5 % 8), 2, 10 + (i * 5 % 8), '#3fa84a'); r(-hw + 7 + i * 15, G - 16 - (i * 5 % 8), 8, 3, '#5fd35f'); } }
    if (b.id === 'alistamento') { r(hw - 12, G - b.h - 30, 2, 30, '#aaa'); r(hw - 10, G - b.h - 30, 14, 9, '#ff4a5a'); r(-hw + 8, G - b.h + 6, 12, 28, '#e8e8f0'); r(-hw + 11, G - b.h + 2, 6, 6, '#e03030'); r(-hw + 8, G - b.h + 30, 5, 8, '#ff9411'); }
    if (b.id === 'casa') { r(hw - 16, G - b.h - 14, 8, 14, '#2a2420'); r(-hw + 4, G - 30, 20, 3, '#555'); }
    // (sem letreiros nas casas: o nome aparece só no aviso "E — Entrar")
    const done = b.tabs.every((_, i) => E.read[b.id + ':' + i]);
    if (done) text('✔', x + hw - 6, G - b.h + 2, '#46e08a', 10, 'center');
  }
  // NPCs com nome
  for (const n of CITY_NPCS) {
    if (!n.av) n.av = randomAvatar(() => { n.s = ((n.s || n.seed) * 16807) % 2147483647; return n.s / 2147483647; });
    n.ph = (n.ph || n.seed) + dt; const talk = E.dialog && E.dialog.id === n.id;
    const x = Math.round(n.x - cam); if (x < -30 || x > VW + 30) continue;
    const face = E.p.x < n.x ? -1 : 1;
    drawChar(n.av, 'civil', x, GROUND, talk || Math.abs(E.p.x - n.x) < 60 ? face : (Math.sin(n.ph * 0.3) > 0 ? 1 : -1), 0, 'happy', true);
    const seen = E.read['npc:' + n.id];
    if (!seen) text('!', x, GROUND - SPR_H - 12 + Math.sin(R.t * 4) * 2, '#ffd34c', 10, 'center');
    const hot = near && near.type === 'n' && near.o === n;
    if (hot && !talk) text('[E] ' + n.name, x, GROUND - SPR_H - 12, '#fff', 8, 'center');
    if (talk) text(n.name, x, GROUND - SPR_H - 12, '#ffd34c', 8, 'center');
    if (talk) R.cityBubble = { text: n.say[E.dialog.i], x, y: GROUND - SPR_H - 4 }; // desenhado depois das placas
  }
}

// ---------- interface ----------
function cityScreen() {
  const E = U.earth;
  if (U.comms) return commsScreen();
  const n = cityCount();
  let ov = '';
  if (E.panel) ov = cityPanel();
  const near = !cityBusy() ? cityNear() : null;
  let houseCard = '';
  if (near && near.type === 'b' && !E.panel) houseCard = `<div class="house-card" data-ui="cityEnter"><span class="hc-ic">${near.o.icon}</span><span class="hc-name">${esc(L(near.o.name))}</span><button class="btn small primary" data-ui="cityEnter"><b>E</b> ${esc(L('Entrar'))}</button></div>`;
  if (near && near.type === 'r') houseCard = `<div class="house-card" data-ui="cityEnter"><span class="hc-ic">🚀</span><span class="hc-name">${esc(L('Foguete Pontes-01b'))}</span><button class="btn small primary" data-ui="cityEnter"><b>E</b> ${esc(L('Embarcar'))}</button></div>`;
  const nearForHint = near && (near.type === 'b' || near.type === 'r') ? null : near;
  const prompt = E.dialog ? `<b>E</b> — ${esc(L('Próxima fala ▶'))} · <b>Esc</b> — ${esc(L('sair'))}` : nearForHint ? `<b>E</b> — ${nearForHint.type === 'b' ? esc(L('Entrar: ')) + esc(L(near.o.name)) : esc(L('Conversar com ')) + esc(near.o.name)}` : '';
  return `<div class="earth-hud">
    <div class="tbox tl small"><b>TERRA · 2091</b><br>Qualidade do ar: <span class="red">péssima (IQA 312)</span><br>Temperatura: <span class="orange">46 °C</span><br>Água: racionamento nível 4</div>
    <div class="tbox tr small">${esc(L('Explore a cidade.'))}<br>🚀 ${esc(L('O foguete da missão fica no fim da rua, à direita.'))}<br><button class="btn tiny" data-ui="earthSkip">⏭ ${esc(L('Pular para o foguete'))}</button></div>
    ${prompt ? `<div class="hint">${prompt}</div>` : ''}</div>${houseCard}${ov}`;
}
function cityPanel() {
  const E = U.earth; const b = CITY_BUILDINGS.find(x => x.id === E.panel); if (!b) return '';
  const tabs = b.tabs.map((t, i) => `<button class="chip ${E.tab === i ? 'on' : ''}" data-ui="cityTab" data-arg="${i}">${E.read[b.id + ':' + i] ? '✔ ' : ''}${esc(L(t.t))}</button>`).join('');
  const t = b.tabs[E.tab];
  const last = b.id === 'alistamento';
  return `<div class="house-card open"><div class="panel"><button class="x" data-ui="cityClose">✕</button><h2>${b.icon} ${esc(L(b.name))}</h2>
    <div class="tabs">${tabs}</div><p class="citytxt">${esc(L(t.b))}</p>
    <p class="small muted">${esc(L('Descobertas lidas: '))}${cityCount()}/${CITY_TOTAL}</p>
    <div class="row">${last ? `<p class="small cyan">🚀 ${esc(L('O foguete da missão fica no fim da rua, à direita.'))}</p>` : ''}<button class="btn" data-ui="cityClose">${esc(L('Sair'))}</button></div></div></div>`;
}
function cityDialog() {
  const E = U.earth; const n = CITY_NPCS.find(x => x.id === E.dialog.id); if (!n || !n.av) return '';
  const line = n.say[E.dialog.i];
  // os moradores falam em voz alta (cada um com seu tom)
  const dk = n.id + ':' + E.dialog.i;
  if (U.lastDlg !== dk) { U.lastDlg = dk; Narrator.say(line, { pitch: NPC_VOICE[n.id] || 1 }); }
  return `<div class="dialog"><img src="${spriteURL(n.av, 'civil', 'happy', 3)}" alt=""><div><b>${esc(n.name)}</b> <small>${esc(L(n.role))}</small><p>${esc(L(line))}</p>
    <div class="row"><button class="btn primary" data-ui="cityNext">${E.dialog.i < n.say.length - 1 ? esc(L('Próximo ▶')) : esc(L('Tchau ✔'))}</button></div></div></div>`;
}
UIH.cityTab = i => { const E = U.earth; E.tab = +i; E.read[E.panel + ':' + i] = 1; learnMark(E.panel + ':' + i); };
UIH.cityEnter = () => { const E = U.earth; if (E && !E.panel) cityInteract(); };
UIH.cityClose = () => { const E = U.earth; if (E.panel) E.autoClosed = E.panel; E.panel = null; E.dialog = null; E.diary = false; };
UIH.cityNext = () => { const E = U.earth; if (!E.dialog) return; const n = CITY_NPCS.find(x => x.id === E.dialog.id); if (E.dialog.i < n.say.length - 1) E.dialog.i++; else E.dialog = null; };
UIH.cityAccept = () => { cityComms(); };

UIH.earthSkip = () => { const E = U.earth; if (!E) return; E.panel = null; E.dialog = null; E.target = null; E.p.x = rocketX() - 28; E.p.face = 1; };
