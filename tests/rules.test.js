// Chạy: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/rules.js');

const c = (d) => R.classify(d);
const six = ['A', 'B', 'C', 'D', 'E', 'F'].map((name) => ({ name }));
const players = (n) => Array.from({ length: n }, (_, i) => ({ name: 'P' + i }));
const NOTHING = [1, 2, 3, 5, 6, 6];

test('bộ thẻ có đủ 63 thẻ, 192 điểm', () => {
  assert.equal(R.STICKS.reduce((n, s) => n + s.count, 0), 63);
  assert.equal(R.STICKS.reduce((n, s) => n + s.count * s.pts, 0), 192);
});

test('nhận diện tổ hợp', () => {
  const cases = [
    [[4, 1, 2, 2, 5, 6], 'nhat_huong', ['tu']],
    [[4, 4, 1, 2, 5, 6], 'nhi_huong', ['cu']],
    [[4, 4, 4, 1, 2, 6], 'tam_huong', ['hoi']],
    [NOTHING, 'khong', []],
    [[3, 3, 3, 3, 1, 6], 'tu_tu', ['tien']],
    [[5, 5, 5, 5, 4, 2], 'tu_tu_nhat_huong', ['tien', 'tu']],
    [[5, 5, 5, 5, 4, 1], 'tu_tu_cap_xien', ['bt']],
    [[6, 6, 6, 6, 4, 4], 'tu_tu_nhi_huong', ['tien', 'cu']],
    [[5, 5, 5, 5, 2, 3], 'tu_tu_cap_xien', ['bt']],
    [[6, 6, 6, 6, 3, 3], 'tu_tu_cap_chinh', ['bt']],
    [[2, 2, 2, 2, 1, 1], 'tu_tu_cap_chinh', ['bt']],
    [[3, 3, 3, 3, 1, 2], 'tu_tu_cap_xien', ['bt']],
    [[6, 6, 6, 6, 2, 4], 'tu_tu_cap_xien', ['bt']],
    [[6, 6, 6, 6, 1, 2], 'tu_tu', ['tien']],
    [[2, 2, 2, 2, 6, 6], 'tu_tu', ['tien']],
    [[1, 1, 1, 6, 6, 6], 'phan_song', ['bt']],
    [[2, 2, 2, 5, 5, 5], 'phan_song', ['bt']],
    [[3, 3, 3, 4, 4, 4], 'phan_song_tam_huong', ['bt', 'hoi']],
    [[1, 1, 1, 3, 3, 3], 'khong', []],
    [[2, 2, 2, 6, 6, 6], 'khong', []],
    [[4, 4, 4, 1, 1, 1], 'tam_huong', ['hoi']],
    [[4, 5, 6, 4, 5, 6], 'thuong_ma', ['bt']],
    [[1, 2, 3, 1, 2, 3], 'ha_ma', ['bt']],
    [[6, 5, 4, 3, 2, 1], 'luc_thuan', ['bt']],
    [[4, 4, 4, 4, 6, 5], 'tu_huong', ['trang']],
    [[4, 4, 4, 4, 2, 2], 'trang_cap_chinh', ['trang']],
    [[4, 4, 4, 4, 1, 3], 'trang_cap_xien', ['trang']],
    [[3, 3, 3, 3, 3, 6], 'ngu_tu', ['trang']],
    [[4, 4, 4, 4, 4, 6], 'ngu_huong', ['trang', 'bang', 'tham']],
    [[2, 2, 2, 2, 2, 2], 'luc_phu_den', []],
    [[4, 4, 4, 4, 4, 4], 'luc_phu_huong', []],
  ];
  for (const [d, id, awards] of cases) {
    const r = c(d);
    assert.equal(r.id, id, `${d} → ${r.id}`);
    assert.deepEqual(r.awards, awards, `${d} awards`);
  }
});

test('tuổi trạng hường: cáp chính > cáp xiên > tổng lớn', () => {
  const t = (d) => c(d).trang;
  assert.equal(t([4, 4, 4, 4, 6, 5]).age, 11);
  assert.ok(R.beats(t([4, 4, 4, 4, 6, 6]), t([4, 4, 4, 4, 6, 5])));
  assert.ok(R.beats(t([4, 4, 4, 4, 1, 3]), t([4, 4, 4, 4, 6, 6])));
  assert.ok(R.beats(t([4, 4, 4, 4, 2, 2]), t([4, 4, 4, 4, 1, 3])));
  assert.ok(!R.beats(t([4, 4, 4, 4, 6, 5]), t([4, 4, 4, 4, 6, 5])), 'bằng tuổi không giật');
});

test('hệ hường và hệ đen không giật qua lại; ngũ hường giật tất', () => {
  const t = (d) => c(d).trang;
  const huong = t([4, 4, 4, 4, 1, 1]);
  const den6 = t([3, 3, 3, 3, 3, 6]);
  const den2 = t([5, 5, 5, 5, 5, 2]);
  assert.ok(!R.beats(den6, huong));
  assert.ok(!R.beats(huong, den2));
  assert.ok(R.beats(den6, den2));
  assert.ok(!R.beats(den2, den6));
  const ngu3 = t([4, 4, 4, 4, 4, 3]);
  const ngu6 = t([4, 4, 4, 4, 4, 6]);
  assert.ok(R.beats(ngu3, den6) && R.beats(ngu3, t([4, 4, 4, 4, 2, 2])));
  assert.ok(R.beats(ngu6, ngu3) && !R.beats(ngu3, ngu6));
  assert.ok(!R.beats(t([4, 4, 4, 4, 2, 2]), ngu3) && !R.beats(den6, ngu3));
});

test('cần 6–12 cửa', () => {
  assert.throws(() => R.newGame(players(5)));
  assert.throws(() => R.newGame(players(13)));
  assert.doesNotThrow(() => R.newGame(players(12)));
});

test('lấy thẻ, chuyển lượt, tăng vòng', () => {
  let st = R.newGame(six);
  st = R.applyRoll(st, [4, 1, 2, 2, 5, 6]).state;
  assert.equal(st.players[0].sticks.tu, 1);
  assert.equal(st.pool.tu, 31);
  assert.equal(st.current, 1);
  for (let i = 0; i < 5; i++) st = R.applyRoll(st, NOTHING).state;
  assert.equal(st.current, 0);
  assert.equal(st.round, 2);
});

test('giật trạng cùng hệ; không giật được thì gom 32 điểm từ cao xuống thấp', () => {
  let st = R.newGame(six);
  st = R.applyRoll(st, [4, 4, 4, 4, 1, 2]).state; // A: tuổi 3
  assert.equal(st.trang.holder, 0);
  let r = R.applyRoll(st, [4, 4, 4, 4, 1, 1]); // B: tuổi 2 → gom
  st = r.state;
  assert.equal(st.trang.holder, 0);
  assert.equal(st.players[1].sticks.bang, 1);
  assert.equal(st.players[1].sticks.tham, 1);
  assert.equal(R.rawScore(st.players[1]), 32);
  r = R.applyRoll(st, [3, 3, 3, 3, 3, 6]); // C: trạng đen → khác hệ, gom
  st = r.state;
  assert.equal(st.trang.holder, 0);
  assert.equal(st.players[2].sticks.hoi, 4);
  r = R.applyRoll(st, [4, 4, 4, 4, 6, 6]); // D: tuổi 12 → giật
  st = r.state;
  assert.equal(st.trang.holder, 3);
  assert.equal(st.players[0].sticks.trang, 0);
  assert.equal(st.players[3].sticks.trang, 1);
  assert.ok(r.result.events.includes('trang_steal'));
});

test('trạng đen giật trạng đen lớn tuổi hơn', () => {
  let st = R.newGame(six);
  st = R.applyRoll(st, [2, 2, 2, 2, 2, 3]).state;
  st = R.applyRoll(st, [6, 6, 6, 6, 6, 5]).state;
  assert.equal(st.trang.holder, 1);
  assert.equal(st.trang.sys, 'den');
});

test('người giữ trạng đổ trạng lớn hơn thì lên tuổi, không gom thêm', () => {
  let st = R.newGame(six);
  st = R.applyRoll(st, [4, 4, 4, 4, 1, 2]).state;
  for (let i = 0; i < 5; i++) st = R.applyRoll(st, NOTHING).state;
  const r = R.applyRoll(st, [4, 4, 4, 4, 6, 6]);
  assert.equal(r.state.trang.age, 12);
  assert.deepEqual(r.result.gained, []);
  assert.ok(r.result.events.includes('trang_up'));
});

test('ngũ hường giật trạng anh và trạng em, kể cả trạng đen', () => {
  let st = R.newGame(six);
  st = R.applyRoll(st, [3, 3, 3, 3, 3, 6]).state; // A: trạng đen
  st = R.applyRoll(st, [1, 2, 3, 4, 5, 6]).state; // B: bảng nhãn
  st = R.applyRoll(st, [1, 2, 3, 4, 5, 6]).state; // C: thám hoa
  st = R.applyRoll(st, [4, 4, 4, 4, 4, 2]).state; // D: ngũ hường tuổi 2
  const d = st.players[3].sticks;
  assert.deepEqual([d.trang, d.bang, d.tham], [1, 1, 1]);
  assert.equal(st.trang.tier, 2);
  const r = R.applyRoll(st, [4, 4, 4, 4, 4, 1]); // E: ngũ hường tuổi 1 → không giật, gom
  assert.equal(r.state.trang.holder, 3);
  assert.equal(r.state.players[3].sticks.bang, 1);
  st = R.applyRoll(r.state, [4, 4, 4, 4, 4, 5]).state; // F: tuổi 5 → giật cả ba
  const f = st.players[5].sticks;
  assert.deepEqual([f.trang, f.bang, f.tham], [1, 1, 1]);
});

test('quy đổi khi hết thẻ', () => {
  let st = R.newGame(six, { quyDoi: true });
  st.pool.bang = 0;
  st.pool.tham = 0;
  st = R.applyRoll(st, [1, 2, 3, 4, 5, 6]).state;
  assert.equal(R.rawScore(st.players[0]), 16);
});

test('bảng bán trạng theo số cửa', () => {
  const exp = { 6: 192, 7: 224, 8: 256, 9: 288, 10: 320, 11: 352, 12: 384 };
  for (const [n, total] of Object.entries(exp)) assert.equal(R.banTrang(+n).total, total, `${n} cửa`);
  assert.equal(R.banTrang(9).mult.trang, 3);
  assert.equal(R.banTrang(10).mult.bang, 3);
  assert.equal(R.banTrang(12).mult.hoi, 3);
});

test('thanh toán: hết thẻ thì tổng dư bằng tổng thiếu', () => {
  for (const n of [6, 7, 8, 9, 10, 11, 12]) {
    for (let g = 0; g < 30; g++) {
      let st = R.newGame(players(n));
      while (!st.over) st = R.applyRoll(st, R.rollDice()).state;
      const s = R.settle(st, 1000);
      const sum = s.rows.reduce((t, r) => t + r.diff, 0);
      if (!st.lucPhu) assert.equal(sum, 0, `${n} cửa`);
      const paid = s.transfers.reduce((t, x) => t + x.points, 0);
      assert.equal(paid, s.rows.filter((r) => r.diff > 0).reduce((t, r) => t + r.diff, 0));
    }
  }
});

test('lục phú hường: mỗi cửa chung 64 điểm, hết ván', () => {
  let st = R.newGame(players(7));
  st = R.applyRoll(st, [4, 4, 4, 4, 6, 6]).state;
  st = R.applyRoll(st, [4, 4, 4, 4, 4, 4]).state;
  assert.equal(st.over, true);
  const s = R.settle(st, 1000);
  assert.equal(s.rows[1].diff, 64 * 6);
  assert.equal(s.rows[0].diff, -64);
  assert.equal(s.rows[1].money, 384000);
});

test('lục phú đen: mỗi cửa chung 32 điểm', () => {
  let st = R.newGame(six);
  st = R.applyRoll(st, [5, 5, 5, 5, 5, 5]).state;
  assert.equal(st.over, true);
  assert.equal(R.settle(st, 0).rows[0].diff, 32 * 5);
});

test('giới hạn số vòng', () => {
  let st = R.newGame(six, { maxRounds: 2 });
  for (let i = 0; i < 12; i++) st = R.applyRoll(st, NOTHING).state;
  assert.equal(st.over, true);
});

test('mô phỏng nhiều ván: thẻ luôn được bảo toàn', () => {
  for (let g = 0; g < 200; g++) {
    let st = R.newGame(players(6 + (g % 7)), { quyDoi: g % 2 === 0 });
    while (!st.over) {
      st = R.applyRoll(st, R.rollDice()).state;
      for (const s of R.STICKS) {
        const held = st.players.reduce((n, p) => n + p.sticks[s.id], 0);
        assert.equal(held + st.pool[s.id], s.count);
      }
      if (st.trang) assert.equal(st.players[st.trang.holder].sticks.trang, 1);
    }
  }
});

test('tuỳ chọn: tứ tự cáp chính thêm hội nguyên (mặc định tắt); quy đổi mặc định bật', () => {
  const d = [6, 6, 6, 6, 3, 3];
  assert.deepEqual(R.classify(d).awards, ['bt']);
  assert.deepEqual(R.classify(d, { capChinhHoi: true }).awards, ['bt', 'hoi']);
  assert.deepEqual(R.classify([5, 5, 5, 5, 2, 3], { capChinhHoi: true }).awards, ['bt']);
  const st = R.newGame(six);
  assert.equal(st.options.quyDoi, true);
  assert.equal(st.options.capChinhHoi, false);
  const on = R.applyRoll(R.newGame(six, { capChinhHoi: true }), d).state;
  assert.equal(on.players[0].sticks.hoi, 1);
});
