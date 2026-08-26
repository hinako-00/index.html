import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_PAGES } from "../../../lib/legal";



export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params; const page=LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];
  return {title:page?`${page.title}｜星詠堂`:"ページが見つかりません｜星詠堂",description:page?.intro};
}

export default async function LegalPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const page=LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];
  if(!page)return <main className="legal"><Link href="/">← 星詠堂へ</Link><h1>ページが見つかりません</h1></main>;
  const rows="rows" in page?page.rows:page.sections;
  return <main className="legal"><Link className="legal-back" href="/">← 星詠堂へ戻る</Link><p className="eyebrow">TRUST &amp; SAFETY</p><h1>{page.title}</h1><p className="legal-intro">{page.intro}</p><div className="legal-table">{rows.map(([title,text])=><section key={title}><h2>{title}</h2><p>{text}</p></section>)}</div><p className="legal-date">制定予定日：有料サービス公開日　／　最終更新：2026年8月26日</p></main>;
}
