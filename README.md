# Bridges-to-The-Space — Pontes01

Jogo 2D em pixel art (site estático) sobre gerenciar uma nave rumo ao planeta **Pontes-01b**, baseado em `.claude/context.md`.
Sprites derivados de `.claude/Astronauta*.png`; trilha sonora com os MP3 da pasta `.claude`.

## Jogar

- **Solo (com bots):** abra `index.html` por qualquer servidor estático (ex.: GitHub Pages) ou rode o servidor abaixo.
- **Multiplayer (até 6 tripulantes + Comandante):** funciona direto no site (Vercel, GitHub Pages ou qualquer hospedagem estática), sem servidor e sem VPN. O Comandante clica em *Multiplayer → Criar sala* e passa o código de 5 letras; os amigos entram com o código. A conexão é P2P (WebRTC, biblioteca PeerJS em `js/vendor/`).
- **Servidor próprio (opcional, rede local):** rode `node server/server.js`, abra `http://localhost:8080` e informe `ws://SEU-IP:8080/ws` em *Avançado*.

## Novidades

- **Tradutor no topo do site**: Português · English · Español (interface, textos do site, narração por voz e conteúdo novo; o idioma fica salvo no navegador).
- **Terra explorável**: cidade com 8 edifícios educativos (dados da NASA) e 8 moradores com diálogos; o **Diário do Explorador** (J) dá até +3 pontos de verba.
- **Qualquer destino na Estação Ponte-Alfa**: escolha até os exoplanetas errados — a viagem custa combustível, oxigênio, comida e dias, e mostra por que o planeta não serve (mais dados do NASA Exoplanet Archive).
- **O jogo continua em Pontes-01b**: construa campo solar, água, estufa, torre e pista; transmita dados à Terra; acenda o farol e receba 3 naves de tripulação (colonos) para fechar o final.
- **Chat**: só no multiplayer (Enter). No modo solo a tripulação e as pessoas da cidade falam em balões de fala.
- **Idiomas**: inglês (padrão), português e espanhol.

## Controles e ajuda

- **← →** andar (ou clique para andar — o teclado tem prioridade) · **Shift** correr · **Espaço** ou **E** interagir · **J** pula em qualquer lugar (também diante de consoles e prédios; no celular, o botão ⤒); o Espaço longe de tudo também pula (na nave o pulo é lento, de gravidade zero) · **E** interagir · **Esc** fecha/desmarca/volta.
- **H** abre o **computador de bordo**: próximo passo, lista de tarefas e controles. A barra 💻 no topo mostra sempre o próximo passo.
- **Shift+S** ou o botão ⏩: tempo 2x até o próximo evento.
- HUD enxuto com 4 barras (oxigênio, fome, humor, armazenamento); ▾ mostra todos os recursos.
- **Traduções e falas em JSON, um arquivo por idioma**: `data/lang/pt.json` (textos do site e falas originais), `data/lang/en.json` e `data/lang/es.json` (`ui`: texto em português → tradução; `patterns`: mensagens com números; `falas`: textos falados). Mensagens que traduzem partes de uma frase ficam em `js/i18n-patterns.js`. O jogo precisa ser aberto por um servidor (GitHub Pages, Vercel ou `node server/server.js`) para carregar os JSON.
- **Salvar progresso**: salvamento automático (a cada 15 s e ao trocar de cena) e “Salvar progresso” no menu de pausa; **Continuar** na tela de título.
- **Tempo acelerado**: Shift+S alterna 2x → 5x → 10x → normal até o próximo evento.

## Jogos salvos e recomeçar

- Cada jornada é salva automaticamente (a cada 15 s, ao trocar de cena e ao fechar a aba). Começar uma nova **não apaga** as anteriores: abra qualquer uma em **📂 Jogos salvos** (tela inicial ou sala do multiplayer). "Salvar progresso" no menu de pausa cria um salvamento extra.
- Se a missão falhar (solo ou multiplayer), o botão **↺ Recomeçar da missão** volta ao início da etapa ou do desafio em que tudo deu errado, com os recursos daquele momento. No multiplayer, o Comandante recomeça e todos voltam juntos.

## Colônia: dormir e comer

- Na colônia dá para **dormir** nos quartos dos habitats instalados (cada cúpula tem 2 camas; E no habitat → Quartos; E, Espaço, Esc ou uma seta acordam) e **comer** no refeitório (nave, habitat ou estufa). A barra de **fome cai 2x mais rápido** que a de **sono**, na nave e na colônia; os bots também vão comer e dormir sozinhos.
- Quando um cargueiro de colonos (**Colonial-1, 2, 3**) pousa, os colonos descem como **bots**.

## Multiplayer com várias Naves (até 28 pessoas)

- Ao criar a sala você escolhe sua **Nave (1 a 4)** e é o **Comandante** dela. Quem entrar com o código escolhendo **outra Nave** e for o **primeiro** nela vira o **Comandante** dessa Nave; os próximos entram na tripulação (6 funções por Nave).
- Cada Nave faz a **sua própria jornada** (montagem, viagem, desafios, colônia), simulada no navegador do respectivo Comandante; a sala só repassa as mensagens. O **chat é da sala toda** (com o nome da Nave). Total: 4 Naves × (Comandante + 6) = **28 pessoas**.
- Se o Comandante de uma Nave sair, a tripulação dela volta ao lobby e a Nave fica livre.

## O que tem

- Narração da introdução, caminhada pela Terra poluída e comunicados.
- Criador de avatar pixelado (pele, cabelo, olhos, roupas, traje, visor, acessórios e pintura pixel a pixel).
- Montagem da expedição: 45 pontos de verba, 5 slots, origem, liderança, rota, módulos, melhorias, reservas, treinamento, gadgets, despensa, fundo de contingência e relatório de prontidão.
- Nave em corte lateral com 12 salas e 15 estações; busca rápida (barras) e relatório detalhado de entradas/saídas.
- Desafios: Regulação Térmica completa (d20/d10, modificadores, sinergias, conflitos, pistas), meteoros (pilotagem), falta e vazamento de combustível, falha de O₂, painel enlouquecido, lixo, rádio com interferência, água contaminada, vazamento de traje, doenças/remédios e tempestade solar.
- Alimentação: horta 4×3, cozinha e livro de receitas, cardápio com gostos/alergias, mesa, racionamento, desperdício.
- Etapas: estação orbital (escambo + exoplanetas reais da NASA), órbita de Pontes-01b (análises e adaptação), migração e final único.
- Jornada Completa e Curta; loja com itens de lazer (moral) e produtividade (eficiência) comprados com pontos.

## Quiz NASA e fundo de contingência na colônia
- **QUIZ NASA** (menu inicial): 8 perguntas por rodada com dados da NASA (fonte citada em cada resposta). Acerto = +5 ✦ (1ª vez) ou +1 ✦ (repetida); +2 ✦ se o tema foi lido na cidade; rodada perfeita +5 ✦. Os créditos vão para a Loja.
- **Centro de Design de Missões NASA** (cidade): ciclo de vida de missões (fases A–F), revisões (PDR/CDR) e da ciência à nave. Texto escrito a partir de conhecimento público da NASA (não extraído do PDF indicado, que não pôde ser lido).
- **Fundo de contingência** na colônia: tecla **F** ou botão no HUD (peça, tratamento médico, energia, água, ração); qualquer jogador (inclusive comandantes de outras Naves) pode usar.

## Engenharia de massa e gestão de órbita
- **Massa na montagem**: cada módulo, melhoria e reserva tem massa (kg, mostrada ao lado do custo). A barra "⚖ Massa" mostra a massa de decolagem contra o limite do lançador (4600 kg) e o **Δv** pela equação do foguete (Δv = Isp·g₀·ln(m₀/m_f)) contra o que a rota pede (rápida 650, equilibrada 450, segura 380 m/s). Acima do limite não dá para decolar; Δv curto faz a nave gastar ~20% mais combustível. Em voo, a massa cai conforme os consumíveis acabam e o gasto de cruzeiro e de pouso acompanha a massa.
- **Órbita em Pontes-01b**: a nave chega a 2400 km. Escolha 400, 800 ou 2400 km: cada manobra é uma transferência de Hohmann que gasta combustível pela massa atual. Órbita baixa tem arrasto (perde altitude e precisa de reimpulso), o cinturão de radiação (1000–1800 km) fere tripulação e casco, e a altitude define o combustível do pouso. Cada análise, desafio ou "esperar 1 dia" passa 1 dia em órbita.
- **Quiz por categorias**: Misto, Espaço real, Terra e clima, Missões, Nave e sistemas (regras do jogo: regulação térmica, água, sistemas), Massa e foguetes, Órbitas.

## Desafios com pulo e outras correções
- **Prateleira rompida** (📦): caixas de suprimento ficam no alto; é preciso **pular (J)** debaixo delas para pegá-las (6 de 8). **Cabos soltos e faíscas** (⚡): cabos faiscando no chão; quem pisa leva choque e fica lento, pular por cima evita. Os dois entram no sorteio de desafios das duas jornadas.
- O **J** deixava de funcionar na nave depois de usar a escada (o estado de subida ficava com um valor residual): corrigido.
- **Espaço** agora também fecha o painel de uma estação (como o E); as seções "Mais opções" (cozinha e outras) permanecem abertas quando a tela atualiza.
- **Pouso**: nunca encerra o jogo antes da colônia. Sem combustível suficiente é um pouso de emergência (dano no casco e um ferido); local pouco investigado começa a colônia com menos energia e água.
- **Colônia sempre aparece**: em órbita, o botão "🛬 Descer para a colônia agora" leva direto ao pouso (a colônia começa mais difícil se faltou investigar). Se algo encerraria a jornada ainda na órbita (ex.: a órbita baixa decai) e a tripulação tem 3 ou mais vivos com o Comandante, a nave faz um **pouso forçado** e a colônia começa.

## Barra rápida, caixinhas da cidade e outras melhorias
- **Barra rápida** (lado esquerdo, em todo o jogo): 🔊 áudio (música e voz), 🔔 efeitos, ⚙ configurações e ◀ **voltar à fase anterior** (toque duas vezes para confirmar).
- **Caixinha de sugestões** em cada prédio da cidade: +1 ponto de verba para montar a nave e uma dica do que levar (o item sugerido aparece com 💡 na montagem). Substitui os +8 créditos; os avisos somem sozinhos.
- **Letreiros** da cidade ficam acima dos prédios e atrás deles e dos nomes das pessoas.
- **Especialidade do Comandante**: escolha na nave recomendada ou na aba Missão de "Montar a minha".
- **Passo a passo automático** na introdução; na primeira vez, JOGAR já começa a Jornada Curta.
- **Escolha de planeta**: depois de um erro, os outros planetas ficam travados e Pontes-01b fica destacado com uma seta; sem clique em 5 s, a nave segue sozinha para a escolha do local de pouso.
- **Regulação Térmica**: depois de falhar, o painel mostra o passo a passo de cada fase.
- **Relatório final** enxuto (mensagem, falas, recomeçar da missão e homenagem a Marcos Pontes) com o botão **Salvar relatório completo** (arquivo HTML com números, perdas, desafios e o que foi aprendido).
- **Hidroponia traduzida**: "Colher", "Limpar bandeja", "Cuidar de todas", "estragou" e os demais textos da estufa agora mudam de idioma.
- **Desempenho**: a interface é reconstruída até cerca de 10 vezes por segundo (ou logo após um clique/tecla), em vez de a cada quadro. Isso reduz o travamento em computadores mais lentos.
- **Textos traduzidos**: "adquirido" (loja) agora aparece como "purchased"/"adquirido"; avisos de combustível, pouso, comida, remédios, fundo de contingência, hibernação, narrações de chegada e os textos da estufa passam a sair em inglês e espanhol.
- **Volume da narração**: em ⚙ Configurações (e no botão ⚙ do jogo), o controle "Volume da narração" ajusta só a voz do computador de bordo e dos tripulantes, sem mexer na música e nos efeitos.
