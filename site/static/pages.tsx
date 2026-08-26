/* 静的サイトの下位ページ。Next 版と同じ本文（lib/）を使う。 */
import { LEGAL_PAGES, LegalSlug } from "../lib/legal";
import { FAQ } from "../lib/faq";

export function FaqPage() {
  return (
    <main className="faq-page">
      <a className="legal-back" href="/">← 星詠堂へ戻る</a>
      <header>
        <p className="eyebrow">QUESTIONS UNDER THE MOON</p>
        <h1>よくある質問</h1>
        <p>ひらく前に知っておきたいことを、ここにまとめました。</p>
      </header>
      <div className="faq-list">
        {FAQ.map(([q, a], i) => (
          <details key={q} open={i === 0}>
            <summary><span>{String(i + 1).padStart(2, "0")}</span>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
      <aside>
        <p>このほかに確認したいことがありますか。</p>
        <a href="mailto:support@example.com">お問い合わせを送る →</a>
      </aside>
    </main>
  );
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const page = LEGAL_PAGES[slug];
  const rows = "rows" in page ? page.rows : page.sections;
  return (
    <main className="legal">
      <a className="legal-back" href="/">← 星詠堂へ戻る</a>
      <p className="eyebrow">TRUST &amp; SAFETY</p>
      <h1>{page.title}</h1>
      <p className="legal-intro">{page.intro}</p>
      <div className="legal-table">
        {rows.map(([title, text]) => (
          <section key={title}><h2>{title}</h2><p>{text}</p></section>
        ))}
      </div>
      <p className="legal-date">制定予定日：有料サービス公開日　／　最終更新：2026年8月26日</p>
    </main>
  );
}
