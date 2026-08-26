import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./guardian.css";
import "./reading.css";

const title = "星詠堂｜あなたの答えを照らすAI鑑定";
const description = "星・数・札を、専属のAI案内人と読み解く。悩みから選べる、続いていく鑑定体験。";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") || "localhost:3000";
  const trusted = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) || /\.(sites\.openai\.com|chatgpt-team\.site|chatgpt\.com)$/.test(host);
  const metadataBase = new URL(`${host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https"}://${trusted ? host : "localhost:3000"}`);
  return {
    metadataBase, title, description,
    openGraph: { title, description, type: "website", locale: "ja_JP", images: [{ url: "/og.jpg", width: 1200, height: 675, alt: "星詠堂 あなたの答えを照らすAI鑑定" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og.jpg"] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
