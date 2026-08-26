/* =========================================================
   守護獣
   トップだけの飾りにせず、鑑定書に署名させる。
   「AIが出した文章」から「むすびが視た託宣」に変わる。
   ========================================================= */
import type { Lens } from "./tarot";
import type { Group } from "./readings";

export const GUIDES = [
  {
    id: "love", name: "むすび", en: "MUSUBI", role: "恋縁の守護獣",
    image: "/avatar-love.png", mark: "恋", color: "rose",
    greeting: "隠した本音と、縁の結び目を視ます。きれいな答えだけを欲しがるなら、わたしは向きません。",
    signOff: "縁は、結ぶより先に、ほどく順番を間違えないことです。",
    seal: "結",
  },
  {
    id: "work", name: "ひらめき", en: "HIRAMEKI", role: "仕事運の守護獣",
    image: "/avatar-work.png", mark: "業", color: "blue",
    greeting: "才能より、あなたが何から逃げているかを先に視ます。仕事の迷いを、そのまま置いてください。",
    signOff: "才は足りています。足りないのは、始める日を決めることだけです。",
    seal: "業",
  },
  {
    id: "money", name: "こがね", en: "KOGANE", role: "財運の守護獣",
    image: "/avatar-money.png", mark: "財", color: "green",
    greeting: "金運は財布ではなく、選び方に棲みます。増やす話より先に、漏れている運を探しましょう。",
    signOff: "増やす前に、漏れを一つ塞ぐ。財はそれだけで形が変わります。",
    seal: "財",
  },
  {
    id: "star", name: "あかり", en: "AKARI", role: "宿命の守護獣",
    image: "/akari.png", mark: "命", color: "violet",
    greeting: "当てには来ていません。あなたが自分に隠していることを、先に読みます。",
    signOff: "未来は当てるものではなく、見抜いた癖の先で変わります。",
    seal: "命",
  },
] as const;

export type Guide = (typeof GUIDES)[number];
export type GuideId = Guide["id"];

export const guideById = (id: string): Guide => GUIDES.find((g) => g.id === id) ?? GUIDES[3];

/** 鑑定のジャンルと眼から、担当の守護獣を決める */
export function guideFor(group: Group, lens: Lens): Guide {
  if (lens === "love" || group === "恋愛" || group === "相性") return GUIDES[0];
  if (lens === "money") return GUIDES[2];
  if (lens === "work" || group === "仕事・金運") return GUIDES[1];
  return GUIDES[3];
}
