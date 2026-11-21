/* Xăm Hường — hình vẽ SVG: thẻ ngà, hột, tô sứ men lam, lồng đèn, hoa mai, Ngọ Môn. */
(function () {
  'use strict';
  const { BY_ID } = window.XHRules;
  const BLUE = '#1d4f9c';
  const RED = '#b51f1a';

  // Màu chữ trên thẻ theo bộ thẻ ngà vua Tự Đức.
  function charColors(id, nameChars, ptsChars) {
    const alt = (start, n) => Array.from({ length: n }, (_, i) => ((i % 2 === 0) === (start === 'b') ? BLUE : RED));
    switch (id) {
      case 'tu': return [alt('b', 0).concat([BLUE, BLUE]), [BLUE, BLUE]];
      case 'cu': return [[RED, RED], [RED, RED]];
      case 'tien': return [[BLUE, BLUE], [RED, RED]];
      case 'hoi': return [[RED, RED], [BLUE, BLUE]];
      case 'tham': return [alt('b', 2), alt('b', 3)];
      case 'bang': return [alt('r', 2), alt('r', 3)];
      case 'trang': return [[RED, RED], alt('b', 4)];
      default: return [nameChars.map(() => RED), ptsChars.map(() => RED)];
    }
  }

  let uid = 0;
  /* Thẻ xăm bằng ngà: đầu hình bầu rượu hai eo, thân chữ nhật, chữ Hán khắc màu. */
  function stick(id, opts) {
    const s = BY_ID[id];
    const o = Object.assign({ height: 120, showPts: true }, opts || {});
    const W = s.wid * 12; // đơn vị nội bộ
    const L = s.len * 10;
    const cx = W / 2 + 3;
    const vbW = W + 6;
    const r1 = W * 0.3, r2 = W * 0.44;
    const y1 = r1 + 2, y2 = y1 + r1 + r2 * 0.75, neck = y2 + r2 * 0.95, bodyTop = neck + W * 0.18;
    const n = ++uid;
    const shapes = (extra) => `
      <ellipse cx="${cx}" cy="${y1}" rx="${r1}" ry="${r1 * 1.05}" ${extra}/>
      <ellipse cx="${cx}" cy="${y2}" rx="${r2}" ry="${r2 * 0.95}" ${extra}/>
      <rect x="${cx - W * 0.16}" y="${y1}" width="${W * 0.32}" height="${neck - y1 + 2}" ${extra}/>
      <path d="M${cx - W * 0.2} ${neck} Q${cx - W / 2} ${neck} ${cx - W / 2} ${bodyTop + 4} L${cx - W / 2} ${L - 4} Q${cx - W / 2} ${L} ${cx - W / 2 + 4} ${L}
               L${cx + W / 2 - 4} ${L} Q${cx + W / 2} ${L} ${cx + W / 2} ${L - 4} L${cx + W / 2} ${bodyTop + 4} Q${cx + W / 2} ${neck} ${cx + W * 0.2} ${neck} Z" ${extra}/>`;
    const nameChars = [...s.han];
    const ptsChars = [...s.hanPts];
    const [nc, pc] = charColors(id, nameChars, ptsChars);
    const fs = W * 0.66;
    const fs2 = Math.min(W * 0.5, (L - bodyTop - fs * 2.5) / (ptsChars.length + 0.6));
    let y = bodyTop + fs * 1.05;
    let text = '';
    nameChars.forEach((ch, i) => {
      text += `<text x="${cx}" y="${y}" fill="${nc[i]}" font-size="${fs}">${ch}</text>`;
      y += fs * 1.05;
    });
    if (o.showPts) {
      y += fs2 * 0.4;
      ptsChars.forEach((ch, i) => {
        text += `<text x="${cx}" y="${y}" fill="${pc[i]}" font-size="${fs2}">${ch}</text>`;
        y += fs2 * 1.08;
      });
    }
    const h = o.height * (s.len / 26);
    const w = h * (vbW / (L + 2));
    return `<svg class="stick stick-${id}" viewBox="0 0 ${vbW} ${L + 2}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" aria-label="${s.name}" role="img">
      <defs><linearGradient id="iv${n}" x1="0" x2="1">
        <stop offset="0" stop-color="#d9c9a3"/><stop offset=".35" stop-color="#fbf4e2"/><stop offset=".7" stop-color="#f3e8cc"/><stop offset="1" stop-color="#cdb98d"/>
      </linearGradient></defs>
      <g>${shapes('fill="#7a5a2b" stroke="#7a5a2b" stroke-width="2.2"')}</g>
      <g>${shapes(`fill="url(#iv${n})"`)}</g>
      <circle cx="${cx}" cy="${y2}" r="${r2 * 0.28}" fill="${id === 'trang' ? RED : '#c8a24a'}" opacity=".85"/>
      <g font-family="'Noto Serif TC','Noto Serif SC','Songti SC','SimSun',serif" font-weight="700" text-anchor="middle">${text}</g>
    </svg>`;
  }

  /* Mặt hột: mặt nhất và mặt tứ tô đỏ, các mặt khác đen. */
  const PIPS = {
    1: [[50, 50]],
    2: [[30, 30], [70, 70]],
    3: [[27, 27], [50, 50], [73, 73]],
    4: [[30, 30], [70, 30], [30, 70], [70, 70]],
    5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
    6: [[30, 24], [70, 24], [30, 50], [70, 50], [30, 76], [70, 76]],
  };
  function dieFace(v) {
    const red = v === 1 || v === 4;
    const r = v === 1 ? 17 : v === 4 ? 11 : 9.5;
    const col = red ? 'url(#pipRed)' : 'url(#pipBlack)';
    return PIPS[v].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`).join('');
  }
  const DIE_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <radialGradient id="pipRed" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ff5a4a"/><stop offset=".6" stop-color="#c4170f"/><stop offset="1" stop-color="#7d0c07"/></radialGradient>
    <radialGradient id="pipBlack" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#555"/><stop offset=".6" stop-color="#151515"/><stop offset="1" stop-color="#000"/></radialGradient>
    <linearGradient id="dieBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f4efe4"/><stop offset="1" stop-color="#d8cfbd"/></linearGradient>
  </defs></svg>`;
  function die(v) {
    return `<svg viewBox="0 0 100 100" class="die-svg"><rect x="3" y="3" width="94" height="94" rx="20" fill="url(#dieBody)" stroke="#b9ad96" stroke-width="2"/><g class="pips">${dieFace(v)}</g></svg>`;
  }

  /* Tô sứ men lam nhìn từ trên xuống. */
  function bowl() {
    const petals = Array.from({ length: 16 }, (_, i) => {
      const a = (i * 360) / 16;
      return `<path transform="rotate(${a} 200 200)" d="M200 40 C 214 52 214 70 200 82 C 186 70 186 52 200 40 Z" fill="none" stroke="#2b5fae" stroke-width="2.2" opacity=".55"/>`;
    }).join('');
    const waves = Array.from({ length: 36 }, (_, i) => {
      const a = (i * 360) / 36;
      return `<path transform="rotate(${a} 200 200)" d="M193 18 q7 -6 14 0" fill="none" stroke="#1b4a96" stroke-width="2.6"/>`;
    }).join('');
    return `<svg viewBox="0 0 400 400" class="bowl-svg" aria-hidden="true">
      <defs>
        <radialGradient id="bowlIn" cx=".5" cy=".46" r=".55">
          <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f3f5f8"/><stop offset=".85" stop-color="#d9e0ea"/><stop offset="1" stop-color="#b9c4d4"/>
        </radialGradient>
        <radialGradient id="bowlRim" cx=".5" cy=".5" r=".5">
          <stop offset=".88" stop-color="#e9eef5"/><stop offset=".95" stop-color="#ffffff"/><stop offset="1" stop-color="#aab6c8"/>
        </radialGradient>
        <filter id="bowlShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#2a0505" flood-opacity=".55"/></filter>
      </defs>
      <circle cx="200" cy="200" r="196" fill="url(#bowlRim)" filter="url(#bowlShadow)"/>
      <circle cx="200" cy="200" r="190" fill="none" stroke="#1b4a96" stroke-width="5"/>
      <circle cx="200" cy="200" r="182" fill="none" stroke="#1b4a96" stroke-width="1.6"/>
      ${waves}
      <circle cx="200" cy="200" r="168" fill="url(#bowlIn)"/>
      <circle cx="200" cy="200" r="168" fill="none" stroke="#2b5fae" stroke-width="1.5" opacity=".6"/>
      ${petals}
      <circle cx="200" cy="200" r="104" fill="none" stroke="#2b5fae" stroke-width="1.2" opacity=".35"/>
      <circle cx="200" cy="200" r="46" fill="none" stroke="#1b4a96" stroke-width="2" opacity=".55"/>
      <circle cx="200" cy="200" r="40" fill="none" stroke="#1b4a96" stroke-width="1" opacity=".45"/>
      <text x="200" y="214" text-anchor="middle" font-size="40" fill="#1b4a96" opacity=".5" font-family="'Noto Serif TC',serif" font-weight="700">壽</text>
    </svg>`;
  }

  /* Lồng đèn đỏ. */
  function lantern(color) {
    const c = color || '#d42a1e';
    return `<svg viewBox="0 0 80 170" class="lantern-svg" aria-hidden="true">
      <line x1="40" y1="0" x2="40" y2="30" stroke="#c9a54a" stroke-width="2"/>
      <rect x="26" y="28" width="28" height="8" rx="2" fill="#e2b84f"/>
      <ellipse cx="40" cy="78" rx="34" ry="44" fill="${c}"/>
      <ellipse cx="40" cy="78" rx="34" ry="44" fill="url(#lanternShine)"/>
      <path d="M40 34 Q16 78 40 122 M40 34 Q64 78 40 122 M40 34 Q2 78 40 122 M40 34 Q78 78 40 122" fill="none" stroke="#8c140c" stroke-width="1.4" opacity=".6"/>
      <rect x="26" y="118" width="28" height="8" rx="2" fill="#e2b84f"/>
      <g stroke="#e9b949" stroke-width="2">${Array.from({ length: 7 }, (_, i) => `<line x1="${29 + i * 3.7}" y1="126" x2="${29 + i * 3.7}" y2="${158 + (i % 2) * 6}"/>`).join('')}</g>
      <text x="40" y="88" text-anchor="middle" font-size="26" fill="#f6d77a" font-family="'Noto Serif TC',serif" font-weight="700">福</text>
      <defs><radialGradient id="lanternShine" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".25"/></radialGradient></defs>
    </svg>`;
  }

  /* Hoa mai vàng năm cánh. */
  function maiFlower(size) {
    const p = Array.from({ length: 5 }, (_, i) => `<ellipse cx="20" cy="9" rx="7" ry="10" transform="rotate(${i * 72} 20 20)" fill="#ffd23f" stroke="#e0a10f" stroke-width=".8"/>`).join('');
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true">${p}<circle cx="20" cy="20" r="5" fill="#f08a00"/>${Array.from({ length: 8 }, (_, i) => `<line x1="20" y1="20" x2="${20 + 9 * Math.cos((i * Math.PI) / 4)}" y2="${20 + 9 * Math.sin((i * Math.PI) / 4)}" stroke="#b5520a" stroke-width=".8"/>`).join('')}</svg>`;
  }

  /* Cành mai: thân nâu, vài bông. */
  function maiBranch() {
    const flowers = [[60, 40], [120, 70], [170, 30], [210, 95], [95, 115], [255, 60], [30, 95]];
    return `<svg viewBox="0 0 300 160" class="mai-branch" aria-hidden="true">
      <path d="M0 150 C 60 120 90 90 140 80 S 230 50 300 40" stroke="#5a3418" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M120 85 C 130 60 150 45 172 32 M190 64 C 205 80 210 90 212 96 M70 112 C 80 100 88 70 60 42 M60 125 C 40 115 34 105 30 96 M240 52 C 248 56 252 58 256 60" stroke="#5a3418" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      ${flowers.map(([x, y], i) => `<g transform="translate(${x - 14} ${y - 14}) rotate(${i * 23} 14 14)">${maiFlower(28).replace('<svg ', '<svg x="0" y="0" ')}</g>`).join('')}
      <g fill="#7fae3a">${[[150, 60], [100, 98], [230, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="3" transform="rotate(-30 ${x} ${y})"/>`).join('')}</g>
    </svg>`;
  }

  /* Bóng Ngọ Môn (cổng chính Kinh thành Huế) — giản lược. */
  function ngoMon() {
    const roof = (x, y, w, h) => `<path d="M${x - 14} ${y + h} Q${x - 4} ${y + h - 4} ${x} ${y} L${x + w} ${y} Q${x + w + 4} ${y + h - 4} ${x + w + 14} ${y + h} Q${x + w / 2} ${y + h - 6} ${x - 14} ${y + h} Z"/>`;
    return `<svg viewBox="0 0 800 220" class="ngomon" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <g fill="currentColor">
        <path d="M0 220 L0 170 L120 170 L130 120 L670 120 L680 170 L800 170 L800 220 Z"/>
        ${roof(260, 66, 280, 22)}
        <rect x="270" y="88" width="260" height="34"/>
        ${roof(300, 30, 200, 20)}
        <rect x="310" y="50" width="180" height="18"/>
        ${roof(160, 90, 80, 16)}<rect x="168" y="106" width="64" height="16"/>
        ${roof(560, 90, 80, 16)}<rect x="568" y="106" width="64" height="16"/>
        <path d="M396 30 L400 14 L404 30 Z"/>
      </g>
      <g fill="#00000055">
        <path d="M376 220 L376 178 Q400 150 424 178 L424 220 Z"/>
        <path d="M300 220 L300 188 Q316 170 332 188 L332 220 Z"/><path d="M468 220 L468 188 Q484 170 500 188 L500 220 Z"/>
      </g>
    </svg>`;
  }

  /* Viền hồi văn (dùng làm dải trang trí). */
  const HOIVAN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M0 22 H22 V2 H6 V16 H16 V8 H11" fill="none" stroke="#e6c36a" stroke-width="2"/></svg>')}")`;

  /* Biểu tượng người chơi — hình ảnh Việt Nam. */
  const AVATARS = {
    non: `<path d="M24 7 L44 33 Q24 39 4 33 Z" fill="#f3dc9b" stroke="#a8812f" stroke-width="1.5" stroke-linejoin="round"/>
      <g stroke="#c9a24f" stroke-width="1" fill="none"><path d="M24 7 L12 34.5"/><path d="M24 7 L18 36"/><path d="M24 7 L24 36.6"/><path d="M24 7 L30 36"/><path d="M24 7 L36 34.5"/></g>
      <path d="M8 33.5 Q24 37 40 33.5" stroke="#c4170f" stroke-width="1.6" fill="none"/>
      <path d="M13 35 Q16 44 24 44 Q32 44 35 35" stroke="#c4170f" stroke-width="1.2" fill="none"/>`,
    sen: `${[-60, -30, 0, 30, 60].map((a) => `<path transform="rotate(${a} 24 34)" d="M24 34 C 17 26 18 14 24 8 C 30 14 31 26 24 34 Z" fill="${a === 0 ? '#f7a8c4' : '#f390b3'}" stroke="#c94f7c" stroke-width="1"/>`).join('')}
      <path d="M6 36 Q24 46 42 36 Q24 41 6 36 Z" fill="#4f9a4a"/><circle cx="24" cy="31" r="3" fill="#ffd23f"/>`,
    ca: `<path d="M8 24 C 14 12 30 12 36 24 C 30 36 14 36 8 24 Z" fill="#f28c28" stroke="#b5520a" stroke-width="1.2"/>
      <path d="M35 24 L45 15 Q42 24 45 33 Z" fill="#e8562a" stroke="#b5520a" stroke-width="1"/>
      <path d="M20 14 Q24 8 30 15" fill="#e8562a"/><path d="M20 34 Q24 40 29 33" fill="#e8562a"/>
      <g fill="none" stroke="#ffd08a" stroke-width="1"><path d="M18 19 q3 3 0 6 M22 18 q3 3 0 6 M26 19 q3 3 0 6 M22 25 q3 3 0 6 M26 25 q3 3 0 6"/></g>
      <circle cx="13" cy="22" r="1.8" fill="#222"/><path d="M8 25 q-3 3 -5 3" stroke="#b5520a" fill="none"/>`,
    den: `<line x1="24" y1="2" x2="24" y2="8" stroke="#a8812f" stroke-width="1.5"/><rect x="17" y="7" width="14" height="4" rx="1" fill="#e2b84f"/>
      <ellipse cx="24" cy="23" rx="15" ry="13" fill="#d42a1e"/><path d="M24 10 Q13 23 24 36 M24 10 Q35 23 24 36" stroke="#8c140c" fill="none"/>
      <rect x="17" y="35" width="14" height="4" rx="1" fill="#e2b84f"/><g stroke="#e9b949" stroke-width="1.4"><line x1="20" y1="39" x2="20" y2="46"/><line x1="24" y1="39" x2="24" y2="47"/><line x1="28" y1="39" x2="28" y2="46"/></g>`,
    trong: `<circle cx="24" cy="24" r="20" fill="#b8863b" stroke="#6e4a16" stroke-width="1.5"/>
      <circle cx="24" cy="24" r="15" fill="none" stroke="#6e4a16" stroke-width="1"/><circle cx="24" cy="24" r="11" fill="none" stroke="#6e4a16" stroke-width=".8" stroke-dasharray="2 1.5"/>
      <path d="${Array.from({ length: 14 }, (_, i) => { const a = (i * Math.PI) / 7, b = a + Math.PI / 14; return `${i ? 'L' : 'M'}${(24 + 8 * Math.cos(a)).toFixed(1)} ${(24 + 8 * Math.sin(a)).toFixed(1)} L${(24 + 3 * Math.cos(b)).toFixed(1)} ${(24 + 3 * Math.sin(b)).toFixed(1)}`; }).join(' ')} Z" fill="#fbe3a0"/>
      ${Array.from({ length: 6 }, (_, i) => { const a = (i * Math.PI) / 3 + 0.3; return `<path transform="translate(${(24 + 17.5 * Math.cos(a)).toFixed(1)} ${(24 + 17.5 * Math.sin(a)).toFixed(1)}) rotate(${((a * 180) / Math.PI + 90).toFixed(0)})" d="M-2 1 L0 -1.5 L2 1" stroke="#fbe3a0" fill="none" stroke-width="1"/>`; }).join('')}`,
    quat: `${Array.from({ length: 9 }, (_, i) => `<path transform="rotate(${-64 + i * 16} 24 40)" d="M24 40 L21.5 8 L26.5 8 Z" fill="${i % 2 ? '#c4170f' : '#e23a2c'}" stroke="#7a0f0d" stroke-width=".6"/>`).join('')}
      <path d="M5.4 29 A 22 22 0 0 1 42.6 29" stroke="#e9b949" stroke-width="2.4" fill="none" transform="translate(0 -12) scale(1 1.2)"/>
      <circle cx="24" cy="40" r="2.5" fill="#e9b949"/><path d="M14 18 Q24 12 34 18" stroke="#ffd98a" stroke-width="1" fill="none"/>`,
    mai: maiFlower(48).replace(/^<svg[^>]*>/, '<g transform="scale(1.2)">').replace('</svg>', '</g>'),
    banh: `<rect x="8" y="8" width="32" height="32" rx="3" fill="#3d8b3d" stroke="#245d24" stroke-width="1.5"/>
      <rect x="12" y="12" width="24" height="24" rx="2" fill="#4fa64f"/>
      <g stroke="#f2e2b0" stroke-width="2.2"><line x1="18" y1="7" x2="18" y2="41"/><line x1="30" y1="7" x2="30" y2="41"/><line x1="7" y1="18" x2="41" y2="18"/><line x1="7" y1="30" x2="41" y2="30"/></g>
      <path d="M24 5 q4 -3 6 1" stroke="#f2e2b0" stroke-width="1.6" fill="none"/>`,
    dua: `<path d="M5 18 A 19 19 0 0 0 43 18 Z" fill="#2e8b3e"/><path d="M8 18 A 16 16 0 0 0 40 18 Z" fill="#f4f1d0"/><path d="M10 18 A 14 14 0 0 0 38 18 Z" fill="#e63a3a"/>
      <g fill="#222">${[[17, 23], [24, 27], [31, 23], [20, 29], [28, 29], [24, 21]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1" ry="1.6"/>`).join('')}</g>`,
    tre: `<g fill="#6fae3a" stroke="#3f7a1d" stroke-width="1">${[[14, 6, 40], [24, 2, 44], [34, 9, 38]].map(([x, y1, y2]) => `<rect x="${x - 2.6}" y="${y1}" width="5.2" height="${y2 - y1}" rx="2"/>`).join('')}</g>
      <g stroke="#3f7a1d" stroke-width="1.4">${[[14, 18], [14, 30], [24, 14], [24, 28], [34, 20], [34, 31]].map(([x, y]) => `<line x1="${x - 3}" y1="${y}" x2="${x + 3}" y2="${y}"/>`).join('')}</g>
      <g fill="#86c34f">${[[17, 15, 30], [27, 11, -30], [37, 18, 25], [11, 26, -35]].map(([x, y, r]) => `<ellipse cx="${x + 4}" cy="${y}" rx="6" ry="1.8" transform="rotate(${r} ${x} ${y})"/>`).join('')}</g>`,
  };
  const AVATAR_IDS = Object.keys(AVATARS);
  function avatar(id) {
    const k = AVATARS[id] ? id : AVATAR_IDS[0];
    return `<svg viewBox="0 0 48 48" class="ava-svg" aria-hidden="true">${AVATARS[k]}</svg>`;
  }

  /* Biểu tượng thanh công cụ (nét vẽ). */
  const ICONS = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2.5Z"/><path d="M8 7h7M8 11h5"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    bellOff: '<path d="M8.7 3A6 6 0 0 1 18 8c0 2.7.6 4.6 1.3 6M17 17H3s3-2 3-9c0-.8.1-1.5.4-2.2"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="m2 2 20 20"/>',
    full: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" class="ico" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;

  window.XHArt = { stick, die, DIE_DEFS, bowl, lantern, maiFlower, maiBranch, ngoMon, HOIVAN, avatar, AVATAR_IDS, icon };
})();
