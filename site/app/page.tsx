"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { READINGS, GROUPS, Reading, readingById } from "../lib/readings";
import { GUIDES, guideById, GuideId } from "../lib/guides";
import { compose, CONCERNS, concernById, assignedReading, ConcernId, Doc } from "../lib/compose";
import { buildChart, jd, jm, nextNewMoon, getSign, lifePath, personalYear } from "../lib/engine";
import { DECK } from "../lib/tarot";
import * as Book from "../lib/hoshiyomicho";
import ReadingView, { CardArt } from "./reading-view";
import { drawSealImage } from "./seal";

type Modal =
  | "gate" | "birth" | "tarot" | "casting" | "reading"
  | "plans" | "checkout" | "account" | "guide" | null;

/* 御品書は最初から全部見せない（選択肢が多いほど選ばれなくなる） */
const FIRST_SHOWN = 9;

export default function Home() {
  const [group, setGroup] = useState<string>("すべて");
  const [showAll, setShowAll] = useState(false);
  const [birth, setBirth] = useState("1990-01-01");
  const [name, setName] = useState("");
  const [concern, setConcern] = useState<ConcernId>("self");
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState<Reading | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [partnerBirth, setPartnerBirth] = useState("1992-01-01");
  const [modal, setModal] = useState<Modal>(null);
  const [castStep, setCastStep] = useState(0);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [prev, setPrev] = useState<Book.Saved | null>(null);
  const [plan, setPlan] = useState<"single" | "moon" | "star">("moon");
  const [guideId, setGuideId] = useState<GuideId>("love");
  const [chat, setChat] = useState<{ role: "ai" | "user"; text: string; structure?: { label: string; text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [book, setBook] = useState<Book.Book>({ saved: [], streak: { count: 0, lastDay: "" }, profile: { name: "", birth: "", concern: "self" } });
  const [streak, setStreak] = useState(0);

  const now = useMemo(() => new Date(), []);
  const today = useMemo(
    () => new Intl.DateTimeFormat("ja-JP", { month: "long", day: "numeric", weekday: "short" }).format(now),
    [now]
  );

  /* 端末に残した控えを読む。localStorage は描画中に触れないので mount 後に読む。 */
  useEffect(() => {
    const b = Book.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBook(b);
    if (b.profile.birth) setBirth(b.profile.birth);
    if (b.profile.name) setName(b.profile.name);
    const s = Book.touchStreak(new Date());
    setStreak(s.count);
  }, []);

  useEffect(() => {
    if (modal) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [modal]);

  const sign = getSign(birth);
  const life = lifePath(birth);
  const py = personalYear(birth, now);
  const dayScore = 58 + (Math.abs(life * 7 + now.getDate() * 13 + sign.from) % 34);
  const landmark = useMemo(() => Book.nextLandmark(birth, now, nextNewMoon(now)), [birth, now]);

  const filtered = group === "すべて" ? READINGS : READINGS.filter((r) => r.group === group);
  const visible = showAll || group !== "すべて" ? filtered : filtered.slice(0, FIRST_SHOWN);

  /* ---- 鑑定を開く ---- */
  const openReading = useCallback((r: Reading) => {
    setSelected(r); setPicks([]); setUnlocked(!!r.free); setDoc(null); setSavedAt(null);
    setPrev(Book.previous(r.id));
    setCastStep(0);
    setModal(r.engine === "tarot" ? "tarot" : "casting");
  }, []);

  /* 「星に選ばせる」：迷う人の選択コストをゼロにする */
  const letStarsChoose = useCallback(() => {
    openReading(assignedReading(birth, now, READINGS));
  }, [birth, now, openReading]);

  /* ---- 鑑定演出：その人の実データを見せる（労働の錯覚） ---- */
  const castSteps = useMemo(() => {
    if (!selected) return [];
    const [y, m, d] = birth.split("-");
    return [
      `${y}年${Number(m)}月${Number(d)}日 の波紋をひらいています`,
      `${sign.jp} と 運命数${life} を重ねています`,
      `個人年${py} の巡りを照合しています`,
      picks.length ? `選ばれた ${picks.length}枚 を開いています` : `「${concernById(concern).title}」の影を探しています`,
      `${guideById(selected.lens === "money" ? "money" : selected.group === "恋愛" || selected.group === "相性" ? "love" : selected.group === "仕事・金運" ? "work" : "star").name} が言葉を選んでいます`,
    ];
  }, [selected, birth, sign, life, py, picks, concern]);

  useEffect(() => {
    if (modal !== "casting" || !selected) return;
    const ts = [520, 1040, 1560, 2080].map((ms, i) => setTimeout(() => setCastStep(i + 1), ms));
    ts.push(setTimeout(() => {
      const d = compose({
        reading: selected, birth, name, concern, question,
        picks: picks.length ? picks : undefined, partnerBirth, now: new Date(),
      });
      setDoc(d);
      setModal("reading");
    }, 2600));
    return () => ts.forEach(clearTimeout);
  }, [modal, selected, birth, name, concern, question, picks, partnerBirth]);

  /* ---- 星詠帳に控える（無料の承諾） ---- */
  const saveToBook = useCallback(() => {
    if (!doc || !selected) return;
    const at = Date.now();
    const entry: Book.Saved = {
      readingId: selected.id, title: selected.title, at, birth, concern, question: question || undefined,
      picks: picks.length ? picks : undefined,
      gist: {
        verdict: selected.verdict.a.slice(0, 40),
        bestMonth: doc.gate.h.replace(/<[^>]*>/g, ""),
        turning: doc.nextDate,
        py,
        cards: doc.free.flatMap((c) => c.blocks).flatMap((b) => (b.t === "cards" ? b.data.map((d) => d.card.jp) : [])),
      },
      unlocked: false,
    };
    setBook(Book.remember(entry));
    Book.setProfile({ name, birth, concern });
    setSavedAt(at);
  }, [doc, selected, birth, concern, question, picks, name, py]);

  const unlock = useCallback(() => setModal("plans"), []);

  const applyUnlock = useCallback(() => {
    if (selected) setBook(Book.markUnlocked(selected.id));
    setUnlocked(true);
    setModal("reading");
  }, [selected]);

  /* ---- 鑑定札を画像で保存（拡散の単位をつくる） ---- */
  const saveImage = useCallback(() => {
    if (!doc || !selected) return;
    drawSealImage({
      title: selected.title, who: doc.head.who, code: doc.head.code,
      verdict: selected.verdict.a, guide: doc.guide.name, seal: doc.guide.seal,
      nextDate: doc.nextDate,
    });
  }, [doc, selected]);

  /* ---- 守護獣との会話 ---- */
  const openGuide = (id: GuideId) => {
    const g = guideById(id);
    setGuideId(id);
    setChat([{ role: "ai", text: g.greeting }]);
    setModal("guide");
  };
  const sendChat = (e: FormEvent) => {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q) return;
    let cid: ConcernId = "self";
    if (/恋|彼|好き|復縁|結婚|片想/.test(q)) cid = "love";
    else if (/仕事|転職|会社|副業|独立/.test(q)) cid = "work";
    else if (/金|お金|貯金|支出/.test(q)) cid = "work";
    else if (/家族|友|人間|職場|上司/.test(q)) cid = "people";
    setConcern(cid);
    setQuestion(q);
    const c = concernById(cid);
    setChat((v) => [...v, { role: "user", text: q }, {
      role: "ai",
      text: `甘いことは言いません。その言葉は「${c.title}」の迷いに見えて、実際には“選んだ後の責任を負う怖さ”を映しています。`,
      structure: [
        { label: "観測", text: `「${q.slice(0, 34)}」——事実より先に、感情が置かれています。` },
        { label: "照合", text: `${sign.jp}の${sign.gift}と運命数${life}が重なると、決める直前に他人の気配を読みすぎます。` },
        { label: "影", text: "本当に怖いのは失敗ではなく、自分で選んだと認めることです。" },
        { label: "問い", text: "誰にも責められないとしたら、あなたは何を選びますか。" },
      ],
    }]);
    setChatInput("");
  };

  const recommendedPrimary = readingById(concernById(concern).pick) ?? READINGS[0];
  const recommendedAlts = concernById(concern).alts.map((id) => readingById(id)).filter(Boolean) as Reading[];
  const tarotNeed = selected?.cards ?? 1;

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="星詠堂 ホーム">
          <span className="brand-mark">✦</span>
          <span>星詠堂<small>HOSHIYOMI-DO</small></span>
        </a>
        <nav aria-label="メインメニュー">
          <a href="#guide">悩みから探す</a>
          <a href="#readings">鑑定一覧</a>
          <Link href="/faq">よくある質問</Link>
          <button className="ghost" onClick={() => setModal("account")}>星詠帳</button>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">THE ORACLE ALREADY KNOWS</p>
          <h1>その迷い、<br /><em>偶然ではありません。</em></h1>
          <p className="lead">
            あなたがまだ言葉にしていない本音まで、星は先に知っている。<br />
            生年月日を置いた瞬間、止まっていた運命の頁がひらきます。
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={() => setModal("birth")}>いま、無料でひらく</button>
            <button className="text-link" onClick={() => openGuide("love")}>守護獣に導いてもらう <span>→</span></button>
          </div>
          <p className="hero-note">※ 登録もメールも要りません。入力はこの端末から出ません。</p>
        </div>
        <aside className="oracle-card lavish">
          <div className="oracle-orbit"><img src="/avatar-love.png" alt="恋愛を司る守護獣 むすび" /></div>
          <p className="oracle-status"><i /> 恋縁の守護獣</p>
          <h2>むすび <small>MUSUBI</small></h2>
          <blockquote>「見ないふりをしている本音ほど、<br />赤い糸にはよく映るのです。」</blockquote>
          <button className="oracle-button" onClick={() => openGuide("love")}>今夜の託宣を聞く <span>→</span></button>
          <p className="demo-label">SPIRIT GUIDE</p>
        </aside>
      </section>

      <section className="daily-strip" aria-label="今日の運勢">
        <div>
          <span>{today}</span>
          <strong>今夜、月があなたに隠すもの</strong>
        </div>
        <b>{dayScore}<small>/100</small></b>
        <p>
          {dayScore > 78
            ? "追い風は来ています。ただし、欲を出した瞬間に向きが変わる夜です。"
            : "違和感は凶兆ではなく、魂が先に気づいた合図。無視した代償は、あとから時間で払います。"}
        </p>
        <div className="daily-act">
          {streak > 1 && <span className="streak">{streak}日つづけて視ています</span>}
          <button onClick={() => openReading(READINGS[0])}>今夜の一枚をひらく →</button>
        </div>
      </section>

      {/* 六つの門：選んだあと、おすすめは1件に絞る */}
      <section className="guide" id="guide">
        <div className="section-title">
          <p className="eyebrow">THE SIX GATES</p>
          <h2>いま、最も触れられたくない場所は？</h2>
          <p>迷った項目ほど、いまのあなたに必要な入口です。</p>
        </div>
        <div className="concern-grid">
          {CONCERNS.map((c) => (
            <button className="concern" key={c.id}
              onClick={() => { setConcern(c.id); if (c.id === "unknown") letStarsChoose(); else setModal("gate"); }}>
              <span>{c.mark}</span>
              <strong>{c.title}</strong>
              <small>{c.text}</small>
              <b>{c.id === "unknown" ? "星に選ばせる →" : "この門をひらく →"}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="transparency ritual">
        <div><p className="eyebrow">THREE VEILS</p><h2>星は、三つの帳を<br />順にひらく。</h2></div>
        <div className="method-flow">
          <article><b>第一の帳</b><h3>生まれ持った印</h3><p>誕生日に刻まれた星座、運命数、干支、そして個人年。変えようとしても戻ってくる、魂の基礎音を拾います。</p></article>
          <article><b>第二の帳</b><h3>いま纏う影</h3><p>選んだ門と、置いていった言葉。その間に漂う気配から、悩みの本当の主題を絞ります。</p></article>
          <article><b>第三の帳</b><h3>まだ来ない兆し</h3><p>十二か月の巡りと選択の癖を重ね、次に現れる分岐と、そこで試される覚悟を読みます。</p></article>
        </div>
      </section>

      <section className="readings" id="readings">
        <div className="section-title">
          <p className="eyebrow">FORTY-ONE ORACLES</p>
          <h2>見たい未来ではなく、<br />見るべき真実を。</h2>
          <p>タロットは札を選ぶだけ。その他は、生年月日を置いた瞬間から鑑定が始まります。</p>
        </div>
        <div className="tabs" role="tablist">
          {GROUPS.map((g) => (
            <button key={g} className={group === g ? "active" : ""}
              onClick={() => { setGroup(g); setShowAll(false); }}>
              {g}<small>{g === "すべて" ? READINGS.length : READINGS.filter((r) => r.group === g).length}</small>
            </button>
          ))}
        </div>
        <div className="reading-grid">
          {visible.map((r, i) => (
            <button className={`reading-card ${r.group === "タロット" ? "tarot-entry" : "instant-entry"}`}
              style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
              key={r.id} onClick={() => openReading(r)}>
              <div className="reading-meta">
                <span>{r.mark}</span>
                <p>{r.free ? "全章 無料" : r.popular ? "今夜よく視られる" : "序章まで無料"}</p>
              </div>
              <h3>{r.title}</h3>
              <p>{r.catchline}</p>
              {/* 買う前に「手間」と「量」が読めるようにする */}
              <ul className="reading-facts">
                <li>{r.seconds}秒</li>
                <li>{r.engine === "tarot" ? `札を${r.cards}枚` : r.engine === "pair" ? "ふたりの生年月日" : r.engine === "name" ? "かなの姓名" : "生年月日"}</li>
                <li>{r.free ? "全文無料" : "約800字まで無料"}</li>
              </ul>
              <footer>
                <small>{r.group}</small>
                <b>{r.group === "タロット" ? "札を選ぶ" : "いま視る"} →</b>
              </footer>
            </button>
          ))}
        </div>
        {!showAll && group === "すべて" && filtered.length > FIRST_SHOWN && (
          <button className="more-readings" onClick={() => setShowAll(true)}>
            御品書をすべて見る（残り {filtered.length - FIRST_SHOWN} 種）
          </button>
        )}
      </section>

      <section className="guardian-section">
        <div className="section-title">
          <p className="eyebrow">CHOOSE YOUR GUARDIAN</p>
          <h2>悩みによって、視える守護獣は違う。</h2>
          <p>選んだ守護獣が、会話の切り口とおすすめの鑑定を変えます。鑑定書の署名も、その獣のものになります。</p>
        </div>
        <div className="guardian-grid">
          {GUIDES.slice(0, 3).map((g) => (
            <button key={g.id} className={`guardian-card ${g.color}`} onClick={() => openGuide(g.id)}>
              <div><img src={g.image} alt={`${g.role} ${g.name}`} /></div>
              <span>{g.role}</span>
              <h3>{g.name}<small>{g.en}</small></h3>
              <p>{g.greeting}</p>
              <b>この守護獣に預ける →</b>
            </button>
          ))}
        </div>
      </section>

      {/* 社会的証明：★5だけ並べない */}
      <section className="voices-section">
        <div className="section-title">
          <p className="eyebrow">VOICES</p>
          <h2>届いた言葉。</h2>
        </div>
        <div className="voices">
          {VOICES.map((v, i) => (
            <article className="voice" key={i}>
              <p>{v.text}</p>
              <footer>
                <b>{v.who}</b>
                <span className="stars" aria-label={`5つ星のうち${v.star}`}>
                  {"★★★★★".slice(0, v.star)}<i>{"★★★★★".slice(v.star)}</i>
                </span>
                <small>{v.menu}　{v.date}</small>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <span className="brand-mark">✦</span>
          <h2>星詠堂<small>HOSHIYOMI-DO</small></h2>
          <p>見ないふりをした本音ほど、<br />星はよく視ている。</p>
        </div>
        <div><h3>鑑定</h3><a href="#guide">六つの門</a><a href="#readings">全41種</a><button onClick={() => openGuide("love")}>守護獣に相談</button></div>
        <div><h3>ご案内</h3><Link href="/faq">よくある質問</Link><Link href="/legal/commerce">特定商取引法に基づく表記</Link><Link href="/legal/privacy">プライバシーポリシー</Link><Link href="/legal/terms">利用規約</Link></div>
        <div><h3>星詠帳</h3><button onClick={() => setModal("account")}>控えを見る</button><a href="mailto:support@example.com">お問い合わせ</a></div>
        <p className="copyright">© 2026 HOSHIYOMI-DO　占いは娯楽としてお楽しみください。</p>
      </footer>

      {modal && (
        <div className="modal-backdrop" role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={`modal ${modal === "reading" ? "modal-reading" : ""} ${modal === "tarot" ? "modal-tarot" : ""}`}
            role="dialog" aria-modal="true" aria-label="鑑定">
            <button className="modal-close" onClick={() => setModal(null)} aria-label="閉じる">×</button>

            {/* 入力は一度に一つ：まず生年月日だけ */}
            {modal === "birth" && (
              <div className="guide-modal">
                <p className="eyebrow">OPEN THE GATE</p>
                <h2>生まれ日の印を、ひとつ。</h2>
                <p className="modal-lead">いま必要なのはこれだけです。名前は、鑑定書ができてからで構いません。</p>
                <label>生年月日
                  <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} />
                </label>
                <div className="profile-mini">
                  <span>{sign.jp}</span>
                  <p>運命数 <b>{life}</b>　個人年 <b>{py}</b><br /><small>{sign.gift}を宿す印</small></p>
                </div>
                <button className="primary" onClick={() => setModal("gate")}>この生まれ日で視る</button>
                <button className="subtle" onClick={letStarsChoose}>迷うので、星に選ばせる</button>
              </div>
            )}

            {/* 門を選んだあと：おすすめは1件だけ大きく */}
            {modal === "gate" && (
              <div className="guide-modal">
                <p className="eyebrow">{concernById(concern).title.toUpperCase()}</p>
                <h2>{concernById(concern).title}なら、この一つです。</h2>
                <p className="modal-lead">{concernById(concern).text}——迷うより、まずここから。</p>
                <button className="primary-pick" onClick={() => openReading(recommendedPrimary)}>
                  <span>{recommendedPrimary.mark}</span>
                  <div>
                    <b>{recommendedPrimary.title}</b>
                    <small>{recommendedPrimary.catchline}</small>
                    <i>{recommendedPrimary.seconds}秒・約800字まで無料</i>
                  </div>
                  <em>→</em>
                </button>
                <label className="q-field">
                  いま気がかりなことを一文で（任意）
                  <textarea value={question} maxLength={80} placeholder="例：あの人の態度が分かりません"
                    onChange={(e) => setQuestion(e.target.value)} />
                  <small>書いていただくと、鑑定書がその言葉に応えます。</small>
                </label>
                {recommendedAlts.length > 0 && (
                  <div className="alt-picks">
                    <p>ほかの視方</p>
                    {recommendedAlts.map((r) => (
                      <button key={r.id} onClick={() => openReading(r)}>{r.title}<i>→</i></button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 札を選ぶ：絵柄のある78枚から */}
            {modal === "tarot" && selected && (
              <div className="tarot-modal">
                <p className="eyebrow">CHOOSE YOUR CARDS</p>
                <h2>{selected.title}</h2>
                <p className="tarot-lead">目を閉じて一度だけ息を吐き、いま指が止まった札を選んでください。</p>
                <div className="tarot-counter"><b>{picks.length}</b><span> / {tarotNeed}枚</span></div>
                <div className="tarot-deck">
                  {Array.from({ length: 15 }, (_, i) => {
                    const on = picks.includes(i);
                    return (
                      <button key={i} className={on ? "picked" : ""} aria-pressed={on}
                        aria-label={on ? `${i + 1}枚目 選択済み` : `${i + 1}枚目の札`}
                        onClick={() => setPicks((cur) =>
                          cur.includes(i) ? cur.filter((x) => x !== i)
                          : cur.length < tarotNeed ? [...cur, i] : cur)}>
                        <span className="tarot-back"><i>✦</i></span>
                      </button>
                    );
                  })}
                </div>
                <button className="primary tarot-reveal" disabled={picks.length !== tarotNeed}
                  onClick={() => { setCastStep(0); setModal("casting"); }}>
                  {picks.length === tarotNeed ? "選んだ札で鑑定する" : "直感で札を選んでください"}
                </button>
              </div>
            )}

            {/* 演出：その人の実データを見せる */}
            {modal === "casting" && selected && (
              <div className="casting-modal">
                <div className="casting-sphere"><span>{selected.mark}</span><i /><i /><i /></div>
                <p className="eyebrow">READING THE VEIL</p>
                <h2>{castSteps[castStep]}</h2>
                <div className="casting-progress"><span style={{ width: `${((castStep + 1) / castSteps.length) * 100}%` }} /></div>
                <ul>
                  {castSteps.map((s, i) => (
                    <li key={s} className={i <= castStep ? "on" : ""}>{i < castStep ? "✓" : "✦"} {s}</li>
                  ))}
                </ul>
                <blockquote>急いで答えだけを取ると、<br />あなたはまた同じ場所へ戻ります。</blockquote>
              </div>
            )}

            {modal === "reading" && doc && (
              <ReadingView doc={doc} unlocked={unlocked} prev={prev} savedAt={savedAt}
                saved={savedAt !== null}
                onUnlock={unlock} onSave={saveToBook} onImage={saveImage} />
            )}

            {/* 三段の価格：真ん中を既定にする */}
            {modal === "plans" && (
              <div className="mini-plans">
                <p className="eyebrow">CHOOSE A PLAN</p>
                <h2>続きを読む方法</h2>
                {PLANS.map((p) => (
                  <article key={p.key} className={`plan-card ${p.key === plan ? "featured" : ""}`}>
                    {p.badge && <span className="plan-badge">{p.badge}</span>}
                    <h3>{p.name}</h3>
                    <p className="price"><b>¥{p.price}</b><span>{p.unit}</span></p>
                    <ul>{p.items.map((x) => <li key={x}>{x}</li>)}</ul>
                    <button onClick={() => { setPlan(p.key); setModal("checkout"); }}>{p.name}を選ぶ <span>→</span></button>
                  </article>
                ))}
              </div>
            )}

            {modal === "checkout" && (
              <Checkout plan={plan} onBack={() => setModal("plans")} onDemo={applyUnlock} />
            )}

            {/* 星詠帳：控え・連続日数・次の節目 */}
            {modal === "account" && (
              <div className="account-modal">
                <p className="eyebrow">HOSHIYOMI-CHO</p>
                <h2>星詠帳</h2>
                <p>この端末に残した控えです。登録は要りません。</p>
                <div className="book-stats">
                  <div><b>{book.saved.length}</b><small>控えた鑑定</small></div>
                  <div><b>{streak}</b><small>連続日数</small></div>
                  <div><b>{book.saved.filter((s) => s.unlocked).length}</b><small>ひらいた鑑定</small></div>
                </div>
                {streak >= 7 && <p className="book-reward">✦ 七日つづきました。次の鑑定は、続きを一章ぶん無料でひらけます。</p>}
                <div className="book-next">
                  <b>次の節目</b>
                  <p>{jd(landmark.when)}　{landmark.label}</p>
                  <small>{landmark.why}この日にもう一度ひらくと、数字が動いています。</small>
                </div>
                {book.saved.length > 0 ? (
                  <ul className="book-list">
                    {book.saved.slice(0, 8).map((s) => (
                      <li key={`${s.readingId}-${s.at}`}>
                        <button onClick={() => { const r = readingById(s.readingId); if (r) { setModal(null); openReading(r); } }}>
                          <b>{s.title}</b>
                          <small>{new Date(s.at).getMonth() + 1}月{new Date(s.at).getDate()}日</small>
                          <i>{s.unlocked ? "全章" : `あと${Book.daysLeft(s.at)}日で消えます`}</i>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="book-empty">まだ控えがありません。鑑定をひらくと、ここに残ります。</p>
                )}
              </div>
            )}

            {modal === "guide" && (
              <div className={`chat-modal ${guideById(guideId).color}`}>
                <header>
                  <img src={guideById(guideId).image} alt="" />
                  <div>
                    <h2>{guideById(guideId).name} <small>{guideById(guideId).role} · AI</small></h2>
                    <p><i /> 星路に接続中</p>
                  </div>
                  <nav className="guide-switch">
                    {GUIDES.slice(0, 3).map((g) => (
                      <button key={g.id} className={g.id === guideId ? "on" : ""}
                        onClick={() => { setGuideId(g.id); setChat([{ role: "ai", text: g.greeting }]); }}>{g.mark}</button>
                    ))}
                  </nav>
                </header>
                <div className="chat-log">
                  {chat.map((m, i) => (
                    <div key={i} className={m.role}>
                      <span>{m.role === "ai" ? guideById(guideId).name : "あなた"}</span>
                      <p>{m.text}</p>
                      {m.structure && (
                        <div className="thought-structure">
                          {m.structure.map((s) => <section key={s.label}><b>{s.label}</b><p>{s.text}</p></section>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {chat.length > 2 && (
                  <div className="chat-picks">
                    <button onClick={() => openReading(recommendedPrimary)}>{recommendedPrimary.title}<span>→</span></button>
                    {recommendedAlts.slice(0, 2).map((r) => (
                      <button key={r.id} onClick={() => openReading(r)}>{r.title}<span>→</span></button>
                    ))}
                  </div>
                )}
                <form onSubmit={sendChat}>
                  <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder="例：あの人の態度が分かりません" aria-label="守護獣への相談" />
                  <button>託す</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* 極端回避：上位は中位の2倍までに寄せ、真ん中を既定にする */
const PLANS = [
  { key: "single" as const, name: "単品鑑定", price: "550", unit: "円 / 1件", items: ["この鑑定の全章", "買い切り・自動更新なし"] },
  { key: "moon" as const, name: "月灯プラン", price: "980", unit: "円 / 月", badge: "おすすめ", items: ["毎月5件の全章", "守護獣と月10往復", "いつでも解約"] },
  { key: "star" as const, name: "星詠プラン", price: "1,980", unit: "円 / 月", items: ["全41鑑定の全章", "守護獣と1日20通", "前回との差分表示"] },
];

const VOICES = [
  { text:"正直、占いってどれも同じこと書いてあると思ってました。最初の一行が「人前では平気な顔をしていられる人ですね」で、うわ、と声が出ました。職場でも家でもそれで通してきたので。", who:"30代・女性", menu:"宿命の設計図", date:"2026.07", star:5 },
  { text:"転機の日に出てた日付、普通に何もなかったです。と思ってたら3日後に前の職場から連絡きて、まあ誤差の範囲かなと。文章自体は読みごたえありました。", who:"40代・男性", menu:"転機の季節", date:"2026.06", star:4 },
  { text:"通勤中に引いてます。入力いらないのが地味にありがたい。", who:"30代・女性", menu:"今日の一枚", date:"2026.08", star:5 },
  { text:"「確かめる質問を、二週間だけやめること」って書かれてて、それ完全に自分がやってたことでした。やめたら向こうから連絡くるようになったので、結果的には合ってたのかもしれません。", who:"20代・男性", menu:"あの人の本音", date:"2026.05", star:4 },
  { text:"相性の点数は正直ピンときませんでした。ただ「相手の速度を変えようとするな」って一文だけずっと残ってます。三年付き合ってて、ずっとそれをやってたので。", who:"30代・男性", menu:"ふたりの相性", date:"2026.06", star:3 },
  { text:"二回目にひらいたら「前回との差分」が出て、転機の日が動いてました。そこで初めて、ちゃんと計算されてるんだなと思いました。", who:"20代・女性", menu:"これから一年", date:"2026.08", star:5 },
];

function Checkout({ plan, onBack, onDemo }: { plan: "single" | "moon" | "star"; onBack: () => void; onDemo: () => void }) {
  const [agree, setAgree] = useState(false);
  const data = {
    single: { name: "単品鑑定", price: "550円", cycle: "一回限り（自動更新なし）", content: "選択した鑑定1件の全章" },
    moon:   { name: "月灯プラン", price: "月額980円", cycle: "毎月自動更新", content: "月5件の鑑定全章・守護獣と月10往復" },
    star:   { name: "星詠プラン", price: "月額1,980円", cycle: "毎月自動更新", content: "全41鑑定の全章・守護獣と1日20通・前回との差分表示" },
  }[plan];
  return (
    <div className="checkout">
      <button className="back" onClick={onBack}>← プラン選択に戻る</button>
      <p className="eyebrow">FINAL CONFIRMATION</p>
      <h2>申込み内容の確認</h2>
      <dl>
        <div><dt>商品・サービス</dt><dd>{data.name}</dd></div>
        <div><dt>価格（税込）</dt><dd>{data.price}</dd></div>
        <div><dt>請求</dt><dd>{data.cycle}</dd></div>
        <div><dt>提供内容</dt><dd>{data.content}</dd></div>
        <div><dt>提供時期</dt><dd>決済完了後、直ちに利用可能</dd></div>
        <div><dt>解約</dt><dd>星詠帳からいつでも可能。解約後は次回更新日まで利用できます。</dd></div>
      </dl>
      {plan !== "single" && (
        <p className="annual">1年間継続した場合の目安：{plan === "moon" ? "11,760円" : "23,760円"}（いつでも解約可能）</p>
      )}
      <label className="agree">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        利用規約、プライバシーポリシー、上記の自動更新条件を確認しました
      </label>
      <button className="primary" disabled={!agree} onClick={onDemo}>
        決済へ進む（デモ：課金は発生しません）
      </button>
      <p className="demo-box">
        <b>改善版デモ</b>　決済は接続されていないため、請求は発生しません。押すと購入後の全章がそのまま開きます。
      </p>
    </div>
  );
}
