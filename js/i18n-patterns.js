// ============================================================
//  PADRÕES DE TRADUÇÃO COM FUNÇÃO (EN · ES)
//  Mensagens montadas com nomes e números cujas partes também
//  precisam ser traduzidas. Os textos fixos e os padrões simples
//  ficam em data/lang/<idioma>.json.
//  registerFnPatterns() é chamada depois de carregar os JSON.
// ============================================================
'use strict';
function registerFnPatterns() {
(function () {
  const t = s => I18n.t(s);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const low = s => s.charAt(0).toLowerCase() + s.slice(1);
  const P = (re, en, es) => { I18N_PATTERNS.en.push([re, en]); I18N_PATTERNS.es.push([re, es]); };
  const sev = { en: { leve: 'minor', média: 'moderate', grave: 'severe' }, es: { leve: 'leve', média: 'media', grave: 'grave' } };
  P(/^(Arca-\d) · (.+)$/, (m, a, b) => a + ' · ' + t(b), (m, a, b) => a + ' · ' + t(b));
  P(/^Colono · (.+)$/, 'Colonist · $1', 'Colono · $1');

  P(/^(.+\.) Um dos impactos furou o casco!$/, (m, a) => `${t(a)} One of the impacts holed the hull!`, (m, a) => `${t(a)} ¡Uno de los impactos perforó el casco!`);
  P(/^(.+): (sucesso|falhou)\. ?(.*)$/, (m, a, r, c) => `${t(a)}: ${r === 'sucesso' ? 'success' : 'failed'}.${c ? ' ' + t(c) : ''}`, (m, a, r, c) => `${t(a)}: ${r === 'sucesso' ? 'éxito' : 'falló'}.${c ? ' ' + t(c) : ''}`);
  P(/^Indo agora: (.+)\.$/, (m, a) => 'On my way: ' + low(t(cap(a))) + '.', (m, a) => 'Voy ahora: ' + low(t(cap(a))) + '.');
  P(/^(\+?)(\d+) pontos \((.+)\)\.$/, (m, s, n, a) => `${s}${n} points (${t(a)}).`, (m, s, n, a) => `${s}${n} puntos (${t(a)}).`);
  P(/^(\d+) tripulante\(s\) ficaram expostos à radiação\.$/, '$1 crew member(s) were exposed to radiation.', '$1 tripulante(s) quedaron expuestos a la radiación.');
  P(/^Colheita: \+([\d.,]+) kg de (.+)\.$/, (m, n, a) => `Harvest: +${n} kg of ${t(a)}.`, (m, n, a) => `Cosecha: +${n} kg de ${t(a)}.`);
  P(/^A nave atravessou a chuva de meteoros com (\d+) impacto\(s\)\.$/, 'The ship made it through the meteor shower with $1 impact(s).', 'La nave atravesó la lluvia de meteoros con $1 impacto(s).');
  P(/^(.+) foi resgatado inconsciente\. Sobreviveu graças aos trajes\/enfermaria\.$/, '$1 was rescued unconscious and survived thanks to the suits/sickbay.', '$1 fue rescatado/a inconsciente. Sobrevivió gracias a los trajes/enfermería.');
  P(/^(.+) voltou para dentro a tempo\. O substituto terminou o reparo\.$/, '$1 got back inside in time. The substitute finished the repair.', '$1 volvió adentro a tiempo. El sustituto terminó la reparación.');
  P(/^(.+) piorou e ficou incapacitado por um tempo, com mobilidade e visão reduzidas\.$/, '$1 got worse and is incapacitated for a while, with reduced mobility and vision.', '$1 empeoró y quedó incapacitado/a por un tiempo, con movilidad y visión reducidas.');
  P(/^(.+) foi tratado e está se recuperando\.$/, '$1 was treated and is recovering.', '$1 fue tratado/a y se está recuperando.');
  P(/^(.+) tomou (.+) e está se recuperando\.$/, (m, a, b) => `${a} took the ${low(t(b))} and is recovering.`, (m, a, b) => `${a} tomó ${low(t(b))} y se está recuperando.`);
  P(/^(.+) faz manutenção preventiva em (.+) \(1 min\)\.$/, (m, a, b) => `${a} does preventive maintenance on ${t(b)} (1 min).`, (m, a, b) => `${a} hace mantenimiento preventivo en ${t(b)} (1 min).`);
  P(/^Manutenção preventiva concluída: (.+) \+1\.$/, (m, a) => `Preventive maintenance done: ${t(a)} +1.`, (m, a) => `Mantenimiento preventivo listo: ${t(a)} +1.`);
  P(/^(.+) falhou! \(Sangue-frio disponível: rolar de novo\?\)$/, (m, a) => `${t(a)} failed! (Cold blood available: roll again?)`, (m, a) => `¡${t(a)} falló! (Sangre fría disponible: ¿tirar de nuevo?)`);
  P(/^(.+) falhou \((leve|média|grave)\): (.+)$/, (m, a, g, c) => `${t(a)} failed (${sev.en[g]}): ${t(c)}`, (m, a, g, c) => `${t(a)} falló (${sev.es[g]}): ${t(c)}`);
  P(/^(.+) falhou!$/, (m, a) => `${t(a)} failed!`, (m, a) => `¡${t(a)} falló!`);
  P(/^(.+): efeito terminou\.$/, (m, a) => `${t(a)}: effect ended.`, (m, a) => `${t(a)}: efecto terminado.`);
  P(/^Cena (\d) — (.+)$/, (m, n, a) => `Scene ${n} — ${t(a)}`, (m, n, a) => `Escena ${n} — ${t(a)}`);
  P(/^(.*) · ativo (\d+)s(?: · (abrir|fechar))?$/, (m, a, n, sm) => `${t(a)} · active ${n}s${sm ? ' · ' + (sm === 'abrir' ? 'open' : 'close') : ''}`, (m, a, n, sm) => `${t(a)} · activo ${n}s${sm ? ' · ' + (sm === 'abrir' ? 'abrir' : 'cerrar') : ''}`);
  P(/^Resultado: (.+)\. Custo para manter a temperatura: ([\d.,]+) kWh de energia, ([\d.,]+) kg de combustível\. Plantação perdida: ([\d.,]+) kg\. Tempo fora da faixa segura: ([\d.,]+) s\.$/,
    (m, g, k, f, p, s) => `Result: ${t(g)}. Cost of keeping the temperature: ${k} kWh of energy, ${f} kg of fuel. Crops lost: ${p} kg. Time outside the safe range: ${s} s.`,
    (m, g, k, f, p, s) => `Resultado: ${t(g)}. Costo de mantener la temperatura: ${k} kWh de energía, ${f} kg de combustible. Cultivo perdido: ${p} kg. Tiempo fuera del rango seguro: ${s} s.`);
  P(/^⚠ Rotina incompleta: (.+)$/, (m, a) => `⚠ Routine unfinished: ${a.split(' · ').map(t).join(' · ')}`, (m, a) => `⚠ Rutina incompleta: ${a.split(' · ').map(t).join(' · ')}`);
  P(/^🍱 (.+) está passando fome! Sirva comida ou coma na Cozinha\.$/, '🍱 $1 is starving! Serve food or eat in the Kitchen.', '🍱 ¡$1 está pasando hambre! Sirve comida o come en la Cocina.');
  P(/^🍴 (.+) comeu\.$/, '🍴 $1 ate.', '🍴 $1 comió.');
  P(/^🍴 (.+) está com fome: vá à Cozinha e clique em Comer agora\.$/, '🍴 $1 is hungry: go to the Kitchen and click Eat now.', '🍴 $1 tiene hambre: ve a la Cocina y haz clic en Comer ahora.');
  P(/^Etapa fora de ordem \((.+)\)\. O ciclo reiniciou\.$/, (m, a) => `Step out of order (${t(a)}). The cycle restarted.`, (m, a) => `Etapa fuera de orden (${t(a)}). El ciclo se reinició.`);
  P(/^(\d+(?:[.,]\d+)?) kg de lixo viraram (\d+(?:[.,]\d+)?) kg de adubo para a horta\.$/, (m, a, b) => `${a.replace(',', '.')} kg of trash became ${b.replace(',', '.')} kg of compost for the garden.`, '$1 kg de basura se convirtieron en $2 kg de abono para el huerto.');
  P(/^A tempestade atingiu a nave\. (\d+) tripulante\(s\) fora do abrigo\.$/, 'The storm hit the ship. $1 crew member(s) outside the shelter.', 'La tormenta golpeó la nave. $1 tripulante(s) fuera del refugio.');
  P(/^Você partiu para (.+?) sem combustível suficiente \((\d+) kg\)\. A nave ficou à deriva\.\s*(.*)$/, (m, a, b, c) => `You left for ${a} without enough fuel (${b} kg). The ship drifted away.${c ? ' ' + t(c) : ''}`, (m, a, b, c) => `Partiste hacia ${a} sin combustible suficiente (${b} kg). La nave quedó a la deriva.${c ? ' ' + t(c) : ''}`);
  P(/^O oxigênio acabou durante a viagem até (.+)\.$/, 'Oxygen ran out on the trip to $1.', 'El oxígeno se acabó durante el viaje a $1.');
  P(/^Chegamos a (.+)\. Atenção: este não é o destino planejado\.$/, 'We have arrived at $1. Warning: this is not the planned destination.', 'Llegamos a $1. Atención: este no es el destino planeado.');
  P(/^Sem combustível para voltar de (.+) \(precisava de (\d+) kg\)\. A nave ficou presa lá, longe de Pontes-01b\.$/, 'No fuel to return from $1 (needed $2 kg). The ship got stuck there, far from Pontes-01b.', 'Sin combustible para volver de $1 (hacían falta $2 kg). La nave quedó atrapada allí, lejos de Pontes-01b.');
  P(/^A estrela se aproxima: o lado do Sol sobe para \+(\d+) °C\. Ligue o resfriador\.$/, 'The star approaches: the sunlit side climbs to +$1 °C. Turn on the cooler.', 'La estrella se acerca: el lado al Sol sube a +$1 °C. Enciende el enfriador.');
  P(/^(Aquecedor|Resfriador) (ligado|desligado)\.$/, (m, a, b) => `${a === 'Aquecedor' ? 'Heater' : 'Cooler'} ${b === 'ligado' ? 'on' : 'off'}.`, (m, a, b) => `${a === 'Aquecedor' ? 'Calefactor' : 'Enfriador'} ${b === 'ligado' ? 'encendido' : 'apagado'}.`);
  P(/^Sem energia: (Aquecedor|Resfriador) desligou\.$/, (m, a) => `Out of energy: the ${a === 'Aquecedor' ? 'heater' : 'cooler'} shut off.`, (m, a) => `Sin energía: el ${a === 'Aquecedor' ? 'calefactor' : 'enfriador'} se apagó.`);
  P(/^☢ (.+): (\d+) mSv de radiação acumulada\. Cansaço e enjoo\.$/, '☢ $1: $2 mSv of accumulated radiation. Fatigue and nausea.', '☢ $1: $2 mSv de radiación acumulada. Cansancio y náuseas.');
  P(/^☢ (.+): dose alta de radiação \((\d+) mSv\)\. Risco de adoecer\.$/, '☢ $1: high radiation dose ($2 mSv). Risk of falling ill.', '☢ $1: dosis alta de radiación ($2 mSv). Riesgo de enfermar.');
  P(/^☢ (.+) está com enjoo de radiação\.$/, '☢ $1 has radiation sickness.', '☢ $1 tiene náuseas por radiación.');
  P(/^Pouso de emergência: combustível curto \((\d+) de (\d+) kg\)\. O casco sofreu e alguém se feriu\.$/, 'Emergency landing: propellant short ($1 of $2 kg). The hull took damage and someone got hurt.', 'Aterrizaje de emergencia: combustible escaso ($1 de $2 kg). El casco sufrió y alguien se hirió.');
  P(/^✔ Rotina: (.+)$/, (m, a) => `✔ Routine: ${t(a)}`, (m, a) => `✔ Rutina: ${t(a)}`);
  P(/^Troca feita: (.+)$/, (m, a) => `Trade done: ${t(a)}`, (m, a) => `Intercambio hecho: ${t(a)}`);
  P(/^Análise de (.+) concluída\.\s*(.*)$/, (m, a, r) => `${t(a)} analysis complete.${r ? ' ' + t(r) : ''}`, (m, a, r) => `Análisis de ${low(t(a))} completado.${r ? ' ' + t(r) : ''}`);
  P(/^A expedição pousou no (.+?)\. A humanidade tem um novo começo(?: — que custou caro\.)?$/, (m, a) => `The expedition landed at ${t(a)}. Humanity has a new beginning — one that came at a high price.`, (m, a) => `La expedición aterrizó en ${t(a)}. La humanidad tiene un nuevo comienzo — que costó caro.`);
  P(/^(.+) \(dia (\d+), (.+)\)$/, (m, a, n, c) => `${t(a)} (day ${n}, ${t(c)})`, (m, a, n, c) => `${t(a)} (día ${n}, ${t(c)})`);
  P(/^Livro de Receitas \((\d+)\/(\d+)\)$/, 'Recipe Book ($1/$2)', 'Libro de Recetas ($1/$2)');
  P(/^([\d.,]+) kg\/dia \(0,84 kg\/pessoa\)$/, '$1 kg/day (0.84 kg/person)', '$1 kg/día (0,84 kg/persona)');
  P(/^([\d.,]+) (kg|L)\/dia$/, '$1 $2/day', '$1 $2/día');
  P(/^\+([\d.,]+) kg\/dia de O₂$/, '+$1 kg/day of O₂', '+$1 kg/día de O₂');
  P(/^Vazaram ([\d.,]+) kg de combustível \((\d+)%\)!$/, '$1 kg of fuel leaked ($2%)!', '¡Se fugaron $1 kg de combustible ($2%)!');
  P(/^Mensagem entendida: “(.+)”\.$/, (m, a) => `Message understood: “${t(a)}”.`, (m, a) => `Mensaje entendido: “${t(a)}”.`);
  P(/^(.+) está do lado de fora com o traje vazando!$/, '$1 is outside with a leaking suit!', '¡$1 está afuera con el traje perdiendo aire!');
  P(/^Doente: (.+)\. Remédios (.+)\.$/, (m, a, b) => `Patient: ${a}. Medicine ${t(b)}.`, (m, a, b) => `Enfermo/a: ${a}. Medicamentos ${t(b)}.`);
  P(/^válidos até o dia (\d+)$/, 'valid until day $1', 'válidos hasta el día $1');
  P(/^(.+) entrou em hibernação\.$/, '$1 entered hibernation.', '$1 entró en hibernación.');
  P(/^(.+) saiu da hibernação\.$/, '$1 left hibernation.', '$1 salió de la hibernación.');
  P(/^(.+) recebeu tratamento\.$/, '$1 received treatment.', '$1 recibió tratamiento.');
  P(/^(.+) pronta \(2 refeições\)\.$/, (m, a) => `${t(a)} ready (2 meals).`, (m, a) => `${t(a)} lista (2 comidas).`);
  P(/^Receita descoberta: (.+?)! (.+)$/, (m, a, b) => `Recipe discovered: ${t(a)}! ${t(b)}`, (m, a, b) => `¡Receta descubierta: ${t(a)}! ${t(b)}`);
  P(/^(.+) reparado \(\+(\d+)%\)\.$/, (m, a, n) => `${t(a)} repaired (+${n}%).`, (m, a, n) => `${t(a)} reparado (+${n}%).`);
  P(/^([\d.,]+) kg de lixo ejetados\. Sem reciclador, a chance de reaproveitar foi perdida\.$/, '$1 kg of trash ejected. Without a recycler, the chance to reuse it was lost.', '$1 kg de basura expulsados. Sin reciclador se perdió la chance de reaprovecharla.');
  P(/^Uma bandeja de (.+) passou do ponto e estragou\.$/, (m, a) => `A tray of ${low(t(a))} went past its prime and spoiled.`, (m, a) => `Una bandeja de ${low(t(a))} se pasó y se echó a perder.`);
  P(/^(.+) concluiu: (.+) \(nível (\d+)\)\.$/, (m, a, b, n) => `${a} finished: ${t(b)} (level ${n}).`, (m, a, b, n) => `${a} terminó: ${t(b)} (nivel ${n}).`);
  P(/^Falta (.+) \(1 kg\)\.$/, (m, a) => `Missing ${low(t(a))} (1 kg).`, (m, a) => `Falta ${low(t(a))} (1 kg).`);
  P(/^☠ (.+) morreu \((.+)\)\.$/, (m, a, b) => `☠ ${t(a)} died (${t(b)}).`, (m, a, b) => `☠ ${t(a)} murió (${t(b)}).`);
  P(/^(.+) entrou como (.+)\.$/, (m, a, b) => `${a} joined as ${t(b)}.`, (m, a, b) => `${a} entró como ${t(b)}.`);
  P(/^(.+) saiu\. Um bot assumiu\.$/, '$1 left. A bot took over.', '$1 salió. Un bot tomó su lugar.');
  P(/^(.+) a caminho…$/, '$1 on the way…', '$1 en camino…');
  P(/^(.+): vá até a Eclusa e pressione E para trocar de lugar\.$/, '$1: go to the Airlock and press E to swap places.', '$1: vaya a la Esclusa y presione E para cambiar de lugar.');
  P(/^Próximo evento previsto: (.+) no dia (\d+)\.$/, (m, a, n) => `Next predicted event: ${t(a)} on day ${n}.`, (m, a, n) => `Próximo evento previsto: ${t(a)} el día ${n}.`);
  P(/^Fundo de contingência: (\d+) pts$/, 'Contingency fund: $1 pts', 'Fondo de contingencia: $1 pts');
  P(/^Fundo de contingência: (\d+) ponto\(s\)\.$/, 'Contingency fund: $1 point(s).', 'Fondo de contingencia: $1 punto(s).');
  P(/^Comida para ≈ (\d+) dias numa viagem de ≈ (\d+) dias\. Será preciso racionar ou trocar\.$/, 'Food for ≈ $1 days on a trip of ≈ $2 days. You will need to ration or trade.', 'Comida para ≈ $1 días en un viaje de ≈ $2 días. Habrá que racionar o intercambiar.');
  P(/^(\d+)\. (.+)$/, (m, n, a) => `${n}. ${t(a)}`, (m, n, a) => `${n}. ${t(a)}`);
  P(/^(.+) \((\d+) porções\)$/, (m, a, n) => `${t(a)} (${n} portions)`, (m, a, n) => `${t(a)} (${n} porciones)`);
  P(/^(.+) \(fresco\)$/, (m, a) => `${t(a)} (fresh)`, (m, a) => `${t(a)} (fresco)`);
  P(/^(.+) \(acabou → ração\)$/, (m, a) => `${t(a)} (ran out → rations)`, (m, a) => `${t(a)} (se acabó → ración)`);
  P(/^Paramédico: (.+)$/, (m, a) => `Paramedic: ${t(a)}`, (m, a) => `Paramédico: ${t(a)}`);
  P(/^(.+):$/, (m, a) => (t(a) !== a ? t(a) + ':' : m), (m, a) => (t(a) !== a ? t(a) + ':' : m));
  // partes separadas por " · " (traduz cada uma)
  P(/^(.+?) · (.+)$/, (m) => m.split(' · ').map(x => t(x)).join(' · '), (m) => m.split(' · ').map(x => t(x)).join(' · '));
})();

// ---------- padrões de mensagens concatenadas no código ----------
(function () {
  const t = s => I18n.t(s);
  const low = s => s.charAt(0).toLowerCase() + s.slice(1);
  const P = (re, en, es) => { I18N_PATTERNS.en.unshift([re, en]); I18N_PATTERNS.es.unshift([re, es]); };
  P(/^Controle da Missão: (.+)$/, (m, a) => `Mission Control: ${t(a)}`, (m, a) => `Control de la Misión: ${t(a)}`);
  P(/^Copiloto de IA sugere: (.+)$/, (m, a) => `AI copilot suggests: ${low(t(a))}`, (m, a) => `El copiloto de IA sugiere: ${low(t(a))}`);
  P(/^MISSÃO FALHOU: (.+)$/, (m, a) => `MISSION FAILED: ${t(a)}`, (m, a) => `MISIÓN FALLIDA: ${t(a)}`);
  P(/^Modo de cruzeiro: (.+)$/, (m, a) => `Cruise mode: ${t(a)}`, (m, a) => `Modo de crucero: ${t(a)}`);
  P(/^Nova receita no livro: (.+)$/, (m, a) => `New recipe in the book: ${t(a)}`, (m, a) => `Nueva receta en el libro: ${t(a)}`);
  P(/^Olhar estratégico: a pista de (.+) ficou mais clara\.$/, (m, a) => `Strategic eye: the clue for ${t(a)} is clearer now.`, (m, a) => `Mirada estratégica: la pista de ${t(a)} quedó más clara.`);
  P(/^A tempestade chega em (\d+) s\.$/, 'The storm arrives in $1 s.', 'La tormenta llega en $1 s.');
  P(/^Este passo precisa de um (.+)\.$/, (m, a) => `This step needs a ${low(t(a))}.`, (m, a) => `Este paso necesita un ${low(t(a))}.`);
  P(/^Manutenção preventiva: (.+)$/, (m, a) => `Preventive maintenance: ${t(a)}`, (m, a) => `Mantenimiento preventivo: ${t(a)}`);
  P(/^Regulação térmica: (.+)$/, (m, a) => `Thermal regulation: ${t(a)}`, (m, a) => `Regulación térmica: ${t(a)}`);
  P(/^Nenhum (.+) disponível para se dedicar\.$/, (m, a) => `No ${low(t(a))} available to dedicate.`, (m, a) => `Ningún ${low(t(a))} disponible para dedicarse.`);
  P(/^Vá até: (.+)\.$/, (m, a) => `Go to: ${t(a)}.`, (m, a) => `Vaya a: ${t(a)}.`);
  P(/^Não estou bem\.\.\. sinto (.+)\.$/, (m, a) => `I don't feel well... I have ${t(a)}.`, (m, a) => `No me siento bien... tengo ${t(a)}.`);
  P(/^Indo agora: (.+)$/, (m, a) => `On my way: ${low(t(a.charAt(0).toUpperCase() + a.slice(1).replace(/\.$/, '')))}.`, (m, a) => `Voy ahora: ${low(t(a.charAt(0).toUpperCase() + a.slice(1).replace(/\.$/, '')))}.`);
  P(/^Coletar a maior parte do lixo \((\d+) de (\d+)\)$/, 'Collect most of the trash ($1 of $2)', 'Recoger la mayor parte de la basura ($1 de $2)');
  P(/^Levar toda a tripulação ao abrigo \((\d+)\/(\d+) nos Dormitórios\)$/, 'Take the whole crew to the shelter ($1/$2 in the Quarters)', 'Llevar a toda la tripulación al refugio ($1/$2 en los Dormitorios)');
  P(/^(.+) inutilizável até o fim da fase\.$/, (m, a) => `${t(a)} unusable until the end of the phase.`, (m, a) => `${t(a)} inutilizable hasta el final de la fase.`);
  P(/^📢 (.+) foi chamado\(a\): (.+)$/, (m, a, b) => `📢 ${a} was called: ${t(b)}`, (m, a, b) => `📢 ${a} fue llamado/a: ${t(b)}`);
  P(/^(.+) não atendeu o chamado; (.+) assumiu\.$/, '$1 did not answer the call; $2 took over.', '$1 no respondió al llamado; $2 tomó el relevo.');
  P(/^(.+) não atendeu o chamado\.$/, '$1 did not answer the call.', '$1 no respondió al llamado.');
  P(/^(.+) cuida pessoalmente: (.+) \(tripulante dedicado\)\.$/, (m, a, b) => `${a} handles it personally: ${t(b)} (dedicated crew member).`, (m, a, b) => `${a} se encarga personalmente: ${t(b)} (tripulante dedicado).`);
  P(/^Rádio — ([\d.,]+) MHz$/, 'Radio — $1 MHz', 'Radio — $1 MHz');
  P(/^Pousamos em (.+)! Mas uma colônia não se faz sozinha\.$/, (m, a) => `We landed at ${t(a)}! But a colony does not build itself.`, (m, a) => `¡Aterrizamos en ${t(a)}! Pero una colonia no se construye sola.`);
})();

}
