import type { Metadata } from "next";
import Link from "next/link";
import { FAQ as faq } from "../../lib/faq";

export const metadata: Metadata = {
  title: "よくある質問｜星詠堂",
  description: "星詠堂の鑑定、守護獣、会員プラン、解約、データの取り扱いに関するよくある質問。",
};



export default function FaqPage(){
  return <main className="faq-page"><Link className="legal-back" href="/">← 星詠堂へ戻る</Link><header><p className="eyebrow">QUESTIONS UNDER THE MOON</p><h1>よくある質問</h1><p>ひらく前に知っておきたいことを、ここにまとめました。</p></header><div className="faq-list">{faq.map(([q,a],i)=><details key={q} open={i===0}><summary><span>{String(i+1).padStart(2,"0")}</span>{q}</summary><p>{a}</p></details>)}</div><aside><p>このほかに確認したいことがありますか。</p><a href="mailto:support@example.com">お問い合わせを送る →</a></aside></main>;
}
