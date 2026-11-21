/* Xăm Hường — giao diện & điều khiển ván chơi. */
(function () {
  'use strict';
  const R = window.XHRules;
  const A = window.XHArt;
  const S = window.XHAudio;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const AVATARS = A.AVATAR_IDS;
  const ava = (id) => A.avatar(id);
  const COLORS = ['#e8b64a', '#4fb0a5', '#d9665b', '#8fb35a', '#b58ad6', '#5b9be0', '#e58fb5', '#d6884a', '#7fc8e0', '#c9b458', '#e07f6a', '#9a9ae6'];
  const DEFAULT_NAMES = ['Ông Nội', 'Bà Nội', 'Ba', 'Mẹ', 'Anh Hai', 'Chị Ba', 'Út', 'Cô Tư', 'Chú Năm', 'Dì Sáu', 'Cậu Bảy', 'Thím Tám'];
  const MIN = R.MIN_PLAYERS;
  const MAX = R.MAX_PLAYERS;
  const money = (v) => (v < 0 ? '−' : '') + Math.abs(v).toLocaleString('vi-VN') + 'đ';
  const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v);
  const STORE = 'xamhuong.v1';

  /* ---------- Lưu trữ cục bộ ---------- */
  const store = {
    load() {
      try {
        return JSON.parse(localStorage.getItem(STORE)) || {};
      } catch (e) {
        return {};
      }
    },
    save(data) {
      try {
        localStorage.setItem(STORE, JSON.stringify(data));
      } catch (e) {
        /* bỏ qua */
      }
    },
  };

  const saved = store.load();
  const cfg = Object.assign(
    {
      players: DEFAULT_NAMES.slice(0, MIN).map((name, i) => ({ name, avatar: AVATARS[i % AVATARS.length] })),
      maxRounds: 0,
      quyDoi: true,
      capChinhHoi: false,
      price: 1000,
      sound: true,
    },
    saved.cfg || {}
  );
  // Cài đặt cũ (trước khi quy đổi bật sẵn): chuyển sang mặc định mới một lần.
  if (!cfg.v) {
    cfg.quyDoi = true;
    cfg.v = 2;
  }
  // Ván lưu từ phiên bản luật cũ thì bỏ.
  const okState = (s) => s && s.v === 2;
  let state = okState(saved.state) ? saved.state : null;
  let history = state ? (saved.history || []).filter(okState) : [];
  let rolling = false;
  let auto = false; // đang đổ tự động
  let lastResult = null;

  S.setEnabled(cfg.sound);
  delete cfg.denTrang;
  while (cfg.players.length < MIN) {
    const names = cfg.players.map((p) => p.name);
    cfg.players.push({ name: DEFAULT_NAMES.find((n) => !names.includes(n)) || 'Cửa ' + (cfg.players.length + 1), avatar: '' });
  }
  cfg.players.forEach((p, i) => {
    if (!AVATARS.includes(p.avatar)) p.avatar = AVATARS.find((a) => !cfg.players.some((q) => q.avatar === a)) || AVATARS[i % AVATARS.length];
  });
  const persist = () => store.save({ cfg, state, history: history.slice(-40) });

  /* ---------- Trang trí ---------- */
  $('#defs').innerHTML = A.DIE_DEFS;
  $('#ngomon').innerHTML = A.ngoMon();
  $$('[data-icon]').forEach((el) => (el.innerHTML = A.icon(el.dataset.icon)));
  $$('[data-lantern]').forEach((el) => (el.innerHTML = A.lantern()));
  $('#maiBranch').innerHTML = A.maiBranch();
  $('#bowlArt').innerHTML = A.bowl();
  document.documentElement.style.setProperty('--hoivan', A.HOIVAN);

  function spawnPetals(n, burst) {
    const box = $('#petals');
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'petal' + (burst ? ' burst' : '');
      const size = 14 + Math.random() * 18;
      p.innerHTML = A.maiFlower(size);
      p.style.left = Math.random() * 100 + 'vw';
      p.style.animationDuration = (burst ? 4 : 14) + Math.random() * (burst ? 3 : 12) + 's';
      p.style.animationDelay = (burst ? Math.random() * 1.5 : Math.random() * -20) + 's';
      p.style.setProperty('--drift', (Math.random() * 30 - 15).toFixed(1) + 'vw');
      box.appendChild(p);
      if (burst) setTimeout(() => p.remove(), 9000);
    }
  }
  spawnPetals(9, false);

  /* ---------- Hộp thoại ---------- */
  function openModal(id) {
    $('#' + id).classList.add('open');
  }
  function closeModal(id) {
    $('#' + id).classList.remove('open');
  }
  $$('[data-open]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.open)));
  $$('.modal').forEach((m) => {
    m.addEventListener('click', (e) => {
      if (e.target === m || e.target.closest('[data-close]')) closeModal(m.id);
    });
  });

  /* ---------- Màn hình bắt đầu ---------- */
  function renderPlayerList() {
    const ul = $('#playerList');
    ul.innerHTML = cfg.players
      .map(
        (p, i) => `<li style="--pc:${COLORS[i % COLORS.length]}">
          <button type="button" class="avatar-btn" data-i="${i}" title="Đổi biểu tượng">${ava(p.avatar)}</button>
          <input type="text" maxlength="16" value="${esc(p.name)}" data-i="${i}" aria-label="Tên cửa ${i + 1}">
          <button type="button" class="remove" data-i="${i}" title="Bớt cửa" ${cfg.players.length <= MIN ? 'disabled' : ''}>×</button>
        </li>`
      )
      .join('');
    $('#addPlayer').disabled = cfg.players.length >= MAX;
    const bt = R.banTrang(cfg.players.length);
    $('#banTrangInfo').innerHTML = bt.steps.length
      ? `<b>${cfg.players.length} cửa</b> — ${bt.steps[bt.steps.length - 1].name} (Trạng ×${bt.mult.trang}${bt.mult.bang > 1 ? `, Bảng/Thám ×${bt.mult.bang}` : ''}${bt.mult.hoi > 1 ? `, Hội nguyên ×${bt.mult.hoi}` : ''}). Tổng ${bt.total} điểm, mỗi cửa phải đủ 32.`
      : `<b>${cfg.players.length} cửa</b> — không bán trạng. Mỗi cửa phải đủ 32 điểm, dư thì bán, thiếu thì mua.`;
  }
  $('#playerList').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const i = +b.dataset.i;
    if (b.classList.contains('avatar-btn')) {
      const used = cfg.players.map((p) => p.avatar);
      let k = AVATARS.indexOf(cfg.players[i].avatar);
      do k = (k + 1) % AVATARS.length;
      while (used.includes(AVATARS[k]) && AVATARS[k] !== cfg.players[i].avatar);
      cfg.players[i].avatar = AVATARS[k];
    } else if (b.classList.contains('remove') && cfg.players.length > MIN) cfg.players.splice(i, 1);
    renderPlayerList();
    persist();
  });
  $('#playerList').addEventListener('input', (e) => {
    if (e.target.dataset.i == null) return;
    cfg.players[+e.target.dataset.i].name = e.target.value;
    persist();
  });
  $('#addPlayer').addEventListener('click', () => {
    if (cfg.players.length >= MAX) return;
    const used = cfg.players.map((p) => p.avatar);
    const names = cfg.players.map((p) => p.name);
    cfg.players.push({
      name: DEFAULT_NAMES.find((n) => !names.includes(n)) || 'Cửa ' + (cfg.players.length + 1),
      avatar: AVATARS.find((a) => !used.includes(a)) || AVATARS[cfg.players.length % AVATARS.length],
    });
    renderPlayerList();
    persist();
    const inputs = $$('#playerList input');
    inputs[inputs.length - 1].select();
  });

  function renderOptions() {
    $$('#endMode button').forEach((b) => b.classList.toggle('on', +b.dataset.v === cfg.maxRounds));
    $('#optPrice').value = cfg.price;
    $('#optQuyDoi').checked = cfg.quyDoi;
    $('#optCapChinh').checked = cfg.capChinhHoi;
    $('#optSound').checked = cfg.sound;
    $('#resumeBtn').hidden = !(state && !state.over);
  }
  $('#endMode').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    cfg.maxRounds = +b.dataset.v;
    renderOptions();
    persist();
  });
  $('#optPrice').addEventListener('input', (e) => {
    cfg.price = Math.max(0, Math.round(+e.target.value || 0));
    persist();
  });
  $('#optQuyDoi').addEventListener('change', (e) => ((cfg.quyDoi = e.target.checked), persist()));
  $('#optCapChinh').addEventListener('change', (e) => ((cfg.capChinhHoi = e.target.checked), persist()));
  $('#optSound').addEventListener('change', (e) => {
    cfg.sound = e.target.checked;
    S.setEnabled(cfg.sound);
    if (cfg.sound) S.chime(1);
    persist();
  });

  function showScreen(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    if (id === 'game') requestWakeLock();
  }

  function startGame() {
    stopAuto();
    cfg.players.forEach((p, i) => {
      p.name = (p.name || '').trim() || 'Cửa ' + (i + 1);
    });
    state = R.newGame(cfg.players, { maxRounds: cfg.maxRounds, quyDoi: cfg.quyDoi, capChinhHoi: cfg.capChinhHoi });
    history = [];
    lastResult = null;
    persist();
    S.unlock();
    showScreen('game');
    renderGame();
    resetDice();
  }
  $('#startBtn').addEventListener('click', startGame);
  $('#resumeBtn').addEventListener('click', () => {
    S.unlock();
    showScreen('game');
    renderGame();
    resetDice();
  });

  /* ---------- Bàn chơi ---------- */
  const playerColor = (i) => COLORS[i % COLORS.length];

  function stickHeight() {
    const h = window.innerHeight;
    const portrait = window.innerWidth < window.innerHeight * 1.05;
    return Math.max(52, Math.min(130, portrait ? h * 0.075 : h * 0.098));
  }

  function renderPool() {
    const box = $('#pool');
    const h = stickHeight();
    const rows = [
      { label: 'Tam khôi', ids: ['trang', 'bang', 'tham'] },
      { label: 'Hội nguyên', ids: ['hoi'] },
      { label: 'Tiến sĩ', ids: ['tien'] },
      { label: 'Cử nhân', ids: ['cu'] },
      { label: 'Tú tài', ids: ['tu'] },
    ];
    box.innerHTML = rows
      .map((row) => {
        if (row.ids.length > 1) {
          const cells = row.ids
            .map((id) => {
              const s = R.BY_ID[id];
              const inPool = state.pool[id] > 0;
              const holder = inPool ? -1 : state.players.findIndex((p) => p.sticks[id] > 0);
              const tag = holder >= 0 ? `<span class="holder" style="--pc:${playerColor(holder)}">${ava(state.players[holder].avatar)}</span>` : '';
              return `<div class="khoi ${inPool ? '' : 'gone'}" data-src="${id}" title="${s.name} — ${s.pts} điểm">
                ${A.stick(id, { height: h * 1.05 })}${tag}<span class="lbl">${s.short} <b>${s.pts}</b></span></div>`;
            })
            .join('');
          return `<div class="cmp tamkhoi"><div class="cmp-head"><span>${row.label}</span></div><div class="khoi-row">${cells}</div></div>`;
        }
        const id = row.ids[0];
        const s = R.BY_ID[id];
        const n = state.pool[id];
        return `<div class="cmp" data-src="${id}">
          <div class="cmp-head"><span>${s.name}</span><b>${s.pts} đ</b><em>${n}/${s.count}</em></div>
          <div class="fan" data-id="${id}" data-n="${n}">${n ? '' : '<span class="empty">Đã hết</span>'}</div>
        </div>`;
      })
      .join('');
    // Xòe thẻ: chồng lên nhau cho vừa ngăn.
    $$('.fan', box).forEach((fan) => {
      const id = fan.dataset.id;
      const n = +fan.dataset.n;
      if (!n) return;
      const svg = A.stick(id, { height: h });
      const tmp = document.createElement('div');
      tmp.innerHTML = svg;
      const w = parseFloat(tmp.firstElementChild.getAttribute('width'));
      const W = fan.clientWidth || 200;
      const step = n > 1 ? Math.min(w * 1.08, (W - w - 4) / (n - 1)) : 0;
      let html = '';
      for (let i = 0; i < n; i++)
        html += `<div class="fan-item" style="left:${(i * step).toFixed(1)}px;transform:rotate(${((i * 37) % 7) - 3}deg)">${i === n - 1 ? svg : A.stick(id, { height: h, showPts: true })}</div>`;
      fan.innerHTML = html;
      fan.style.height = h + 6 + 'px';
    });
    const left = R.poolTotal(state);
    $('#poolLeft').textContent = `còn ${left}/63 thẻ`;
  }

  function renderPlayers() {
    const ol = $('#players');
    const n = state.players.length;
    ol.className = n > 6 ? 'many' : '';
    const best = Math.max(...state.players.map((p) => R.score(p, n)));
    ol.innerHTML = state.players
      .map((p, i) => {
        const sc = R.score(p, n);
        const diff = sc - R.QUOTA;
        const isTrang = state.trang && state.trang.holder === i;
        const chips = R.STICKS.filter((s) => p.sticks[s.id] > 0)
          .map((s) => `<span class="chip chip-${s.id}" title="${s.name}">${s.short}${p.sticks[s.id] > 1 ? ' ×' + p.sticks[s.id] : ''}</span>`)
          .join('');
        return `<li class="pcard ${i === state.current && !state.over ? 'current' : ''} ${isTrang ? 'trang' : ''}" data-p="${i}" style="--pc:${playerColor(i)}">
          <div class="pava">${ava(p.avatar)}</div>
          <div class="pinfo">
            <div class="pname">${esc(p.name)}${isTrang ? `<span class="crown" title="Đang giữ ${esc(R.trangTitle(state.trang))}">狀</span>` : ''}</div>
            <div class="chips">${chips || '<span class="muted">Chưa có thẻ</span>'}</div>
          </div>
          <div class="pscore"><b>${sc}</b><small>điểm</small><i class="diff ${diff >= 0 ? 'pos' : 'neg'}" title="So với 32 điểm phải có">${diff > 0 ? 'dư ' + diff : diff === 0 ? 'đủ 32' : 'thiếu ' + -diff}</i>${sc > 0 && sc === best ? '<i class="lead">dẫn đầu</i>' : ''}</div>
        </li>`;
      })
      .join('');
    const t = state.trang;
    const bt = R.banTrang(n);
    const ban = bt.steps.length ? `<div class="tb-ban">${n} cửa, ${bt.steps[bt.steps.length - 1].name.toLowerCase()}: Trạng tính ${32 * bt.mult.trang} điểm${bt.mult.bang > 1 ? `, Bảng/Thám ${16 * bt.mult.bang}` : ''}${bt.mult.hoi > 1 ? `, Hội nguyên ${8 * bt.mult.hoi}` : ''}</div>` : '';
    let how = '';
    if (t) {
      if (t.tier === 2) how = `Chỉ ngũ hường lớn tuổi hơn (trên ${t.age}) mới giật được.`;
      else if (t.sys === 'huong')
        how = t.age >= 14 ? 'Trạng hường lớn nhất — chỉ ngũ hường mới giật được.' : t.age === 13 ? 'Phải đổ cáp chính hoặc ngũ hường mới giật được.' : `Giật được bằng tứ hường tuổi trên ${t.age}, trạng cáp, hoặc ngũ hường. Trạng đen không giật được.`;
      else how = `Giật được bằng ngũ tử tuổi trên ${t.age}, hoặc ngũ hường. Trạng hường không giật được.`;
    }
    $('#trangBox').innerHTML = t
      ? `<div class="tb-stick">${A.stick('trang', { height: 64 })}</div><div><div class="tb-title">${R.trangTitle(t)}</div>
         <div class="tb-who" style="--pc:${playerColor(t.holder)}">${ava(state.players[t.holder].avatar)}<b>${esc(state.players[t.holder].name)}</b></div>
         <div class="tb-how">${how}</div>${ban}</div>`
      : `<div class="tb-stick dim">${A.stick('trang', { height: 64 })}</div><div><div class="tb-title">Ngôi Trạng còn bỏ trống</div>
         <div class="tb-how">Trạng hường: bốn mặt tứ. Trạng đen: năm mặt giống nhau (khác tứ). Ngũ hường giật cả trạng anh lẫn trạng em.</div>${ban}</div>`;
  }

  function renderTurn() {
    const p = state.players[state.current];
    const tb = $('#turnBanner');
    if (state.over) {
      tb.innerHTML = `<span class="turn-label">Ván đã kết thúc</span>`;
    } else {
      tb.style.setProperty('--pc', playerColor(state.current));
      tb.innerHTML = `<span class="turn-label">Đến lượt</span><span class="turn-ava">${ava(p.avatar)}</span><span class="turn-name">${esc(p.name)}</span>`;
    }
    $('#rollBtn').disabled = state.over;
    $('#manualBtn').disabled = state.over;
    $('#undoBtn').disabled = history.length === 0;
    const mr = state.options.maxRounds;
    $('#roundInfo').innerHTML = `Vòng <b>${Math.min(state.round, mr || state.round)}</b>${mr ? ' / ' + mr : ''}`;
    $('#soundBtn span').innerHTML = A.icon(cfg.sound ? 'bell' : 'bellOff');
  }

  function renderLog() {
    const items = state.log.slice(-14).reverse();
    $('#log').innerHTML = items.length
      ? items
          .map((e) => {
            const p = state.players[e.player];
            const g = summarizeGain(e.gained);
            return `<div class="log-item ${e.gained.length ? '' : 'none'}" style="--pc:${playerColor(e.player)}">
              <span>${ava(p.avatar)}</span><b>${esc(p.name)}</b><span class="mini-dice">${e.dice.map((v) => `<i class="d${v}">${v}</i>`).join('')}</span>
              <span class="cname">${e.name}</span>${g ? `<span class="gain">+${g}</span>` : ''}</div>`;
          })
          .join('')
      : '<div class="log-empty">Mỗi người lần lượt đổ hột vào tô. Kết quả các lượt sẽ hiện ở đây.</div>';
  }

  function summarizeGain(gained) {
    const by = {};
    gained.forEach((g) => (by[g.id] = (by[g.id] || 0) + 1));
    return R.STICKS.filter((s) => by[s.id])
      .map((s) => s.short + (by[s.id] > 1 ? ' ×' + by[s.id] : ''))
      .join(', ');
  }

  function renderResult() {
    const el = $('#result');
    if (!lastResult) {
      el.innerHTML = '';
      el.className = 'result';
      return;
    }
    const { combo, gained, notes, player } = lastResult;
    const p = state.players[player];
    const pts = gained.reduce((n, g) => n + R.BY_ID[g.id].pts, 0);
    const sticks = gained.slice(0, 10).map((g) => `<span class="rs">${A.stick(g.id, { height: 64 })}</span>`).join('') + (gained.length > 10 ? `<span class="more">+${gained.length - 10}</span>` : '');
    el.className = 'result show ' + (gained.length ? 'win' : 'none') + (combo.big ? ' big' : '');
    el.innerHTML = `<div class="r-who" style="--pc:${playerColor(player)}">${ava(p.avatar)} ${esc(p.name)} đổ được</div>
      <div class="r-name">${combo.name}</div>
      <div class="r-detail">${combo.detail}</div>
      ${gained.length ? `<div class="r-sticks">${sticks}<span class="r-pts">+${pts} điểm</span></div>` : ''}
      ${notes.length ? `<div class="r-notes">${notes.map(esc).join(' ')}</div>` : ''}`;
  }

  function renderGame() {
    renderAuto();
    renderPool();
    renderPlayers();
    renderTurn();
    renderLog();
    renderResult();
  }

  /* ---------- Hột & tô ---------- */
  const diceEls = [];
  function ensureDice() {
    if (diceEls.length) return;
    const box = $('#dice');
    for (let i = 0; i < 6; i++) {
      const d = document.createElement('div');
      d.className = 'die';
      box.appendChild(d);
      diceEls.push(d);
    }
  }
  function layout() {
    // vị trí ngẫu nhiên không chồng lên nhau trong lòng tô
    const pts = [];
    let guard = 0;
    while (pts.length < 6 && guard++ < 2000) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.25;
      const x = 0.5 + r * Math.cos(a);
      const y = 0.5 + r * Math.sin(a);
      if (pts.every((p) => Math.hypot(p.x - x, p.y - y) > 0.165)) pts.push({ x, y });
    }
    while (pts.length < 6) pts.push({ x: 0.3 + 0.08 * pts.length, y: 0.5 });
    return pts;
  }
  function placeDice(values, pts, spin) {
    ensureDice();
    diceEls.forEach((d, i) => {
      d.innerHTML = A.die(values[i]);
      d.style.left = pts[i].x * 100 + '%';
      d.style.top = pts[i].y * 100 + '%';
      d.style.setProperty('--rot', (spin ? Math.random() * 720 - 360 : Math.random() * 50 - 25).toFixed(0) + 'deg');
      d.classList.toggle('red', values[i] === 4);
    });
  }
  function resetDice() {
    const last = state && state.log.length ? state.log[state.log.length - 1].dice : [4, 1, 3, 4, 6, 2];
    placeDice(last, layout(), false);
    $('#tapHint').hidden = !!(state && state.log.length);
  }

  function roll(manualDice, fromAuto) {
    if (rolling || !state || state.over || (auto && !fromAuto)) return;
    rolling = true;
    $('#tapHint').hidden = true;
    const final = manualDice || R.rollDice();
    const bowl = $('#bowl');
    const dur = auto ? 380 : manualDice ? 500 : 1150;
    bowl.classList.add('shaking');
    $('#result').classList.add('dim');
    S.rattle(dur / 1000);
    const t0 = performance.now();
    $('#dice').classList.add('tumbling');
    const tick = () => {
      const el = performance.now() - t0;
      if (el < dur - 120) {
        placeDice(R.rollDice(), layout(), true);
        setTimeout(tick, 85 + el / 12);
      } else {
        $('#dice').classList.remove('tumbling');
        placeDice(final, layout(), false);
        bowl.classList.remove('shaking');
        setTimeout(() => afterRoll(final), auto ? 120 : 380);
      }
    };
    tick();
  }

  function afterRoll(dice) {
    const before = state;
    const { state: next, result } = R.applyRoll(state, dice);
    history.push(before);
    state = next;
    lastResult = result;
    persist();

    flySticks(result, before);
    renderGame();
    const pc = $(`.pcard[data-p="${result.player}"]`);
    if (pc) {
      pc.classList.remove('bump');
      void pc.offsetWidth;
      pc.classList.add('bump');
    }

    const ev = result.events;
    if (ev.length && auto) {
      S.drum(ev.includes('lucphu') ? 5 : 3);
      toast(result);
    } else if (ev.length) {
      S.drum(ev.includes('lucphu') ? 5 : 3);
      setTimeout(() => showEvent(result), 650);
    } else if (result.gained.length) {
      const top = Math.max(...result.gained.map((g) => R.BY_ID[g.id].pts));
      S.chime(top >= 8 ? 4 : top >= 4 ? 3 : top >= 2 ? 2 : 1);
    } else S.thud();

    setTimeout(() => {
      rolling = false;
      if (auto) {
        if (state.over) stopAuto(), setTimeout(showEnd, 1200);
        else setTimeout(() => auto && roll(null, true), ev.length ? 1100 : 220);
        renderAuto();
      } else if (state.over && !ev.length) setTimeout(showEnd, 900);
    }, auto ? 200 : 450);
  }

  /* ---------- Đổ tự động ---------- */
  function renderAuto() {
    $('#autoRow').hidden = !auto;
    $('.roll-row').hidden = auto;
    if (auto) $('#autoLeft').textContent = `còn ${R.poolTotal(state)} thẻ trong hộp`;
  }
  function startAuto() {
    if (!state || state.over || auto) return;
    auto = true;
    renderAuto();
    if (!rolling) roll(null, true);
  }
  function stopAuto() {
    auto = false;
    renderAuto();
  }
  function finishNow() {
    stopAuto();
    const go = () => {
      if (rolling) return setTimeout(go, 100);
      while (!state.over) {
        history.push(state);
        const r = R.applyRoll(state, R.rollDice());
        state = r.state;
        lastResult = r.result;
      }
      persist();
      renderGame();
      resetDice();
      showEnd();
    };
    go();
  }
  // Báo nhanh sự kiện lớn khi đang đổ tự động, không chặn màn hình.
  function toast(result) {
    const p = state.players[result.player];
    const ev = result.events;
    const what = ev.includes('lucphu') ? 'Lục phú!' : ev.includes('tamkhoi') ? 'Giật cả trạng anh lẫn trạng em' : ev.includes('trang_steal') ? 'Giật Trạng' : ev.includes('trang_new') ? 'Đỗ Trạng nguyên' : 'Trạng lên tuổi';
    const t = document.createElement('div');
    t.className = 'toast';
    t.style.setProperty('--pc', playerColor(result.player));
    t.innerHTML = `${A.stick('trang', { height: 56 })}<div><b>${esc(p.name)}</b> · ${what}<small>${esc(result.combo.name)}${state.trang && !ev.includes('lucphu') ? ' — ' + R.trangTitle(state.trang) : ''}</small></div>`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2800);
  }
  $('#autoStop').addEventListener('click', stopAuto);
  $('#autoSkip').addEventListener('click', finishNow);

  // Thẻ bay từ hộp (hoặc từ người bị cướp) sang người được.
  function flySticks(result, before) {
    const target = $(`.pcard[data-p="${result.player}"] .pava`);
    if (!target) return;
    const tr = target.getBoundingClientRect();
    result.gained.slice(0, 14).forEach((g, k) => {
      let src = g.from == null ? $(`[data-src="${g.id}"]`) : $(`.pcard[data-p="${g.from}"] .pava`);
      if (!src) return;
      const fan = src.querySelector && src.querySelector('.fan-item:last-child');
      const sr = (fan || src).getBoundingClientRect();
      const f = document.createElement('div');
      f.className = 'flyer';
      f.innerHTML = A.stick(g.id, { height: 90 });
      f.style.left = sr.left + sr.width / 2 + 'px';
      f.style.top = sr.top + sr.height / 2 + 'px';
      document.body.appendChild(f);
      setTimeout(() => {
        f.style.transform = `translate(${tr.left + tr.width / 2 - (sr.left + sr.width / 2)}px, ${tr.top + tr.height / 2 - (sr.top + sr.height / 2)}px) translate(-50%,-50%) scale(.35) rotate(${k % 2 ? 25 : -25}deg)`;
        f.style.opacity = '0.2';
      }, 30 + k * 70);
      setTimeout(() => f.remove(), 1100 + k * 70);
    });
  }

  /* ---------- Sự kiện lớn ---------- */
  function showEvent(result) {
    const p = state.players[result.player];
    const ev = result.events;
    let title = result.combo.name;
    let sub = '';
    let ids = ['trang'];
    if (ev.includes('lucphu')) (sub = `Mỗi cửa chung ${state.lucPhu.each} điểm — hết ván!`), (ids = ['bang', 'trang', 'tham']);
    else if (ev.includes('tamkhoi')) (sub = 'Giật cả trạng anh lẫn trạng em!'), (ids = ['bang', 'trang', 'tham']);
    else if (ev.includes('trang_steal')) sub = 'Giật Trạng!';
    else if (ev.includes('trang_new')) sub = 'Đỗ Trạng nguyên!';
    else if (ev.includes('trang_up')) sub = 'Tự giật trạng — chỉ lên tuổi';
    if (!ev.includes('lucphu') && state.trang) sub += `<small>${R.trangTitle(state.trang)}</small>`;
    const notes = result.notes.filter((n) => !/^(Đoạt Trạng|Giật Trạng|Mỗi cửa chung)/.test(n));
    $('#eventCard').innerHTML = `
      <div class="ev-sticks">${ids.map((id) => A.stick(id, { height: Math.min(300, window.innerHeight * 0.36) })).join('')}</div>
      <div class="ev-title">${title}</div>
      <div class="ev-sub">${sub}</div>
      <div class="ev-who" style="--pc:${playerColor(result.player)}"><span>${ava(p.avatar)}</span>${esc(p.name)}</div>
      ${notes.length ? `<div class="ev-notes">${notes.map(esc).join('<br>')}</div>` : ''}
      <button class="btn primary big" type="button" id="evOk">${state.over ? 'Xem kết quả' : 'Tiếp tục'}</button>`;
    openModal('event');
    spawnPetals(24, true);
    $('#evOk').focus();
    $('#evOk').addEventListener('click', () => {
      closeModal('event');
      if (state.over) showEnd();
    });
  }

  /* ---------- Kết thúc ---------- */
  function showEnd() {
    const price = cfg.price || 0;
    const s = R.settle(state, price);
    const n = state.players.length;
    const medal = ['Nhất', 'Nhì', 'Ba'];
    let place = 0;
    const rows = s.ranking
      .map((r, k) => {
        if (k > 0 && r.diff < s.ranking[k - 1].diff) place = k;
        const p = state.players[r.i];
        const chips = R.STICKS.filter((x) => p.sticks[x.id] > 0)
          .map((x) => `<span class="chip chip-${x.id}">${x.short}${p.sticks[x.id] > 1 ? ' ×' + p.sticks[x.id] : ''}</span>`)
          .join('');
        const cls = r.diff > 0 ? 'pos' : r.diff < 0 ? 'neg' : '';
        const word = r.diff > 0 ? 'nhận' : r.diff < 0 ? 'trả' : 'hoà';
        return `<li class="pl${place}" style="--pc:${playerColor(r.i)}">
          <span class="medal">${medal[place] || place + 1}</span><span class="pava">${ava(r.avatar)}</span>
          <span class="nm">${esc(r.name)}${r.trang ? ' <span class="crown">狀</span>' : ''}<span class="chips">${chips}</span></span>
          <span class="sc"><b>${s.lucPhu ? '' : r.points}</b>${s.lucPhu ? '' : ' điểm'}<em class="${cls}">${r.diff === 0 ? 'đủ 32' : (r.diff > 0 ? 'dư ' : 'thiếu ') + Math.abs(r.diff)}</em></span>
          <span class="money ${cls}">${price ? `<small>${word}</small>${money(Math.abs(r.money))}` : `<small>${word}</small>${Math.abs(r.diff)} điểm`}</span></li>`;
      })
      .join('');
    const pay = s.transfers.length
      ? `<h3>Ai trả ai</h3><ul class="transfers">${s.transfers
          .map((t) => {
            const a = state.players[t.from], b = state.players[t.to];
            return `<li><span style="--pc:${playerColor(t.from)}">${ava(a.avatar)}${esc(a.name)}</span><span class="arrow">→</span><span style="--pc:${playerColor(t.to)}">${ava(b.avatar)}${esc(b.name)}</span><b>${price ? money(t.money) : t.points + ' điểm'}</b>${price ? `<small>${t.points} điểm</small>` : ''}</li>`;
          })
          .join('')}</ul>`
      : '';
    let head;
    if (s.lucPhu) {
      const w = state.players[s.lucPhu.player];
      head = `<p class="settle-head"><b>${esc(w.name)}</b> đổ được <b>${s.lucPhu.kind === 'huong' ? 'Lục phú hường' : 'Lục phú đen'}</b> — mỗi cửa chung ${s.lucPhu.each} điểm.</p>`;
    } else {
      head = `<p class="settle-head">${n} cửa, mỗi cửa phải đủ <b>32 điểm</b> — dư thì bán, thiếu thì mua${price ? `, giá <b>${money(price)}</b> một điểm` : ''}.${
        s.banTrang.steps.length ? ` Đã <b>${s.banTrang.steps[s.banTrang.steps.length - 1].name.toLowerCase()}</b>: Trạng tính ${32 * s.banTrang.mult.trang} điểm${s.banTrang.mult.bang > 1 ? `, Bảng/Thám ${16 * s.banTrang.mult.bang}` : ''}${s.banTrang.mult.hoi > 1 ? `, Hội nguyên ${8 * s.banTrang.mult.hoi}` : ''}.` : ''
      }</p>`;
    }
    $('#endBody').innerHTML = `${head}<ol class="podium">${rows}</ol>${pay}
      <p class="muted center-text">${state.log.length} lượt đổ · ${s.unclaimed && !s.lucPhu ? `còn ${s.unclaimed} thẻ trong hộp chưa ai lấy, nên tổng dư và tổng thiếu có thể lệch nhau` : 'đã hết thẻ trong hộp'}</p>`;
    openModal('end');
    S.fanfare();
    spawnPetals(26, true);
  }

  $('#endAgain').addEventListener('click', () => {
    closeModal('end');
    startGame();
  });
  $('#endHome').addEventListener('click', () => {
    closeModal('end');
    goHome();
  });
  $('#endView').addEventListener('click', () => closeModal('end'));

  function goHome() {
    stopAuto();
    renderPlayerList();
    renderOptions();
    showScreen('setup');
  }

  /* ---------- Điều khiển ---------- */
  $('#bowl').addEventListener('click', () => roll());
  $('#rollBtn').addEventListener('click', () => roll());
  document.addEventListener('keydown', (e) => {
    if (!$('#game').classList.contains('active') || $('.modal.open')) return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target.closest && e.target.closest('button') && e.target.id !== 'rollBtn' && e.target.id !== 'bowl') return;
      e.preventDefault();
      roll();
    }
  });

  $('#undoBtn').addEventListener('click', () => {
    if (auto) stopAuto();
    if (rolling || !history.length) return;
    const last = state.log[state.log.length - 1];
    const who = last ? state.players[last.player].name : '';
    if (!confirm(`Hoàn tác lượt đổ vừa rồi${who ? ' của ' + who : ''}?`)) return;
    state = history.pop();
    lastResult = null;
    persist();
    renderGame();
    resetDice();
  });
  $('#soundBtn').addEventListener('click', () => {
    cfg.sound = !cfg.sound;
    S.setEnabled(cfg.sound);
    if (cfg.sound) S.chime(1);
    persist();
    renderTurn();
  });
  const fsOk = !!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen);
  $('#fsBtn').hidden = !fsOk;
  $('#fsBtn').addEventListener('click', () => {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else {
      const el = d.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  });
  $('#menuBtn').addEventListener('click', () => {
    $('#endNowBtn').textContent = state.over ? 'Xem kết quả' : auto ? 'Dừng đổ tự động' : 'Đổ tự động đến hết ván';
    $('#skipBtn').hidden = state.over;
    openModal('menu');
  });
  $('#endNowBtn').addEventListener('click', () => {
    closeModal('menu');
    if (state.over) showEnd();
    else if (auto) stopAuto();
    else startAuto();
  });
  $('#skipBtn').addEventListener('click', () => {
    closeModal('menu');
    if (!state.over && confirm('Đổ ngẫu nhiên hết các lượt còn lại rồi tính điểm ngay?')) finishNow();
  });
  $('#restartBtn').addEventListener('click', () => {
    if (!confirm('Bỏ ván đang chơi và bắt đầu lại?')) return;
    closeModal('menu');
    startGame();
  });
  $('#homeBtn').addEventListener('click', () => {
    closeModal('menu');
    goHome();
  });

  /* ---------- Nhập hột thật ---------- */
  let manual = [4, 4, 1, 2, 3, 6];
  function renderManual() {
    $('#manualDice').innerHTML = manual.map((v, i) => `<button type="button" class="mdie" data-i="${i}" aria-label="Hột ${i + 1}: ${v}">${A.die(v)}</button>`).join('');
    const c = R.classify(manual);
    $('#manualPreview').innerHTML = `Kết quả: <b>${c.name}</b> — ${c.detail}`;
  }
  $('#manualBtn').addEventListener('click', () => {
    if (rolling || auto || state.over) return;
    renderManual();
    openModal('manual');
  });
  $('#manualDice').addEventListener('click', (e) => {
    const b = e.target.closest('.mdie');
    if (!b) return;
    const i = +b.dataset.i;
    manual[i] = (manual[i] % 6) + 1;
    renderManual();
  });
  $('#manualOk').addEventListener('click', () => {
    closeModal('manual');
    roll(manual.slice());
  });

  /* ---------- Luật chơi ---------- */
  function renderRules() {
    const sticksRows = R.STICKS.map(
      (s) => `<tr><td class="rs-cell">${A.stick(s.id, { height: 70 })}</td><td><b>${s.name}</b><br><span class="han">${s.han}</span></td><td>${s.count}</td><td>${s.pts}</td></tr>`
    ).join('');
    const dice = (arr) => `<span class="rdice">${arr.map((v) => A.die(v)).join('')}</span>`;
    const combos = [
      ['Nhất hường', [4, 1, 2, 2, 5, 6], 'Một mặt tứ', 'Tú tài (1)'],
      ['Nhị hường', [4, 4, 1, 2, 5, 6], 'Hai mặt tứ', 'Cử nhân (2)'],
      ['Tam hường', [4, 4, 4, 1, 2, 6], 'Ba mặt tứ', 'Hội nguyên (8)'],
      ['Tứ tự', [3, 3, 3, 3, 1, 6], 'Bốn mặt giống nhau (không phải tứ)', 'Tiến sĩ (4)'],
      ['Tứ tự nhất hường', [5, 5, 5, 5, 4, 1], 'Tứ tự kèm một mặt tứ', 'Tiến sĩ + Tú tài'],
      ['Tứ tự nhị hường', [6, 6, 6, 6, 4, 4], 'Tứ tự kèm hai mặt tứ', 'Tiến sĩ + Cử nhân'],
      ['Tứ tự cáp xiên', [5, 5, 5, 5, 2, 3], 'Hai mặt còn lại khác nhau, cộng bằng mặt tứ tự', 'Trạng em (16)'],
      ['Tứ tự cáp chính', [6, 6, 6, 6, 3, 3], 'Hai mặt còn lại là một đôi, cộng bằng mặt tứ tự', 'Trạng em (16); nếu bật tuỳ chọn thì thêm Hội nguyên'],
      ['Phân song', [1, 1, 1, 6, 6, 6], 'Hai bộ ba đối mặt nhau (cộng bằng 7): nhất–lục, nhị–ngũ', 'Trạng em'],
      ['Phân song tam hường', [3, 3, 3, 4, 4, 4], 'Ba mặt tam và ba mặt tứ', 'Trạng em + Hội nguyên'],
      ['Thượng mã', [4, 4, 5, 5, 6, 6], 'Đôi tứ, đôi ngũ, đôi lục', 'Trạng em'],
      ['Hạ mã', [1, 1, 2, 2, 3, 3], 'Đôi nhất, đôi nhị, đôi tam', 'Trạng em'],
      ['Lục thuận', [1, 2, 3, 4, 5, 6], 'Đủ sáu mặt', 'Trạng em'],
      ['Tứ hường', [4, 4, 4, 4, 6, 5], 'Trạng hường: bốn mặt tứ, tuổi = tổng hai mặt còn lại', 'Trạng nguyên (32)'],
      ['Ngũ tử', [3, 3, 3, 3, 3, 6], 'Trạng đen: năm mặt giống nhau khác mặt tứ, tuổi = mặt còn lại', 'Trạng nguyên'],
      ['Ngũ hường', [4, 4, 4, 4, 4, 6], 'Năm mặt tứ, tuổi = mặt còn lại', 'Trạng anh + hai trạng em'],
      ['Lục phú đen', [2, 2, 2, 2, 2, 2], 'Sáu mặt giống nhau (không phải tứ)', 'Mỗi cửa chung 32 điểm, hết ván'],
      ['Lục phú hường', [4, 4, 4, 4, 4, 4], 'Sáu mặt tứ', 'Mỗi cửa chung 64 điểm, hết ván'],
    ]
      .map(([n, d, desc, win]) => `<tr><td><b>${n}</b><br>${dice(d)}</td><td>${desc}</td><td>${win}</td></tr>`)
      .join('');
    const banRows = [7, 8, 9, 10, 11, 12]
      .map((n) => {
        const bt = R.banTrang(n);
        return `<tr><td>${n} cửa</td><td>${bt.steps[bt.steps.length - 1].name}</td><td>Trạng ${32 * bt.mult.trang} · Bảng/Thám ${16 * bt.mult.bang} · Hội nguyên ${8 * bt.mult.hoi}</td><td>${bt.total}</td></tr>`;
      })
      .join('');
    $('#rulesBody').innerHTML = `
      <p>Bộ xăm hường có <b>63 thẻ</b> bằng ngà, tổng <b>192 điểm</b>, và <b>6 hột</b>. Trên hột, mặt <b class="red">nhất</b> và mặt <b class="red">tứ</b> tô đỏ — mặt tứ đỏ gọi là <i>hường</i>.
      Các cửa lần lượt đổ cả 6 hột vào tô sứ; ra tổ hợp nào thì lấy thẻ tương ứng trong hộp. Cần ít nhất <b>6 cửa</b> (một người có thể chơi nhiều cửa).</p>
      <h3>Thẻ xăm</h3>
      <table class="rtable"><thead><tr><th></th><th>Thẻ</th><th>Số thẻ</th><th>Điểm</th></tr></thead><tbody>${sticksRows}</tbody></table>
      <p class="muted">Bảng nhãn và Thám hoa gọi chung là <i>trạng em</i>; Trạng nguyên là <i>trạng anh</i>.</p>
      <h3>Tổ hợp hột</h3>
      <table class="rtable"><thead><tr><th>Tên</th><th>Cách ra</th><th>Được</th></tr></thead><tbody>${combos}</tbody></table>
      <p class="muted">Tứ tự mà hai mặt còn lại vừa thành cáp vừa có mặt tứ (như lục lục lục lục, nhị, tứ) thì tính cáp, được trạng em. Hai bộ ba không đối mặt nhau (như nhất–tam) thì không phải phân song; nếu có ba mặt tứ thì chỉ tính tam hường.</p>
      <h3>Giật trạng</h3>
      <p>Trạng có <b>tuổi</b> và chia hai hệ, <b>không giật qua lại</b> giữa hai hệ:</p>
      <ul class="rank">
        <li><b>Trạng hường</b> (bốn mặt tứ): tuổi là tổng hai mặt còn lại. Trạng <b>cáp</b> (hai mặt cộng bằng 4) lớn hơn mọi tuổi khác, trong đó <b>cáp chính</b> (nhị + nhị) lớn hơn <b>cáp xiên</b> (nhất + tam).</li>
        <li><b>Trạng đen</b> (ngũ tử — năm mặt giống nhau, <i>không phải</i> mặt tứ): tuổi là mặt còn lại.</li>
        <li><b>Ngũ hường</b> (năm mặt tứ) giật cả trạng anh lẫn hai trạng em, dù trạng đang thuộc hệ nào; tuổi là mặt còn lại. Chỉ ngũ hường lớn tuổi hơn mới giật lại được.</li>
      </ul>
      <p>Người đổ sau ra trạng <b>lớn tuổi hơn</b> cùng hệ thì giật trạng của người trước. Nếu <b>không giật được</b> (nhỏ tuổi hơn, bằng tuổi, hoặc khác hệ) thì <b>gom 32 điểm</b> thẻ trên bàn, từ thẻ cao xuống thấp. Người đang giữ trạng mà đổ ra trạng lớn tuổi hơn thì coi như <b>tự giật trạng của mình</b>: không được thêm thẻ nào, chỉ có trạng lên tuổi nên khó bị người khác giật hơn.</p>
      <h3>Lục phú</h3>
      <p><b>Lục phú hường</b> (sáu mặt tứ): mỗi cửa chung <b>64 điểm</b>. <b>Lục phú đen</b> (sáu mặt giống nhau khác): mỗi cửa chung <b>32 điểm</b>. Cả hai đều kết thúc ván ngay.</p>
      <h3>Thanh toán & bán trạng</h3>
      <p>Hết ván (hết thẻ trong hộp, hoặc đủ số vòng đã chọn), mỗi cửa phải đủ <b>32 điểm</b>: dư thì bán, thiếu thì mua, giá mỗi điểm thoả thuận trước khi chơi. Bộ thẻ chỉ đủ cho 6 cửa, nên mỗi cửa thêm thì <b>bán trạng</b> thêm một bậc — mỗi bậc cộng đúng 32 điểm:</p>
      <table class="rtable"><thead><tr><th>Số cửa</th><th>Bậc</th><th>Điểm thẻ</th><th>Tổng</th></tr></thead><tbody>${banRows}</tbody></table>
      <h3>Hết thẻ</h3>
      <p>Ra tổ hợp mà loại thẻ đó đã hết thì lấy các thẻ nhỏ hơn có tổng điểm tương đương (<i>Quy đổi khi hết thẻ</i>, bật sẵn). Tắt tuỳ chọn này thì không được gì. Muốn xong nhanh thì vào mục <b>Ván</b> chọn <i>Đổ tự động đến hết ván</i>: máy đổ ngẫu nhiên lần lượt cho từng cửa đến khi hết thẻ, bấm <b>Dừng</b> lúc nào cũng được.</p>
      <p class="muted">Luật theo lệ chơi xăm hường Huế, đối chiếu với bài của Trần Đức Anh Sơn và Lê Duy Đoàn. Bấm <b>Hoàn tác</b> nếu ai lỡ đổ nhầm lượt.</p>`;
  }
  $$('[data-open="rules"]').forEach((b) => b.addEventListener('click', renderRules));
  renderRules();

  /* ---------- Giữ màn hình sáng (TV / iPad) ---------- */
  let wakeLock = null;
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => (wakeLock = null));
      }
    } catch (e) {
      /* không hỗ trợ */
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && $('#game').classList.contains('active')) requestWakeLock();
  });

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => state && $('#game').classList.contains('active') && renderPool(), 150);
  });

  /* ---------- Khởi động ---------- */
  renderPlayerList();
  renderOptions();
  if (state && !state.over) {
    // có ván đang dở: vào thẳng bàn chơi
    showScreen('game');
    renderGame();
    resetDice();
  }
  window.__xh = { get state() { return state; }, roll };
})();
