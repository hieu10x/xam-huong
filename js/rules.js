/* Xăm Hường — luật chơi (thuần logic, không phụ thuộc giao diện).
 * Dùng được trong trình duyệt (window.XHRules) và Node (module.exports).
 */
(function (root) {
  'use strict';

  // Bảy loại thẻ, xếp từ cao xuống thấp. Kích thước (cm) theo bộ thẻ ngà của vua Tự Đức.
  const STICKS = [
    { id: 'trang', name: 'Trạng nguyên', short: 'Trạng', han: '狀元', hanPts: '三十二注', pts: 32, count: 1, len: 26, wid: 3.2 },
    { id: 'bang', name: 'Bảng nhãn', short: 'Bảng', han: '榜眼', hanPts: '十六注', pts: 16, count: 1, len: 24, wid: 2.8 },
    { id: 'tham', name: 'Thám hoa', short: 'Thám', han: '探花', hanPts: '十六注', pts: 16, count: 1, len: 24, wid: 2.8 },
    { id: 'hoi', name: 'Hội nguyên', short: 'Hội', han: '會元', hanPts: '八注', pts: 8, count: 4, len: 22.2, wid: 2.5 },
    { id: 'tien', name: 'Tiến sĩ', short: 'Tiến', han: '進士', hanPts: '四注', pts: 4, count: 8, len: 21.9, wid: 2.5 },
    { id: 'cu', name: 'Cử nhân', short: 'Cử', han: '舉人', hanPts: '二注', pts: 2, count: 16, len: 19.7, wid: 2.2 },
    { id: 'tu', name: 'Tú tài', short: 'Tú', han: '秀才', hanPts: '一注', pts: 1, count: 32, len: 18.7, wid: 1.9 },
  ];
  const BY_ID = {};
  STICKS.forEach((s) => (BY_ID[s.id] = s));
  const IDS = STICKS.map((s) => s.id);
  const FACE = ['', 'nhất', 'nhị', 'tam', 'tứ', 'ngũ', 'lục'];

  const MIN_PLAYERS = 6;
  const MAX_PLAYERS = 12;
  const QUOTA = 32; // mỗi cửa phải đủ 32 điểm
  const LUC_PHU = { huong: 64, den: 32 }; // mỗi cửa chung cho người đổ được lục phú

  const DEFAULT_OPTIONS = {
    quyDoi: true, // hết loại thẻ được thưởng thì lấy các thẻ nhỏ hơn có tổng điểm tương đương
    capChinhHoi: false, // tứ tự cáp chính được thêm Hội nguyên (luật nhà: chỉ trạng em)
    maxRounds: 0, // 0 = chơi đến khi hết thẻ
  };

  /* ---------- Bán trạng ----------
   * Mỗi cửa phải đủ 32 điểm. Bộ thẻ chỉ có 192 điểm (đủ 6 cửa); mỗi cửa thêm thì bán thêm một bậc,
   * mỗi bậc cộng đúng 32 điểm. */
  const BAN_TRANG_STEPS = [
    { ids: ['trang'], name: 'Bán trạng' },
    { ids: ['bang', 'tham'], name: 'Bán trạng em' },
    { ids: ['trang'], name: 'Bán trạng lần 2' },
    { ids: ['bang', 'tham'], name: 'Bán trạng em lần 2' },
    { ids: ['hoi'], name: 'Bán tam hường' },
    { ids: ['hoi'], name: 'Bán tam hường lần 2' },
  ];
  function banTrang(n) {
    const mult = {};
    IDS.forEach((id) => (mult[id] = 1));
    const steps = BAN_TRANG_STEPS.slice(0, Math.max(0, n - MIN_PLAYERS));
    steps.forEach((s) => s.ids.forEach((id) => mult[id]++));
    const total = STICKS.reduce((t, s) => t + s.pts * s.count * mult[s.id], 0);
    return { mult, steps, total };
  }

  /* ---------- Nhận diện tổ hợp ----------
   * award: 'trang' | 'bt' (Bảng nhãn hoặc Thám hoa) | id thẻ thường
   * trang: { sys: 'huong'|'den', tier: 1|2, age, ageLabel } — thông tin tranh Trạng */
  function classify(dice, opts) {
    if (!Array.isArray(dice) || dice.length !== 6 || dice.some((v) => !(v >= 1 && v <= 6)))
      throw new Error('Cần đúng 6 hột, mỗi hột từ 1 đến 6');
    const c = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach((v) => c[v]++);
    const n4 = c[4];
    const others = dice.filter((v) => v !== 4).sort((a, b) => a - b);
    const R = (id, name, detail, awards, extra) => Object.assign({ id, name, detail, awards, trang: null }, extra || {});

    if (n4 === 6) return R('luc_phu_huong', 'Lục phú hường', `Sáu mặt tứ — mỗi cửa chung ${LUC_PHU.huong} điểm, hết ván`, [], { lucPhu: 'huong', big: true });

    for (let k = 1; k <= 6; k++)
      if (c[k] === 6) return R('luc_phu_den', 'Lục phú đen', `Sáu mặt ${FACE[k]} — mỗi cửa chung ${LUC_PHU.den} điểm, hết ván`, [], { lucPhu: 'den', big: true });

    if (n4 === 5) {
      const o = others[0];
      return R('ngu_huong', 'Ngũ hường', `Năm mặt tứ, tuổi ${o} — giật cả trạng anh lẫn trạng em`, ['trang', 'bang', 'tham'], {
        trang: { sys: 'huong', tier: 2, age: o, ageLabel: `tuổi ${o}` },
        tamKhoi: true,
        big: true,
      });
    }

    for (let k = 1; k <= 6; k++) {
      if (k === 4 || c[k] !== 5) continue;
      const o = dice.find((v) => v !== k);
      return R('ngu_tu', 'Ngũ tử', `Trạng đen: năm mặt ${FACE[k]}, tuổi ${o}`, ['trang'], {
        trang: { sys: 'den', tier: 1, age: o, ageLabel: `tuổi ${o}` },
        big: true,
      });
    }

    if (n4 === 4) {
      const [a, b] = others;
      if (a === 2 && b === 2)
        return R('trang_cap_chinh', 'Trạng cáp chính', 'Bốn mặt tứ, kèm đôi nhị — tuổi lớn nhất hệ hường', ['trang'], {
          trang: { sys: 'huong', tier: 1, age: 14, ageLabel: 'cáp chính' },
          big: true,
        });
      if (a === 1 && b === 3)
        return R('trang_cap_xien', 'Trạng cáp xiên', 'Bốn mặt tứ, kèm nhất và tam', ['trang'], {
          trang: { sys: 'huong', tier: 1, age: 13, ageLabel: 'cáp xiên' },
          big: true,
        });
      return R('tu_huong', 'Tứ hường', `Trạng hường tuổi ${a + b} (${FACE[a]} + ${FACE[b]})`, ['trang'], {
        trang: { sys: 'huong', tier: 1, age: a + b, ageLabel: `tuổi ${a + b}` },
        big: true,
      });
    }

    for (let k = 1; k <= 6; k++) {
      if (k === 4 || c[k] !== 4) continue;
      const rest = dice.filter((v) => v !== k).sort((x, y) => x - y);
      const fours = rest.filter((v) => v === 4).length;
      const [a, b] = rest;
      // Cáp: hai mặt còn lại cộng bằng mặt tứ tự. Cáp chính hay cáp xiên đều chỉ được trạng em.
      if (a + b === k)
        return a === b
          ? R('tu_tu_cap_chinh', 'Tứ tự cáp chính', `Bốn mặt ${FACE[k]}, kèm đôi ${FACE[a]}`, opts && opts.capChinhHoi ? ['bt', 'hoi'] : ['bt'])
          : R('tu_tu_cap_xien', 'Tứ tự cáp xiên', `Bốn mặt ${FACE[k]}, kèm ${FACE[a]} và ${FACE[b]}`, ['bt']);
      if (fours === 2) return R('tu_tu_nhi_huong', 'Tứ tự nhị hường', `Bốn mặt ${FACE[k]}, kèm hai mặt tứ`, ['tien', 'cu']);
      if (fours === 1) return R('tu_tu_nhat_huong', 'Tứ tự nhất hường', `Bốn mặt ${FACE[k]}, kèm một mặt tứ`, ['tien', 'tu']);
      return R('tu_tu', 'Tứ tự', `Bốn mặt ${FACE[k]} giống nhau`, ['tien']);
    }

    const triples = [];
    for (let k = 1; k <= 6; k++) if (c[k] === 3) triples.push(k);
    // Phân song: hai bộ ba là hai mặt đối nhau trên hột (cộng bằng 7): nhất–lục, nhị–ngũ, tam–tứ.
    if (triples.length === 2 && triples[0] + triples[1] === 7) {
      if (n4 === 3) return R('phan_song_tam_huong', 'Phân song tam hường', 'Ba mặt tam và ba mặt tứ', ['bt', 'hoi']);
      return R('phan_song', 'Phân song', `Ba mặt ${FACE[triples[0]]} và ba mặt ${FACE[triples[1]]}`, ['bt']);
    }
    if (c[4] === 2 && c[5] === 2 && c[6] === 2) return R('thuong_ma', 'Thượng mã', 'Đôi tứ, đôi ngũ, đôi lục', ['bt']);
    if (c[1] === 2 && c[2] === 2 && c[3] === 2) return R('ha_ma', 'Hạ mã', 'Đôi nhất, đôi nhị, đôi tam', ['bt']);
    if (c.slice(1).every((x) => x === 1)) return R('luc_thuan', 'Lục thuận', 'Đủ sáu mặt từ nhất đến lục', ['bt']);

    if (n4 === 3) return R('tam_huong', 'Tam hường', 'Ba mặt tứ đỏ', ['hoi']);
    if (n4 === 2) return R('nhi_huong', 'Nhị hường', 'Hai mặt tứ đỏ', ['cu']);
    if (n4 === 1) return R('nhat_huong', 'Nhất hường', 'Một mặt tứ đỏ', ['tu']);
    return R('khong', 'Không được gì', 'Không có mặt tứ nào', []);
  }

  /* Trạng mới `a` có giật được trạng đang giữ `b` không?
   * - Ngũ hường giật được mọi trạng, trừ ngũ hường tuổi bằng hoặc lớn hơn.
   * - Còn lại chỉ giật trong cùng hệ (hường với hường, đen với đen), phải lớn tuổi hơn. */
  function beats(a, b) {
    if (a.tier === 2 || b.tier === 2) return a.tier === 2 && (b.tier !== 2 || a.age > b.age);
    return a.sys === b.sys && a.age > b.age;
  }

  const SYS_NAME = { huong: 'Trạng hường', den: 'Trạng đen' };
  function trangTitle(t) {
    if (!t) return '';
    if (t.tier === 2) return `Ngũ hường ${t.ageLabel}`;
    if (t.ageLabel.startsWith('cáp')) return `Trạng ${t.ageLabel}`;
    return `${SYS_NAME[t.sys]} ${t.ageLabel}`;
  }

  /* ---------- Trạng thái ván chơi ---------- */
  function emptySticks() {
    const o = {};
    IDS.forEach((id) => (o[id] = 0));
    return o;
  }

  function newGame(players, options) {
    if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) throw new Error(`Cần từ ${MIN_PLAYERS} đến ${MAX_PLAYERS} cửa`);
    const pool = {};
    STICKS.forEach((s) => (pool[s.id] = s.count));
    return {
      v: 2,
      options: Object.assign({}, DEFAULT_OPTIONS, options || {}),
      players: players.map((p) => ({ name: p.name, avatar: p.avatar, sticks: emptySticks() })),
      pool,
      trang: null, // { holder, sys, tier, age, ageLabel, combo }
      lucPhu: null, // { player, kind, each }
      current: 0,
      round: 1,
      turn: 0,
      over: false,
      log: [],
    };
  }

  const clone = (s) => JSON.parse(JSON.stringify(s));
  const poolTotal = (st) => IDS.reduce((n, id) => n + st.pool[id], 0);
  const rawScore = (p) => IDS.reduce((n, id) => n + p.sticks[id] * BY_ID[id].pts, 0);
  const stickCount = (p) => IDS.reduce((n, id) => n + p.sticks[id], 0);
  // Điểm đã tính bán trạng theo số cửa.
  function score(p, n) {
    const { mult } = banTrang(n || MIN_PLAYERS);
    return IDS.reduce((t, id) => t + p.sticks[id] * BY_ID[id].pts * mult[id], 0);
  }

  // Gom các thẻ trên bàn nhỏ hơn `belowPts`, từ cao xuống thấp, tổng không vượt `pts`.
  function takeEquivalent(st, p, pts, belowPts, gained, why) {
    let left = pts;
    for (const s of STICKS) {
      if (s.id === 'trang' || s.pts >= belowPts || s.pts > left) continue;
      while (st.pool[s.id] > 0 && s.pts <= left) {
        st.pool[s.id]--;
        st.players[p].sticks[s.id]++;
        gained.push({ id: s.id, from: null, why });
        left -= s.pts;
      }
    }
    return pts - left;
  }

  function applyRoll(state, dice) {
    if (state.over) throw new Error('Ván đã kết thúc');
    const st = clone(state);
    const p = st.current;
    const me = st.players[p];
    const combo = classify(dice, st.options);
    const gained = []; // { id, from: null|playerIndex, why }
    const notes = [];
    const events = []; // 'trang_new' | 'trang_steal' | 'trang_up' | 'tamkhoi' | 'lucphu'

    const fromPool = (id, why) => {
      if (st.pool[id] > 0) {
        st.pool[id]--;
        me.sticks[id]++;
        gained.push({ id, from: null, why });
        return true;
      }
      return false;
    };
    const fromPlayer = (id, q) => {
      st.players[q].sticks[id]--;
      me.sticks[id]++;
      gained.push({ id, from: q });
    };
    const seize = (id) => {
      if (fromPool(id)) return;
      const q = st.players.findIndex((pl) => pl.sticks[id] > 0);
      if (q >= 0 && q !== p) {
        fromPlayer(id, q);
        notes.push(`Giật ${BY_ID[id].name} của ${st.players[q].name}.`);
      }
    };
    const fallback = (id) => {
      const s = BY_ID[id];
      if (st.options.quyDoi) {
        const got = takeEquivalent(st, p, s.pts, s.pts, gained, 'quy đổi');
        notes.push(got > 0 ? `Hết thẻ ${s.name} — quy đổi được ${got} điểm.` : `Hết thẻ ${s.name}, cũng không còn thẻ nhỏ để quy đổi.`);
      } else notes.push(`Thẻ ${s.name} đã hết.`);
    };
    const gom32 = () => {
      const got = takeEquivalent(st, p, 32, 32, gained, 'gom trạng');
      notes.push(got > 0 ? `Gom ${got} điểm trên bàn.` : 'Trên bàn không còn thẻ để gom.');
    };

    // Trả về true nếu được (hoặc giữ vững) trạng.
    const handleTrang = () => {
      const t = st.trang;
      const mine = Object.assign({}, combo.trang, { combo: combo.name });
      if (!t) {
        fromPool('trang');
        st.trang = Object.assign({ holder: p }, mine);
        events.push('trang_new');
        notes.push(`Đoạt Trạng nguyên (${trangTitle(mine)}).`);
        return true;
      }
      if (!beats(mine, t)) {
        const holder = t.holder === p ? 'mình' : st.players[t.holder].name;
        const why = t.tier !== 2 && mine.tier !== 2 && mine.sys !== t.sys ? 'khác hệ, không giật được' : 'không lớn tuổi hơn';
        notes.push(`${why[0].toUpperCase() + why.slice(1)} — Trạng của ${holder} là ${trangTitle(t)}.`);
        gom32();
        return false;
      }
      if (t.holder === p) {
        st.trang = Object.assign({ holder: p }, mine);
        events.push('trang_up');
        notes.push(`Tự giật trạng của mình: chỉ lên tuổi, nay là ${trangTitle(mine)}, không được thêm thẻ.`);
        return true;
      }
      const q = t.holder;
      fromPlayer('trang', q);
      st.trang = Object.assign({ holder: p }, mine);
      events.push('trang_steal');
      notes.push(`Giật Trạng của ${st.players[q].name}!`);
      return true;
    };

    if (combo.lucPhu) {
      st.lucPhu = { player: p, kind: combo.lucPhu, each: LUC_PHU[combo.lucPhu] };
      events.push('lucphu');
      notes.push(`Mỗi cửa chung ${LUC_PHU[combo.lucPhu]} điểm — kết thúc ván.`);
    } else {
      let gotTrang = false;
      for (const a of combo.awards) {
        if (a === 'trang') gotTrang = handleTrang();
        else if (combo.tamKhoi && (a === 'bang' || a === 'tham')) {
          if (gotTrang) seize(a);
        } else if (a === 'bt') {
          if (!fromPool('bang') && !fromPool('tham')) fallback('bang');
        } else if (!fromPool(a)) fallback(a);
      }
      if (combo.tamKhoi && gotTrang) events.push('tamkhoi');
    }

    const entry = { turn: st.turn, round: st.round, player: p, dice: dice.slice(), combo: combo.id, name: combo.name, gained, notes, events };
    st.log.push(entry);
    st.turn++;

    if (combo.lucPhu || poolTotal(st) === 0) st.over = true;
    st.current = (p + 1) % st.players.length;
    if (st.current === 0) {
      st.round++;
      if (st.options.maxRounds > 0 && st.round > st.options.maxRounds) st.over = true;
    }
    return { state: st, result: { combo, gained, notes, events, player: p } };
  }

  /* ---------- Thanh toán cuối ván ----------
   * Mỗi cửa phải đủ 32 điểm: dư thì bán, thiếu thì mua. Lục phú: mỗi cửa chung cho người đổ được. */
  function settle(st, price) {
    const n = st.players.length;
    const bt = banTrang(n);
    const rows = st.players.map((pl, i) => {
      const points = score(pl, n);
      let diff = points - QUOTA;
      if (st.lucPhu) diff = i === st.lucPhu.player ? st.lucPhu.each * (n - 1) : -st.lucPhu.each;
      return { i, name: pl.name, avatar: pl.avatar, points, diff, money: diff * (price || 0), trang: !!(st.trang && st.trang.holder === i) };
    });
    // Ai trả ai: người thiếu trả lần lượt cho người dư.
    const debt = rows.filter((r) => r.diff < 0).map((r) => ({ i: r.i, left: -r.diff })).sort((a, b) => b.left - a.left);
    const cred = rows.filter((r) => r.diff > 0).map((r) => ({ i: r.i, left: r.diff })).sort((a, b) => b.left - a.left);
    const transfers = [];
    let ci = 0;
    for (const d of debt) {
      while (d.left > 0 && ci < cred.length) {
        const c = cred[ci];
        const x = Math.min(d.left, c.left);
        transfers.push({ from: d.i, to: c.i, points: x, money: x * (price || 0) });
        d.left -= x;
        c.left -= x;
        if (c.left === 0) ci++;
      }
    }
    const ranking = rows.slice().sort((a, b) => b.diff - a.diff || b.trang - a.trang);
    return { rows, ranking, transfers, banTrang: bt, lucPhu: st.lucPhu, unclaimed: poolTotal(st) };
  }

  function rollDice(rng) {
    const r = rng || Math.random;
    return Array.from({ length: 6 }, () => 1 + Math.floor(r() * 6));
  }

  const api = {
    STICKS, BY_ID, IDS, FACE, MIN_PLAYERS, MAX_PLAYERS, QUOTA, LUC_PHU, BAN_TRANG_STEPS, DEFAULT_OPTIONS,
    classify, beats, trangTitle, banTrang, newGame, applyRoll, settle, score, rawScore, stickCount, poolTotal, rollDice,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.XHRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
