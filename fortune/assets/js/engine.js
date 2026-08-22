/* =========================================================
   星詠堂 — 鑑定エンジン
   ・入力から決定論的に「鍵」を導出（同じ人・同じ日には必ず同じ結果）
   ・鍵をもとに文章を組成する
   ========================================================= */
(function (global) {
  'use strict';
  const D = global.HOSHI_DATA;

  /* ---------- 1. 決定論的乱数 ---------- */
  function hash32(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];
  const pickN = (arr, n, r) => {
    const pool = arr.slice(), out = [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out;
  };

  /* ---------- 2. 暦・数理 ---------- */
  function sunSign(m, d) {
    const cut = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22]; // 各月の切替日
    const idx = (d < cut[m - 1]) ? (m + 10) % 12 : (m + 11) % 12;
    return D.SIGNS[idx];
  }
  function reduceNum(n, keepMaster) {
    while (n > 9) {
      if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
      n = String(n).split('').reduce((a, b) => a + (+b), 0);
    }
    return n;
  }
  function lifePath(y, m, d) {
    const sum = reduceNum(y, false) + reduceNum(m, false) + reduceNum(d, false);
    return reduceNum(sum, true);
  }
  function personalYear(m, d, year) {
    return reduceNum(reduceNum(m, false) + reduceNum(d, false) + reduceNum(year, false), false);
  }
  function personalMonth(py, month) { return reduceNum(py + month, false); }

  const SYNODIC = 29.530588853;
  const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14) / 86400000;
  function moonPhase(date) {
    const days = date.getTime() / 86400000 - NEW_MOON_REF;
    let age = days % SYNODIC; if (age < 0) age += SYNODIC;
    const idx = Math.floor((age / SYNODIC) * 8 + 0.5) % 8;
    return { moon: D.MOONS[idx], age: age, illum: (1 - Math.cos(2 * Math.PI * age / SYNODIC)) / 2 };
  }

  function daysBetween(a, b) { return Math.round((b - a) / 86400000); }
  function biorhythm(birth, date) {
    const n = daysBetween(birth, date);
    return {
      days: n,
      p: Math.sin(2 * Math.PI * n / 23),
      e: Math.sin(2 * Math.PI * n / 28),
      i: Math.sin(2 * Math.PI * n / 33)
    };
  }

  /* 西洋4元素 → 五行への対応 */
  const EL_MAP = { '火': '火', '地': '土', '風': '木', '水': '水' };
  const SEASON_EL = ['水','水','木','木','木','火','火','火','金','金','金','水']; // 月→五行(簡易)

  function elementBalance(sign, stem, branch, month, lp, r) {
    const base = { '木': 8, '火': 8, '土': 8, '金': 8, '水': 8 };
    base[EL_MAP[sign.el]] += 22;
    base[stem.el] += 26;
    base[branch.el] += 20;
    base[SEASON_EL[month - 1]] += 12;
    const lpEl = ['土','木','水','火','土','金','木','水','土','火','木','土'][lp % 12] || '土';
    base[lpEl] += 10;
    Object.keys(base).forEach(k => { base[k] += Math.floor(r() * 9); });
    const max = Math.max(...Object.values(base));
    const out = {};
    Object.keys(base).forEach(k => { out[k] = Math.round(base[k] / max * 100); });
    return out;
  }


  /* ---------- 札を引く ---------- */
  function ymdKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function drawCards(seedStr, n) {
    const r = mulberry32(hash32(seedStr));
    const deck = D.TAROT.slice(), out = [];
    for (let i = 0; i < n && deck.length; i++) {
      const c = deck.splice(Math.floor(r() * deck.length), 1)[0];
      out.push({ card: c, rev: r() < 0.38 });
    }
    return out;
  }

  /* ---------- 姓名判断（かな画数） ---------- */
  function kanaStrokes(str) {
    const out = [];
    for (const ch of String(str)) {
      // カタカナはひらがなへ寄せる
      let c = ch;
      const code = c.codePointAt(0);
      if (code >= 0x30a1 && code <= 0x30f6) c = String.fromCodePoint(code - 0x60);
      let base = c, add = 0;
      // 濁点・半濁点を分解
      const dakuten = 'がぎぐげござじずぜぞだぢづでどばびぶべぼゔ';
      const handaku = 'ぱぴぷぺぽ';
      const plain   = 'かきくけこさしすせそたちつてとはひふへほう';
      if (dakuten.includes(c)) { base = String.fromCodePoint(c.codePointAt(0) - 1); add = 2; }
      else if (handaku.includes(c)) { base = String.fromCodePoint(c.codePointAt(0) - 2); add = 1; }
      if (add && !plain.includes(base) && base !== 'う') base = c;
      const v = D.KANA[base];
      if (v == null) return null;               // 未知の文字が混じっている
      out.push(v + add);
    }
    return out;
  }
  function kakuMeaning(n) {
    if (D.KAKU[n]) return D.KAKU[n];
    let k = n; while (k > 52) k -= 52;          // 52 を超える格は還元して読む
    return D.KAKU[k] || D.KAKU[1];
  }
  const SANSAI = { 1:'木', 2:'木', 3:'火', 4:'火', 5:'土', 6:'土', 7:'金', 8:'金', 9:'水', 0:'水' };
  function seimeiChart(sei, mei) {
    const a = kanaStrokes(sei), b = kanaStrokes(mei);
    if (!a || !b || !a.length || !b.length) return null;
    const sum = arr => arr.reduce((x, y) => x + y, 0);
    const ten  = sum(a);                                   // 天格：姓の総和
    const chi  = sum(b);                                   // 地格：名の総和
    const jin  = a[a.length - 1] + b[0];                    // 人格：姓の末＋名の頭
    const soto = (a.length === 1 ? 1 : a[0]) + (b.length === 1 ? 1 : b[b.length - 1]); // 外格
    const sou  = ten + chi;                                 // 総格
    const el = v => SANSAI[v % 10];
    return {
      sei, mei, seiStrokes: a, meiStrokes: b,
      ten, jin, chi, soto, sou,
      m: { ten: kakuMeaning(ten), jin: kakuMeaning(jin), chi: kakuMeaning(chi),
           soto: kakuMeaning(soto), sou: kakuMeaning(sou) },
      sansai: [el(ten), el(jin), el(chi)],
      code: 'SM-' + String(hash32(sei + mei) % 100000).padStart(5, '0') + '-' + sou
    };
  }

  /* ---------- 3. チャート算出 ---------- */
  function buildChart(input, now) {
    now = now || new Date();
    const y = input.y, m = input.m, d = input.d;
    const birth = new Date(y, m - 1, d);
    const seedStr = [input.name || '名無し', y, m, d, input.hour == null ? '-' : input.hour].join('|');
    const seed = hash32(seedStr);
    const r = mulberry32(seed);

    const sign = sunSign(m, d);
    const lp = lifePath(y, m, d);
    const num = D.NUMBERS[lp] || D.NUMBERS[9];
    const branch = D.BRANCHES[((y - 4) % 12 + 12) % 12];
    const stem = D.STEMS[((y % 10) + 10) % 10];
    const bal = elementBalance(sign, stem, branch, m, lp, mulberry32(seed ^ 0x9e3779b9));
    const balArr = Object.entries(bal).sort((a, b) => b[1] - a[1]);
    const domEl = balArr[0][0], weakEl = balArr[4][0];
    const mp = moonPhase(now);
    const birthMoon = moonPhase(birth);
    const bio = biorhythm(birth, now);
    const py = personalYear(m, d, now.getFullYear());
    const pm = personalMonth(py, now.getMonth() + 1);
    const color = D.COLORS[(lp + branch.jp.charCodeAt(0) + y) % D.COLORS.length];

    // タロット（当日・利用者固定）
    const draw = drawCards(seedStr + '|tarot|' + ymdKey(now), 5);

    // 12ヶ月の運勢曲線
    const months = [];
    for (let i = 0; i < 12; i++) {
      const dt = new Date(now.getFullYear(), now.getMonth() + i, 15);
      const b = biorhythm(birth, dt);
      const pmn = personalMonth(personalYear(m, d, dt.getFullYear()), dt.getMonth() + 1);
      const numBoost = [0, 14, 4, 12, 2, 10, 8, -2, 16, 6][pmn] || 0;
      const raw = 50 + (b.p * 12 + b.e * 14 + b.i * 10) + numBoost + (mulberry32(seed + i * 7919)() * 10 - 5);
      months.push({
        date: dt,
        label: (dt.getMonth() + 1) + '月',
        year: dt.getFullYear(),
        score: Math.max(8, Math.min(98, Math.round(raw))),
        pm: pmn,
        bio: b
      });
    }
    const best = months.slice().sort((a, b) => b.score - a.score)[0];
    const worst = months.slice().sort((a, b) => a.score - b.score)[0];

    // 転機の日（最良月の中で感情バイオリズムが最も高い日）
    let turning = null, tBest = -2;
    const yy = best.date.getFullYear(), mm = best.date.getMonth();
    const dim = new Date(yy, mm + 1, 0).getDate();
    for (let dd = 1; dd <= dim; dd++) {
      const dt = new Date(yy, mm, dd);
      const b = biorhythm(birth, dt);
      const v = b.e * 1.15 + b.p + b.i * .85;
      if (v > tBest) { tBest = v; turning = dt; }
    }

    // 幸運の要素
    const luckyNums = pickN([lp, reduceNum(d, false), (lp * 3) % 9 || 9, (y % 9) || 9], 3, mulberry32(seed + 17)).filter((v, i, a) => a.indexOf(v) === i);
    const dirs = { '木': '東', '火': '南', '土': '中央・地元', '金': '西', '水': '北' };

    return {
      input, now, birth, seed, rnd: mulberry32(seed + 99),
      sign, lp, num, branch, stem,
      balance: bal, balArr, domEl, weakEl,
      domElData: D.ELEMENTS[domEl], weakElData: D.ELEMENTS[weakEl],
      moon: mp.moon, moonIllum: mp.illum, moonAge: mp.age,
      birthMoon: birthMoon.moon,
      bio, py, pm, color, draw, months, best, worst, turning,
      luckyNums, dir: dirs[domEl],
      code: 'HY-' + (seed % 100000).toString().padStart(5, '0') + '-' + sign.en.slice(0, 2).toUpperCase() + lp
    };
  }

  /* ---------- 4. 相性（アドオン） ---------- */
  function compatibility(a, b) {
    const r = mulberry32(hash32(a.code + '::' + b.code));
    const elGood = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
    const elBad = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
    let s = 52;
    if (elGood[a.domEl] === b.domEl || elGood[b.domEl] === a.domEl) s += 20;
    if (elBad[a.domEl] === b.domEl || elBad[b.domEl] === a.domEl) s -= 14;
    if (a.domEl === b.domEl) s += 8;
    if (a.sign.el === b.sign.el) s += 12;
    const lpDiff = Math.abs(a.lp - b.lp);
    if (lpDiff === 0) s += 10; else if (lpDiff % 3 === 0) s += 7;
    const signDist = Math.abs(D.SIGNS.indexOf(a.sign) - D.SIGNS.indexOf(b.sign)) % 12;
    if ([4, 8].includes(signDist)) s += 12;
    if ([6].includes(signDist)) s += 6;
    if ([1, 11].includes(signDist)) s -= 6;
    s += Math.floor(r() * 9) - 4;
    return {
      score: Math.max(24, Math.min(98, Math.round(s))),
      axes: {
        '価値観': Math.max(20, Math.min(99, s + Math.floor(r() * 18) - 9)),
        '会話': Math.max(20, Math.min(99, s + Math.floor(r() * 22) - 11)),
        '生活リズム': Math.max(20, Math.min(99, s + Math.floor(r() * 20) - 10)),
        '情の深さ': Math.max(20, Math.min(99, s + Math.floor(r() * 16) - 8)),
        '将来性': Math.max(20, Math.min(99, s + Math.floor(r() * 20) - 8))
      },
      elGood: elGood[a.domEl] === b.domEl || elGood[b.domEl] === a.domEl,
      elBad: elBad[a.domEl] === b.domEl || elBad[b.domEl] === a.domEl,
      signDist
    };
  }

  global.HOSHI_ENGINE = { hash32, mulberry32, pick, pickN, sunSign, reduceNum, lifePath,
    personalYear, personalMonth, moonPhase, biorhythm, buildChart, compatibility, daysBetween,
    drawCards, kanaStrokes, seimeiChart, kakuMeaning, ymdKey };
})(window);
