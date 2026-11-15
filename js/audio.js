// ============================================================
//  ÁUDIO — trilha sonora (MP3 da pasta .claude), efeitos e narração
// ============================================================
'use strict';

const Music = {
  cur: null, curKey: null, list: [], idx: 0, unlocked: false, fadeTimer: null,
  vol() { return Save.data.settings.mute ? 0 : Save.data.settings.music; },
  play(key) {
    if (key === this.curKey) return;
    this.curKey = key;
    this.list = key === 'intro' ? [ASSETS.intro] : (key === 'heroic' ? ASSETS.heroic.slice() : ASSETS.fase.slice());
    this.idx = Math.floor(Math.random() * this.list.length);
    if (this.unlocked) this._start();
  },
  _start() {
    const old = this.cur;
    if (old) this._fadeOut(old);
    if (!this.list.length) return;
    const a = new Audio(this.list[this.idx]);
    a.loop = this.list.length === 1;
    a.volume = 0;
    a.addEventListener('ended', () => { if (this.cur === a) { this.idx = (this.idx + 1) % this.list.length; this._start(); } });
    this.cur = a;
    a.play().catch(() => {});
    this._fadeIn(a);
  },
  _fadeIn(a) {
    const target = this.vol() * (Narrator.speaking ? 0.35 : 1);
    const step = () => { if (a !== this.cur) return; a.volume = Math.min(target, a.volume + 0.04); if (a.volume < target) setTimeout(step, 60); };
    step();
  },
  _fadeOut(a) {
    const step = () => { a.volume = Math.max(0, a.volume - 0.05); if (a.volume > 0) setTimeout(step, 50); else a.pause(); };
    step();
  },
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.curKey) this._start();
  },
  refreshVolume() { if (this.cur) this.cur.volume = this.vol() * (Narrator.speaking ? 0.35 : 1); },
};

const Sfx = {
  ctx: null,
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* sem áudio */ } } return this.ctx; },
  tone(freq, dur, type = 'square', vol = 0.08, slide = 0, delay = 0) {
    const c = this.ensure(); if (!c) return;
    const v = vol * (Save.data.settings.sfxOff ? 0 : Save.data.settings.sfx);
    if (v <= 0) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02);
  },
  noise(dur, vol = 0.06) {
    const c = this.ensure(); if (!c) return;
    const v = vol * (Save.data.settings.sfxOff ? 0 : Save.data.settings.sfx); if (v <= 0) return;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = c.createBufferSource(), g = c.createGain(); g.gain.value = v;
    s.buffer = buf; s.connect(g); g.connect(c.destination); s.start();
  },
  click() { this.tone(660, 0.05, 'square', 0.05); },
  ok() { this.tone(523, 0.08); this.tone(784, 0.12, 'square', 0.08, 0, 0.08); },
  bad() { this.tone(220, 0.25, 'sawtooth', 0.07, -80); },
  alarm() { this.tone(880, 0.18, 'square', 0.05); this.tone(660, 0.18, 'square', 0.05, 0, 0.2); },
  pick() { this.tone(988, 0.06, 'triangle', 0.08); },
  hit() { this.noise(0.25, 0.12); },
  step() { this.tone(120, 0.03, 'triangle', 0.03); },
  dice() { for (let i = 0; i < 5; i++) this.tone(300 + Math.random() * 500, 0.03, 'square', 0.04, 0, i * 0.04); },
};

const Narrator = {
  speaking: false, voice: null,
  // escolhe a voz mais natural disponível no idioma (vozes "Natural/Neural/Online", Google e "Enhanced/Premium" primeiro)
  voices() {
    if (!('speechSynthesis' in window)) return [];
    const lg = I18n.speech().toLowerCase(), base = lg.slice(0, 2);
    return speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(base))
      .map(v => {
        let sc = 0; const n = v.name.toLowerCase(); const vl = v.lang.replace('_', '-').toLowerCase();
        if (vl === lg) sc += 5;
        if (/natural|neural|online/.test(n)) sc += 12;
        if (/premium|enhanced|aprimorad|mejorad/.test(n)) sc += 9;
        if (/google/.test(n)) sc += 7;
        if (/francisca|thalita|luciana|antonio|jenny|aria|guy|samantha|ava|elvira|alvaro|dalia|paulina/.test(n)) sc += 3;
        if (/espeak|robot|compact|novelty|whisper|bad news|zarvox|trinoids/.test(n)) sc -= 20;
        if (!v.localService) sc += 1;
        return { v, sc };
      }).sort((a, b) => b.sc - a.sc).map(x => x.v);
  },
  pickVoice() {
    const list = this.voices(); const want = (Save.data.settings.voices || {})[I18n.lang];
    this.voice = (want && list.find(v => v.name === want)) || list[0] || null;
    return this.voice;
  },
  // fala depois do que estiver falando agora (sem cortar a narração)
  later(text) { setTimeout(() => { if (this.speaking || ('speechSynthesis' in window && speechSynthesis.speaking)) this._q = text; else this.say(text); }, 700); },
  say(text, opts) {
    if (!Save.data.settings.narration || Save.data.settings.mute || !('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(L(text));
      u.lang = (this.voice && this.voice.lang) || I18n.speech(); u.rate = (Save.data.settings.voiceRate || 1) * 0.98; u.pitch = (opts && opts.pitch) || 1;
      if (!this.voice || !this.voice.lang.toLowerCase().startsWith(I18n.speech().slice(0, 2))) this.pickVoice();
      if (this.voice) u.voice = this.voice;
      u.onstart = () => { this.speaking = true; Music.refreshVolume(); };
      u.onend = u.onerror = () => { this.speaking = false; Music.refreshVolume(); if (this._q) { const t = this._q; this._q = null; setTimeout(() => this.say(t), 350); } };
      speechSynthesis.speak(u);
    } catch (e) { /* ignora */ }
  },
  stop() { try { speechSynthesis.cancel(); } catch (e) { /* */ } this.speaking = false; Music.refreshVolume(); },
};
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => { Narrator.voice = null; Narrator.pickVoice(); };
