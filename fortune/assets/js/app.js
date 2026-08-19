/* =========================================================
   星詠堂 — UI
   ========================================================= */
(function () {
  'use strict';
  const D = window.HOSHI_DATA, E = window.HOSHI_ENGINE, W = window.HOSHI_WRITER;
  const $ = (s, p) => (p || document).querySelector(s);
  const $$ = (s, p) => Array.from((p || document).querySelectorAll(s));
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NOW = new Date();
  const WD = ['日','月','火','水','木','金','土'];
  const LS = {
    get(k, f){ try { const v = localStorage.getItem('hy_' + k); return v ? JSON.parse(v) : f; } catch(e){ return f; } },
    set(k, v){ try { localStorage.setItem('hy_' + k, JSON.stringify(v)); } catch(e){} }
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function toast(msg){
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 3400);
  }

  /* ================= 星空 ================= */
  (function starfield(){
    const cv = $('#starfield'); if (!cv) return;
    const ctx = cv.getContext('2d');
    let w, h, stars = [], raf, dpr = Math.min(devicePixelRatio || 1, 2);
    function build(){
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      const n = Math.round(innerWidth * innerHeight / 6200);
      stars = Array.from({ length:n }, () => ({
        x:Math.random()*w, y:Math.random()*h, r:(Math.random()*1.2+.25)*dpr,
        a:Math.random()*.6+.16, sp:Math.random()*.014+.003, ph:Math.random()*6.28,
        big:Math.random() > .962, gold:Math.random() > .7
      }));
    }
    function draw(t){
      ctx.clearRect(0,0,w,h);
      for (const s of stars){
        const tw = REDUCED ? s.a : s.a + Math.sin(t*s.sp + s.ph)*.3;
        ctx.globalAlpha = Math.max(.04, Math.min(1, tw));
        ctx.fillStyle = s.big ? '#fdf3d4' : s.gold ? '#e2c27f' : '#ded6c6';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.284); ctx.fill();
        if (s.big){ ctx.globalAlpha *= .3; ctx.beginPath(); ctx.arc(s.x, s.y, s.r*3.6, 0, 6.284); ctx.fill(); }
      }
      ctx.globalAlpha = 1; raf = requestAnimationFrame(draw);
    }
    build(); raf = requestAnimationFrame(draw);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 220); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(draw);
    });
  })();

  /* ================= ヘッダー ================= */
  (function header(){
    const hdr = $('#hdr'), tg = $('#navTg'), nav = $('#nav');
    const on = () => hdr.classList.toggle('stuck', scrollY > 36);
    on(); addEventListener('scroll', on, { passive:true });
    tg.addEventListener('click', () => {
      const o = document.body.classList.toggle('nav-open');
      tg.setAttribute('aria-expanded', String(o));
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });
    addEventListener('keydown', e => { if (e.key === 'Escape') document.body.classList.remove('nav-open'); });
  })();

  /* ================= 表出 ================= */
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold:.1, rootMargin:'0px 0px -6% 0px' });
  const watch = root => $$('.rv', root || document).forEach(el => io.observe(el));
  watch();

  /* ================= ヒーローの空 ================= */
  (function sky(){
    const halo = $('#heroHalo');
    if (halo){
      const syms = D.SIGNS.map(s => s.sym);
      $('#zring').innerHTML = syms.map((s,i) => {
        const a = i/12*6.2832 - 1.5708;
        return '<text x="'+(400+Math.cos(a)*358).toFixed(1)+'" y="'+(400+Math.sin(a)*358+6).toFixed(1)+
          '" style="font-variant-emoji:text">'+s+'︎</text>';
      }).join('');
    }
    $('#today').textContent = NOW.getFullYear()+'.'+String(NOW.getMonth()+1).padStart(2,'0')+'.'+
      String(NOW.getDate()).padStart(2,'0')+'（'+WD[NOW.getDay()]+'）';
    const mp = E.moonPhase(NOW);
    $('#moonNm').textContent = mp.moon.jp + '　' + Math.round(mp.illum*100) + '%';
    $('#moonDs').textContent = mp.moon.theme + '｜月齢 ' + mp.age.toFixed(1);
    $('#moonMsg').textContent = mp.moon.msg;
    const lit = $('#moonLit');
    if (lit){
      const k = mp.illum, R = 38, rx = (R*Math.abs(2*k-1)).toFixed(2), sw = k < .5 ? 0 : 1;
      lit.setAttribute('d','M50 '+(50-R)+' A'+R+' '+R+' 0 0 1 50 '+(50+R)+' A'+rx+' '+R+' 0 0 '+sw+' 50 '+(50-R)+' Z');
      lit.setAttribute('transform', mp.age < 14.765 ? '' : 'translate(100,0) scale(-1,1)');
    }
  })();

  /* ================= 今日の運勢 ================= */
  function dailyFor(prof){
    const key = prof ? [prof.y,prof.m,prof.d].join('-') : (LS.get('dev', '') || 'guest');
    const r = E.mulberry32(E.hash32('d|'+key+'|'+E.ymdKey(NOW)));
    let base = 38 + Math.floor(r()*58);
    if (prof){
      const b = E.biorhythm(new Date(prof.y, prof.m-1, prof.d), NOW);
      base = Math.max(12, Math.min(98, Math.round(52 + b.p*13 + b.e*15 + b.i*11)));
    }
    const cats = ['恋愛','仕事','金運','対人','健康'].map(jp => ({ jp, v:Math.max(1, Math.min(5, Math.round((base + r()*40 - 20)/20))) }));
    const mp = E.moonPhase(NOW);
    const sign = prof ? E.sunSign(prof.m, prof.d) : null;
    const txt = ['急がないこと。今日の流れは、押すより待つほうに味方します。',
      '思い出したように連絡が来る日。返す前に、一度深呼吸を。',
      '小さな決断があとから効いてくる日です。迷ったら軽いほうを。',
      '人の言葉が刺さりやすい日。あなたが敏感なのではなく、月がその位置にあるだけです。',
      '整える日。散らかった場所を一箇所だけ片づけると、流れが変わります。',
      '保留していた連絡を、今日返すとよい流れが生まれます。',
      '無理に前を向かなくていい日。休むことが、今日の正解です。'][Math.floor(r()*7)];
    return { score:base, cats, sign, moon:mp.moon, txt,
      luck:{ color:D.COLORS[Math.floor(r()*D.COLORS.length)].jp, num:1+Math.floor(r()*9),
        dir:['東','西','南','北','東南','西北'][Math.floor(r()*6)],
        item:['白いハンカチ','温かい飲み物','手書きのメモ','銀色の小物','柑橘の香り','短い散歩'][Math.floor(r()*6)] } };
  }
  function renderDaily(prof){
    const d = dailyFor(prof);
    $('#dScore').textContent = d.score;
    $('#dialNum').textContent = d.score;
    const arc = $('#dialArc'); if (arc) arc.style.strokeDashoffset = String(515 - 515*d.score/100);
    $('#dRank').textContent = d.score>=80?'総合運 — 大吉':d.score>=65?'総合運 — 吉':d.score>=45?'総合運 — 中吉':d.score>=30?'総合運 — 小吉':'総合運 — 静の日';
    $('#dCats').innerHTML = d.cats.map(c =>
      '<div class="dcat">'+c.jp+'<span class="s">'+'★'.repeat(c.v)+'<span style="opacity:.22">'+'★'.repeat(5-c.v)+'</span></span></div>').join('');
    $('#dTxt').innerHTML = (d.sign ? '<em class="hl">'+d.sign.jp+'</em>のあなたへ。' : '') + d.txt +
      '　月は<em class="hl">'+d.moon.jp+'</em>（'+d.moon.theme+'）。'+d.moon.msg;
    $('#dLucky').innerHTML = [['色',d.luck.color],['数',d.luck.num],['方位',d.luck.dir],['もの',d.luck.item]]
      .map(([k,v]) => '<li><b>'+k+'</b>'+v+'</li>').join('');
  }
  (function dailyForm(){
    const y = $('#dY'), m = $('#dM'), dd = $('#dD');
    const ty = NOW.getFullYear();
    y.innerHTML = '<option value="">年</option>' + Array.from({length:ty-1929},(_,i)=>ty-i).map(v=>'<option>'+v+'</option>').join('');
    m.innerHTML = '<option value="">月</option>' + Array.from({length:12},(_,i)=>'<option>'+(i+1)+'</option>').join('');
    const fill = () => {
      const dim = new Date(+y.value||2000, +m.value||1, 0).getDate(), cur = dd.value;
      dd.innerHTML = '<option value="">日</option>' + Array.from({length:dim},(_,i)=>'<option>'+(i+1)+'</option>').join('');
      if (cur && +cur <= dim) dd.value = cur;
    };
    fill(); y.onchange = fill; m.onchange = fill;
    const apply = () => {
      if (!y.value || !m.value || !dd.value) return;
      const prof = { y:+y.value, m:+m.value, d:+dd.value };
      LS.set('profile', Object.assign(LS.get('profile', {}), prof));
      renderDaily(prof);
      toast('あなた個人の今日の運勢に切り替えました');
    };
    $('#dGo').onclick = apply;
    const p = LS.get('profile', null);
    if (p && p.y){ y.value = p.y; m.value = p.m; fill(); dd.value = p.d; renderDaily(p); }
    else renderDaily(null);
    if (!LS.get('dev', null)) LS.set('dev', 'g'+Math.random().toString(36).slice(2,9));
  })();

  /* ================= メニュー一覧 ================= */
  const MENU_BY_ID = {}; D.MENUS.forEach(m => MENU_BY_ID[m.id] = m);
  const EASE_LABEL = { tarot:'札を選ぶだけ', natal:'生年月日だけ', compat:'生年月日ふたつ', seimei:'名前だけ' };

  function menuCard(m){
    const tags = (m.tags||[]).map(t =>
      '<span class="badge '+(t==='人気'?'hot':t==='入力なし'||t==='10秒'?'easy':'')+'">'+t+'</span>').join('');
    return '<button class="mcard rv" data-menu="'+m.id+'">' +
      '<div class="mcard-top"><span class="mcard-ic">'+m.ic+'</span>' +
      '<div class="mcard-badges"><span class="badge free">無料で読める</span>'+tags+'</div></div>' +
      '<h3>'+esc(m.t)+'</h3>' +
      '<p class="catch">'+esc(m.c)+'</p>' +
      '<p class="desc">'+esc(m.d)+'</p>' +
      '<div class="foot"><span>'+EASE_LABEL[m.e]+'</span><span class="go">視てもらう</span></div></button>';
  }
  let curGenre = 'all';
  function renderMenus(){
    const list = curGenre === 'all' ? D.MENUS : D.MENUS.filter(m => m.g === curGenre);
    const g = $('#mgrid');
    g.innerHTML = list.map(menuCard).join('');
    watch(g);
    requestAnimationFrame(() => $$('.mcard', g).forEach(el => el.classList.add('in')));
  }
  (function tabs(){
    const t = $('#tabs');
    t.innerHTML = D.GENRES.map(g => {
      const n = g.id === 'all' ? D.MENUS.length : D.MENUS.filter(m => m.g === g.id).length;
      return '<button class="tab'+(g.id==='all'?' on':'')+'" data-g="'+g.id+'">'+g.sym+'　'+g.jp+'<span class="n">'+n+'</span></button>';
    }).join('');
    t.addEventListener('click', e => {
      const b = e.target.closest('.tab'); if (!b) return;
      $$('.tab', t).forEach(x => x.classList.toggle('on', x === b));
      curGenre = b.dataset.g; renderMenus();
    });
    renderMenus();
  })();

  /* ================= 人気ランキング ================= */
  (function rank(){
    const top = D.MENUS.filter(m => (m.tags||[]).includes('人気')).slice(0,5);
    $('#rank').innerHTML = top.map((m,i) =>
      '<button class="rank-item rv d'+(i+1)+'" data-menu="'+m.id+'">' +
      '<span class="rank-n">'+(i+1)+'</span>' +
      '<span><span class="rank-ttl">'+esc(m.t)+'</span><span class="rank-ct">'+esc(m.c)+'</span></span>' +
      '<span class="rank-go">'+EASE_LABEL[m.e]+' →</span></button>').join('');
    watch($('#rank'));
  })();

  /* ================= 占い師・体験談 ================= */
  (function tellers(){
    const P = '<svg viewBox="0 0 120 160" fill="none" stroke="currentColor" stroke-width=".9">' +
      '<path d="M60 36c14 0 22 10 22 24 0 16-10 28-22 28s-22-12-22-28c0-14 8-24 22-24z"/>' +
      '<path d="M18 148c0-24 19-38 42-38s42 14 42 38" opacity=".8"/>' +
      '<path d="M60 12v14M46 20l5 9M74 20l-5 9" opacity=".5"/><circle cx="60" cy="8" r="3" fill="currentColor" stroke="none"/></svg>';
    $('#tellers').innerHTML = D.TELLERS.map((t,i) =>
      '<article class="teller rv d'+(i+1)+'"><div class="teller-por">'+P+'</div>' +
      '<h3>'+t.name+'</h3><p class="ttl">'+t.title+'</p><p>'+t.bio+'</p>' +
      '<ul class="tags">'+t.tags.map(x=>'<li>'+x+'</li>').join('')+'</ul></article>').join('');
    watch($('#tellers'));
  })();

  const VOICES = [
    ['最初の一行で手が止まりました。「人前では平気な顔をしていられる人ですね」——誰にも言ったことがないのに、なぜ分かるのかと。','30代・女性','宿命鑑定','2026.07'],
    ['転機の日として出た日付に、本当に連絡が来ました。半信半疑だったぶん、鳥肌が立ちました。','40代・男性','転機の日 特定鑑定','2026.06'],
    ['名前だけで、あそこまで言い当てられるとは思っていませんでした。総格の話は、母に見せたら泣いていました。','20代・女性','姓名判断','2026.08'],
    ['タロットは入力もいらないので、通勤中に引いています。毎朝これを見ないと落ち着かなくなりました。','30代・女性','今日引くべき一枚','2026.08'],
    ['相手の本音の章で、「確かめる質問を重ねるな」と書かれていて、まさに自分がやっていたことでした。やめたら関係が変わりました。','20代・男性','あの人の本音','2026.05'],
    ['影の章は正直つらかったです。でも、あそこまで言ってくれる占いは初めてでした。読んでよかったです。','50代・女性','影の章','2026.04']
  ];
  (function voices(){
    $('#voices').innerHTML = VOICES.map(([q,who,menu,date],i) =>
      '<article class="voice rv d'+((i%3)+1)+'"><span class="qm">&ldquo;</span><p>'+q+'</p>' +
      '<div class="who"><b>'+who+'</b><span class="stars">★★★★★</span><span>'+menu+'　'+date+'</span></div></article>').join('');
    watch($('#voices'));
  })();

  /* =======================================================
     鑑定オーバーレイ
     ======================================================= */
  const reader = $('#reader'), rBody = $('#rBody'), rTtl = $('#rTtl'), rKind = $('#rKind');
  let CUR = null;                       // { menu, ctx, doc }
  const unlocked = () => LS.get('unlocked', {});
  const isUnlocked = id => !!unlocked()[id];

  function openReader(menu){
    CUR = { menu, ctx:null, doc:null };
    rTtl.textContent = menu.t;
    rKind.textContent = (D.TELLERS.find(t => t.id === menu.teller) || {}).name + '　監修';
    reader.classList.add('on');
    document.body.classList.add('locked');
    rBody.scrollTop = 0;
    if (menu.e === 'tarot') renderPick(menu); else renderAsk(menu);
    $('.reader-close').focus();
  }
  function closeReader(){
    reader.classList.remove('on');
    document.body.classList.remove('locked');
    CUR = null;
  }
  $('.reader-close').addEventListener('click', closeReader);
  addEventListener('keydown', e => { if (e.key === 'Escape' && reader.classList.contains('on')) closeReader(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-menu]'); if (!b) return;
    const m = MENU_BY_ID[b.dataset.menu]; if (m) openReader(m);
  });

  /* ---------- 入力画面 ---------- */
  function dateSelects(pre, label, req){
    const ty = NOW.getFullYear();
    const years = Array.from({length:ty-1929},(_,i)=>ty-i).map(v=>'<option>'+v+'</option>').join('');
    const months = Array.from({length:12},(_,i)=>'<option>'+(i+1)+'</option>').join('');
    return '<div><p class="flabel">'+label+(req?' <span class="sub">必須</span>':'')+'</p>' +
      '<div class="frow">' +
      '<select class="inp" id="'+pre+'Y"><option value="">年</option>'+years+'</select>' +
      '<select class="inp" id="'+pre+'M"><option value="">月</option>'+months+'</select>' +
      '<select class="inp" id="'+pre+'D"><option value="">日</option></select></div></div>';
  }
  function bindDays(pre){
    const y = $('#'+pre+'Y'), m = $('#'+pre+'M'), d = $('#'+pre+'D');
    const fill = () => {
      const dim = new Date(+y.value||2000, +m.value||1, 0).getDate(), cur = d.value;
      d.innerHTML = '<option value="">日</option>' + Array.from({length:dim},(_,i)=>'<option>'+(i+1)+'</option>').join('');
      if (cur && +cur <= dim) d.value = cur;
    };
    fill(); y.onchange = fill; m.onchange = fill;
    return { y, m, d };
  }
  function askHead(menu){
    const t = D.TELLERS.find(x => x.id === menu.teller) || {};
    return '<div class="ask-head"><div class="ask-ic">'+menu.ic+'</div>' +
      '<h2>'+esc(menu.t)+'</h2><p class="catch">'+esc(menu.c)+'</p>' +
      '<p class="by">'+(t.name||'')+'　'+(t.title||'')+'</p></div>';
  }
  const LOCKNOTE = '<p class="ask-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
    '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>' +
    '入力はこの端末の中だけで処理されます</p>';

  function renderAsk(menu){
    const prof = LS.get('profile', {});
    let fields = '';
    if (menu.e === 'natal'){
      fields = '<div class="fset">' +
        '<div><p class="flabel">お名前・ニックネーム <span class="sub">任意</span></p>' +
        '<input class="inp" id="aName" maxlength="16" placeholder="例：ゆき" value="'+esc(prof.name||'')+'"></div>' +
        dateSelects('a', '生年月日', true) + '</div>';
    } else if (menu.e === 'compat'){
      fields = '<div class="fset"><p class="flabel">あなたのこと</p>' +
        dateSelects('a', '生年月日', true) + '</div>' +
        '<div class="fset"><p class="flabel">お相手のこと</p>' +
        '<div><p class="flabel">お相手のお名前 <span class="sub">任意</span></p>' +
        '<input class="inp" id="bName" maxlength="16" placeholder="例：しゅん"></div>' +
        dateSelects('b', 'お相手の生年月日', true) + '</div>';
    } else {
      const pair = !!menu.pair;
      fields = '<div class="fset"><p class="flabel">お名前を<span class="sub">ひらがな</span>で</p>' +
        '<div class="f2"><input class="inp" id="sSei" maxlength="10" placeholder="せい（例：やまだ）">' +
        '<input class="inp" id="sMei" maxlength="10" placeholder="めい（例：はなこ）"></div>' +
        '<p class="fhint">かなの画数で鑑定します。濁点・半濁点もそのまま入れてください。</p></div>' +
        (pair ? '<div class="fset"><p class="flabel">お相手のお名前を<span class="sub">ひらがな</span>で</p>' +
        '<div class="f2"><input class="inp" id="tSei" maxlength="10" placeholder="せい">' +
        '<input class="inp" id="tMei" maxlength="10" placeholder="めい"></div></div>' : '');
    }
    rBody.innerHTML = '<div class="wrap-narrow">' + askHead(menu) +
      '<div class="ask-box">' + fields +
      '<p class="ferr" id="askErr"></p>' +
      '<div class="ask-foot"><button class="btn btn-gold btn-block btn-lg" id="askGo">鑑定をはじめる</button>' +
      LOCKNOTE + '</div></div></div>';

    if (menu.e === 'natal' || menu.e === 'compat'){
      const a = bindDays('a');
      if (prof.y){ a.y.value = prof.y; a.m.value = prof.m; a.y.onchange(); a.d.value = prof.d; }
      if (menu.e === 'compat') bindDays('b');
    }
    $('#askGo').onclick = () => submitAsk(menu);
    rBody.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList.contains('inp')) submitAsk(menu); });
  }

  function submitAsk(menu){
    const err = $('#askErr'); err.textContent = '';
    const ctx = { now:NOW };
    if (menu.e === 'natal' || menu.e === 'compat'){
      const y = +$('#aY').value, m = +$('#aM').value, d = +$('#aD').value;
      if (!y || !m || !d){ err.textContent = '生年月日をお選びください。'; return; }
      const name = ($('#aName') ? $('#aName').value.trim().slice(0,16) : '');
      LS.set('profile', { name, y, m, d });
      ctx.chart = E.buildChart({ name, y, m, d, hour:null }, NOW);
      if (menu.e === 'compat'){
        const y2 = +$('#bY').value, m2 = +$('#bM').value, d2 = +$('#bD').value;
        if (!y2 || !m2 || !d2){ err.textContent = 'お相手の生年月日をお選びください。'; return; }
        ctx.chart2 = E.buildChart({ name:$('#bName').value.trim().slice(0,16), y:y2, m:m2, d:d2, hour:null }, NOW);
        ctx.compat = E.compatibility(ctx.chart, ctx.chart2);
      }
    } else {
      const sei = $('#sSei').value.trim(), mei = $('#sMei').value.trim();
      if (!sei || !mei){ err.textContent = '姓と名の両方をひらがなでご入力ください。'; return; }
      const s = E.seimeiChart(sei, mei);
      if (!s){ err.textContent = 'ひらがなで入力してください（漢字・英数は読み取れません）。'; return; }
      ctx.seimei = s;
      if (menu.pair){
        const s2 = E.seimeiChart($('#tSei').value.trim(), $('#tMei').value.trim());
        if (!s2){ err.textContent = 'お相手のお名前も、ひらがなでご入力ください。'; return; }
        ctx.seimei2 = s2;
      }
    }
    runCasting(menu, ctx);
  }

  /* ---------- 札を選ぶ ---------- */
  const PICK_ART = '<svg viewBox="0 0 60 96" fill="none" stroke="currentColor" stroke-width=".9">' +
    '<rect x="4" y="4" width="52" height="88" rx="4" opacity=".5"/>' +
    '<circle cx="30" cy="48" r="16" opacity=".7"/>' +
    '<path d="M30 35l3 8.7L42 47l-9 3.3L30 60l-3-9.7L18 47l9-3.3z" fill="currentColor" stroke="none"/>' +
    '<path d="M30 13v7M30 76v7M13 48h7M40 48h7" opacity=".45"/></svg>';
  function renderPick(menu){
    const n = menu.n || 1, total = 9;
    rBody.innerHTML = '<div class="wrap-narrow">' + askHead(menu) +
      '<p class="pick-msg">心を静めて、<em class="hl">'+n+'枚</em>お選びください。<br>考えず、目に留まったものを。</p>' +
      '<div class="pick-row" id="pickRow">' +
      Array.from({length:total},(_,i)=>'<button class="pick" data-i="'+i+'" aria-label="'+(i+1)+'枚目">'+PICK_ART+'</button>').join('') +
      '</div><p class="c small mt-m" id="pickCount">あと '+n+' 枚</p></div>';
    const chosen = [];
    $('#pickRow').addEventListener('click', e => {
      const b = e.target.closest('.pick'); if (!b || b.classList.contains('chosen')) return;
      b.classList.add('chosen'); chosen.push(+b.dataset.i);
      $('#pickCount').textContent = chosen.length >= n ? '札を読みます…' : 'あと ' + (n - chosen.length) + ' 枚';
      if (chosen.length >= n){
        $$('.pick').forEach(x => { if (!x.classList.contains('chosen')) x.disabled = true; });
        const seedStr = menu.id + '|' + E.ymdKey(NOW) + '|' + chosen.join(',') + '|' + (LS.get('dev','') || '');
        const ctx = { now:NOW, draw:E.drawCards(seedStr, n), seed:E.hash32(seedStr),
          code:'TR-' + String(E.hash32(seedStr) % 100000).padStart(5,'0') };
        setTimeout(() => runCasting(menu, ctx), 700);
      }
    });
  }

  /* ---------- 鑑定中 ---------- */
  const CAST = {
    natal:['星の位置を確かめています…','運命数を還元しています…','干支と五行の配分を測っています…','月齢を計算しています…','言葉を選んでいます…'],
    compat:['おふたりの命式を並べています…','気の流れを読んでいます…','星の距離を測っています…','縁の糸をたどっています…','言葉を選んでいます…'],
    tarot:['札を切っています…','選ばれた札を開いています…','配置の意味を読んでいます…','言葉を選んでいます…'],
    seimei:['画数を数えています…','五格を立てています…','三才の配置を見ています…','言葉を選んでいます…']
  };
  function runCasting(menu, ctx){
    const msgs = CAST[menu.e] || CAST.natal;
    rBody.innerHTML = '<div class="wrap-narrow"><div class="casting">' +
      '<svg class="cast-ring" viewBox="0 0 200 200" fill="none">' +
      '<circle cx="100" cy="100" r="92" stroke="#c9a253" stroke-width=".6" opacity=".3"/>' +
      '<g class="sp"><circle cx="100" cy="100" r="78" stroke="#c9a253" stroke-width=".8" stroke-dasharray="4 12" opacity=".7"/>' +
      '<circle cx="100" cy="22" r="3.4" fill="#fdf3d4"/></g>' +
      '<g class="sp-r"><circle cx="100" cy="100" r="56" stroke="#8a5fb8" stroke-width="1" stroke-dasharray="30 14" opacity=".75"/>' +
      '<circle cx="156" cy="100" r="2.6" fill="#e2c27f"/></g>' +
      '<path d="M100 58l7.4 21.6L129 87l-21.6 7.4L100 116l-7.4-21.6L71 87l21.6-7.4z" fill="#cfa css" opacity=".9"/>' +
      '<path d="M100 58l7.4 21.6L129 87l-21.6 7.4L100 116l-7.4-21.6L71 87l21.6-7.4z" fill="#e2c27f" opacity=".9"/>' +
      '</svg><p class="cast-msg" id="castMsg">'+msgs[0]+'</p>' +
      '<div class="cast-bar"><i id="castBar"></i></div></div></div>';
    const total = REDUCED ? 300 : 2500, t0 = performance.now();
    (function tick(t){
      const k = Math.min(1, (t - t0)/total);
      $('#castBar').style.width = (k*100)+'%';
      $('#castMsg').textContent = msgs[Math.min(msgs.length-1, Math.floor(k*msgs.length))];
      if (k < 1) requestAnimationFrame(tick);
      else { CUR = { menu, ctx, doc:W.compose(menu, ctx) }; renderResult(); saveHistory(menu, ctx); }
    })(t0);
  }

  /* =======================================================
     鑑定結果の描画
     ======================================================= */
  const SEAL = '<svg class="res-seal" viewBox="0 0 120 120" fill="none">' +
    '<circle cx="60" cy="60" r="55" stroke="#c9a253" stroke-width=".8" opacity=".7"/>' +
    '<circle cx="60" cy="60" r="46" stroke="#c9a253" stroke-width=".5" opacity=".4" stroke-dasharray="2 6"/>' +
    '<circle cx="60" cy="60" r="34" stroke="#8a5fb8" stroke-width=".9" opacity=".65"/>' +
    '<path d="M60 24l5.6 16.4L82 46l-16.4 5.6L60 68l-5.6-16.4L38 46l16.4-5.6z" fill="#e2c27f"/>' +
    '<path d="M38 80h44M45 88h30" stroke="#c9a253" stroke-width=".7" opacity=".5"/></svg>';

  function radarSVG(bal){
    const keys = ['木','火','土','金','水'], R = 84, cx = 118, cy = 112;
    const pt = (i,r) => { const a = i/5*6.2832 - 1.5708; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; };
    let g = '';
    [.25,.5,.75,1].forEach(f => { g += '<polygon points="'+keys.map((_,i)=>pt(i,R*f).map(n=>n.toFixed(1)).join(',')).join(' ')+
      '" fill="none" stroke="rgba(242,222,187,.13)" stroke-width=".7"/>'; });
    keys.forEach((_,i) => { const p = pt(i,R); g += '<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="rgba(242,222,187,.13)" stroke-width=".7"/>'; });
    const poly = keys.map((k,i)=>pt(i,R*(bal[k]/100)).map(n=>n.toFixed(1)).join(',')).join(' ');
    const dots = keys.map((k,i)=>{ const p = pt(i,R*(bal[k]/100)); return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3" fill="#fdf3d4"/>'; }).join('');
    const lb = keys.map((k,i)=>{ const p = pt(i,R+20);
      return '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+5).toFixed(1)+'" text-anchor="middle" font-size="14" fill="#e2c27f">'+k+'</text>' +
        '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+19).toFixed(1)+'" text-anchor="middle" font-size="9" fill="#776e60" font-family="Cormorant Garamond,serif">'+bal[k]+'</text>'; }).join('');
    return '<svg viewBox="0 0 236 244" role="img" aria-label="五行バランス図" style="max-width:330px;margin:0 auto">' +
      '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#c9a253" stop-opacity=".55"/><stop offset="100%" stop-color="#8a5fb8" stop-opacity=".5"/></linearGradient></defs>' +
      g + '<polygon points="'+poly+'" fill="url(#rg)" stroke="#f2debb" stroke-width="1.2"/>' + dots + lb + '</svg>';
  }
  function lineSVG(months){
    const W = 720, H = 236, PL = 32, PR = 14, PT = 20, PB = 38;
    const iw = W-PL-PR, ih = H-PT-PB;
    const x = i => PL + i/(months.length-1)*iw, y = v => PT + ih - v/100*ih;
    let g = '';
    [0,25,50,75,100].forEach(v => { g += '<line x1="'+PL+'" y1="'+y(v).toFixed(1)+'" x2="'+(W-PR)+'" y2="'+y(v).toFixed(1)+'" stroke="rgba(242,222,187,.1)" stroke-width=".7"/>' +
      '<text x="'+(PL-7)+'" y="'+(y(v)+3.5).toFixed(1)+'" text-anchor="end" font-size="9" fill="#776e60" font-family="Cormorant Garamond,serif">'+v+'</text>'; });
    const pts = months.map((m,i)=>[x(i),y(m.score)]);
    let d = 'M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for (let i=1;i<pts.length;i++){ const p0=pts[i-1],p1=pts[i],mx=(p0[0]+p1[0])/2;
      d += ' C'+mx.toFixed(1)+' '+p0[1].toFixed(1)+','+mx.toFixed(1)+' '+p1[1].toFixed(1)+','+p1[0].toFixed(1)+' '+p1[1].toFixed(1); }
    const area = d+' L'+pts[pts.length-1][0].toFixed(1)+' '+(PT+ih)+' L'+pts[0][0].toFixed(1)+' '+(PT+ih)+' Z';
    const bi = months.indexOf(months.reduce((a,b)=>b.score>a.score?b:a));
    const dots = months.map((m,i)=>'<circle cx="'+x(i).toFixed(1)+'" cy="'+y(m.score).toFixed(1)+'" r="'+(i===bi?4.6:2.8)+'" fill="'+(i===bi?'#fdf3d4':'#c9a253')+'"/>').join('');
    const lbs = months.map((m,i)=>'<text x="'+x(i).toFixed(1)+'" y="'+(H-14)+'" text-anchor="middle" font-size="9.5" fill="'+(i===bi?'#f2debb':'#776e60')+'">'+m.label+'</text>').join('');
    return '<div style="overflow-x:auto"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="十二ヶ月の運勢曲線" style="min-width:590px">' +
      '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#c9a253" stop-opacity=".4"/><stop offset="100%" stop-color="#c9a253" stop-opacity="0"/></linearGradient></defs>' +
      g+'<path d="'+area+'" fill="url(#lg)"/><path d="'+d+'" fill="none" stroke="#f2debb" stroke-width="1.8" stroke-linecap="round"/>'+dots+lbs+
      '<line x1="'+x(bi).toFixed(1)+'" y1="'+PT+'" x2="'+x(bi).toFixed(1)+'" y2="'+(PT+ih)+'" stroke="#fdf3d4" stroke-width=".7" stroke-dasharray="3 4" opacity=".6"/></svg></div>';
  }
  function cardsHTML(draw, pos){
    return '<div class="drawn'+(draw.length===5?' five':'')+'">' + draw.map((x,i)=>{
      const side = x.rev ? x.card.rv : x.card.up;
      return '<div><button class="dcard" aria-label="'+pos[i]+'の札">' +
        '<div class="dcard-in"><div class="dcard-f dcard-b">'+PICK_ART.replace('currentColor','#c9a253')+'</div>' +
        '<div class="dcard-f dcard-fr"><span class="pos">'+pos[i]+'</span>' +
        '<span class="rn">'+x.card.rn+'</span><span class="nm">'+x.card.jp+'</span>' +
        '<span class="en">'+x.card.en+'</span>' +
        '<span class="rv'+(x.rev?' r':'')+'">'+(x.rev?'逆位置':'正位置')+'</span></div></div></button>' +
        '<p class="dcard-note">'+side.kw+'</p></div>';
    }).join('') + '</div>';
  }
  function chartHTML(ch){
    if (!ch) return '';
    if (ch.type === 'radar'){
      const bars = Object.entries(ch.data).sort((a,b)=>b[1]-a[1]).map(([k,v]) =>
        '<div class="bar-r"><span>'+k+'（'+D.ELEMENTS[k].en+'）</span><span class="bar-tr"><i class="bar-fl" data-w="'+v+'"></i></span><span class="v">'+v+'</span></div>').join('');
      return '<div class="chart-box"><div class="chart-t">五行バランス<span>木火土金水の配分</span></div>'+radarSVG(ch.data)+bars+'</div>';
    }
    if (ch.type === 'line')
      return '<div class="chart-box"><div class="chart-t">十二ヶ月の運勢曲線<span>身体23日・感情28日・知性33日の周期</span></div>'+lineSVG(ch.data)+'</div>';
    if (ch.type === 'cards') return cardsHTML(ch.data, ch.pos);
    return '';
  }
  const secHTML = s => '<section class="res-sec"><div class="res-h"><span class="n">'+s.no+'</span><h3>'+s.title+'</h3>' +
    '<span class="ln"></span><span class="n" style="font-family:Cormorant Garamond,serif;font-style:italic">'+(s.en||'')+'</span></div>' +
    '<div class="res-body">'+s.html+chartHTML(s.chart)+'</div></section>';

  function renderResult(){
    const { menu, doc } = CUR;
    const open = isUnlocked(menu.id);
    let h = '<div class="wrap-narrow"><div class="res">';

    h += '<div class="res-hero">'+SEAL+'<p class="kind">'+doc.head.kind+'</p><h2>'+esc(doc.head.title)+'</h2>' +
      '<p class="for">'+esc(doc.head.forWhom)+'</p>' +
      (doc.head.code ? '<span class="code">'+esc(doc.head.code)+'</span>' : '') + '</div>';
    if (doc.head.pillars && doc.head.pillars.length)
      h += '<div class="pillars">' + doc.head.pillars.map(([g,k,v,s]) =>
        '<div class="pil"><div class="g">'+g+'︎</div><p class="k">'+k+'</p><p class="v">'+v+'</p><p class="s">'+s+'</p></div>').join('') + '</div>';

    h += doc.free.map(secHTML).join('');

    if (open){
      h += doc.paid.map(secHTML).join('');
      h += '<div class="res-end">' + nextUpHTML(menu) +
        '<div class="res-actions">' +
        '<button class="btn btn-ghost btn-sm" id="resPrint">印刷 / PDF保存</button>' +
        '<button class="btn btn-ghost btn-sm" id="resAgain">条件を変えて視る</button>' +
        '<button class="btn btn-ghost btn-sm" id="resClose">閉じる</button></div></div>';
    } else {
      const first = doc.paid[0];
      h += '<div class="fadeout"><div class="clip">'+secHTML(first)+'</div><div class="veil"></div></div>';
      h += gateHTML(doc);
      h += '<div class="res-end">' + nextUpHTML(menu) + '</div>';
    }
    h += '</div></div>';
    rBody.innerHTML = h;
    rBody.scrollTop = 0;
    afterResult();
  }

  function gateHTML(doc){
    const g = doc.gate, p = doc.price;
    return '<div class="gate" id="gate">' +
      '<div class="gate-key"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3">' +
      '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>' +
      '<circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none"/></svg></div>' +
      '<p class="gate-lead">'+g.lead+'</p>' +
      '<h3 class="gate-h">'+g.h+'</h3>' +
      '<p class="gate-why">'+g.why+'</p>' +
      '<ul class="gate-list">'+g.list.map(x=>'<li>'+x+'</li>').join('')+'</ul>' +
      '<div class="gate-buy">' +
      '<button class="buy-main" data-buy="single"><span>この鑑定を最後まで読む</span><span class="p">¥'+p.single+'<small>（税込）</small></span></button>' +
      '<button class="buy-sub" data-buy="pass">すべての鑑定が読み放題　<b>月額 ¥'+p.pass.toLocaleString('ja-JP')+'</b>　いつでも解約できます</button>' +
      '</div>' +
      '<p class="gate-fine">※ 単品は買い切りです。一度お読みいただいた鑑定は、この端末でいつでも読み返せます。</p>' +
      '<div class="gate-demo"><b>これはデモサイトです。</b>決済は実装されておらず、課金は発生しません。' +
      'ボタンを押すと、購入後にお読みいただける内容がそのまま表示されます。</div>' +
      '</div>';
  }

  function nextUpHTML(menu){
    const pool = D.MENUS.filter(m => m.id !== menu.id);
    const same = pool.filter(m => m.g === menu.g), other = pool.filter(m => m.g !== menu.g);
    const pick = same.slice(0,2).concat(other.filter(m => (m.tags||[]).includes('人気')).slice(0,2)).slice(0,4);
    return '<div class="nextup"><h4>この鑑定を受けた方は、次にこちらも視ています</h4><div class="row">' +
      pick.map(m => '<button data-menu="'+m.id+'">'+esc(m.t)+'<span>'+esc(m.c)+'</span></button>').join('') +
      '</div></div>';
  }

  function afterResult(){
    requestAnimationFrame(() => $$('.bar-fl', rBody).forEach(b => { b.style.width = b.dataset.w + '%'; }));
    $$('.dcard', rBody).forEach((btn,i) => {
      btn.addEventListener('click', () => btn.classList.toggle('flip'));
      if (REDUCED) btn.classList.add('flip');
      else setTimeout(() => btn.classList.add('flip'), 420 + i*230);
    });
    $$('[data-buy]', rBody).forEach(b => b.addEventListener('click', () => doUnlock(b.dataset.buy)));
    const pr = $('#resPrint'); if (pr) pr.onclick = () => print();
    const ag = $('#resAgain'); if (ag) ag.onclick = () => {
      if (CUR.menu.e === 'tarot') renderPick(CUR.menu); else renderAsk(CUR.menu);
    };
    const cl = $('#resClose'); if (cl) cl.onclick = closeReader;
  }

  function doUnlock(kind){
    const u = unlocked();
    if (kind === 'pass') D.MENUS.forEach(m => u[m.id] = true);
    else u[CUR.menu.id] = true;
    LS.set('unlocked', u);
    renderResult();
    toast(kind === 'pass' ? 'すべての鑑定が開きました（デモ表示）' : 'この鑑定の続きが開きました（デモ表示）');
    setTimeout(() => {
      const secs = $$('.res-sec', rBody);
      const t = secs[CUR.doc.free.length] || rBody;
      t.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block:'start' });
    }, 120);
  }

  /* ---------- 履歴 ---------- */
  function saveHistory(menu, ctx){
    const h = LS.get('hist', []);
    h.unshift({ id:menu.id, t:menu.t, at:NOW.toISOString() });
    LS.set('hist', h.filter((x,i,a) => a.findIndex(z => z.id === x.id) === i).slice(0,8));
    renderHistory();
  }
  function renderHistory(){
    const h = LS.get('hist', []), box = $('#histBox');
    if (!box) return;
    if (!h.length){ box.classList.add('hide'); return; }
    box.classList.remove('hide');
    $('#histRow').innerHTML = h.map(x =>
      '<button data-menu="'+x.id+'">'+esc(x.t)+'<span>'+x.at.slice(0,10).replace(/-/g,'.')+
      (isUnlocked(x.id) ? '　/　購入済み' : '　/　続きは未読')+'</span></button>').join('');
  }
  renderHistory();

  /* ---------- CTA ---------- */
  $$('[data-open-first]').forEach(b => b.addEventListener('click', () => {
    openReader(MENU_BY_ID[b.dataset.openFirst] || D.MENUS[0]);
  }));
})();
