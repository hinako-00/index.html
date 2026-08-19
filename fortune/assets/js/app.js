/* =========================================================
   星詠堂 — UI / アプリケーション
   ========================================================= */
(function () {
  'use strict';
  const D = window.HOSHI_DATA, E = window.HOSHI_ENGINE, W = window.HOSHI_WRITER;
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => Array.from((p || document).querySelectorAll(s));
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LS = {
    get(k, f) { try { const v = localStorage.getItem('hy_' + k); return v ? JSON.parse(v) : f; } catch (e) { return f; } },
    set(k, v) { try { localStorage.setItem('hy_' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const NOW = new Date();

  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 3200);
  }

  /* ================= 1. 星空 ================= */
  (function starfield() {
    const cv = $('#starfield'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let w, h, stars = [], dpr = Math.min(window.devicePixelRatio || 1, 2), raf;
    function build() {
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      const n = Math.round((innerWidth * innerHeight) / 7000);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.15 + .25) * dpr,
        a: Math.random() * .6 + .15,
        sp: Math.random() * .014 + .003,
        ph: Math.random() * Math.PI * 2,
        big: Math.random() > .965
      }));
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const tw = REDUCED ? s.a : s.a + Math.sin(t * s.sp + s.ph) * .28;
        ctx.globalAlpha = Math.max(.04, Math.min(1, tw));
        ctx.fillStyle = s.big ? '#f6ecd0' : '#dcd6c4';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.284); ctx.fill();
        if (s.big) {
          ctx.globalAlpha *= .32;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3.4, 0, 6.284); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    build(); raf = requestAnimationFrame(draw);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 220); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(draw);
    });
  })();

  /* ================= 2. ヘッダー / ナビ ================= */
  (function header() {
    const hdr = $('#hdr'), tg = $('#navToggle'), nav = $('#nav');
    const onScroll = () => hdr.classList.toggle('stuck', scrollY > 40);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
    tg.addEventListener('click', () => {
      const open = document.body.classList.toggle('nav-open');
      tg.setAttribute('aria-expanded', String(open));
      tg.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) { document.body.classList.remove('nav-open'); tg.setAttribute('aria-expanded', 'false'); }
    });
    addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('nav-open'); });
  })();

  /* ================= 3. スクロール表出 ================= */
  const io = new IntersectionObserver((es) => {
    es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  const observeReveals = (root) => $$('.reveal', root || document).forEach(el => io.observe(el));
  observeReveals();

  /* ================= 4. 数字カウントアップ ================= */
  const cio = new IntersectionObserver((es) => {
    es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, to = +el.dataset.count, sfx = el.dataset.suffix || '';
      const dur = REDUCED ? 0 : 1500, t0 = performance.now();
      (function step(t) {
        const k = dur ? Math.min(1, (t - t0) / dur) : 1;
        const v = Math.round(to * (1 - Math.pow(1 - k, 3)));
        el.innerHTML = v.toLocaleString('ja-JP') + sfx;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
      cio.unobserve(el);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ================= 5. ヒーローの空 ================= */
  (function heroSky() {
    const ring = $('#zodiacRing');
    if (ring) {
      const syms = D.SIGNS.map(s => s.sym);
      ring.innerHTML = syms.map((s, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return '<text x="' + (400 + Math.cos(a) * 362).toFixed(1) + '" y="' + (400 + Math.sin(a) * 362 + 6).toFixed(1) +
          '" style="font-variant-emoji:text">' + s + '\uFE0E</text>';
      }).join('');
    }
    const con = $('#constellation');
    if (con) {
      const pts = [[300,250],[360,300],[430,282],[490,330],[540,300],[470,390],[400,430],[330,400],[300,250]];
      let d = 'M' + pts.map(p => p.join(' ')).join(' L');
      con.setAttribute('opacity', '.32');
      con.innerHTML = '<path d="' + d + '"/>' + pts.map(p =>
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2" fill="#f6ecd0" stroke="none"/>').join('');
    }

    const wd = ['日','月','火','水','木','金','土'];
    $('#todayStr').textContent = NOW.getFullYear() + '.' + String(NOW.getMonth() + 1).padStart(2, '0') + '.' +
      String(NOW.getDate()).padStart(2, '0') + '（' + wd[NOW.getDay()] + '）';

    const mp = E.moonPhase(NOW);
    $('#moonName').textContent = mp.moon.jp + '　' + Math.round(mp.illum * 100) + '%';
    $('#moonDesc').textContent = mp.moon.theme + '｜月齢 ' + mp.age.toFixed(1);
    const lit = $('#moonLit');
    if (lit) {
      const k = mp.illum, R = 38, rx = (R * Math.abs(2 * k - 1)).toFixed(2), sw = k < .5 ? 0 : 1;
      lit.setAttribute('d', 'M50 ' + (50 - R) + ' A' + R + ' ' + R + ' 0 0 1 50 ' + (50 + R) +
        ' A' + rx + ' ' + R + ' 0 0 ' + sw + ' 50 ' + (50 - R) + ' Z');
      // 満ちていく月は右が、欠けていく月は左が光る
      const waxing = mp.age < 14.765;
      lit.setAttribute('transform', waxing ? '' : 'translate(100,0) scale(-1,1)');
    }
    $('#heroQuote').textContent = mp.moon.msg;

    const items = ['西洋占星術 × 数秘術 × 干支五行 × 月相','同じ入力からは必ず同じ鑑定が出ます','入力内容はサーバーへ送信されません',
      '無料鑑定に登録・メール不要','鑑定歴14年・延べ12万件','転機の日を「日付」で特定します','鑑定メニュー全27種'];
    const mq = $('#marquee');
    if (mq) mq.innerHTML = items.concat(items).map(t => '<span>' + t + '</span>').join('');
  })();

  /* ================= 6. 今日の運勢 ================= */
  const CATS = [['恋愛','love'],['仕事','work'],['金運','money'],['対人','social'],['健康','health']];
  function dailyFor(profile) {
    const key = (profile ? [profile.name, profile.y, profile.m, profile.d].join('|') : (LS.get('device', null) || ''));
    const seed = E.hash32('daily|' + key + '|' + ymd(NOW));
    const r = E.mulberry32(seed);
    let base = 38 + Math.floor(r() * 58);
    if (profile) {
      const bio = E.biorhythm(new Date(profile.y, profile.m - 1, profile.d), NOW);
      base = Math.max(12, Math.min(98, Math.round(52 + (bio.p * 13 + bio.e * 15 + bio.i * 11))));
    }
    const cats = CATS.map(([jp]) => ({ jp, v: Math.max(1, Math.min(5, Math.round((base + (r() * 40 - 20)) / 20))) }));
    const mp = E.moonPhase(NOW);
    const sign = profile ? E.sunSign(profile.m, profile.d) : null;
    const texts = [
      '急がないこと。今日の流れは、押すより待つほうに味方します。',
      '思い出したように連絡が来る日。返す前に、一度深呼吸を。',
      '小さな決断が、あとから効いてくる日です。迷ったら軽いほうを。',
      '人の言葉が刺さりやすい日。それはあなたが敏感なのではなく、月がそういう位置にあるだけです。',
      '整える日。散らかった場所を一箇所だけ片づけると、流れが変わります。',
      '見送っていた連絡を、今日返すとよい流れが生まれます。',
      '無理に前を向かなくていい日。休むことが、今日の正解です。'
    ];
    const luck = {
      color: D.COLORS[Math.floor(r() * D.COLORS.length)],
      num: 1 + Math.floor(r() * 9),
      dir: ['東','西','南','北','東南','西北'][Math.floor(r() * 6)],
      item: ['白いハンカチ','温かい飲み物','手書きのメモ','銀色の小物','柑橘の香り','短い散歩'][Math.floor(r() * 6)]
    };
    return {
      score: base, cats,
      text: (sign ? sign.jp + 'のあなたへ。' : '') + texts[Math.floor(r() * texts.length)] +
            '　月は' + mp.moon.jp + '（' + mp.moon.theme + '）。' + mp.moon.msg,
      luck
    };
  }
  function renderDaily(profile) {
    const d = dailyFor(profile);
    $('#dailyScore').textContent = d.score;
    $('#dialNum').textContent = d.score;
    const arc = $('#dialArc'); if (arc) arc.style.strokeDashoffset = String(515 - 515 * d.score / 100);
    $('#dailyRank').textContent = d.score >= 80 ? '総合運 — 大吉' : d.score >= 65 ? '総合運 — 吉' :
      d.score >= 45 ? '総合運 — 中吉' : d.score >= 30 ? '総合運 — 小吉' : '総合運 — 静の日';
    $('#dailyCats').innerHTML = d.cats.map(c =>
      '<div class="daily-cat">' + c.jp + '<span class="s">' + '★'.repeat(c.v) + '<span style="opacity:.25">' + '★'.repeat(5 - c.v) + '</span></span></div>').join('');
    $('#dailyTxt').textContent = d.text + (profile ? '' : '　※ 生年月日を入力すると、あなた個人の運勢に切り替わります。');
    $('#dailyLucky').innerHTML = [
      ['色', d.luck.color.jp], ['数', d.luck.num], ['方位', d.luck.dir], ['もの', d.luck.item]
    ].map(([k, v]) => '<li><b>' + k + '</b>' + v + '</li>').join('');
  }

  /* ================= 7. 参詣（継続来訪） ================= */
  const COUPONS = { 3:{ code:'TAROT-3', text:'三日続けてお参りいただきました。詳細鑑定に「大アルカナ追加二枚」を無料で付与します。' },
    7:{ code:'HOSHI-7-15OFF', text:'七日連続。すべての詳細鑑定が15%割引になるコードを発行しました。有効期限は発行から30日です。' },
    14:{ code:'HOSHI-14-30OFF', text:'十四日連続。深淵の章が30%割引になります。よく通ってくださいました。' } };
  function visit() {
    const v = LS.get('visit', { last: null, streak: 0, total: 0 });
    const today = ymd(NOW);
    if (v.last !== today) {
      const y = new Date(NOW); y.setDate(y.getDate() - 1);
      v.streak = (v.last === ymd(y)) ? v.streak + 1 : 1;
      v.last = today; v.total = (v.total || 0) + 1;
      LS.set('visit', v);
    }
    if (!LS.get('device', null)) LS.set('device', 'dev-' + Math.random().toString(36).slice(2, 10));

    $('#streakN').textContent = v.streak;
    $('#streakDots').innerHTML = Array.from({ length: 7 }, (_, i) =>
      '<i class="' + (i < Math.min(v.streak, 7) ? 'on' : '') + '"></i>').join('');
    const next = v.streak < 3 ? 3 : v.streak < 7 ? 7 : v.streak < 14 ? 14 : null;
    $('#streakMsg').innerHTML = next
      ? '通算 <b>' + v.total + '</b> 回のご来館。あと <b>' + (next - v.streak) + '日</b> で「' +
        (next === 3 ? 'タロット二枚追加' : next === 7 ? '15%割引券' : '30%割引券') + '」が開きます。'
      : '通算 <b>' + v.total + '</b> 回。よく通ってくださいました。すべての特典が開放されています。';

    const reached = [14, 7, 3].find(n => v.streak >= n);
    if (reached) {
      const c = COUPONS[reached];
      $('#coupon').classList.add('on');
      $('#couponCode').textContent = c.code;
      $('#couponText').textContent = c.text;
      $('#couponCopy').onclick = () => {
        (navigator.clipboard ? navigator.clipboard.writeText(c.code) : Promise.reject())
          .then(() => toast('コードをコピーしました')).catch(() => toast('コード：' + c.code));
      };
    }
    return v;
  }

  /* ================= 8. メニュー一覧 ================= */
  const MENU = [
    ['今日の運勢','その日の月相とあなたの周期から、五分野の運勢を毎日算出します。','無料','—','毎日更新'],
    ['星読み（太陽宮）','生年月日から太陽宮を割り出し、性格の骨格を読みます。','無料','—','約250字'],
    ['運命数診断','数秘術の運命数から、今生の主題と罠を示します。','無料','—','約250字'],
    ['干支と五行の気質','十干十二支から、生まれ持った気の質を読みます。','無料','—','約150字'],
    ['月相リーディング','鑑定日の月齢から、始めどき・手放しどきを判定。','無料','—','約120字'],
    ['寄り添いの一言','いまの気持ちに合わせて、必要な言葉だけを届けます。','無料','—','約150字'],
    ['星と数の交点','太陽宮と運命数が交わる場所にある、あなたの本体。','光の章','¥1,980〜','約700字'],
    ['五行バランスと体質','五気の配分図と、過不足から見る消耗の癖。','光の章','¥1,980〜','図＋約330字'],
    ['健康と気の巡り','負担のかかる臓腑・具体的な兆候・養生の方向。','光の章','¥1,980〜','約470字'],
    ['才能の棚卸し','当たり前にできてしまう、五つの強み。','光の章','¥1,980〜','約390字'],
    ['恋愛とパートナーシップ','繰り返す型、満たす相手、関係が動く時期。','光の章','¥1,980〜','約380字'],
    ['仕事・天職・才能','向く環境／消耗する環境と、今年の動きどき。','光の章','¥1,980〜','約300字'],
    ['金運と豊かさの流れ','お金の動き方の型と、詰まりの原因。','光の章','¥1,980〜','約270字'],
    ['人間関係の消耗マップ','あなたを削る人の型と、境界線の引き方。','光の章','¥1,980〜','約350字'],
    ['大アルカナ五枚展開','現在・障害・根源・近未来・結論の五枚。','光の章','¥1,980〜','5枚＋約380字'],
    ['十二ヶ月の運勢曲線','身体・感情・知性の三周期を重ねた一年の図。','光の章','¥1,980〜','図＋約310字'],
    ['月別ガイド','十二ヶ月を、月ごとの言葉に落とし込みます。','光の章','¥1,980〜','約740字'],
    ['転機の日の特定','年間で最も追い風の吹く日を、日付で特定します。','光の章','¥1,980〜','日付＋解説'],
    ['九十日の実践計画','三期に分けた、具体的な行動指針。','光の章','¥1,980〜','約410字'],
    ['開運の実務','色・数・方位・曜日・石・場所・習慣の処方。','光の章','¥1,980〜','約370字'],
    ['影の章','繰り返してきたパターンと、その解除の鍵。','深淵の章','¥4,980〜','約390字'],
    ['前世と魂の系譜','魂が持ち越した主題と、未完のまま置いてきたもの。','深淵の章','¥4,980〜','約450字'],
    ['魂の約束','今生であなたが引き受けた、ひとつの主題。','深淵の章','¥4,980〜','約290字'],
    ['相性の設計図','気の四型で読む、誰と組むべきかの構造。','深淵の章','¥4,980〜','約540字'],
    ['十二星座 相性早見','十二星座それぞれとの力学を、一覧で。','深淵の章','¥4,980〜','約580字'],
    ['あなたへの十の問い','答えのいらない、あなただけの十の問い。','深淵の章','¥4,980〜','10問'],
    ['鑑定士の個別便り','自動生成では届かない言葉を、直接お書きします。','宿命の書','¥12,800/年','7日以内']
  ];
  (function menu() {
    const g = $('#menuGrid'); if (!g) return;
    g.innerHTML = MENU.map(([t, d, tag, price, vol], i) =>
      '<article class="card menu-card frame reveal ' + ['d1','d2','d3'][i % 3] + '">' +
        '<span class="tag' + (tag === '無料' ? '' : ' paid') + '">' + tag + '</span>' +
        '<h3 style="margin:0">' + t + '</h3><p>' + d + '</p>' +
        '<div class="meta"><span class="price">' + (price === '—' ? '<span style="font-family:var(--font-jp);font-size:.82rem">無料</span>' : price) + '</span>' +
        '<span class="vol">' + vol + '</span></div></article>').join('');
    observeReveals(g);
  })();

  /* ================= 9. お客様の声 / FAQ ================= */
  const VOICES = [
    ['「当たっている」より先に、「よく見ていてくれた」と思いました。影の章で書かれていた繰り返しの型が、まさに私が三回同じ場所で躓いてきた形そのままで、読みながら涙が止まりませんでした。',' 30代・女性・東京','深淵の章','2026.06'],
    ['転機の日として示された日付に、本当に異動の内示が出ました。偶然かもしれませんが、その日を意識して準備していた自分がいたのは確かです。',' 40代・男性・大阪','光の章','2026.05'],
    ['占いは半信半疑でしたが、計算方法を全部公開しているのが逆に信用できました。バイオリズムは自分で検算したら本当に同じ数字が出ました。',' 20代・男性・福岡','光の章','2026.07'],
    ['毎朝、今日の運勢を見るのが習慣になりました。連続日数が増えていくのが地味に嬉しくて、気づけば二ヶ月続いています。',' 30代・女性・北海道','今日の運勢','2026.08'],
    ['前世の章は正直あまり期待していなかったのですが、「伝えそびれることに人一倍痛みを感じる」という一文で手が止まりました。心当たりがありすぎて。',' 50代・女性・愛知','深淵の章','2026.04'],
    ['同じ生年月日の友人と結果を見比べたら、気持ちの選択が違うだけで文章がかなり変わっていて驚きました。ちゃんと個別に組まれているんですね。',' 20代・女性・神奈川','光の章','2026.06']
  ];
  (function voices() {
    const g = $('#voiceGrid'); if (!g) return;
    g.innerHTML = VOICES.map(([q, who, menu, date], i) =>
      '<article class="voice reveal ' + ['d1','d2','d3'][i % 3] + '">' +
        '<span class="qm" aria-hidden="true">&ldquo;</span><p>' + q + '</p>' +
        '<div class="who"><b>' + who.trim() + '</b><span class="stars" aria-label="評価5">★★★★★</span>' +
        '<span>' + menu + '　' + date + '</span></div></article>').join('');
    observeReveals(g);
  })();

  const FAQ = [
    ['本当に当たるのですか？','「必ず当たります」とは申し上げません。当館がお約束できるのは、算出の過程をすべて公開していること、同じ入力からは必ず同じ結果が出ること、そしてあなたのいまの気持ちに合わせて言葉を選んでいることの三点です。鑑定は未来の予言ではなく、いまの自分を別の角度から見るための地図だとお考えください。'],
    ['引き直すと結果が変わりますか？','変わりません。生年月日・お名前・ご相談内容・いまの気持ちが同じであれば、いつ何度開いても同じ鑑定文が出ます。鑑定書に記載される鑑定番号（HY-xxxxx）が同一であることでご確認いただけます。ただし「今日の運勢」とタロットは、日付・月が変わると更新されます。'],
    ['なぜ「いまの気持ち」を聞くのですか？','同じ配置でも、つらい只中にいる方と、踏み出す準備ができている方とでは、必要な言葉が違うからです。苦しい方に「行動しましょう」と言うのは鑑定ではなく暴力だと考えています。選んでいただいた気持ちによって、鑑定文の入り方・結び方・助言の強さが変わります。'],
    ['無料鑑定と詳細鑑定は何が違いますか？','無料鑑定は約1,200字で、あなたの輪郭と今日の巡りをお伝えします。詳細鑑定は8,000〜22,000字。性格の深層、五行バランス図、恋愛・仕事・金運・人間関係、タロット五枚展開、十二ヶ月の運勢曲線、転機の日の特定、そして「深淵の章」以上では影の章と前世の系譜まで踏み込みます。'],
    ['入力した個人情報はどうなりますか？','無料鑑定でご入力いただいた内容は、お使いのブラウザ内だけで処理されます。当館のサーバーに送信も保存もされません。過去の鑑定書や来訪記録は、お使いの端末のローカルストレージにのみ保存されます。ブラウザのデータを消去すると失われますのでご注意ください。'],
    ['支払いは自動更新になりますか？','「光の章」「深淵の章」および単品メニューはすべて買い切りです。自動更新はありません。「宿命の書」のみ年額制ですが、更新の30日前と7日前に必ずご連絡し、ご返信がない場合は更新しません。'],
    ['返金はできますか？','鑑定書を開封される前であれば、購入から8日以内は全額返金いたします。開封後については、内容の性質上ご返金いたしかねますが、鑑定内容にご納得いただけない場合はお問い合わせください。個別に対応いたします。'],
    ['依存してしまいそうで不安です。','その心配ができる方は、まず大丈夫です。当館は毎日課金を促す設計にしていませんし、「今日の運勢」は永久に無料です。もし占いを見ないと不安で動けない状態が続くようでしたら、それは占いではなく、信頼できる人か専門家に相談すべき状態です。'],
    ['医療や法律の相談にも使えますか？','いいえ。当館の鑑定は娯楽および自己理解の補助を目的としたもので、医療・法律・投資などの専門的助言に代わるものではありません。健康や法的問題、経済的判断については、必ず有資格の専門家にご相談ください。'],
    ['このサイトで実際に課金は発生しますか？','いいえ。本サイトはデモンストレーションであり、決済機能は実装されていません。プラン購入ボタンを押しても課金は一切発生せず、購入後に読める内容をそのままご体験いただけます。掲載の実績数値・お客様の声・鑑定士紹介もサンプルです。']
  ];
  (function faq() {
    const w = $('#faqList'); if (!w) return;
    w.innerHTML = FAQ.map(([q, a], i) =>
      '<div class="faq-item"><button class="faq-q" aria-expanded="false" aria-controls="fa' + i + '">' +
        '<span class="q">Q</span><span>' + q + '</span><span class="ic" aria-hidden="true"></span></button>' +
        '<div class="faq-a" id="fa' + i + '"><div class="faq-a-in">' + a + '</div></div></div>').join('');
    w.addEventListener('click', e => {
      const b = e.target.closest('.faq-q'); if (!b) return;
      const item = b.parentElement, panel = item.querySelector('.faq-a'), inner = panel.firstElementChild;
      const open = item.classList.toggle('open');
      b.setAttribute('aria-expanded', String(open));
      panel.style.height = open ? inner.offsetHeight + 'px' : '0px';
    });
  })();

  /* ================= 10. フォーム ================= */
  const CONCERN_LIST = [['love','恋愛・パートナーシップ'],['work','仕事・進路'],['human','人間関係'],
    ['money','金運・お金'],['self','自分自身のこと'],['future','これからの生き方']];
  const MOOD_LIST = [['hurt','つらい・苦しい'],['lost','迷っている'],['hope','期待している・前向き'],
    ['stuck','立ち止まっている'],['decide','決めたい・踏み出したい']];
  const STEP_TITLES = ['生まれた日を教えてください','いちばん知りたいことは？','いま、どんな気持ちですか？'];

  (function buildForm() {
    const y = $('#fYear'), m = $('#fMonth'), d = $('#fDay'), h = $('#fHour');
    const thisYear = NOW.getFullYear();
    y.innerHTML = '<option value="">年</option>' +
      Array.from({ length: thisYear - 1929 }, (_, i) => thisYear - i).map(v => '<option value="' + v + '">' + v + '年</option>').join('');
    m.innerHTML = '<option value="">月</option>' + Array.from({ length: 12 }, (_, i) => '<option value="' + (i + 1) + '">' + (i + 1) + '月</option>').join('');
    const fillDays = () => {
      const yy = +y.value || 2000, mm = +m.value || 1, cur = d.value;
      const dim = new Date(yy, mm, 0).getDate();
      d.innerHTML = '<option value="">日</option>' + Array.from({ length: dim }, (_, i) => '<option value="' + (i + 1) + '">' + (i + 1) + '日</option>').join('');
      if (cur && +cur <= dim) d.value = cur;
    };
    fillDays(); y.addEventListener('change', fillDays); m.addEventListener('change', fillDays);
    h.innerHTML = '<option value="">わからない</option>' +
      Array.from({ length: 24 }, (_, i) => '<option value="' + i + '">' + String(i).padStart(2, '0') + '時台</option>').join('');

    $('#concernChoices').innerHTML = CONCERN_LIST.map(([v, t], i) =>
      '<label class="choice"><input type="radio" name="concern" value="' + v + '"' + (i === 0 ? '' : '') + '><span>' + t + '</span></label>').join('');
    $('#moodChoices').innerHTML = MOOD_LIST.map(([v, t]) =>
      '<label class="choice"><input type="radio" name="mood" value="' + v + '"><span>' + t + '</span></label>').join('');

    const note = $('#fNote');
    note.addEventListener('input', () => { $('#noteCount').textContent = note.value.length; });

    // 前回入力の復元
    const prof = LS.get('profile', null);
    if (prof) {
      $('#fName').value = prof.name || '';
      y.value = prof.y || ''; m.value = prof.m || ''; fillDays(); d.value = prof.d || '';
      if (prof.hour != null) h.value = prof.hour;
      renderDaily(prof);
    } else renderDaily(null);
  })();

  let step = 1;
  function showStep(n) {
    step = n;
    $$('.step-pane').forEach(p => p.classList.toggle('hide', +p.dataset.step !== n));
    $('#stepNo').textContent = n;
    $('#stepTitle').textContent = STEP_TITLES[n - 1];
    $$('.progress i').forEach((el, i) => el.classList.toggle('on', i < n));
    $('#btnPrev').classList.toggle('hide', n === 1);
    $('#btnNext').classList.toggle('hide', n === 3);
    $('#btnCast').classList.toggle('hide', n !== 3);
    $('#formErr').textContent = '';
  }
  function validate(n) {
    if (n === 1) {
      if (!$('#fYear').value || !$('#fMonth').value || !$('#fDay').value) return '生年月日をすべてお選びください。';
    }
    if (n === 2 && !$('input[name=concern]:checked')) return 'いちばん知りたいことを一つお選びください。';
    if (n === 3 && !$('input[name=mood]:checked')) return 'いまのお気持ちに近いものを一つお選びください。';
    return '';
  }
  $('#btnNext').addEventListener('click', () => {
    const err = validate(step);
    if (err) { $('#formErr').textContent = err; return; }
    showStep(Math.min(3, step + 1));
  });
  $('#btnPrev').addEventListener('click', () => showStep(Math.max(1, step - 1)));

  /* ================= 11. 鑑定実行 ================= */
  const CAST_MSGS = ['星の位置を確かめています…','運命数を還元しています…','干支と五行の配分を測っています…',
    '月齢を計算しています…','三つの周期を重ねています…','あなたの気持ちに合わせて、言葉を選んでいます…'];
  let CURRENT = null, UNLOCKED = null;

  $('#readForm').addEventListener('submit', e => {
    e.preventDefault();
    for (let i = 1; i <= 3; i++) { const err = validate(i); if (err) { showStep(i); $('#formErr').textContent = err; return; } }

    const input = {
      name: $('#fName').value.trim().slice(0, 20),
      y: +$('#fYear').value, m: +$('#fMonth').value, d: +$('#fDay').value,
      hour: $('#fHour').value === '' ? null : +$('#fHour').value,
      concern: $('input[name=concern]:checked').value,
      mood: $('input[name=mood]:checked').value,
      note: $('#fNote').value.trim().slice(0, 200)
    };
    LS.set('profile', { name: input.name, y: input.y, m: input.m, d: input.d, hour: input.hour });
    renderDaily(input);

    $('#readForm').classList.add('hide');
    $('#casting').classList.add('on');
    $('#report').classList.remove('on');

    const total = REDUCED ? 300 : 2900;
    const t0 = performance.now();
    (function tick(t) {
      const k = Math.min(1, (t - t0) / total);
      $('#castBar').style.width = (k * 100) + '%';
      const mi = Math.min(CAST_MSGS.length - 1, Math.floor(k * CAST_MSGS.length));
      $('#castMsg').textContent = CAST_MSGS[mi];
      if (k < 1) requestAnimationFrame(tick);
      else {
        $('#casting').classList.remove('on');
        $('#readForm').classList.remove('hide');
        CURRENT = E.buildChart(input, NOW);
        UNLOCKED = null;
        renderReport();
        saveHistory(input, CURRENT);
        $('#report').classList.add('on');
        $('#report').focus({ preventScroll: true });
        $('#report').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      }
    })(t0);
  });

  /* ================= 12. 鑑定書の描画 ================= */
  const SEAL = '<svg class="rep-seal" viewBox="0 0 120 120" fill="none" aria-hidden="true">' +
    '<circle cx="60" cy="60" r="55" stroke="#c09a4f" stroke-width=".8" opacity=".7"/>' +
    '<circle cx="60" cy="60" r="46" stroke="#c09a4f" stroke-width=".5" opacity=".4" stroke-dasharray="2 6"/>' +
    '<circle cx="60" cy="60" r="34" stroke="#7b5f9c" stroke-width=".8" opacity=".6"/>' +
    '<path d="M60 24l5.4 15.8L81 45.2l-15.6 5.4L60 66.4l-5.4-15.8L39 45.2l15.6-5.4z" fill="#d3b573"/>' +
    '<path d="M38 78h44M44 86h32" stroke="#c09a4f" stroke-width=".7" opacity=".5"/></svg>';

  function pillarsHTML(c) {
    const rows = [
      ['太陽宮', c.sign.jp, c.sign.en + '・' + c.sign.el, c.sign.sym],
      ['運命数', String(c.lp), c.num.title, '✦'],
      ['干支', c.branch.jp + '（' + c.branch.yomi + '）', c.branch.el + 'の気', '☯'],
      ['主たる気', c.domEl, c.domElData.en + '／薄いのは' + c.weakEl, '❋'],
      ['本日の月', c.moon.jp, c.moon.theme, '☾']
    ];
    return '<div class="pillars">' + rows.map(([k, v, s, g]) =>
      '<div class="pillar"><div class="glyph" style="font-size:26px;line-height:32px">' + g + '\uFE0E</div>' +
      '<p class="k">' + k + '</p><p class="v">' + v + '</p><p class="s">' + s + '</p></div>').join('') + '</div>';
  }

  function radarSVG(bal) {
    const keys = ['木','火','土','金','水'], R = 88, cx = 120, cy = 116;
    const pt = (i, r) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    let grid = '';
    [.25, .5, .75, 1].forEach(f => {
      grid += '<polygon points="' + keys.map((_, i) => pt(i, R * f).map(n => n.toFixed(1)).join(',')).join(' ') +
        '" fill="none" stroke="rgba(233,224,203,.13)" stroke-width=".7"/>';
    });
    keys.forEach((_, i) => { const p = pt(i, R); grid += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="rgba(233,224,203,.13)" stroke-width=".7"/>'; });
    const poly = keys.map((k, i) => pt(i, R * (bal[k] / 100)).map(n => n.toFixed(1)).join(',')).join(' ');
    const dots = keys.map((k, i) => { const p = pt(i, R * (bal[k] / 100)); return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3" fill="#f6ecd0"/>'; }).join('');
    const labels = keys.map((k, i) => {
      const p = pt(i, R + 20);
      return '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 5).toFixed(1) + '" text-anchor="middle" font-size="14" fill="#d3b573">' + k + '</text>' +
             '<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 19).toFixed(1) + '" text-anchor="middle" font-size="9" fill="#726b5e" font-family="Cormorant Garamond,serif">' + bal[k] + '</text>';
    }).join('');
    return '<svg viewBox="0 0 240 250" role="img" aria-label="五行バランス図" style="max-width:340px;margin:0 auto">' +
      '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#c09a4f" stop-opacity=".55"/><stop offset="100%" stop-color="#7b5f9c" stop-opacity=".45"/></linearGradient></defs>' +
      grid + '<polygon points="' + poly + '" fill="url(#rg)" stroke="#e8d6a4" stroke-width="1.2"/>' + dots + labels + '</svg>';
  }

  function lineSVG(months) {
    const W = 720, H = 240, PL = 34, PR = 16, PT = 22, PB = 40;
    const iw = W - PL - PR, ih = H - PT - PB;
    const x = i => PL + (i / (months.length - 1)) * iw;
    const y = v => PT + ih - (v / 100) * ih;
    let grid = '';
    [0, 25, 50, 75, 100].forEach(v => {
      grid += '<line x1="' + PL + '" y1="' + y(v).toFixed(1) + '" x2="' + (W - PR) + '" y2="' + y(v).toFixed(1) +
        '" stroke="rgba(233,224,203,.1)" stroke-width=".7"/>' +
        '<text x="' + (PL - 8) + '" y="' + (y(v) + 3.5).toFixed(1) + '" text-anchor="end" font-size="9" fill="#726b5e" font-family="Cormorant Garamond,serif">' + v + '</text>';
    });
    const pts = months.map((m, i) => [x(i), y(m.score)]);
    let dpath = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i], mx = (p0[0] + p1[0]) / 2;
      dpath += ' C' + mx.toFixed(1) + ' ' + p0[1].toFixed(1) + ',' + mx.toFixed(1) + ' ' + p1[1].toFixed(1) + ',' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
    }
    const area = dpath + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (PT + ih) + ' L' + pts[0][0].toFixed(1) + ' ' + (PT + ih) + ' Z';
    const best = months.reduce((a, b) => b.score > a.score ? b : a);
    const bi = months.indexOf(best);
    const dots = months.map((m, i) =>
      '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(m.score).toFixed(1) + '" r="' + (i === bi ? 4.6 : 2.8) + '" fill="' + (i === bi ? '#f6ecd0' : '#c09a4f') + '"/>').join('');
    const labels = months.map((m, i) =>
      '<text x="' + x(i).toFixed(1) + '" y="' + (H - 16) + '" text-anchor="middle" font-size="9.5" fill="' + (i === bi ? '#e8d6a4' : '#726b5e') + '">' + m.label + '</text>').join('');
    return '<div style="overflow-x:auto"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="十二ヶ月の運勢曲線" style="min-width:600px">' +
      '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#c09a4f" stop-opacity=".38"/><stop offset="100%" stop-color="#c09a4f" stop-opacity="0"/></linearGradient></defs>' +
      grid + '<path d="' + area + '" fill="url(#lg)"/>' +
      '<path d="' + dpath + '" fill="none" stroke="#e8d6a4" stroke-width="1.7" stroke-linecap="round"/>' + dots + labels +
      '<line x1="' + x(bi).toFixed(1) + '" y1="' + PT + '" x2="' + x(bi).toFixed(1) + '" y2="' + (PT + ih) + '" stroke="#f6ecd0" stroke-width=".7" stroke-dasharray="3 4" opacity=".6"/>' +
      '</svg></div>';
  }

  function tarotHTML(draw) {
    const pos = ['現在','障害','根源','近い未来','結論'];
    return '<div class="tarot-row">' + draw.map((x, i) => {
      const side = x.rev ? x.card.rv : x.card.up;
      return '<div><button class="tcard" data-i="' + i + '" aria-label="' + pos[i] + 'の札をめくる">' +
        '<div class="tcard-in">' +
          '<div class="tcard-face tcard-back">' +
            '<svg class="tcard-art" viewBox="0 0 60 96" fill="none" stroke="#c09a4f" stroke-width=".8">' +
              '<rect x="4" y="4" width="52" height="88" rx="3" opacity=".55"/>' +
              '<circle cx="30" cy="48" r="17" opacity=".7"/><circle cx="30" cy="48" r="10" opacity=".4"/>' +
              '<path d="M30 34l3.2 9.3L42 46.6l-8.8 3.2L30 59l-3.2-9.2L18 46.6l8.8-3.3z" fill="#c09a4f" stroke="none"/>' +
              '<path d="M30 12v8M30 76v8M12 48h8M40 48h8" opacity=".45"/></svg>' +
            '<span class="hintflip">TAP</span>' +
          '</div>' +
          '<div class="tcard-face tcard-front">' +
            '<span class="pos">' + pos[i] + '</span>' +
            '<svg viewBox="0 0 40 40" width="34" height="34" fill="none" stroke="#c09a4f" stroke-width=".8" aria-hidden="true"' +
              (x.rev ? ' style="transform:rotate(180deg)"' : '') + '>' +
              '<circle cx="20" cy="20" r="14" opacity=".55"/>' +
              '<path d="M20 9l2.4 6.9L29 18.3l-6.6 2.4L20 28l-2.4-7.3L11 18.3l6.6-2.4z" fill="#c09a4f" stroke="none"/>' +
            '</svg>' +
            '<span class="en" style="font-family:Cormorant Garamond,serif;font-size:.72rem;color:#c09a4f">' + x.card.rn + '</span>' +
            '<span class="nm">' + x.card.jp + '</span>' +
            '<span class="en">' + x.card.en + '</span>' +
            '<span class="rv' + (x.rev ? ' is-rev' : '') + '">' + (x.rev ? '逆位置' : '正位置') + '</span>' +
          '</div>' +
        '</div></button>' +
        '<p class="tcard-note"><strong style="color:#e8d6a4;font-weight:400">' + side.kw + '</strong></p></div>';
    }).join('') + '</div>';
  }

  function chartHTML(ch) {
    if (!ch) return '';
    if (ch.type === 'radar') {
      const bars = Object.entries(ch.data).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
        '<div class="bar-row"><span>' + k + '（' + D.ELEMENTS[k].en + '）</span>' +
        '<span class="bar-track"><i class="bar-fill" data-w="' + v + '"></i></span><span class="val">' + v + '</span></div>').join('');
      return '<div class="chart-wrap"><div class="chart-title">五行バランス<span>木火土金水の配分（最大値を100とした相対値）</span></div>' +
        radarSVG(ch.data) + bars + '</div>';
    }
    if (ch.type === 'line') {
      return '<div class="chart-wrap"><div class="chart-title">十二ヶ月の運勢曲線<span>身体23日・感情28日・知性33日の周期＋個人月数</span></div>' +
        lineSVG(ch.data) +
        '<div class="legend"><span><i style="background:#e8d6a4"></i>総合指数</span><span><i style="background:#f6ecd0"></i>最良月</span></div></div>';
    }
    if (ch.type === 'tarot') return tarotHTML(ch.data);
    return '';
  }

  function sectionHTML(s) {
    return '<section class="rep-block">' +
      '<div class="rep-block-head"><span class="n">' + s.no + '</span><h3>' + s.title + '</h3><span class="ln"></span>' +
      '<span class="n" style="font-family:Cormorant Garamond,serif;font-style:italic">' + s.en + '</span></div>' +
      '<div class="rep-body">' + s.html + chartHTML(s.chart) + '</div></section>';
  }

  const TIERS = {
    light:  { name:'光の章',   price:1980,  vol:'約6,500字／全15章',  includes:['light'] },
    deep:   { name:'深淵の章', price:4980,  vol:'約9,300字／全21章', includes:['light','deep'] },
    master: { name:'宿命の書', price:12800, vol:'約9,500字＋毎月更新', includes:['light','deep','master'] }
  };

  function renderReport() {
    const c = CURRENT; if (!c) return;
    const free = W.composeFree(c), paid = W.composePaid(c);
    const wd = ['日','月','火','水','木','金','土'];
    let html = '';

    html += '<div class="rep-header">' + SEAL +
      '<p class="rep-for">鑑 定 書</p>' +
      '<h2 class="rep-name">' + (c.input.name ? c.input.name + ' さんへ' : 'あなたへ') + '</h2>' +
      '<p class="rep-issued">' + W.jdate(c.now) + '（' + wd[c.now.getDay()] + '）発行　／　' +
      D.CONCERNS[c.input.concern].jp + '　／　' + D.MOODS[c.input.mood].jp + '</p>' +
      '<span class="rep-code">' + c.code + '</span>' +
      '<p class="small" style="margin-top:12px">この番号を控えておけば、いつでも同じ鑑定を再現できます。</p>' +
      '</div>';

    html += pillarsHTML(c);
    html += free.map(sectionHTML).join('');

    if (UNLOCKED) {
      const allow = TIERS[UNLOCKED].includes;
      const shown = paid.filter(s => allow.indexOf(s.tier) >= 0);
      html += '<div class="rule mt-l" aria-hidden="true">✦</div>' +
        '<p class="center small mt-s">ここから先は「' + TIERS[UNLOCKED].name + '」の内容です（' + TIERS[UNLOCKED].vol + '）</p>';
      html += shown.map(sectionHTML).join('');
      const locked = paid.filter(s => allow.indexOf(s.tier) < 0);
      if (locked.length) {
        html += '<div class="paywall mt-l" style="margin-top:44px">' +
          '<h3>さらに深く読む</h3><p class="why">' +
          locked.map(s => '「' + s.title + '」').join('・') + ' は、上位の章に収録されています。</p>' +
          unlockCards(UNLOCKED) + '</div>';
      }
    } else {
      const teaser = paid[0];
      html += '<div class="rule mt-l" aria-hidden="true">✦</div>' +
        '<div class="locked"><div class="clip">' + sectionHTML(teaser) + '</div><div class="veil-cut"></div></div>' +
        '<div class="paywall">' +
          '<svg class="lockicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">' +
            '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none"/></svg>' +
          '<h3>この続きに、あなたの核心があります</h3>' +
          '<p class="why">無料鑑定はここまでです。ここから先には、あなたが繰り返してきたパターン、五行の偏りから見る消耗の癖、' +
          '恋愛・仕事・金運それぞれの具体策、大アルカナ五枚展開、十二ヶ月の運勢曲線、そして<strong style="color:var(--gold-100);font-weight:400">' +
          W.jdate(c.turning) + '</strong>という転機の日付までが収められています。</p>' +
          unlockCards(null) +
          '<p class="small mt-m">※ 本サイトはデモです。実際の課金は発生しません。' +
          '各ボタンから、購入後に読める内容をそのままご覧いただけます。</p>' +
        '</div>';
    }

    html += comeBackHTML(c);
    html += '<div class="console-foot" style="justify-content:center;gap:12px;flex-wrap:wrap;margin-top:40px">' +
      '<button class="btn btn-ghost btn-sm" id="repPrint">印刷 / PDF保存</button>' +
      '<button class="btn btn-ghost btn-sm" id="repCopy">鑑定番号をコピー</button>' +
      '<button class="btn btn-ghost btn-sm" id="repAgain">条件を変えて視てもらう</button>' +
      '</div>';

    html += historyHTML();

    const rep = $('#report');
    rep.innerHTML = html;
    afterRender(rep);
  }

  function unlockCards(current) {
    const order = ['light', 'deep', 'master'];
    const from = current ? order.indexOf(current) + 1 : 0;
    const cards = order.slice(from).map((k, i) => {
      const t = TIERS[k];
      const feat = { light:['性格の深層と五行バランス図','健康・才能・恋愛・仕事・金運・人間関係','大アルカナ五枚展開','十二ヶ月の曲線と月別ガイド','転機の日と九十日の実践計画'],
        deep:['光の章の全内容','影の章（反復パターンと解除の鍵）','前世と魂の系譜／魂の約束','相性の設計図と星座別早見','あなたへの十の問い'],
        master:['深淵の章の全内容','鑑定士による個別便り（7日以内）','十二ヶ月の月次更新','相性鑑定 無制限','年一回の個別相談30分'] }[k];
      return '<div class="unlock-card' + (k === 'deep' ? ' best' : '') + '">' +
        '<span class="ttl">' + t.name + '</span>' +
        '<span class="pr">¥' + t.price.toLocaleString('ja-JP') + '<small>' + (k === 'master' ? '/年' : '買い切り') + '</small></span>' +
        '<span class="small" style="color:var(--gold-300)">' + t.vol + '</span>' +
        '<ul>' + feat.map(f => '<li>' + f + '</li>').join('') + '</ul>' +
        '<button class="btn ' + (k === 'deep' ? 'btn-gold' : 'btn-ghost') + ' btn-sm" data-buy="' + k + '">' + t.name + 'を開く</button></div>';
    }).join('');
    const n = order.length - from;
    return '<div class="unlock-grid' + (n === 2 ? ' two' : n === 1 ? ' one' : '') + '">' + cards + '</div>';
  }

  function afterRender(rep) {
    // バーの伸長
    requestAnimationFrame(() => $$('.bar-fill', rep).forEach(b => { b.style.width = b.dataset.w + '%'; }));
    // タロットめくり
    $$('.tcard', rep).forEach((btn, i) => {
      btn.addEventListener('click', () => btn.classList.toggle('flipped'));
      if (!REDUCED) setTimeout(() => btn.classList.add('flipped'), 500 + i * 230);
      else btn.classList.add('flipped');
    });
    const p = $('#repPrint'); if (p) p.onclick = () => window.print();
    const cp = $('#repCopy'); if (cp) cp.onclick = () => {
      (navigator.clipboard ? navigator.clipboard.writeText(CURRENT.code) : Promise.reject())
        .then(() => toast('鑑定番号 ' + CURRENT.code + ' をコピーしました')).catch(() => toast('鑑定番号：' + CURRENT.code));
    };
    const ag = $('#repAgain'); if (ag) ag.onclick = () => {
      showStep(1); $('#console').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
    };
    bindHistory(rep);
  }


  /* 次に訪れるべき日 */
  function nextMoonDate(idx) {
    for (let i = 1; i <= 40; i++) {
      const dt = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + i);
      if (E.moonPhase(dt).moon === D.MOONS[idx]) return dt;
    }
    return null;
  }
  function comeBackHTML(c) {
    const wd = ['日','月','火','水','木','金','土'];
    const full = nextMoonDate(4), nw = nextMoonDate(0);
    const fmt = dt => dt ? (dt.getMonth() + 1) + '月' + dt.getDate() + '日（' + wd[dt.getDay()] + '）' : '—';
    return '<div class="streak" style="margin-top:44px">' +
      '<div><div class="streak-n num">☾<small>次のご来館</small></div></div>' +
      '<p class="streak-msg">' +
        '次の<b>満月は' + fmt(full) + '</b>、<b>新月は' + fmt(nw) + '</b>。' +
        '満月は手放しと結実、新月は種を蒔く位相です。' + (c.input.name ? c.input.name + 'さんの' : 'あなたの') +
        '<b>' + c.domEl + '</b>の気は月の満ち欠けに強く反応しますので、この二日は運勢が大きく動きます。<br>' +
        'そして<b>' + W.jdate(c.turning) + '</b>が、今年最大の転機の日です。手帳に印を。' +
      '</p></div>';
  }

  /* ================= 13. 課金モーダル ================= */
  const modal = $('#payModal');
  let pendingTier = 'deep';
  function openPay(tier) {
    pendingTier = tier;
    const t = TIERS[tier];
    $('#payTitle').textContent = t.name + 'を開く';
    $('#paySub').textContent = t.vol + '　／　' + (tier === 'master' ? '年額・更新前に必ずご連絡します' : '買い切り・自動更新なし');
    $('#orderSum').innerHTML =
      '<div class="order-line"><span>' + t.name + '</span><span>¥' + t.price.toLocaleString('ja-JP') + '</span></div>' +
      '<div class="order-line"><span>鑑定番号</span><span>' + (CURRENT ? CURRENT.code : '—') + '</span></div>' +
      '<div class="order-line"><span>消費税（内税）</span><span>¥' + Math.round(t.price * 10 / 110).toLocaleString('ja-JP') + '</span></div>' +
      '<div class="order-line"><span>お支払い合計</span><span>¥' + t.price.toLocaleString('ja-JP') + '</span></div>';
    modal.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closePay() { modal.classList.remove('on'); document.body.style.overflow = ''; }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closePay(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('on')) closePay(); });
  $('#payGo').addEventListener('click', () => {
    toast('デモサイトのため決済には進みません。下のボタンで内容をご覧いただけます。');
  });
  $('#demoUnlock').addEventListener('click', () => {
    closePay();
    if (!CURRENT) {
      toast('先に無料鑑定を受けてください');
      $('#reading').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
      showStep(1);
      return;
    }
    UNLOCKED = pendingTier;
    renderReport();
    $('#report').classList.add('on');
    toast(TIERS[pendingTier].name + 'を開きました（デモ表示）');
    setTimeout(() => {
      const blocks = $$('#report .rep-block');
      const target = blocks[3] || $('#report');
      target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
    }, 120);
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-buy]'); if (!b) return;
    e.preventDefault();
    if (!CURRENT) {
      toast('まず無料鑑定を受けると、そのまま続きを開けます');
      $('#reading').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      showStep(1);
      return;
    }
    openPay(b.dataset.buy);
  });

  /* ================= 14. 鑑定履歴 ================= */
  function saveHistory(input, chart) {
    const h = LS.get('history', []);
    if (!h.some(x => x.code === chart.code)) {
      h.unshift({ code: chart.code, name: input.name, y: input.y, m: input.m, d: input.d,
        hour: input.hour, concern: input.concern, mood: input.mood, note: input.note,
        at: NOW.toISOString(), sign: chart.sign.jp, lp: chart.lp });
      LS.set('history', h.slice(0, 12));
    }
  }
  function historyHTML() {
    const h = LS.get('history', []);
    if (!h.length) return '';
    return '<section class="rep-block"><div class="rep-block-head"><span class="n">＊</span><h3>この端末に残っている鑑定書</h3><span class="ln"></span></div>' +
      '<div class="history">' + h.map(x =>
        '<div class="hist-item"><div><p class="t">' + (x.name ? x.name + ' さん／' : '') + x.sign + '・運命数' + x.lp +
        '　<span style="color:var(--text-faint);font-size:.78rem">' + (D.CONCERNS[x.concern] || {}).jp + '</span></p>' +
        '<p class="d">' + x.code + '　' + x.at.slice(0, 10) + '</p></div>' +
        '<button class="btn btn-ghost btn-sm" data-reopen="' + x.code + '">開く</button></div>').join('') +
      '</div><p class="small mt-s">※ 端末内にのみ保存されています。ブラウザのデータを消去すると失われます。</p></section>';
  }
  function bindHistory(root) {
    $$('[data-reopen]', root).forEach(btn => btn.addEventListener('click', () => {
      const rec = LS.get('history', []).find(x => x.code === btn.dataset.reopen);
      if (!rec) return;
      CURRENT = E.buildChart({ name: rec.name, y: rec.y, m: rec.m, d: rec.d, hour: rec.hour,
        concern: rec.concern, mood: rec.mood, note: rec.note }, NOW);
      UNLOCKED = null;
      renderReport();
      $('#report').classList.add('on');
      $('#report').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      toast('鑑定番号 ' + rec.code + ' を再現しました');
    }));
  }

  /* ================= 15. 起動 ================= */
  showStep(1);
  visit();
  const hist = LS.get('history', []);
  if (hist.length) {
    const rep = $('#report');
    rep.innerHTML = historyHTML();
    rep.classList.add('on');
    bindHistory(rep);
  }
})();
