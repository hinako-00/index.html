"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Block, Chapter, Doc } from "../lib/compose";
import { ART, LENS_LABEL, LENS_REV, lensLine } from "../lib/tarot";
import type { Saved } from "../lib/hoshiyomicho";

/* ---------- 札の絵柄 ---------- */
export function CardArt({ n, className }: { n: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ART[n] ?? ART[0] }} />
  );
}

/* ---------- 章の中身 ---------- */
function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return <p dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "quote":
      return <blockquote className="r-quote" dangerouslySetInnerHTML={{ __html: b.html }} />;
    case "verdict":
      return (
        <div className="oracle-verdict">
          <span>{b.label}</span>
          <b>{b.big}</b>
          <p>{b.sub}</p>
        </div>
      );
    case "kv":
      return (
        <dl className="r-kv">
          {b.rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd dangerouslySetInnerHTML={{ __html: v }} />
            </div>
          ))}
        </dl>
      );
    case "list":
      return (
        <ol className="r-list">
          {b.items.map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}
        </ol>
      );
    case "steps":
      return (
        <div className="r-steps">
          {b.items.map(([t, d], i) => (
            <div className="r-step" key={i}>
              <span>{i + 1}</span>
              <div><h5>{t}</h5><p dangerouslySetInnerHTML={{ __html: d }} /></div>
            </div>
          ))}
        </div>
      );
    case "months": {
      const max = Math.max(...b.data.map((m) => m.score));
      return (
        <div className="r-months">
          <div className="r-months-chart" role="img" aria-label="十二か月の運勢指数">
            {b.data.map((m) => (
              <div key={m.label} className="r-mbar" title={`${m.label} 指数${m.score}`}>
                <i style={{ height: `${(m.score / max) * 100}%` }}
                   className={m.score >= 72 ? "up" : m.score <= 38 ? "down" : ""} />
                <small>{m.label.replace("月", "")}</small>
              </div>
            ))}
          </div>
          <dl className="r-kv r-kv-tight">
            {b.data.map((m) => (
              <div key={m.label}>
                <dt>{m.label}　<b>{m.score}</b></dt>
                <dd>{m.theme}——{m.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }
    case "cards":
      return (
        <div className="r-cards">
          {b.data.map((d, i) => {
            const side = d.rev ? d.card.rv : d.card.up;
            return (
              <figure key={i} className={`r-card ${d.rev ? "rev" : ""}`}>
                <div className="r-card-face">
                  <span className="r-ori" aria-hidden="true">{d.rev ? "▽" : "△"}</span>
                  <span className="r-pos">{b.pos[i]}</span>
                  <CardArt n={d.card.n} className="r-card-art" />
                  <b>{d.card.jp}</b>
                  <small>{d.card.en}</small>
                  <em className={d.rev ? "rev" : ""}>{d.rev ? "逆位置" : "正位置"}</em>
                </div>
                <figcaption>
                  <b>{side.kw}</b>
                  <p>{side.msg}</p>
                  <span className="r-lens">
                    <i>{LENS_LABEL[b.lens]}{d.rev ? "（逆）" : ""}</i>
                    {d.rev ? LENS_REV[b.lens] : ""}{lensLine(d.card, b.lens)}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      );
  }
}

function ChapterView({ ch, id }: { ch: Chapter; id: string }) {
  return (
    <section className="r-chapter" id={id}>
      <p className="chapter"><b>{ch.no}</b> · {ch.title}<span>{ch.en}</span></p>
      {ch.blocks.map((b, i) => <BlockView key={i} b={b} />)}
    </section>
  );
}

/* ---------- 章レール（目標勾配効果：あと何章かを見せる） ---------- */
function Rail({ chapters, active }: { chapters: Chapter[]; active: number }) {
  return (
    <nav className="r-rail" aria-label="章の進み">
      {chapters.map((ch, i) => (
        <a key={ch.no} href={`#ch-${i}`} className={i === active ? "on" : i < active ? "done" : ""}>
          <i />
          <span>{ch.no}　{ch.title}</span>
        </a>
      ))}
    </nav>
  );
}

/* ---------- 前回との差分 ---------- */
function Diff({ prev, doc }: { prev: Saved; doc: Doc }) {
  const changes: [string, string, string][] = [];
  const nowPy = Number(doc.head.pillars.find(([k]) => k === "年")?.[1].replace("個人年", "") ?? NaN);
  if (Number.isFinite(nowPy) && prev.gist.py !== nowPy) {
    changes.push(["個人年", `${prev.gist.py}`, `${nowPy}`]);
  }
  const nowBest = doc.paid.length ? doc.gate.h.replace(/<[^>]*>/g, "") : "";
  if (prev.gist.bestMonth && nowBest && !nowBest.includes(prev.gist.bestMonth)) {
    changes.push(["山の月", prev.gist.bestMonth, nowBest]);
  }
  if (prev.gist.turning && prev.gist.turning !== doc.nextDate) {
    changes.push(["転機の日", prev.gist.turning, doc.nextDate]);
  }
  if (prev.gist.cards?.length) {
    changes.push(["前回の札", prev.gist.cards.join("・"), "今回は別の札が出ています"]);
  }
  const when = new Date(prev.at);
  return (
    <div className="r-diff">
      <p className="r-diff-h">
        <b>前回との差分</b>
        <span>{when.getFullYear()}年{when.getMonth() + 1}月{when.getDate()}日に、同じ鑑定をひらいています</span>
      </p>
      <p className="r-diff-prev">前回の結論　「{prev.gist.verdict}」</p>
      {changes.length > 0 ? (
        <dl className="r-kv r-kv-tight">
          {changes.map(([k, a, b]) => (
            <div key={k}><dt>{k}</dt><dd><s>{a}</s> → <b>{b}</b></dd></div>
          ))}
        </dl>
      ) : (
        <p className="r-diff-same">主だった数字は前回から動いていません。<b>いまは、変化を待つ時期です。</b></p>
      )}
    </div>
  );
}

export default function ReadingView({
  doc, unlocked, prev, savedAt, onUnlock, onSave, onImage, saved,
}: {
  doc: Doc; unlocked: boolean; prev: Saved | null; savedAt: number | null;
  onUnlock: () => void; onSave: () => void; onImage: () => void; saved: boolean;
}) {
  const shown = unlocked ? [...doc.free, ...doc.paid] : doc.free;
  const [active, setActive] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = shown.map((_, i) => document.getElementById(`ch-${i}`)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) setActive(els.indexOf(e.target as HTMLElement)); }),
      { rootMargin: "-25% 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  // shown は unlocked と章数から決まるので、その二つで足りる
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.length, unlocked]);

  const remaining = useMemo(() => doc.gate.totalChars, [doc]);

  return (
    <div className="reading-view" ref={bodyRef}>
      <Rail chapters={shown} active={active} />

      <header className="r-head">
        <img className="r-guide" src={doc.guide.image} alt={`${doc.guide.role} ${doc.guide.name}`} />
        <p>{doc.head.kind} · <b>{doc.guide.name}</b> 視</p>
        <h2>{doc.head.title}</h2>
        <small>{doc.head.who}</small>
        <div className="r-pillars">
          {doc.head.pillars.map(([k, v]) => (
            <span key={k}><i>{k}</i>{v}</span>
          ))}
        </div>
        <div className="constellation-code">STAR SEAL · {doc.head.code}</div>
      </header>

      {prev && <Diff prev={prev} doc={doc} />}

      {shown.map((ch, i) => <ChapterView key={ch.no + ch.title} ch={ch} id={`ch-${i}`} />)}

      {!unlocked && (
        <div className="paywall">
          <span aria-hidden="true">✦</span>
          <p className="pw-lead">{doc.gate.lead}</p>
          <h3 dangerouslySetInnerHTML={{ __html: doc.gate.h }} />
          <p className="pw-why" dangerouslySetInnerHTML={{ __html: doc.gate.why }} />
          <ul className="pw-list">
            {doc.gate.list.map((x) => (
              <li key={x.title}>
                <b>{x.title}</b>
                <span>{x.teaser}</span>
                <i>{x.chars.toLocaleString("ja-JP")}字</i>
              </li>
            ))}
          </ul>
          <p className="pw-total">
            この先 <b>{remaining.toLocaleString("ja-JP")}字</b>・{doc.gate.list.length}章
          </p>

          {/* 課金の手前に、無料の承諾を一段挟む（一貫性） */}
          {!saved ? (
            <button className="pw-save" onClick={onSave}>
              まず、この鑑定を星詠帳に控える（無料）
            </button>
          ) : (
            <p className="pw-saved">
              ✓ 星詠帳に控えました。<b>{doc.savedUntil}まで</b>この端末から読み返せます。
            </p>
          )}

          <button className="primary" onClick={onUnlock}>この鑑定の続きをひらく</button>
          <p className="pw-fine">単品 550円（買い切り）／ 月灯プラン 980円で月5件</p>
        </div>
      )}

      {unlocked && (
        <div className="r-end">
          {/* 守護獣の署名と落款 */}
          <div className="r-sign">
            <div className="r-sign-body">
              <p>{doc.guide.signOff}</p>
              <b>{doc.guide.role}　{doc.guide.name}</b>
            </div>
            <span className="r-seal" aria-label="落款">{doc.guide.seal}</span>
          </div>

          {/* ピーク・エンド：手ぶらで終わらせない */}
          <div className="r-next">
            <p>次にこの扉をひらくなら</p>
            <b>{doc.nextDate}</b>
            <small>その日、あなたの三つの周期が同時に上を向きます。</small>
          </div>

          <div className="r-actions">
            <button className="subtle" onClick={onImage}>鑑定札を画像で保存</button>
            <button className="subtle" onClick={() => window.print()}>印刷・PDF</button>
          </div>
          {savedAt && (
            <p className="r-kept">星詠帳に控えてあります（{doc.savedUntil}まで）</p>
          )}
        </div>
      )}
    </div>
  );
}
