// ============================================================
//  DADOS — catálogos baseados em .claude/context.md
// ============================================================
'use strict';

const ASSETS = {
  intro: '.claude/IntroGameMusic.mp3',
  fase: ['.claude/InteriorFaseMusic1.mp3', '.claude/InteriorFaseMusic2.mp3', '.claude/InteriorFaseMusic3.mp3'],
  heroic: ['.claude/InteriorFaseHeroicMusic1.mp3', '.claude/InteriorFaseHeroicMusic2.mp3'],
};

const NARRATION_INTRO = []; // preenchido por data/lang/<idioma>.json ("falas") (story)

// ---------------- Tripulação ----------------
const ROLES = [
  { id: 'paramedico', name: 'Paramédico', short: 'Paramédico', home: 'enfermaria', likes: ['sopa'], avoid: [], allergy: [] },
  { id: 'navegador', name: 'Navegador', short: 'Navegador', home: 'ponte', likes: ['apimentado'], avoid: ['algas'], allergy: [] },
  { id: 'agricultor', name: 'Agricultor / Eng. Genético', short: 'Agricultor', home: 'estufa', likes: ['salada'], avoid: ['carne'], allergy: [] },
  { id: 'engenheiro1', name: 'Engenheiro 1', short: 'Engenheiro 1', home: 'motor', likes: ['carne', 'batata'], avoid: [], allergy: [], eng: true },
  { id: 'engenheiro2', name: 'Engenheiro 2', short: 'Engenheiro 2', home: 'suporte', likes: ['pao', 'doce'], avoid: [], allergy: ['soja'], eng: true },
  { id: 'pesquisador', name: 'Pesquisador Chefe', short: 'Pesquisador', home: 'lab', likes: ['diferente'], avoid: [], allergy: [] },
];
const FEM_NAMES = ['Ana', 'Carla', 'Elisa', 'Gabi', 'Iara', 'Luana', 'Nina', 'Paula', 'Sofia', 'Yara'];
// concordância de gênero: cargos no feminino para nomes femininos
const FEM_ROLE = { 'Paramédico': 'Paramédica', 'Navegador': 'Navegadora', 'Agricultor / Eng. Genético': 'Agricultora / Eng. Genética', 'Engenheiro 1': 'Engenheira 1', 'Engenheiro 2': 'Engenheira 2', 'Pesquisador Chefe': 'Pesquisadora Chefe' };
const roleForName = (role, name) => (FEM_NAMES.includes(name) && FEM_ROLE[role]) || role;
const ROLE_FN = {
  paramedico: 'Cura feridos e doentes',
  navegador: 'Rota e manobras',
  agricultor: 'Horta e comida',
  engenheiro1: 'Motores e reparos',
  engenheiro2: 'Suporte à vida e trajes',
  pesquisador: 'Ciência e dados',
};
const CREW_NAMES = ['Ana', 'Bruno', 'Carla', 'Davi', 'Elisa', 'Felipe', 'Gabi', 'Heitor', 'Iara', 'João', 'Kaique', 'Luana', 'Marcos', 'Nina', 'Otávio', 'Paula', 'Rafa', 'Sofia', 'Tiago', 'Yara'];
const FOOD_TAGS = ['sopa', 'apimentado', 'salada', 'carne', 'batata', 'pao', 'doce', 'diferente', 'algas', 'soja'];

// ---------------- Sistemas da nave (8) ----------------
// Dados internos inspirados em números públicos (ISS / ECLSS)
const DMG_PCT = { Baixo: 10, Médio: 20, Alto: 30 }; // % de integridade descontada a cada ocorrência de dano
const SYSTEMS = {
  casco: { name: 'Casco e Blindagem', dmg: 'Baixo', station: 'aviônica', desc: 'Estrutura externa de proteção contra impactos e radiação cósmica.' },
  termico: { name: 'Escudo Térmico', dmg: 'Médio', station: 'termico', desc: 'Projetado para suportar as temperaturas externas (MLI: cobertor multicamadas, como na ISS).' },
  propulsao: { name: 'Sistema de Propulsão', dmg: 'Alto', station: 'motor', desc: 'Motores e propulsores para manobras e mudanças de órbita.' },
  tanques: { name: 'Tanques de Combustível e Oxidante', dmg: 'Alto', station: 'tanqueAux', desc: 'Armazenam os propelentes líquidos e gasosos.' },
  avionica: { name: 'Aviônica', dmg: 'Médio', station: 'avionica', desc: 'Computadores, sensores, radares e software de navegação e telemetria.' },
  suporte: { name: 'Suporte à Vida', dmg: 'Alto', station: 'suporte', desc: 'Pressão, temperatura, filtragem do ar (CDRA), eletrólise de O₂ (OGS) e reciclagem de água (WRS).' },
  comunicacao: { name: 'Sistema de Comunicação', dmg: 'Médio', station: 'antena', desc: 'Antenas e transceptores de longo alcance com o Controle da Missão.' },
  acoplamento: { name: 'Módulos de Acoplamento', dmg: 'Médio', station: 'eclusa', desc: 'Eclusa, portas e trajes para atividades extraveiculares.' },
};
// Números de referência usados na simulação
const NASA = {
  o2PorPessoaDia: 0.84,      // kg de O2 por astronauta/dia
  aguaPorPessoaDia: 3.0,     // L (bebida, comida, higiene)
  recuperacaoAguaBase: 0.70, // WRS básico (processador de urina antigo)
  recuperacaoAguaCiclo: 0.98,// WRS + BPA (2023: 98%)
  ogsO2Dia: 5.4,             // kg/dia gerados por eletrólise (OGS da ISS, nominal)
  ogsAguaDia: 6.1,           // L/dia consumidos pela eletrólise
  co2PorPessoaDia: 1.0,      // kg
  lixoPorPessoaDia: 0.25,    // kg
};

// ---------------- Montagem da expedição ----------------
const BUDGET = 30, SLOTS = 5; // menos itens à venda: a verba continua sendo um dilema

const ORIGINS = [
  { id: 'astronauta', name: 'Ex-astronauta', bonus: '+1 em rotação e manobras' },
  { id: 'engenheiro', name: 'Engenheiro-chefe', bonus: '+1 em reparos' },
  { id: 'cientista', name: 'Cientista', bonus: '+20 GB de dados por fase' },
  { id: 'medico', name: 'Médico/psicólogo', bonus: 'A moral cai 1 ponto a menos por evento' },
  { id: 'diplomata', name: 'Diplomata', bonus: 'A Terra responde mais rápido (rota e comunicação)' },
];
const SKILLS = [
  { id: 'voz', name: 'Voz de comando', pts: 2, desc: 'Cada falha tira 1 ponto de moral em vez de 2' },
  { id: 'voz2', name: 'Voz de comando II', pts: 2, req: 'voz', desc: 'O "Pânico na tripulação" só ativa com 3 falhas' },
  { id: 'sangue', name: 'Sangue-frio', pts: 4, desc: '1 vez por fase, rola o d20 de novo e fica com o melhor' },
  { id: 'olhar', name: 'Olhar estratégico', pts: 3, desc: '1 vez por fase, uma pista aparece um nível mais clara' },
  { id: 'delegar', name: 'Delegar', pts: 3, desc: 'Tripulante dedicado dá +3 em vez de +2' },
  { id: 'linha', name: 'Linha direta com a Terra', pts: 2, desc: 'O Controle da Missão dá uma dica extra em cada evento' },
  { id: 'exemplo', name: 'Exemplo em campo', pts: 3, desc: 'O líder assume a função de um tripulante ocupado, ferido ou morto, com −1' },
  { id: 'economia', name: 'Economia de bordo', pts: 3, desc: '−10 L de água e −2 kg de oxigênio de consumo por fase' },
  { id: 'bussola', name: 'Bússola moral', pts: 2, desc: 'Decisões éticas que dividem a tripulação custam menos moral' },
];
const ROUTES = [
  { id: 'rapida', name: 'Rápida', desc: 'Menos tempo de viagem, mais asteroides e radiação', cost: 'Mais combustível', days: 0.8, fuel: 1.45, risk: 1.5 },
  { id: 'equilibrada', name: 'Equilibrada', desc: 'Frequência normal de eventos', cost: 'Normal', days: 1, fuel: 1, risk: 1 },
  { id: 'segura', name: 'Segura', desc: 'Menos asteroides e radiação', cost: 'Viagem longa: mais água, comida e desgaste de sanidade', days: 1.25, fuel: 0.8, risk: 0.6 },
];
const MODULES = [
  { id: 'estufa', cat: 'Sobrevivência', name: 'Estufa hidropônica', slots: 1, pts: 3, desc: 'Produz alimento e ajuda no oxigênio' },
  { id: 'reciclaAgua', cat: 'Sobrevivência', name: 'Reciclador de água de ciclo fechado', slots: 1, pts: 3, desc: 'Recicla quase toda a água (urina, suor, condensação)' },
  { id: 'biorreator', cat: 'Sobrevivência', name: 'Biorreator de algas', slots: 1, pts: 3, desc: 'Oxigênio e alimento extra, mas gasta energia e água' },
  { id: 'reciclaLixo', cat: 'Sobrevivência', name: 'Reciclador de lixo', slots: 1, pts: 3, desc: 'Converte lixo orgânico e eletrônico em recursos' },
  { id: 'hibernacao', cat: 'Sobrevivência', name: 'Câmara de hibernação', slots: 1, pts: 4, desc: 'Quem hiberna quase não consome, se cura e fica protegido, mas indisponível' },
  { id: 'solar', cat: 'Energia e proteção', name: 'Painéis solares desdobráveis', slots: 1, pts: 2, desc: '+8 kWh por dia, vulneráveis a asteroides' },
  { id: 'fusao', cat: 'Energia e proteção', name: 'Reator de fusão compacto', slots: 2, pts: 6, desc: '+20 kWh por dia, mas gera calor extra' },
  { id: 'escudoMag', cat: 'Energia e proteção', name: 'Escudo magnético', slots: 1, pts: 4, desc: 'Reduz radiação e tempestades solares, gasta energia constante' },
  { id: 'lab', cat: 'Ciência e exploração', name: 'Laboratório científico', slots: 1, pts: 3, desc: 'Mais dados e análises de exoplanetas' },
  { id: 'radar', cat: 'Ciência e exploração', name: 'Radar de longo alcance', slots: 1, pts: 3, desc: 'Avisa eventos com antecedência e melhora as pistas' },
  { id: 'sonda', cat: 'Ciência e exploração', name: 'Sonda de reconhecimento', slots: 1, pts: 3, desc: 'Analisa planetas sem arriscar a tripulação' },
  { id: 'pouso', cat: 'Ciência e exploração', name: 'Nave auxiliar de pouso', slots: 1, pts: 4, desc: 'Explora a superfície; sem ela, o pouso usa a nave principal (arriscado)' },
  { id: 'mineradora', cat: 'Ciência e exploração', name: 'Mineradora de asteroides', slots: 1, pts: 3, desc: 'Captura água e metais, mas exige parar a nave' },
  { id: 'sementes', cat: 'Ciência e exploração', name: 'Banco de sementes e embriões', slots: 1, pts: 3, desc: 'Preserva biodiversidade e aumenta as chances na adaptação' },
  { id: 'enfermaria', cat: 'Tripulação e engenharia', name: 'Enfermaria', slots: 1, pts: 3, desc: 'Trata feridos mais rápido e reduz risco de morte' },
  { id: 'bemestar', cat: 'Tripulação e engenharia', name: 'Módulo de bem-estar', slots: 1, pts: 2, desc: 'A sanidade cai mais devagar' },
  { id: 'cupula', cat: 'Tripulação e engenharia', name: 'Cúpula de observação', slots: 1, pts: 2, desc: 'Moral e dados astronômicos' },
  { id: 'impressora', cat: 'Tripulação e engenharia', name: 'Oficina de impressão 3D', slots: 1, pts: 3, desc: 'Fabrica peças durante a viagem' },
  { id: 'drone', cat: 'Tripulação e engenharia', name: 'Drone de reparo externo', slots: 1, pts: 3, desc: 'Repara sem expor engenheiros' },
  { id: 'ia', cat: 'Tripulação e engenharia', name: 'Copiloto de IA', slots: 1, pts: 4, desc: 'Sugere a melhor ação, mas erra se a Aviônica estiver danificada' },
];
const UPGRADES = [
  { id: 'casco1', sys: 'casco', name: 'Reforço nível 1', pts: 2, desc: 'Reduz dano de asteroides' },
  { id: 'casco2', sys: 'casco', name: 'Reforço nível 2', pts: 4, req: 'casco1', desc: 'Também reduz radiação' },
  { id: 'cobertor', sys: 'termico', name: 'Cobertor multicamadas', pts: 2, desc: 'Reparo +1, rasgo menos frequente' },
  { id: 'pintura', sys: 'termico', name: 'Pintura refletiva', pts: 2, desc: 'Pico do lado do Sol cai de +120 °C para +100 °C' },
  { id: 'propReforco', sys: 'propulsao', name: 'Propulsores reforçados', pts: 3, desc: 'Rotação +2' },
  { id: 'motorEf', sys: 'propulsao', name: 'Motor eficiente', pts: 3, desc: 'Menos combustível nas manobras' },
  { id: 'valvulas', sys: 'tanques', name: 'Válvulas anti-vazamento', pts: 2, desc: 'Vazamento de 20% vira 10%' },
  { id: 'redundante', sys: 'avionica', name: 'Computador redundante', pts: 3, desc: 'Mapa de backup quando o painel enlouquece' },
  { id: 'sensores', sys: 'avionica', name: 'Sensores térmicos avançados', pts: 1, desc: 'Mostram a chance como faixa (baixa, média, alta)' },
  { id: 'filtroReserva', sys: 'suporte', name: 'Filtro de ar reserva instalado', pts: 2, desc: 'Falha do filtro vira troca rápida' },
  { id: 'antena', sys: 'comunicacao', name: 'Antena de alto ganho', pts: 2, desc: 'Menos quedas e recálculo de rota mais rápido' },
  { id: 'trajes', sys: 'acoplamento', name: 'Eclusa e trajes reforçados', pts: 2, desc: 'Vazamento de traje menos grave e menor risco de morte' },
  { id: 'radiadoresRed', sys: 'termico', name: 'Radiadores redundantes', pts: 3, desc: 'Radiadores +2 na regulação térmica' },
  { id: 'aquecEf', sys: 'termico', name: 'Aquecedores eficientes', pts: 2, desc: 'Aquecedores gastam 9 kWh em vez de 12 kWh' },
];
const RESERVES = [
  { id: 'tanqueExtra', name: 'Tanque extra', pts: 2, desc: '+100 kg de combustível' },
  { id: 'baterias', name: 'Baterias extras', pts: 2, desc: '+20 kWh' },
  { id: 'cisterna', name: 'Cisterna extra', pts: 1, desc: '+150 L de água' },
  { id: 'cilindros', name: 'Cilindros de oxigênio extras', pts: 1, desc: '+20 kg de oxigênio' },
  { id: 'sementesEstoque', name: 'Sementes e estoque de alimentos', pts: 2, desc: '+10 kg de plantação' },
  { id: 'kitMedico', name: 'Kit médico ampliado', pts: 2, desc: 'Mais recursos clínicos (+6)' },
  { id: 'pecas', name: 'Peças sobressalentes', pts: 2, desc: '1 reparo sem gastar energia (+1 peça)' },
  { id: 'armazenamento', name: 'Armazenamento extra', pts: 1, desc: '+100 GB de dados' },
];
const TRAINING = [
  { id: 'tEng', name: 'Engenheiros', pts: 2, desc: '+1 em reparo, radiadores e persianas' },
  { id: 'tNav', name: 'Navegador', pts: 2, desc: '+1 em rotação e recálculo de rota' },
  { id: 'tMed', name: 'Paramédico', pts: 2, desc: 'Trata feridos gastando menos recursos e reduz risco de morte' },
  { id: 'tAgr', name: 'Agricultor', pts: 2, desc: 'A plantação resiste melhor ao frio e ao calor' },
  { id: 'tPesq', name: 'Pesquisador chefe', pts: 2, desc: 'Perde menos dados ao desligar equipamentos' },
];
const GADGETS = [
  { id: 'radioEmerg', name: 'Rádio de emergência de ondas curtas', pts: 1, desc: 'Comunicação mínima mesmo com a antena caída' },
  { id: 'remendo', name: 'Kit de remendo universal', pts: 1, desc: 'Conserto provisório em vazamentos' },
  { id: 'extintores', name: 'Extintores e mantas anti-fogo', pts: 1, desc: 'Reduzem o dano de incêndios' },
  { id: 'analogicos', name: 'Instrumentos analógicos', pts: 1, desc: 'Backup quando o painel enlouquece' },
  { id: 'mascote', name: 'Mascote robô', pts: 1, desc: 'Pequeno bônus de moral' },
  { id: 'jogos', name: 'Jogos e diário de bordo', pts: 1, desc: 'A sanidade cai um pouco mais devagar' },
];
const PANTRY = [
  { id: 'racaoExtra', name: '+30 kg de ração', pts: 2, desc: 'Ração liofilizada extra' },
  { id: 'temperos', name: 'Kit de temperos e molhos (líquidos)', pts: 1, desc: 'A ração deixa de dar Humor negativo' },
  { id: 'cozinha', name: 'Cozinha equipada (indução e forno)', pts: 2, desc: 'Permite receitas cozidas' },
  { id: 'geladeira', name: 'Geladeira de bordo', pts: 2, desc: 'Comida fresca dura 6 dias em vez de 3' },
  { id: 'ervas', name: 'Kit de cultivo de ervas', pts: 1, desc: '2 bandejas de cultivo mesmo sem estufa' },
  { id: 'livro', name: 'Livro de receitas da Terra', pts: 1, desc: 'Começa com 3 receitas descobertas' },
  { id: 'favorito', name: 'Prato favorito de cada tripulante', pts: 1, desc: 'Humor extra ao servir favoritos' },
];

// Montagem enxuta: dinheiro só para módulos e suprimentos essenciais (4 abas)
const SETUP_STEPS = [
  { id: 'mission', title: 'Missão' },
  { id: 'modules', title: 'Módulos' },
  { id: 'supplies', title: 'Suprimentos' },
  { id: 'report', title: 'Decolar' },
];
// itens essenciais vendidos na aba Suprimentos (além das reservas)
const ESSENTIALS = [['pantry', 'racaoExtra'], ['upgrades', 'filtroReserva'], ['upgrades', 'casco1'], ['pantry', 'geladeira']];

// ---------------- Horta e cozinha ----------------
// days = dias de jogo; water = L totais; yield = kg
const CROPS = {
  alface: { name: 'Alface e folhas', days: 4, yield: 3, water: 20, tags: ['salada'], humor: 1, color: '#5fd35f' },
  batata: { name: 'Batata', days: 10, yield: 12, water: 60, tags: ['batata'], humor: 0, color: '#c9a36b' },
  soja: { name: 'Soja e feijão', days: 8, yield: 6, water: 40, tags: ['soja'], humor: 0, color: '#d8c86a', bonusNext: 1 },
  pimenta: { name: 'Tomate e pimenta', days: 7, yield: 4, water: 35, tags: ['apimentado'], humor: 2, color: '#ff4a3a' },
  algas: { name: 'Algas', days: 3, yield: 4, water: 15, tags: ['algas'], humor: -1, color: '#2fa88a', needs: 'biorreator' },
};
const RECIPES = [
  { id: 'salada', name: 'Salada fresca', ing: ['alface', 'pimenta'], humor: 3, energy: 0, tags: ['salada', 'diferente'], fact: 'Já foram cultivadas alfaces em órbita, nos experimentos Veggie na ISS.' },
  { id: 'ensopado', name: 'Ensopado da Terra', ing: ['racao', 'batata', 'soja'], humor: 4, energy: 1.5, tags: ['carne', 'batata', 'soja', 'sopa'], cook: true, fact: 'Refeições quentes e familiares ajudam a manter o ânimo em missões longas.' },
  { id: 'paoAlgas', name: 'Pão de algas', ing: ['algas', 'batata'], humor: 2, energy: 1, tags: ['pao', 'algas'], cook: true, fact: 'Algas crescem rápido e servem de comida de emergência.' },
  { id: 'tortilha', name: 'Tortilha recheada', ing: ['racao', 'soja', 'pimenta'], humor: 3, energy: 1, tags: ['apimentado', 'soja', 'pao'], cook: true, fact: 'Na ISS usam tortilhas no lugar do pão: migalhas flutuam e podem entrar nos equipamentos.' },
  { id: 'sopa', name: 'Sopa de reaproveitamento', ing: ['racao', 'alface'], humor: 1, energy: 1, tags: ['sopa'], cook: true, fact: 'Reaproveitar sobras reduz o lixo orgânico a bordo.' },
  { id: 'pure', name: 'Purê apimentado', ing: ['batata', 'pimenta'], humor: 3, energy: 1, tags: ['batata', 'apimentado', 'diferente'], cook: true, fact: 'Sal e pimenta vão em forma líquida no espaço: o pó flutua e pode ser inalado.' },
  { id: 'doce', name: 'Doce de batata', ing: ['batata', 'racao'], humor: 2, energy: 1, tags: ['doce'], cook: true, fact: 'Doces são raros a bordo e muito valorizados pela tripulação.' },
];
const BANQUETE = { id: 'banquete', name: 'Banquete do Dia da Terra', humor: 10, cost: 4 };

// ---------------- Loja (tela inicial) ----------------
const SHOP = [
  { id: 'violao', cat: 'lazer', name: 'Violão', price: 60, moral: 4, desc: '+4% de moral' },
  { id: 'biblioteca', cat: 'lazer', name: 'Biblioteca digital', price: 40, moral: 3, desc: '+3% de moral' },
  { id: 'pintura', cat: 'lazer', name: 'Kit de pintura', price: 40, moral: 3, desc: '+3% de moral' },
  { id: 'console', cat: 'lazer', name: 'Console retrô', price: 90, moral: 6, desc: '+6% de moral' },
  { id: 'planetario', cat: 'lazer', name: 'Mini planetário', price: 80, moral: 5, desc: '+5% de moral' },
  { id: 'vr', cat: 'lazer', name: 'Óculos VR “Praia da Terra”', price: 140, moral: 8, desc: '+8% de moral' },
  { id: 'tablet', cat: 'produtividade', name: 'Tablet de checklists', price: 60, eff: 4, desc: '+4% de eficiência' },
  { id: 'cafe', cat: 'produtividade', name: 'Café liofilizado premium', price: 40, eff: 3, desc: '+3% de eficiência' },
  { id: 'cadeira', cat: 'produtividade', name: 'Cadeira ergonômica', price: 40, eff: 3, desc: '+3% de eficiência' },
  { id: 'ferramentas', cat: 'produtividade', name: 'Ferramentas de precisão', price: 90, eff: 6, desc: '+6% de eficiência' },
  { id: 'ar', cat: 'produtividade', name: 'Óculos de realidade aumentada', price: 80, eff: 5, desc: '+5% de eficiência' },
  { id: 'exo', cat: 'produtividade', name: 'Exoesqueleto leve', price: 140, eff: 8, desc: '+8% de eficiência' },
  { id: 'verba', cat: 'upgrade', name: 'Contrato de verba extra', price: 150, desc: '+3 pontos de verba na montagem' },
  { id: 'pecaInicial', cat: 'upgrade', name: 'Peça sobressalente inicial', price: 50, desc: 'Começa com +1 peça' },
  { id: 'bateriaReserva', cat: 'upgrade', name: 'Bateria de reserva', price: 70, desc: '+10 kWh iniciais' },
  { id: 'filtroAgua', cat: 'upgrade', name: 'Membrana de filtragem avançada', price: 80, desc: '+5% de recuperação de água' },
  { id: 'cascoExtra', cat: 'upgrade', name: 'Placas de casco extras', price: 90, desc: 'Casco começa mais resistente (+asteroides)' },
];

// ---------------- Exoplanetas (dados reais — Exoplanet Archive, aproximados) ----------------
const EXOPLANETS = [
  { id: 'proxb', name: 'Proxima Centauri b', dist: 4.2, radius: '~1.1 (massa mín. 1,07 M⊕)', teq: 234, period: 11.2, star: 'Anã vermelha M5.5 com fortes erupções', esi: 0.87, disc: '2016 · velocidade radial', sma: 0.049, issues: 'Erupções estelares intensas podem ter removido a atmosfera; provável rotação travada.',
    trip: { days: 5, fuel: 120, o2: 14, food: 8, moral: -8, dados: 40, type: 'rock', outcome: { pt: 'A estrela Proxima Centauri lança erupções que podem ser centenas de vezes mais intensas que as do nosso Sol. O sensor mostra um solo seco e sem atmosfera: a radiação é letal na superfície.', en: 'Proxima Centauri throws flares that can be hundreds of times stronger than our Sun\'s. Sensors show dry ground and almost no atmosphere: the surface radiation is deadly.', es: 'Próxima Centauri lanza llamaradas que pueden ser cientos de veces más intensas que las de nuestro Sol. Los sensores muestran suelo seco y casi sin atmósfera: la radiación en superficie es letal.' } } },
  { id: 'trap1e', name: 'TRAPPIST-1 e', dist: 40.7, radius: '0,92 R⊕', teq: 250, period: 6.1, star: 'Anã ultrafria M8', esi: 0.85, disc: '2017 · trânsito', sma: 0.029, issues: 'Estrela ativa; atmosfera ainda incerta (observações do JWST).',
    trip: { days: 8, fuel: 190, o2: 24, food: 14, moral: -10, dados: 55, type: 'rock', outcome: { pt: 'O sistema TRAPPIST-1 tem 7 planetas apertados em torno de uma estrela pequena e ativa. Aqui o “ano” dura 6 dias, o céu está cheio de planetas vizinhos, mas as erupções constantes tornam a superfície instável.', en: 'The TRAPPIST-1 system packs 7 planets around a small, active star. A “year” lasts 6 days and the sky is full of neighbouring planets, but constant flares make the surface unstable.', es: 'El sistema TRAPPIST-1 tiene 7 planetas muy juntos alrededor de una estrella pequeña y activa. Un “año” dura 6 días y el cielo está lleno de planetas vecinos, pero las erupciones constantes vuelven inestable la superficie.' } } },
  { id: 'k442b', name: 'Kepler-442 b', dist: 1206, radius: '1,34 R⊕', teq: 233, period: 112.3, star: 'Anã laranja K', esi: 0.84, disc: '2015 · trânsito (Kepler)', sma: 0.409, issues: 'Distância enorme: mais de 1.200 anos-luz.',
    trip: { days: 90, fuel: 9000, o2: 400, food: 300, moral: -40, dados: 0, type: 'rock', outcome: { pt: 'Impossível: 1.206 anos-luz. A sonda Voyager 1 (17 km/s) levaria cerca de 21 milhões de anos.', en: 'Impossible: 1,206 light-years. Voyager 1 (17 km/s) would take about 21 million years.', es: 'Imposible: 1.206 años luz. La Voyager 1 (17 km/s) tardaría unos 21 millones de años.' } } },
  { id: 'lhs1140b', name: 'LHS 1140 b', dist: 48.8, radius: '1,73 R⊕ (5,6 M⊕)', teq: 226, period: 24.7, star: 'Anã vermelha calma M4.5', esi: 0.72, disc: '2017 · trânsito (MEarth)', sma: 0.088, issues: 'Pode ser um mundo oceânico gelado; gravidade alta.',
    trip: { days: 9, fuel: 210, o2: 26, food: 15, moral: -9, dados: 50, type: 'ocean', outcome: { pt: 'Uma super-Terra: 1,7 vez o raio da Terra e quase 6 vezes a massa. A gravidade na superfície é cerca de 2 vezes a nossa — cada passo pesa. Pode ser um mundo coberto de gelo e oceano profundo.', en: 'A super-Earth: 1.7 times Earth\'s radius and almost 6 times its mass. Surface gravity is about twice ours — every step is heavy. It may be a world of ice and deep ocean.', es: 'Una súper-Tierra: 1,7 veces el radio terrestre y casi 6 veces su masa. La gravedad superficial es unas 2 veces la nuestra: cada paso pesa. Puede ser un mundo de hielo y océano profundo.' } } },
  { id: 'teeb', name: 'Teegarden b', dist: 12.5, radius: '~1,0 (massa mín. 1,05 M⊕)', teq: 264, period: 4.9, star: 'Anã vermelha M7', esi: 0.95, disc: '2019 · velocidade radial', sma: 0.026, issues: 'Sem trânsito: raio e atmosfera desconhecidos.',
    trip: { days: 7, fuel: 160, o2: 20, food: 12, moral: -8, dados: 45, type: 'rock', outcome: { pt: 'Um dos mundos com maior índice de similaridade com a Terra (ESI 0,95)… mas sem trânsito ninguém mediu seu raio ou sua atmosfera. Lá chegando: rotação travada, um lado em fogo e o outro em gelo eterno.', en: 'One of the highest Earth Similarity Index worlds (ESI 0.95)… but with no transit, nobody measured its radius or atmosphere. On arrival: tidally locked, one side scorched and the other frozen forever.', es: 'Uno de los mundos con mayor índice de similitud con la Tierra (ESI 0,95)… pero sin tránsito nadie midió su radio ni su atmósfera. Al llegar: rotación sincronizada, un lado ardiendo y el otro helado para siempre.' } } },
  { id: 'k452b', name: 'Kepler-452 b', dist: 1402, radius: '1,63 R⊕', teq: 265, period: 384.8, star: 'Estrela tipo Sol (G2)', esi: 0.83, disc: '2015 · trânsito (Kepler)', sma: 1.046, issues: '“Prima da Terra”, mas a 1.400 anos-luz: fora do alcance de qualquer nave.',
    trip: { days: 120, fuel: 12000, o2: 520, food: 380, moral: -45, dados: 0, type: 'rock', outcome: { pt: 'O “primo da Terra” orbita uma estrela parecida com o Sol, em um ano de 385 dias. Mas fica a 1.400 anos-luz: nenhuma tecnologia atual alcança isso.', en: 'Earth\'s “cousin” orbits a Sun-like star with a 385-day year. But it is 1,400 light-years away: no current technology can get there.', es: 'El “primo de la Tierra” orbita una estrella parecida al Sol, con un año de 385 días. Pero está a 1.400 años luz: ninguna tecnología actual llega allí.' } } },
  { id: 'cnc55e', name: '55 Cancri e', dist: 41, radius: '1,88 R⊕ (8 M⊕)', teq: 2000, period: 0.74, star: 'Estrela tipo Sol (G8)', esi: 0.11, disc: '2004 · velocidade radial', sma: 0.015, issues: '“Mundo de lava”: temperatura de ~2.000 K no lado diurno.',
    trip: { days: 8, fuel: 190, o2: 22, food: 12, moral: -12, dados: 60, type: 'lava', outcome: { pt: 'Um “mundo de lava”: orbita tão perto da estrela que seu ano dura menos de 18 horas e o lado diurno passa dos 2.000 K. Rocha derretida, nenhuma chance de pouso.', en: 'A “lava world”: it orbits so close to its star that its year lasts under 18 hours and the dayside tops 2,000 K. Molten rock — no chance to land.', es: 'Un “mundo de lava”: orbita tan cerca de su estrella que su año dura menos de 18 horas y el lado diurno supera los 2.000 K. Roca fundida: imposible aterrizar.' } } },
  { id: 'pontes', name: 'Pontes-01b', dist: 'na rota', radius: '1,04 R⊕', teq: 268, period: 291, star: 'Anã amarela-laranja G9, calma', esi: 0.96, disc: 'Projeto Pontes (ficção)', sma: 0.82, issues: 'Medições da expedição: água líquida provável e campo magnético detectado.', fiction: true },
];

// ---------------- Eventos ----------------
// Descrição de cada desafio. Lógica em events.js
const EVENT_INFO = {
  termico: { title: 'Regulação Térmica', icon: '🌡', systems: ['termico', 'suporte'], energy: true, desc: 'A nave entra numa zona de calor extremo. Mantenha a temperatura interna entre 18 °C e 26 °C.' },
  brecha: { title: 'Brecha no casco', icon: '💨', systems: ['casco', 'suporte'], desc: 'Um meteoro furou o casco e o ar está vazando! Pegue a resina epóxi na Eclusa, sele a brecha e confira a pressão.' },
  asteroides: { title: 'Chuva de meteoros', icon: '☄', systems: ['casco', 'propulsao'], desc: 'Pedras espaciais em alta velocidade! Ative o escudo, use o manche para desviar e confira o radar.' },
  combFalta: { title: 'Falta de combustível', icon: '⛽', systems: ['tanques', 'propulsao'], desc: 'A velocidade da nave está caindo. Abra a válvula do tanque auxiliar, ligue a bomba e confira o painel.' },
  combVaz: { title: 'Vazamento de combustível', icon: '💧', systems: ['tanques', 'comunicacao'], desc: 'Vazamento de combustível! A equipe em solo precisa recalcular a rota para gastar menos.' },
  oxigenio: { title: 'Falha no oxigênio', icon: '🫁', systems: ['suporte'], desc: 'A filtragem do ar parou. Todos usam cilindros de O₂ até resolver. Encontre o filtro entupido, troque e reinicie.' },
  painel: { title: 'Painel enlouquecido', icon: '🖥', systems: ['avionica'], desc: 'O computador de bordo travou e mostra o mapa errado. A nave está perdida no espaço!' },
  lixo: { title: 'Lixo acumulado', icon: '🗑', systems: ['suporte', 'propulsao'], desc: 'Latinhas, garrafas, papel e restos de comida flutuam pela nave. Colete o lixo e veja se algo entrou nos mecanismos.' },
  radio: { title: 'Rádio com interferência', icon: '📻', systems: ['comunicacao'], desc: 'O rádio chia e só recebe pedaços das mensagens da Terra. Descubra o que a base está tentando avisar.' },
  contaminacao: { title: 'Contaminação da água', icon: '🚱', systems: ['suporte'], desc: 'A água foi contaminada. Faça a descontaminação no ciclo fechado: Destilação, Filtração, Oxidação e Desinfecção.' },
  traje: { title: 'Vazamento no traje', icon: '🧑‍🚀', systems: ['acoplamento', 'suporte'], desc: 'Durante um reparo externo, o traje de um engenheiro está vazando. Substitua o engenheiro antes que ele sufoque!' },
  doenca: { title: 'Tripulante doente', icon: '🤒', systems: ['suporte'], desc: 'Um tripulante adoeceu. Use os aparelhos médicos para diagnosticar e aplique o remédio correto.' },
  tempestade: { title: 'Tempestade solar', icon: '☀', systems: ['casco', 'comunicacao'], desc: 'Uma tempestade de partículas se aproxima! Leve a tripulação ao abrigo blindado (dormitórios).' },
};

const DISEASES = [
  { id: 'enjoo', name: 'Enjoo espacial', med: 'antiemetico', readings: { temp: '36,8 °C', spo2: '98%', pressao: '118/76 · 92 bpm', esteto: 'Respiração normal', scanner: 'Sistema vestibular confuso pela microgravidade' }, sintoma: 'náusea e tontura' },
  { id: 'cefaleia', name: 'Dor de cabeça (fluidos na cabeça)', med: 'analgesico', readings: { temp: '36,9 °C', spo2: '97%', pressao: '135/88 · 80 bpm', esteto: 'Respiração normal', scanner: 'Pressão intracraniana elevada pelo deslocamento de fluidos' }, sintoma: 'dor de cabeça e rosto inchado' },
  { id: 'alergia', name: 'Alergia', med: 'antialergico', readings: { temp: '37,0 °C', spo2: '96%', pressao: '120/80 · 88 bpm', esteto: 'Leve chiado', scanner: 'Reação a poeira e partículas flutuantes' }, sintoma: 'coceira e espirros' },
  { id: 'infeccao', name: 'Infecção bacteriana', med: 'antibiotico', readings: { temp: '38,9 °C', spo2: '95%', pressao: '110/70 · 104 bpm', esteto: 'Ruído no pulmão direito', scanner: 'Bactérias se multiplicam mais rápido em microgravidade' }, sintoma: 'febre e cansaço' },
  { id: 'hipoxia', name: 'Hipóxia leve', med: 'oxigenio', readings: { temp: '36,6 °C', spo2: '86%', pressao: '125/82 · 110 bpm', esteto: 'Respiração acelerada', scanner: 'Pouco oxigênio no sangue' }, sintoma: 'falta de ar e confusão' },
];
const MEDICINES = [
  { id: 'analgesico', name: 'Analgésico' }, { id: 'antiemetico', name: 'Antiemético (enjoo)' },
  { id: 'antialergico', name: 'Antialérgico' }, { id: 'antibiotico', name: 'Antibiótico' },
  { id: 'oxigenio', name: 'Máscara e tanque de O₂' },
];
const MED_DEVICES = [
  { id: 'temp', name: 'Termômetro digital' }, { id: 'spo2', name: 'Oxímetro' },
  { id: 'pressao', name: 'Medidor de pressão e batimentos' }, { id: 'esteto', name: 'Estetoscópio' },
  { id: 'scanner', name: 'Scanner médico (gasta 1 recurso)' },
];

const RADIO_MESSAGES = [
  { full: 'ATENCAO NAVE: TEMPESTADE SOLAR EM 2 DIAS. REFORCEM O ESCUDO', answer: 'Uma tempestade solar está chegando', options: ['Uma tempestade solar está chegando', 'Pontes-01b não existe', 'Voltem para a Terra', 'Liguem os aquecedores'] },
  { full: 'ROTA CORRIGIDA: DESVIEM 3 GRAUS PARA EVITAR DETRITOS', answer: 'Devem desviar a rota por causa de detritos', options: ['Devem desviar a rota por causa de detritos', 'O combustível acabou na Terra', 'Uma nova tripulação vai embarcar', 'Desliguem a comunicação'] },
  { full: 'TROQUEM O LOTE DE REMEDIOS: ESTOQUE PODE ESTAR VENCIDO', answer: 'Os remédios podem estar vencidos', options: ['Os remédios podem estar vencidos', 'A estufa precisa de mais luz', 'O casco está rachado', 'A rota está perfeita'] },
  { full: 'PONTES-01b CONFIRMADO: AGUA LIQUIDA DETECTADA NA SUPERFICIE', answer: 'Há água líquida em Pontes-01b', options: ['Há água líquida em Pontes-01b', 'Pontes-01b é um gigante gasoso', 'A Terra foi evacuada', 'Precisam parar a nave'] },
];

// Locais de pouso em Pontes-01b
// gravidade na superfície (g = massa / raio², em gravidades da Terra); "~" = massa ou raio estimado
const EXO_GRAV = { proxb: '~0,9 g', trap1e: '0,82 g', k442b: '~1,3 g', lhs1140b: '1,9 g', teeb: '~1,0 g', k452b: '~1,9 g', cnc55e: '2,3 g', pontes: '0,94 g' };
const LANDING_SITES = [
  { id: 'vale', name: 'Vale Equatorial', pros: 'Temperatura amena (≈ 19 °C), rios próximos', cons: 'Tempestades de poeira sazonais', score: { atmosfera: 1, agua: 2, solo: 1, radiacao: 1 } },
  { id: 'planalto', name: 'Planalto Norte', pros: 'Solo firme e rico em minerais', cons: 'Frio intenso (≈ −5 °C), pouca água', score: { atmosfera: 1, agua: 0, solo: 2, radiacao: 0 } },
  { id: 'costa', name: 'Costa do Mar Raso', pros: 'Água abundante e algas nativas', cons: 'Radiação UV alta e marés fortes', score: { atmosfera: 1, agua: 2, solo: 0, radiacao: -1 } },
];
const PLANET_ANALYSES = [
  { id: 'atmosfera', name: 'Atmosfera', cost: 20, result: 'N₂ 74%, O₂ 19%, CO₂ 0,9%, pressão 0,93 atm — respirável com aclimatação.' },
  { id: 'agua', name: 'Água', cost: 20, result: 'Água líquida em rios e mares rasos. Salinidade baixa no Vale Equatorial.' },
  { id: 'solo', name: 'Solo', cost: 25, result: 'Solo argiloso com nitrogênio e fósforo; precisa de microrganismos terrestres para cultivo.' },
  { id: 'radiacao', name: 'Radiação', cost: 15, result: 'Campo magnético fraco (≈ 40% do terrestre). UV alto na costa, moderado no vale.' },
  { id: 'biologia', name: 'Biologia', cost: 30, result: 'Tapetes microbianos e algas nativas. Nenhum patógeno conhecido detectado.' },
];

// ---------- Nutrição: pontos de [energia, proteína, vitaminas] por refeição ----------
// A Nutrição de cada tripulante mostra a variedade da dieta: só ração mantém
// energia e proteína, mas as vitaminas caem — é preciso comida fresca.
const FOOD_NUTR = {
  racao: [30, 24, 9], alface: [6, 4, 36], batata: [32, 6, 12], soja: [14, 36, 8], pimenta: [6, 4, 34], algas: [10, 22, 24],
};
function foodNutr(item) {
  if (FOOD_NUTR[item]) return FOOD_NUTR[item];
  const r = RECIPES.find(x => x.id === item);
  if (!r) return FOOD_NUTR.racao;
  const sum = [0, 0, 0];
  r.ing.forEach(i => { const n = FOOD_NUTR[i] || FOOD_NUTR.racao; for (let k = 0; k < 3; k++) sum[k] += n[k]; });
  return sum.map(v => Math.min(40, Math.round(v * 0.75)));
}
const NUTR_NAMES = ['Energia', 'Proteína', 'Vitaminas'];

// nomes dos gostos/alergias da tripulação (traduzidos)
const FOOD_TAG_NAMES = {
  sopa: 'sopa', apimentado: 'apimentado', salada: 'salada',
  carne: 'carne', batata: 'batata', pao: 'pão', doce: 'doce',
  diferente: 'pratos diferentes', algas: 'algas', soja: 'soja',
};
const tagNames = list => list.map(t => L(FOOD_TAG_NAMES[t] || t)).join(', ');

// o que cada função faz (mostrado ao jogador no multiplayer)
const ROLE_DUTIES = {
  paramedico: 'Trata feridos e doentes (gasta menos recursos), diagnostica na Enfermaria e cuida dos remédios.',
  navegador: 'Pilota na chuva de meteoros, gira a nave na fase térmica e confere o painel e o radar.',
  agricultor: 'Cuida da horta e das colheitas e protege a plantação do frio e do calor.',
  engenheiro1: 'Faz os reparos: motores, tanques, filtros de ar, computador, radiadores, persianas e isolamento.',
  engenheiro2: 'Faz os reparos: motores, tanques, filtros de ar, computador, radiadores, persianas e isolamento.',
  pesquisador: 'Cuida dos equipamentos científicos e dos dados; decide o que desligar na sobrecarga.',
};
