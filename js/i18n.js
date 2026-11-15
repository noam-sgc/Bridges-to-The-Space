// ============================================================
//  IDIOMAS — tradutor do site e do jogo (PT · EN · ES)
//  • L({pt,en,es})  → texto novo já escrito nos 3 idiomas
//  • T('texto PT')  → traduz um texto em português usando os dicionários
//  • I18n.dom(html) → traduz o HTML renderizado pela interface
//  Textos sem tradução caem para o português (nunca quebram).
// ============================================================
'use strict';

const LANGS = [
  { id: 'pt', label: 'Português', flag: '🇧🇷', speech: 'pt-BR' },
  { id: 'en', label: 'English', flag: '🇺🇸', speech: 'en-US' },
  { id: 'es', label: 'Español', flag: '🇪🇸', speech: 'es-ES' },
];
const I18N_DICT = { pt: {}, en: {}, es: {} };      // chave = texto em PT (ou chave estática do index.html)
const I18N_PATTERNS = { en: [], es: [] };  // [RegExp, 'substituição $1']

const I18n = {
  lang: 'pt',
  init() {
    let l = null;
    try { l = (Save.data.settings.lang) || null; } catch (e) { /* */ }
    if (!l || !LANGS.some(x => x.id === l)) l = 'en'; // inglês é o idioma padrão
    this.lang = l;
    this.apply();
  },
  set(l) {
    if (!LANGS.some(x => x.id === l)) return;
    this.lang = l;
    try { Save.data.settings.lang = l; Save.write(); } catch (e) { /* */ }
    if (typeof U !== 'undefined') U.cache = {};
    if (typeof Narrator !== 'undefined') { Narrator.stop(); Narrator.voice = null; Narrator.pickVoice(); } // a voz acompanha o idioma (cada idioma lembra a sua)
    this.apply();
    if (typeof Chat !== 'undefined' && Chat.render) Chat.render(true);
  },
  speech() { return (LANGS.find(x => x.id === this.lang) || LANGS[0]).speech; },
  // traduz a página estática (index.html): elementos com data-i18n="chave" guardam o HTML original em data-pt
  apply() {
    document.documentElement.lang = this.lang === 'pt' ? 'pt-BR' : this.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.dataset.pt == null) el.dataset.pt = el.innerHTML;
      const k = el.dataset.i18n;
      const v = (I18N_DICT[this.lang] || {})[k];
      el.innerHTML = v != null ? v : el.dataset.pt;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.dataset.i18nAttr.split(',').forEach(spec => {
        const [attr, k] = spec.split(':');
        if (el.dataset['pt_' + attr] == null) el.dataset['pt_' + attr] = el.getAttribute(attr) || '';
        const v = this.lang === 'pt' ? null : I18N_DICT[this.lang][k];
        el.setAttribute(attr, v != null ? v : el.dataset['pt_' + attr]);
      });
    });
    const sel = document.getElementById('lang');
    if (sel && sel.value !== this.lang) sel.value = this.lang;
    const t = this.lang === 'pt' ? 'Pontes01 — Exploração Espacial' : (I18N_DICT[this.lang]['title'] || document.title);
    document.title = t;
  },
  // textos em português que apareceram sem tradução (para auditoria: I18n.misses)
  misses: new Set(),
  PT_RE: /[ãõçâêôáéíóúà]|\b(não|você|para|com|uma|dos|das|nave|está|são|sem|mais|seu|sua|pelo|pela|até|que|da|os|ao|em|na|pule|pegar|de|levou)\b/i,
  noteMiss(k) { if (k && k.length > 1 && this.misses.size < 3000 && /\p{L}/u.test(k) && this.PT_RE.test(k)) this.misses.add(k); },
  // texto isolado
  _c: { en: new Map(), es: new Map() },
  t(s) {
    if (this.lang === 'pt' || s == null || s === '' || typeof s !== 'string') return s;
    let out = this._t(s, this.lang);
    // sem tradução em espanhol: mostra o inglês (nunca volta ao português)
    const has = (l, x) => { const d = I18N_DICT[l] || {}; return d[x] != null || d[x.trim()] != null; };
    if (out === s && this.lang !== 'en' && !has(this.lang, s)) out = this._t(s, 'en');
    if (out === s && !has(this.lang, s)) this.noteMiss(s.trim());
    return out;
  },
  _t(s, lang) {
    const cache = this._c[lang];
    const hit = cache.get(s); if (hit !== undefined) return hit;
    const d = I18N_DICT[lang]; let out = s;
    const k = s.trim();
    if (k.startsWith('Narração: ') && d['Narração:']) out = s.replace(k, d['Narração:'] + ' ' + this._t(k.slice(10), lang));
    else if (d[s] != null) out = d[s];
    else if (k && d[k] != null) out = s.replace(k, d[k]);
    else {
      let done = false;
      for (const [re, rep] of I18N_PATTERNS[lang]) { if (re.test(k)) { out = s.replace(k, k.replace(re, rep)); done = true; break; } }
      if (!done) {
        let m;
        // fala de tripulante: "Engenheiro 1 João: “...”", "Navegador Ana ★"
        if ((m = /^(Paramédic[oa]|Navegador[a]?|Agricultor[a]? \/ Eng\. Gen[ée]tic[oa]|Engenheir[oa] \d|Pesquisador[a]? Chefe|Comandante)( .*)$/.exec(k))) {
          const rest = m[2]; const sp = /^ (.+?): “(.+)”$/.exec(rest);
          out = s.replace(k, this._t(m[1], lang) + (sp ? ' ' + sp[1] + ': “' + this._t(sp[2], lang) + '”' : rest.replace(/^ Comandante$/, ' ' + this._t('Comandante', lang))));
        }
        // símbolos no início ("▶ ", "— ", "✔ ") e sufixo " — Comandante"
        else if ((m = /^([^\p{L}\p{N}"“(+−-]+)(.+)$/u.exec(k)) && this._t(m[2], lang) !== m[2]) out = s.replace(k, m[1] + this._t(m[2], lang));
        else if ((m = /^(.+?)( — )([^—]+)$/.exec(k)) && (this._t(m[1], lang) !== m[1] || this._t(m[3], lang) !== m[3])) out = s.replace(k, this._t(m[1], lang) + m[2] + this._t(m[3], lang));
      }
    }
    if (cache.size > 4000) cache.clear();
    cache.set(s, out); return out;
  },
  // HTML da interface → HTML traduzido (nós de texto + alguns atributos)
  dom(html) {
    if (this.lang === 'pt' || !html) return html;
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const walk = n => {
      if (n.nodeType === 3) {
        const raw = n.nodeValue; const k = raw.trim();
        if (k) { const v = this.t(k); if (v !== k) n.nodeValue = raw.replace(k, v); }
      } else if (n.nodeType === 1) {
        for (const a of ['title', 'placeholder', 'alt']) if (n.hasAttribute(a)) n.setAttribute(a, this.t(n.getAttribute(a)));
        n.childNodes.forEach(walk);
      }
    };
    tpl.content.childNodes.forEach(walk);
    return tpl.innerHTML;
  },
};

// texto novo nos 3 idiomas
const K = (pt, en, es) => ({ pt, en, es });
// atalhos globais
// objeto K(pt, en, es): idioma atual → inglês → português (o inglês tem prioridade sobre o português)
// os arquivos data/lang/<idioma>.json têm prioridade; o texto embutido no código é só reserva
const L = o => { if (o == null) return ''; if (typeof o === 'string') return I18n.t(o); if (I18n.lang !== 'pt' && o.pt != null) { const d = I18N_DICT[I18n.lang] || {}; if (d[o.pt] != null) return d[o.pt]; } if (o[I18n.lang] != null) return o[I18n.lang]; if (I18n.lang !== 'pt' && o.en != null) return o.en; if (o.pt != null) { if (I18n.lang !== 'pt') { const t = I18n.t(o.pt); if (t !== o.pt) return t; } return o.pt; } return ''; };
const T = s => I18n.t(s);

// ---------- traduções em JSON: data/lang/<idioma>.json ----------
//  pt.json → "site" (textos da página) e "falas" (textos falados, original)
//  en.json / es.json → "ui" (texto PT → tradução), "patterns" ([regex, troca]) e "falas"
const FALAS_LANG = {};
async function loadLangs() {
  const get = async l => { try { const r = await fetch(`data/lang/${l}.json`, { cache: 'no-cache' }); return await r.json(); } catch (e) { console.warn(`Não foi possível carregar data/lang/${l}.json (abra o jogo por um servidor):`, e); return {}; } };
  const [pt, en, es] = await Promise.all(['pt', 'en', 'es'].map(get));
  I18N_DICT.pt = pt.site || {};
  for (const [l, d] of [['en', en], ['es', es]]) {
    I18N_DICT[l] = d.ui || {};
    I18N_PATTERNS[l] = (d.patterns || []).map(([re, rep]) => [new RegExp(re), rep]);
    FALAS_LANG[l] = d.falas || {};
  }
  FALAS_LANG.pt = pt.falas || {};
  if (typeof registerFnPatterns === 'function') registerFnPatterns();
  // reúne as falas no formato {pt, en, es} usado pelo jogo
  const join = (a, b, c) => {
    if (typeof a === 'string') { const en = typeof b === 'string' ? b : a, es = typeof c === 'string' ? c : a; return en === a && es === a ? a : { pt: a, en, es }; } // igual nos 3 idiomas (nomes, ids) = texto simples
    if (Array.isArray(a)) return a.map((x, i) => join(x, (b || [])[i], (c || [])[i]));
    if (a && typeof a === 'object') { const o = {}; for (const k in a) o[k] = join(a[k], (b || {})[k], (c || {})[k]); return o; }
    return a;
  };
  return join(FALAS_LANG.pt, FALAS_LANG.en, FALAS_LANG.es);
}
