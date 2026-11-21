/* Xăm Hường — âm thanh tổng hợp bằng Web Audio (không cần tệp âm thanh). */
(function () {
  'use strict';
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!enabled) return null;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) {
      return null;
    }
  }

  function tone(c, t, freq, dur, vol, type, endFreq) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function noise(c, t, dur, vol, freq) {
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(f).connect(g).connect(c.destination);
    src.start(t);
  }

  // Tiếng hột lăn lách cách trong tô sứ.
  function rattle(duration) {
    const c = ac();
    if (!c) return;
    const now = c.currentTime;
    const n = Math.round(duration * 26);
    for (let i = 0; i < n; i++) {
      const t = now + (i / n) * duration + Math.random() * 0.03;
      const fade = 1 - (i / n) * 0.6;
      tone(c, t, 2600 + Math.random() * 2200, 0.05 + Math.random() * 0.05, 0.05 * fade);
      noise(c, t, 0.025, 0.12 * fade, 3500);
    }
    // tiếng "keng" cuối khi hột dừng
    tone(c, now + duration, 3100, 0.5, 0.05);
    tone(c, now + duration, 4650, 0.35, 0.025);
  }

  // Chuông nhỏ khi được thẻ.
  function chime(level) {
    const c = ac();
    if (!c) return;
    const now = c.currentTime;
    const notes = [523.25, 587.33, 698.46, 783.99, 880.0]; // ngũ cung: Đô Rê Fa Sol La
    const k = Math.min(notes.length, 1 + (level || 0));
    for (let i = 0; i < k; i++) {
      tone(c, now + i * 0.11, notes[i] * 2, 0.9, 0.07, 'sine');
      tone(c, now + i * 0.11, notes[i] * 4.01, 0.4, 0.015, 'sine');
    }
  }

  // Tiếng không được gì.
  function thud() {
    const c = ac();
    if (!c) return;
    const now = c.currentTime;
    tone(c, now, 220, 0.25, 0.06, 'triangle', 150);
  }

  // Trống "tùng tùng tùng" + thanh la cho sự kiện lớn (Trạng nguyên, cướp trạng...).
  function drum(times) {
    const c = ac();
    if (!c) return;
    const now = c.currentTime;
    for (let i = 0; i < (times || 3); i++) {
      const t = now + i * 0.32;
      tone(c, t, 120, 0.6, 0.5, 'sine', 48);
      noise(c, t, 0.08, 0.25, 600);
    }
    const t = now + (times || 3) * 0.32;
    tone(c, t, 520, 2.2, 0.08, 'sine', 500);
    tone(c, t, 1310, 1.8, 0.04, 'sine', 1290);
    tone(c, t, 2090, 1.2, 0.02, 'sine');
  }

  // Nhạc kết ván (ngũ cung).
  function fanfare() {
    const c = ac();
    if (!c) return;
    const now = c.currentTime;
    const seq = [392, 440, 523.25, 587.33, 659.25, 783.99, 659.25, 783.99, 1046.5];
    seq.forEach((f, i) => {
      tone(c, now + i * 0.16, f, 0.6, 0.09, 'triangle');
      tone(c, now + i * 0.16, f * 2, 0.3, 0.02, 'sine');
    });
  }

  window.XHAudio = {
    rattle,
    chime,
    thud,
    drum,
    fanfare,
    unlock: () => ac(),
    setEnabled(v) {
      enabled = !!v;
    },
    get enabled() {
      return enabled;
    },
  };
})();
