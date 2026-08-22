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

    // iOS Safari は overflow:hidden だけでは背景タッチスクロールを止めない。
    // スクロール位置を固定して body ごと止め、閉じたら復元する。
    let savedY = 0;
    function openNav(){
      savedY = scrollY;
      document.body.style.top = -savedY + 'px';
      document.body.classList.add('nav-open');
      tg.setAttribute('aria-expanded', 'true');
    }
    function closeNav(){
      document.body.classList.remove('nav-open');
      document.body.style.top = '';
      scrollTo(0, savedY);
      tg.setAttribute('aria-expanded', 'false');
    }
    tg.addEventListener('click', () => {
      document.body.classList.contains('nav-open') ? closeNav() : openNav();
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) closeNav(); });
    $('#navScrim').addEventListener('click', closeNav);
    addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeNav(); });
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
      toast('あなたの相に、切り替えました');
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
      '<span class="badge '+(t==='全部無料'?'allfree':t==='人気'?'hot':t==='手ぶら'||t==='10秒'?'easy':'')+'">'+t+'</span>').join('');
    const hakke = ['☰','☱','☲','☳','☴','☵','☶','☷'][Math.abs(E.hash32(m.id)) % 8];
    return '<button class="mcard rv" data-menu="'+m.id+'">' +
      '<i class="tome" aria-hidden="true"></i><span class="kado" aria-hidden="true">'+hakke+'</span>' +
      '<div class="mcard-top"><span class="mcard-ic">'+m.ic+'</span>' +
      '<div class="mcard-badges">'+(m.free?'':'<span class="badge free">無料で試す</span>')+tags+'</div></div>' +
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
    rKind.textContent = (D.TELLERS.find(t => t.id === menu.teller) || {}).name + '　視';
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
    '入力は、この端末の中だけ</p>';

  function renderAsk(menu){
    const prof = LS.get('profile', {});
    let fields = '';
    if (menu.e === 'natal'){
      fields = '<div class="fset">' +
        '<div><p class="flabel">お名前 <span class="sub">任意</span></p>' +
        '<input class="inp" id="aName" maxlength="16" placeholder="例：ゆき" value="'+esc(prof.name||'')+'"></div>' +
        dateSelects('a', '生年月日', true) + '</div>';
    } else if (menu.e === 'compat'){
      fields = '<div class="fset"><p class="flabel">あなた</p>' +
        dateSelects('a', '生年月日', true) + '</div>' +
        '<div class="fset"><p class="flabel">お相手</p>' +
        '<div><p class="flabel">お相手の名 <span class="sub">任意</span></p>' +
        '<input class="inp" id="bName" maxlength="16" placeholder="例：しゅん"></div>' +
        dateSelects('b', 'お相手の生年月日', true) + '</div>';
    } else {
      const pair = !!menu.pair;
      fields = '<div class="fset"><p class="flabel">名を<span class="sub">ひらがな</span>で</p>' +
        '<div class="f2"><input class="inp" id="sSei" maxlength="10" placeholder="せい（例：やまだ）">' +
        '<input class="inp" id="sMei" maxlength="10" placeholder="めい（例：はなこ）"></div>' +
        '<p class="fhint">かなの画数で視ます。濁点・半濁点もそのまま。</p></div>' +
        (pair ? '<div class="fset"><p class="flabel">お相手の名を<span class="sub">ひらがな</span>で</p>' +
        '<div class="f2"><input class="inp" id="tSei" maxlength="10" placeholder="せい">' +
        '<input class="inp" id="tMei" maxlength="10" placeholder="めい"></div></div>' : '');
    }
    rBody.innerHTML = '<div class="wrap-narrow">' + askHead(menu) +
      '<div class="ask-box">' + fields +
      '<p class="ferr" id="askErr"></p>' +
      '<div class="ask-foot"><button class="btn btn-gold btn-block btn-lg" id="askGo">視てもらう</button>' +
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
      if (!y || !m || !d){ err.textContent = '生年月日をお選びください'; return; }
      const name = ($('#aName') ? $('#aName').value.trim().slice(0,16) : '');
      LS.set('profile', { name, y, m, d });
      ctx.chart = E.buildChart({ name, y, m, d, hour:null }, NOW);
      if (menu.e === 'compat'){
        const y2 = +$('#bY').value, m2 = +$('#bM').value, d2 = +$('#bD').value;
        if (!y2 || !m2 || !d2){ err.textContent = 'お相手の生年月日をお選びください'; return; }
        ctx.chart2 = E.buildChart({ name:$('#bName').value.trim().slice(0,16), y:y2, m:m2, d:d2, hour:null }, NOW);
        ctx.compat = E.compatibility(ctx.chart, ctx.chart2);
      }
    } else {
      const sei = $('#sSei').value.trim(), mei = $('#sMei').value.trim();
      if (!sei || !mei){ err.textContent = '姓と名を、ひらがなで'; return; }
      const s = E.seimeiChart(sei, mei);
      if (!s){ err.textContent = 'ひらがなでご入力ください（漢字・英数は読めません）'; return; }
      ctx.seimei = s;
      if (menu.pair){
        const s2 = E.seimeiChart($('#tSei').value.trim(), $('#tMei').value.trim());
        if (!s2){ err.textContent = 'お相手の名も、ひらがなで'; return; }
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
      '<p class="pick-msg">心を静めて、<em class="hl">'+n+'枚</em>。<br>考えず、目に留まったものを。</p>' +
      '<div class="pick-row" id="pickRow">' +
      Array.from({length:total},(_,i)=>'<button class="pick" data-i="'+i+'" aria-label="'+(i+1)+'枚目の札">'+
        CARD_BACK+'<span class="pick-n">'+(i+1)+'</span></button>').join('') +
      '</div><p class="c small mt-m" id="pickCount">あと '+n+' 枚</p></div>';
    const chosen = [];
    $('#pickRow').addEventListener('click', e => {
      const b = e.target.closest('.pick'); if (!b || b.classList.contains('chosen')) return;
      b.classList.add('chosen'); chosen.push(+b.dataset.i);
      $('#pickCount').textContent = chosen.length >= n ? '札を、読む' : 'あと ' + (n - chosen.length) + ' 枚';
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
    natal:['星の位置を、確かめる','運命数を、還元する','干支と五行を、測る','月齢を、算する','言葉を、選ぶ'],
    compat:['ふたつの命式を、並べる','気の流れを、読む','星の距離を、測る','縁の糸を、たどる','言葉を、選ぶ'],
    tarot:['札を、切る','選ばれた札を、開く','配置の意味を、読む','言葉を、選ぶ'],
    seimei:['画数を、数える','五格を、立てる','三才を、視る','言葉を、選ぶ']
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


  /* ---------- 札の絵柄 ---------- */
  const CARD_BACK = '<svg class="back-art" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.1">' +
    '<circle cx="50" cy="50" r="30" opacity=".55"/><circle cx="50" cy="50" r="20" opacity=".35"/>' +
    '<path d="M50 26l5 14 14 5-14 5-5 14-5-14-14-5 14-5z" fill="currentColor" stroke="none" opacity=".85"/>' +
    '<path d="M50 6v10M50 84v10M6 50h10M84 50h10M20 20l7 7M73 73l7 7M80 20l-7 7M27 73l-7 7" opacity=".45"/></svg>';
  function cardArt(card, cls){
    const a = D.TAROT_ART[card.n] || D.TAROT_ART[0];
    return '<svg class="' + (cls || 'dcard-art') + '" viewBox="0 0 100 100" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + a + '</svg>';
  }

  /* ---------- 五行の輪（相生・相剋） ---------- */
  function elCycleSVG(dom, weak){
    const K = ['木','火','土','金','水'], R = 74, cx = 110, cy = 106;
    const pt = i => { const a = i/5*6.2832 - 1.5708; return [cx+Math.cos(a)*R, cy+Math.sin(a)*R]; };
    let out = '';
    // 相生（外周の矢印）
    for (let i=0;i<5;i++){
      const p0 = pt(i), p1 = pt((i+1)%5);
      const mx = (p0[0]+p1[0])/2, my = (p0[1]+p1[1])/2;
      const nx = (mx-cx)*0.16, ny = (my-cy)*0.16;
      out += '<path d="M'+p0[0].toFixed(1)+' '+p0[1].toFixed(1)+' Q'+(mx+nx).toFixed(1)+' '+(my+ny).toFixed(1)+
        ' '+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+'" fill="none" stroke="#c9a253" stroke-width="1.3" opacity=".75" marker-end="url(#arw)"/>';
    }
    // 相剋（内側の点線）
    for (let i=0;i<5;i++){
      const p0 = pt(i), p1 = pt((i+2)%5);
      out += '<line x1="'+p0[0].toFixed(1)+'" y1="'+p0[1].toFixed(1)+'" x2="'+p1[0].toFixed(1)+'" y2="'+p1[1].toFixed(1)+
        '" stroke="#d4506a" stroke-width=".9" stroke-dasharray="3 5" opacity=".45"/>';
    }
    // 節点
    K.forEach((k,i) => {
      const p = pt(i), isD = k===dom, isW = k===weak;
      out += '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(isD?21:16)+'" fill="'+
        (isD?'url(#elg)':'rgba(9,6,20,.95)')+'" stroke="'+(isD?'#fdf3d4':isW?'#d4506a':'#c9a253')+
        '" stroke-width="'+(isD?1.6:1)+'"'+(isW?' stroke-dasharray="3 3"':'')+'/>';
      out += '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+6).toFixed(1)+'" text-anchor="middle" font-size="'+(isD?19:15)+
        '" fill="'+(isD?'#2a1a05':isW?'#d4506a':'#e2c27f')+'" font-family="Shippori Mincho B1,serif" font-weight="600">'+k+'</text>';
      if (isD) out += '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+34).toFixed(1)+'" text-anchor="middle" font-size="9" fill="#fdf3d4" letter-spacing="1">最強</text>';
      if (isW) out += '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+30).toFixed(1)+'" text-anchor="middle" font-size="9" fill="#d4506a" letter-spacing="1">最弱</text>';
    });
    return '<div class="diagram"><p class="d-t">五行の相生・相剋図</p>' +
      '<svg viewBox="0 0 220 216" role="img" aria-label="五行の相生相剋図" style="max-width:300px">' +
      '<defs><marker id="arw" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto">' +
      '<path d="M0 0L8 4L0 8z" fill="#c9a253"/></marker>' +
      '<radialGradient id="elg"><stop offset="0%" stop-color="#fdf3d4"/><stop offset="100%" stop-color="#c9a253"/></radialGradient></defs>' +
      out + '</svg>' +
      '<div class="chart-legend"><span><i style="background:#c9a253"></i>相生（生かす流れ）</span>' +
      '<span><i style="background:#d4506a"></i>相剋（抑える流れ）</span></div>' +
      '<p class="d-n">金色の丸があなたの最も強い気、破線の丸が最も薄い気です。' +
      '<b>' + dom + '</b>を生かすのは<b>' + ({'木':'水','火':'木','土':'火','金':'土','水':'金'})[dom] + '</b>の気。' +
      '不足する<b>' + weak + '</b>を補うと、全体の巡りが整います。</p></div>';
  }

  /* ---------- 個人年の九年周期リング ---------- */
  const PY_LABEL = {1:'種まき',2:'育てる',3:'花',4:'土台',5:'変化',6:'責任',7:'内省',8:'収穫',9:'完了'};
  function pyRingSVG(py){
    const R = 78, cx = 110, cy = 110, N = 9;
    let out = '<circle cx="110" cy="110" r="96" fill="none" stroke="rgba(242,222,187,.08)" stroke-width="1"/>';
    for (let i=1;i<=N;i++){
      const a = (i-1)/N*6.2832 - 1.5708, p = [cx+Math.cos(a)*R, cy+Math.sin(a)*R];
      const cur = i === py;
      out += '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(cur?19:13)+'" fill="'+
        (cur?'url(#pyg)':'rgba(9,6,20,.92)')+'" stroke="'+(cur?'#fdf3d4':'rgba(201,162,83,.45)')+'" stroke-width="'+(cur?1.6:.9)+'"/>';
      out += '<text x="'+p[0].toFixed(1)+'" y="'+(p[1]+(cur?6:5)).toFixed(1)+'" text-anchor="middle" font-size="'+(cur?18:13)+
        '" font-family="Cormorant Garamond,serif" fill="'+(cur?'#2a1a05':'#a89d8b')+'">'+i+'</text>';
      const lp = [cx+Math.cos(a)*(R+27), cy+Math.sin(a)*(R+27)];
      out += '<text x="'+lp[0].toFixed(1)+'" y="'+(lp[1]+4).toFixed(1)+'" text-anchor="middle" font-size="10" fill="'+
        (cur?'#fdf3d4':'#776e60')+'" font-family="Shippori Mincho B1,serif">'+PY_LABEL[i]+'</text>';
    }
    // 進行方向
    out += '<circle cx="110" cy="110" r="46" fill="none" stroke="rgba(201,162,83,.28)" stroke-width=".9" stroke-dasharray="4 6"/>';
    out += '<text x="110" y="105" text-anchor="middle" font-size="11" fill="#a89d8b" letter-spacing="3">いまここ</text>';
    out += '<text x="110" y="128" text-anchor="middle" font-size="21" fill="#fdf3d4" font-family="Cormorant Garamond,serif">'+py+' / 9</text>';
    return '<div class="diagram"><p class="d-t">九年周期のいまの位置</p>' +
      '<svg viewBox="0 0 220 220" role="img" aria-label="個人年の九年周期" style="max-width:320px">' +
      '<defs><radialGradient id="pyg"><stop offset="0%" stop-color="#fdf3d4"/><stop offset="100%" stop-color="#c9a253"/></radialGradient></defs>' +
      out + '</svg><p class="d-n">運勢は九年でひと巡りします。あなたは<b>' + py + '年目「' + PY_LABEL[py] +
      '」</b>。ここで蒔いたものが、九年かけて形になります。</p></div>';
  }

  /* ---------- 姓名の五格構造図 ---------- */
  function kakuDiagram(s){
    const chars = [...s.sei].map((c,i) => ({c, v:s.seiStrokes[i], side:'sei'}))
      .concat([...s.mei].map((c,i) => ({c, v:s.meiStrokes[i], side:'mei'})));
    const W = 46, GAP = 14, PADL = 74, TOP = 56;
    const nSei = s.sei.length, nMei = s.mei.length;
    const x = i => PADL + i*W + (i >= nSei ? GAP : 0);
    const total = PADL + chars.length*W + GAP + 84;
    let out = '';
    chars.forEach((ch,i) => {
      const X = x(i);
      out += '<rect x="'+X+'" y="'+TOP+'" width="'+(W-6)+'" height="46" rx="4" fill="rgba(24,16,44,.85)" stroke="rgba(201,162,83,.4)"/>';
      out += '<text x="'+(X+(W-6)/2)+'" y="'+(TOP+30)+'" text-anchor="middle" font-size="21" fill="#fbf6ea" font-family="Shippori Mincho B1,serif">'+ch.c+'</text>';
      out += '<text x="'+(X+(W-6)/2)+'" y="'+(TOP+64)+'" text-anchor="middle" font-size="12" fill="#c9a253" font-family="Cormorant Garamond,serif">'+ch.v+'</text>';
    });
    const brace = (x1,x2,y,dir,label,val,color) => {
      const d = dir === 'up' ? -1 : 1;
      return '<path d="M'+x1+' '+y+' L'+x1+' '+(y+8*d)+' L'+x2+' '+(y+8*d)+' L'+x2+' '+y+'" fill="none" stroke="'+color+'" stroke-width="1.1"/>' +
        '<text x="'+((x1+x2)/2)+'" y="'+(y+(dir==='up'? -14 : 24))+'" text-anchor="middle" font-size="12" fill="'+color+'" font-family="Shippori Mincho B1,serif">'+label+' '+val+'</text>';
    };
    // 天格（姓）／地格（名）：上
    out += brace(x(0)+2, x(nSei-1)+W-8, TOP-4, 'up', '天格', s.ten, '#8fd6bb');
    out += brace(x(nSei)+2, x(chars.length-1)+W-8, TOP-4, 'up', '地格', s.chi, '#8fd6bb');
    // 人格：下（姓の末＋名の頭）
    out += brace(x(nSei-1)+2, x(nSei)+W-8, TOP+74, 'down', '人格', s.jin, '#fdf3d4');
    // 総格：さらに下
    out += brace(x(0)+2, x(chars.length-1)+W-8, TOP+110, 'down', '総格', s.sou, '#c9a253');
    // 外格
    out += '<text x="'+(PADL-12)+'" y="'+(TOP+30)+'" text-anchor="end" font-size="12" fill="#d4506a" font-family="Shippori Mincho B1,serif">外格</text>';
    out += '<text x="'+(PADL-12)+'" y="'+(TOP+50)+'" text-anchor="end" font-size="14" fill="#d4506a" font-family="Cormorant Garamond,serif">'+s.soto+'</text>';
    out += '<path d="M'+(PADL-8)+' '+(TOP+24)+' L'+(x(0)-4)+' '+(TOP+24)+'" stroke="#d4506a" stroke-width=".9" stroke-dasharray="3 3"/>';
    return '<div class="diagram"><p class="d-t">五格の成り立ち</p><div style="overflow-x:auto">' +
      '<svg viewBox="0 0 '+total+' 210" role="img" aria-label="五格の構造図" style="min-width:'+Math.min(total,520)+'px">' + out + '</svg></div>' +
      '<p class="d-n">各文字の下の数字が<b>かな画数</b>です。姓の合計が天格、名の合計が地格、' +
      '姓の末字と名の頭字の和が<b>人格</b>（生涯の主運）、全体の和が総格になります。</p></div>';
  }

  /* ---------- 相性：気の関係図 ---------- */
  function relationSVG(a, b, x){
    const kind = x.elGood ? '相生' : x.elBad ? '相剋' : '並立';
    const col = x.elGood ? '#8fd6bb' : x.elBad ? '#d4506a' : '#c9a253';
    const note = x.elGood ? '一方が他方を生かす、伸びやかな流れです。'
      : x.elBad ? '一方が他方を抑える配置。惹かれ合いますが、消耗も早くなります。'
      : '互いを大きく変えない、静かな並びです。';
    return '<div class="diagram"><p class="d-t">おふたりの気の関係</p>' +
      '<svg viewBox="0 0 340 150" role="img" aria-label="気の関係図" style="max-width:420px">' +
      '<defs><marker id="rel" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto">' +
      '<path d="M0 0L8 4L0 8z" fill="'+col+'"/></marker></defs>' +
      '<circle cx="66" cy="72" r="44" fill="rgba(24,16,44,.9)" stroke="#c9a253" stroke-width="1.2"/>' +
      '<text x="66" y="68" text-anchor="middle" font-size="30" fill="#fdf3d4" font-family="Shippori Mincho B1,serif">'+a.domEl+'</text>' +
      '<text x="66" y="90" text-anchor="middle" font-size="10" fill="#a89d8b">あなた</text>' +
      '<circle cx="274" cy="72" r="44" fill="rgba(24,16,44,.9)" stroke="#c9a253" stroke-width="1.2"/>' +
      '<text x="274" y="68" text-anchor="middle" font-size="30" fill="#fdf3d4" font-family="Shippori Mincho B1,serif">'+b.domEl+'</text>' +
      '<text x="274" y="90" text-anchor="middle" font-size="10" fill="#a89d8b">お相手</text>' +
      '<path d="M116 60 L222 60" stroke="'+col+'" stroke-width="1.6" marker-end="url(#rel)"'+(x.elBad?' stroke-dasharray="5 4"':'')+'/>' +
      '<path d="M222 88 L116 88" stroke="'+col+'" stroke-width="1.6" marker-end="url(#rel)" opacity=".5"'+(x.elBad?' stroke-dasharray="5 4"':'')+'/>' +
      '<text x="170" y="42" text-anchor="middle" font-size="15" fill="'+col+'" font-family="Shippori Mincho B1,serif">'+kind+'</text>' +
      '<text x="170" y="118" text-anchor="middle" font-size="26" fill="#fdf3d4" font-family="Cormorant Garamond,serif">'+x.score+'</text>' +
      '<text x="170" y="136" text-anchor="middle" font-size="9" fill="#776e60" letter-spacing="2">AFFINITY</text>' +
      '</svg><p class="d-n">'+note+'</p></div>';
  }

  function radarSVG(bal){
    const keys = ['木','火','土','金','水'], R = 84, cx = 124, cy = 134;
    const sorted = Object.entries(bal).sort((a,b)=>b[1]-a[1]);
    const dom = sorted[0][0], weak = sorted[4][0];
    const pt = (i,r) => { const a = i/5*6.2832 - 1.5708; return [cx+Math.cos(a)*r, cy+Math.sin(a)*r]; };
    let g = '';
    [.25,.5,.75,1].forEach((f,n) => {
      g += '<polygon points="'+keys.map((_,i)=>pt(i,R*f).map(v=>v.toFixed(1)).join(',')).join(' ')+
        '" fill="none" stroke="rgba(242,222,187,'+(n===3?'.22':'.11')+')" stroke-width=".8"/>';
    });
    keys.forEach((_,i)=>{ const p=pt(i,R);
      g += '<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'" stroke="rgba(242,222,187,.11)" stroke-width=".8"/>'; });
    // 目盛り
    [25,50,75,100].forEach(v=>{ const p=pt(0,R*v/100);
      g += '<text x="'+(p[0]+7)+'" y="'+(p[1]+3).toFixed(1)+'" font-size="8" fill="#5f5849" font-family="Cormorant Garamond,serif">'+v+'</text>'; });
    const poly = keys.map((k,i)=>pt(i,R*(bal[k]/100)).map(v=>v.toFixed(1)).join(',')).join(' ');
    let dots='', lb='';
    keys.forEach((k,i)=>{
      const p = pt(i, R*(bal[k]/100));
      const isD = k===dom, isW = k===weak;
      dots += '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(isD?5:isW?4.4:3.2)+'" fill="'+
        (isD?'#fdf3d4':isW?'#d4506a':'#c9a253')+'" stroke="rgba(9,6,20,.9)" stroke-width="1"/>';
      const l = pt(i, R+26);
      const col = isD?'#fdf3d4':isW?'#d4506a':'#e2c27f';
      lb += '<text x="'+l[0].toFixed(1)+'" y="'+(l[1]+2).toFixed(1)+'" text-anchor="middle" font-size="17" fill="'+col+
        '" font-family="Shippori Mincho B1,serif" font-weight="600">'+k+'</text>';
      lb += '<rect x="'+(l[0]-17).toFixed(1)+'" y="'+(l[1]+8).toFixed(1)+'" width="34" height="16" rx="8" fill="rgba(9,6,20,.85)" stroke="'+col+'" stroke-opacity=".5"/>';
      lb += '<text x="'+l[0].toFixed(1)+'" y="'+(l[1]+20).toFixed(1)+'" text-anchor="middle" font-size="11" fill="'+col+
        '" font-family="Cormorant Garamond,serif">'+bal[k]+'</text>';
    });
    return '<svg viewBox="0 0 248 282" role="img" aria-label="五行バランス図" style="max-width:348px;margin:0 auto">' +
      '<defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#c9a253" stop-opacity=".62"/><stop offset="100%" stop-color="#8a5fb8" stop-opacity=".55"/></linearGradient></defs>' +
      g + '<polygon points="'+poly+'" fill="url(#rg)" stroke="#f2debb" stroke-width="1.5"/>' + dots + lb + '</svg>';
  }
  function lineSVG(months){
    const W = 760, H = 268, PL = 40, PR = 18, PT = 26, PB = 52;
    const iw = W-PL-PR, ih = H-PT-PB;
    const x = i => PL + i/(months.length-1)*iw, y = v => PT + ih - v/100*ih;
    // 帯（追い風／横ばい／潜る）
    let g = '<rect x="'+PL+'" y="'+y(100)+'" width="'+iw+'" height="'+(y(70)-y(100))+'" fill="rgba(201,162,83,.10)"/>' +
      '<rect x="'+PL+'" y="'+y(70)+'" width="'+iw+'" height="'+(y(40)-y(70))+'" fill="rgba(242,222,187,.03)"/>' +
      '<rect x="'+PL+'" y="'+y(40)+'" width="'+iw+'" height="'+(y(0)-y(40))+'" fill="rgba(212,80,106,.09)"/>';
    [0,25,50,75,100].forEach(v => {
      g += '<line x1="'+PL+'" y1="'+y(v).toFixed(1)+'" x2="'+(W-PR)+'" y2="'+y(v).toFixed(1)+'" stroke="rgba(242,222,187,.12)" stroke-width=".7"/>' +
        '<text x="'+(PL-9)+'" y="'+(y(v)+4).toFixed(1)+'" text-anchor="end" font-size="10" fill="#776e60" font-family="Cormorant Garamond,serif">'+v+'</text>';
    });
    g += '<text x="'+(W-PR-4)+'" y="'+(y(85)+4).toFixed(1)+'" text-anchor="end" font-size="9.5" fill="rgba(226,194,127,.75)">追い風</text>' +
      '<text x="'+(W-PR-4)+'" y="'+(y(20)+4).toFixed(1)+'" text-anchor="end" font-size="9.5" fill="rgba(212,80,106,.8)">潜る時期</text>';
    const pts = months.map((m,i)=>[x(i),y(m.score)]);
    let d = 'M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for (let i=1;i<pts.length;i++){ const p0=pts[i-1],p1=pts[i],mx=(p0[0]+p1[0])/2;
      d += ' C'+mx.toFixed(1)+' '+p0[1].toFixed(1)+','+mx.toFixed(1)+' '+p1[1].toFixed(1)+','+p1[0].toFixed(1)+' '+p1[1].toFixed(1); }
    const area = d+' L'+pts[pts.length-1][0].toFixed(1)+' '+(PT+ih)+' L'+pts[0][0].toFixed(1)+' '+(PT+ih)+' Z';
    const best = months.reduce((a,b)=>b.score>a.score?b:a), worst = months.reduce((a,b)=>b.score<a.score?b:a);
    const bi = months.indexOf(best), wi = months.indexOf(worst);
    let dots='', lbs='';
    months.forEach((m,i)=>{
      const hi = i===bi, lo = i===wi;
      dots += '<circle cx="'+x(i).toFixed(1)+'" cy="'+y(m.score).toFixed(1)+'" r="'+(hi||lo?5.4:3)+'" fill="'+
        (hi?'#fdf3d4':lo?'#d4506a':'#c9a253')+'" stroke="rgba(9,6,20,.85)" stroke-width="1"/>';
      if (hi || lo){
        const col = hi?'#fdf3d4':'#d4506a', yy = y(m.score) + (hi ? -16 : 24);
        dots += '<rect x="'+(x(i)-19).toFixed(1)+'" y="'+(yy-13)+'" width="38" height="18" rx="9" fill="rgba(9,6,20,.9)" stroke="'+col+'" stroke-opacity=".6"/>' +
          '<text x="'+x(i).toFixed(1)+'" y="'+(yy+1)+'" text-anchor="middle" font-size="12" fill="'+col+'" font-family="Cormorant Garamond,serif">'+m.score+'</text>';
      }
      lbs += '<text x="'+x(i).toFixed(1)+'" y="'+(H-26)+'" text-anchor="middle" font-size="10.5" fill="'+
        (hi?'#fdf3d4':lo?'#d4506a':'#8d8474')+'" font-family="Shippori Mincho B1,serif">'+m.label+'</text>';
      if (hi) lbs += '<text x="'+x(i).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle" font-size="9" fill="#fdf3d4">最良</text>';
      if (lo) lbs += '<text x="'+x(i).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle" font-size="9" fill="#d4506a">要注意</text>';
    });
    return '<div style="overflow-x:auto"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="十二ヶ月の運勢曲線" style="min-width:620px">' +
      '<defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#c9a253" stop-opacity=".45"/><stop offset="100%" stop-color="#c9a253" stop-opacity="0"/></linearGradient></defs>' +
      g+'<path d="'+area+'" fill="url(#lg)"/><path d="'+d+'" fill="none" stroke="#f2debb" stroke-width="2" stroke-linecap="round"/>'+dots+lbs+
      '<line x1="'+x(bi).toFixed(1)+'" y1="'+PT+'" x2="'+x(bi).toFixed(1)+'" y2="'+(PT+ih)+'" stroke="#fdf3d4" stroke-width=".8" stroke-dasharray="3 4" opacity=".55"/>' +
      '<line x1="'+x(wi).toFixed(1)+'" y1="'+PT+'" x2="'+x(wi).toFixed(1)+'" y2="'+(PT+ih)+'" stroke="#d4506a" stroke-width=".8" stroke-dasharray="3 4" opacity=".45"/></svg></div>';
  }
  function cardsHTML(draw, pos){
    return '<div class="drawn'+(draw.length===5?' five':'')+'">' + draw.map((x,i)=>{
      const side = x.rev ? x.card.rv : x.card.up;
      return '<div><button class="dcard" aria-label="'+pos[i]+'の札：'+x.card.jp+'">' +
        '<div class="dcard-in"><div class="dcard-f dcard-b">'+CARD_BACK+'</div>' +
        '<div class="dcard-f dcard-fr"><span class="pos">'+pos[i]+'</span>' +
        '<span class="rn">'+x.card.rn+'</span>' +
        '<span class="dcard-art"'+(x.rev?' style="transform:rotate(180deg)"':'')+'>'+cardArt(x.card,'')+'</span>' +
        '<span class="nm">'+x.card.jp+'</span>' +
        '<span class="en">'+x.card.en+'</span>' +
        '<span class="rv'+(x.rev?' r':'')+'">'+(x.rev?'逆位置':'正位置')+'</span></div></div></button>' +
        '<p class="dcard-note">'+side.kw+'</p></div>';
    }).join('') + '</div>';
  }
  function heroCardHTML(x, label){
    const side = x.rev ? x.card.rv : x.card.up;
    return '<div class="hero-card-art"><div class="frame"'+(x.rev?' style="transform:rotate(180deg)"':'')+'>'+cardArt(x.card,'')+'</div>' +
      '<div class="meta"><p class="rn">'+(label||'結論の札')+'　'+x.card.rn+'</p>' +
      '<p class="nm">'+x.card.jp+'<span style="font-size:.62em;color:'+(x.rev?'#d4506a':'#8fd6bb')+';margin-left:.6em">'+
      (x.rev?'逆位置':'正位置')+'</span></p>' +
      '<p class="en">'+x.card.en+'</p><p class="kw">'+side.kw+'</p></div></div>';
  }
  function chartHTML(ch){
    if (!ch) return '';
    if (ch.type === 'radar'){
      const sorted = Object.entries(ch.data).sort((a,b)=>b[1]-a[1]);
      const bars = sorted.map(([k,v],idx) => {
        const top = idx===0, low = idx===sorted.length-1;
        return '<div class="bar-r"><span>'+k+'（'+D.ELEMENTS[k].en+'）</span>' +
          '<span class="bar-tr"><i class="bar-fl'+(top?' top':low?' low':'')+'" data-w="'+v+'"></i></span>' +
          '<span class="v"><b>'+v+'</b>'+(top?'<span class="tag hi">最強</span>':low?'<span class="tag lo">最弱</span>':'')+'</span></div>';
      }).join('');
      return '<div class="chart-box"><div class="chart-t">五行バランス<span>木・火・土・金・水の配分</span></div>' +
        radarSVG(ch.data) + bars +
        '<div class="chart-legend"><span><i style="background:linear-gradient(90deg,#a37c33,#fdf3d4)"></i>強い気（活かす）</span>' +
        '<span><i style="background:linear-gradient(90deg,#7a2c40,#d4506a)"></i>薄い気（補う）</span></div>' +
        '<p class="chart-note">最大値を100とした相対値です。<b>'+sorted[0][0]+'</b>に偏り、<b>'+sorted[4][0]+'</b>が不足しています。</p></div>';
    }
    if (ch.type === 'line'){
      const best = ch.data.reduce((a,b)=>b.score>a.score?b:a), worst = ch.data.reduce((a,b)=>b.score<a.score?b:a);
      return '<div class="chart-box"><div class="chart-t">十二ヶ月の運勢曲線<span>身体23日・感情28日・知性33日の周期＋個人月数</span></div>' +
        lineSVG(ch.data) +
        '<div class="chart-legend"><span><i style="background:#fdf3d4"></i>最良月　'+best.year+'年'+best.label+'（'+best.score+'）</span>' +
        '<span><i style="background:#d4506a"></i>要注意月　'+worst.year+'年'+worst.label+'（'+worst.score+'）</span>' +
        '<span><i style="background:rgba(201,162,83,.35)"></i>70以上＝追い風帯</span></div>' +
        '<p class="chart-note">指数70以上は<b>通してよい月</b>、40未満は<b>守りに徹する月</b>です。</p></div>';
    }
    if (ch.type === 'cards') return cardsHTML(ch.data, ch.pos);
    if (ch.type === 'heroCard') return heroCardHTML(ch.data, ch.label);
    if (ch.type === 'elcycle') return elCycleSVG(ch.dom, ch.weak);
    if (ch.type === 'pyring') return pyRingSVG(ch.py);
    if (ch.type === 'kaku') return kakuDiagram(ch.data);
    if (ch.type === 'relation') return relationSVG(ch.a, ch.b, ch.x);
    return '';
  }
  function charts(s){
    const list = s.charts || (s.chart ? [s.chart] : []);
    return list.map(chartHTML).join('');
  }
  const secHTML = s => '<section class="res-sec"><div class="res-h"><span class="n">'+s.no+'</span><h3>'+s.title+'</h3>' +
    '<span class="ln"></span><span class="n" style="font-family:Cormorant Garamond,serif;font-style:italic">'+(s.en||'')+'</span></div>' +
    '<div class="res-body">'+ (s.pre ? charts(s) + s.html : s.html + charts(s)) +'</div></section>';

  function renderResult(){
    const { menu, doc } = CUR;
    const open = isUnlocked(menu.id) || !!menu.free;
    let h = '<div class="wrap-narrow"><div class="res">';

    h += '<div class="res-hero"><span class="inkan" aria-hidden="true">星<i>詠</i></span>' +
      SEAL+'<p class="kind">'+doc.head.kind+'</p><h2>'+esc(doc.head.title)+'</h2>' +
      '<p class="for">'+esc(doc.head.forWhom)+'</p>' +
      (doc.head.code ? '<span class="code">'+esc(doc.head.code)+'</span>' : '') + '</div>';
    if (doc.head.pillars && doc.head.pillars.length)
      h += '<div class="pillars">' + doc.head.pillars.map(([g,k,v,s]) =>
        '<div class="pil"><div class="g">'+g+'︎</div><p class="k">'+k+'</p><p class="v">'+v+'</p><p class="s">'+s+'</p></div>').join('') + '</div>';

    h += doc.free.map(secHTML).join('');

    if (open){
      h += doc.paid.map(secHTML).join('');
      if (menu.free) h += '<div class="freebar">✦　<b>ここまで、すべて無料</b>。登録も課金もありません。</div>';
      h += '<div class="res-end">' + nextUpHTML(menu) +
        '<div class="res-actions">' +
        '<button class="btn btn-ghost btn-sm" id="resPrint">保存</button>' +
        '<button class="btn btn-ghost btn-sm" id="resAgain">条件を変える</button>' +
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
      '<button class="buy-main" data-buy="single"><span>最後まで読む</span><span class="p">¥'+p.single+'<small>税込</small></span></button>' +
      '<button class="buy-sub" data-buy="pass">全鑑定 読み放題　<b>月 ¥'+p.pass.toLocaleString('ja-JP')+'</b></button>' +
      '</div>' +
      '<p class="gate-fine">※ 単品は買い切り。読み放題はいつでも解約できます。<br>一度ひらいた鑑定は、この端末でいつでも読み返せます。</p>' +
      '<div class="gate-demo"><b>これはデモです。</b>決済は未実装で、課金は発生しません。' +
      'ボタンを押すと、購入後の内容がそのまま開きます。</div>' +
      '</div>';
  }

  function nextUpHTML(menu){
    const pool = D.MENUS.filter(m => m.id !== menu.id);
    const same = pool.filter(m => m.g === menu.g), other = pool.filter(m => m.g !== menu.g);
    const pick = same.slice(0,2).concat(other.filter(m => (m.tags||[]).includes('人気')).slice(0,2)).slice(0,4);
    return '<div class="nextup"><h4>次に、視られているもの</h4><div class="row">' +
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

  /* ---------- 上にもどる（ホームのみ） ---------- */
  (function toTop(){
    const btn = $('#pageTop');
    // 鑑定オーバーレイ／ハンバーガーメニューを開いているあいだは隠す
    const on = () => btn.classList.toggle('on',
      scrollY > innerHeight * .6 && !reader.classList.contains('on') && !document.body.classList.contains('nav-open'));
    on(); addEventListener('scroll', on, { passive:true });
    new MutationObserver(on).observe(reader, { attributes:true, attributeFilter:['class'] });
    new MutationObserver(on).observe(document.body, { attributes:true, attributeFilter:['class'] });
    btn.addEventListener('click', () => scrollTo({ top:0, behavior: REDUCED ? 'auto' : 'smooth' }));
  })();

  function doUnlock(kind){
    const u = unlocked();
    if (kind === 'pass') D.MENUS.forEach(m => u[m.id] = true);
    else u[CUR.menu.id] = true;
    LS.set('unlocked', u);
    renderResult();
    toast(kind === 'pass' ? '全鑑定、ひらきました（デモ）' : '続きが、ひらきました（デモ）');
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
      (isUnlocked(x.id) ? '　/　開封済' : '　/　途中まで')+'</span></button>').join('');
  }
  renderHistory();

  /* ---------- CTA ---------- */
  $$('[data-open-first]').forEach(b => b.addEventListener('click', () => {
    openReader(MENU_BY_ID[b.dataset.openFirst] || D.MENUS[0]);
  }));
})();
