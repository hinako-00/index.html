/* =========================================================
   鑑定の計算層
   入力（生年月日・名前・選んだ札・悩み）から、
   文章を組み立てるための鍵をすべてここで出す。
   ========================================================= */

export type Sign = {
  key: string; jp: string; en: string; el: "火" | "地" | "風" | "水";
  from: number; gift: string; shadow: string; day: string; color: string;
};

export const SIGNS: Sign[] = [
  { key:"capricorn", jp:"山羊座", en:"Capricorn", el:"地", from:1220, gift:"積み上げる力",       shadow:"休むことに許可がいる", day:"土曜", color:"墨(すみ)" },
  { key:"aquarius",  jp:"水瓶座", en:"Aquarius",  el:"風", from:120,  gift:"前提を疑う視点",     shadow:"心を測られるのを嫌う", day:"土曜", color:"浅葱(あさぎ)" },
  { key:"pisces",    jp:"魚座",   en:"Pisces",    el:"水", from:219,  gift:"感情を受け取る力",   shadow:"境界が薄く、もらい疲れる", day:"木曜", color:"藤(ふじ)" },
  { key:"aries",     jp:"牡羊座", en:"Aries",     el:"火", from:321,  gift:"最初の一歩",         shadow:"走り出した後の孤独に弱い", day:"火曜", color:"緋(ひ)" },
  { key:"taurus",    jp:"牡牛座", en:"Taurus",    el:"地", from:420,  gift:"時間を味方にする力", shadow:"終わった関係を手放せない", day:"金曜", color:"萌黄(もえぎ)" },
  { key:"gemini",    jp:"双子座", en:"Gemini",    el:"風", from:521,  gift:"言葉でつなぐ力",     shadow:"深まる直前に話題を変える", day:"水曜", color:"月白(げっぱく)" },
  { key:"cancer",    jp:"蟹座",   en:"Cancer",    el:"水", from:622,  gift:"安心の場をつくる力", shadow:"守るために先に閉じる", day:"月曜", color:"白練(しろねり)" },
  { key:"leo",       jp:"獅子座", en:"Leo",       el:"火", from:723,  gift:"場を明るくする力",   shadow:"弱みを見せる相手を選びすぎる", day:"日曜", color:"金襴(きんらん)" },
  { key:"virgo",     jp:"乙女座", en:"Virgo",     el:"地", from:823,  gift:"小さなずれを整える力", shadow:"自分にだけ点が辛い", day:"水曜", color:"利休鼠(りきゅうねずみ)" },
  { key:"libra",     jp:"天秤座", en:"Libra",     el:"風", from:923,  gift:"違う立場を結ぶ力",   shadow:"決めることを人に渡す", day:"金曜", color:"桜(さくら)" },
  { key:"scorpio",   jp:"蠍座",   en:"Scorpio",   el:"水", from:1024, gift:"奥まで見る力",       shadow:"一度疑うと戻れない", day:"火曜", color:"深緋(こきひ)" },
  { key:"sagittarius", jp:"射手座", en:"Sagittarius", el:"火", from:1123, gift:"未知へ向かう力", shadow:"重くなる前に離れる", day:"木曜", color:"瑠璃(るり)" },
];

export type NumberMeaning = { title: string; gift: string; trap: string; lesson: string };
export const NUMBERS: Record<number, NumberMeaning> = {
  1:  { title:"開拓の数", gift:"ゼロから立ち上げる力", trap:"助けを求められない頑固さ", lesson:"決断の主語を、いつも自分に戻すこと。" },
  2:  { title:"調停の数", gift:"人の間を保つ力",       trap:"我慢を優しさと呼ぶ癖",     lesson:"相手を理解する前に、自分の怒りを認めること。" },
  3:  { title:"表現の数", gift:"場を明るくする力",     trap:"軽さで本音を隠すこと",     lesson:"楽しませる前に、伝えたいことを一つ決めること。" },
  4:  { title:"基盤の数", gift:"積み上げを守る力",     trap:"変化を損だと感じる硬さ",   lesson:"守る対象を、年に一度は選び直すこと。" },
  5:  { title:"変転の数", gift:"環境に適応する速さ",   trap:"留まることへの過剰な恐れ", lesson:"逃げと転身を、自分の言葉で区別すること。" },
  6:  { title:"責任の数", gift:"引き受けて育てる力",   trap:"背負いすぎて枯れること",   lesson:"引き受ける前に、条件を一つ確認すること。" },
  7:  { title:"探究の数", gift:"深く掘り下げる力",     trap:"考えることで決断を延ばす癖", lesson:"調べ終える日を、先に決めておくこと。" },
  8:  { title:"結実の数", gift:"数字と成果を動かす力", trap:"止まると価値が消える感覚", lesson:"成果と自分の価値を、切り離して置くこと。" },
  9:  { title:"完了の数", gift:"全体を見て収める力",   trap:"自分の願いを後回しにする癖", lesson:"人の分より先に、自分の分を取ること。" },
  11: { title:"感受の数", gift:"言葉になる前を掴む力", trap:"感じすぎて動けなくなること", lesson:"受け取った気配を、身体から降ろすこと。" },
  22: { title:"構築の数", gift:"大きな形をつくる力",   trap:"規模で自分を測ること",     lesson:"小さく始めることを、負けと呼ばないこと。" },
  33: { title:"奉仕の数", gift:"惜しみなく与える力",   trap:"見返りのなさに疲れること", lesson:"与えた分を、受け取る練習をすること。" },
};

export const BRANCHES = [
  { jp:"子", el:"水" }, { jp:"丑", el:"土" }, { jp:"寅", el:"木" }, { jp:"卯", el:"木" },
  { jp:"辰", el:"土" }, { jp:"巳", el:"火" }, { jp:"午", el:"火" }, { jp:"未", el:"土" },
  { jp:"申", el:"金" }, { jp:"酉", el:"金" }, { jp:"戌", el:"土" }, { jp:"亥", el:"水" },
];

export type Element = "木" | "火" | "土" | "金" | "水";
export const ELEMENTS: Record<Element, { strong: string; weak: string; dir: string; care: string }> = {
  木: { strong:"企画力と成長意欲が高まり、新しい環境で伸びます。", weak:"苛立ちと伸び悩みが出やすくなります。", dir:"東",       care:"深呼吸と、緑のある場所。" },
  火: { strong:"発信力が上がり、あなたの言葉が届きやすくなります。", weak:"焦りと空回りが出ます。",           dir:"南",       care:"休息と睡眠。燃やしすぎないこと。" },
  土: { strong:"人望と信用が集まり、任される場面が増えます。",     weak:"思い悩みが長引き、腰が重くなります。", dir:"中央・地元", care:"規則正しい食事と、土に触れること。" },
  金: { strong:"決断力と審美眼が冴え、整理が進みます。",           weak:"厳しさが自他に向き、乾いた孤独が出ます。", dir:"西",   care:"白い衣類と、静かな音楽。" },
  水: { strong:"洞察力と柔軟性が高まり、人脈が自然に広がります。", weak:"不安と冷えが先に立ちます。",         dir:"北",       care:"温めることと、早めの就寝。" },
};

/* ---------- 基本の計算 ---------- */
export function hash32(s: string): number {
  let h = 2166136261;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const pickBy = <T,>(arr: readonly T[], seed: number): T => arr[Math.abs(seed) % arr.length];

export function getSign(birth: string): Sign {
  const [, m, d] = birth.split("-").map(Number);
  const md = m * 100 + d;
  if (md >= 1220 || md < 120) return SIGNS[0];
  for (let i = SIGNS.length - 1; i >= 1; i--) if (md >= SIGNS[i].from) return SIGNS[i];
  return SIGNS[1];
}
function reduceNum(n: number, allowMaster = true): number {
  while (n > 9 && !(allowMaster && [11, 22, 33].includes(n))) {
    n = String(n).split("").reduce((a, b) => a + Number(b), 0);
  }
  return n;
}
export function lifePath(birth: string): number {
  return reduceNum(birth.replace(/\D/g, "").split("").reduce((a, b) => a + Number(b), 0));
}
/** 個人年：同じ人でも年ごとに変わる。再訪で結果が変わる要。 */
export function personalYear(birth: string, now: Date): number {
  const [, m, d] = birth.split("-").map(Number);
  return reduceNum(reduceNum(m + d, false) + reduceNum(now.getFullYear(), false), false) || 9;
}
export function personalMonth(py: number, month: number): number {
  return reduceNum(py + month, false) || 9;
}
function biorhythm(birth: Date, at: Date) {
  const days = Math.floor((at.getTime() - birth.getTime()) / 86400000);
  return {
    p: Math.sin((2 * Math.PI * days) / 23),
    e: Math.sin((2 * Math.PI * days) / 28),
    i: Math.sin((2 * Math.PI * days) / 33),
  };
}

export const PM_THEME: Record<number, [string, string]> = {
  1: ["起こす", "新しい話が持ち込まれます。断らずに一度聞いてください。"],
  2: ["整える", "距離を調整する月。返事を寝かせて構いません。"],
  3: ["広げる", "声をかけられる月。誘いに乗ると縁が動きます。"],
  4: ["固める", "地味な作業が効く月。書類・数字・約束事を整えて。"],
  5: ["動く",   "予定が崩れやすい月。空いた場所のほうを見てください。"],
  6: ["担う",   "頼まれごとが増える月。引き受ける前に条件を一つ。"],
  7: ["沈む",   "内へ向かう月。判断より休息と学びに配分を。"],
  8: ["実る",   "努力が形になる月。交渉・請求・提出はこの月に。"],
  9: ["終える", "片づけの月。手放したぶん、翌月が軽くなります。"],
};

export type MonthPoint = { date: Date; label: string; year: number; score: number; pm: number };

export type Chart = {
  birth: string; name: string; seed: number;
  sign: Sign; lp: number; num: NumberMeaning;
  branch: { jp: string; el: string }; domEl: Element; weakEl: Element;
  py: number; pyLine: string;
  months: MonthPoint[]; best: MonthPoint; worst: MonthPoint; turning: Date;
  luckyNums: number[]; dir: string; code: string;
};

const PY_LINE: Record<number, string> = {
  1: "種を蒔く年です。ここで始めたことは九年かけて育ちます。",
  2: "育てる年。関係を耕すことが実になります。",
  3: "花の年。表現・発信・交流が運を運んできます。",
  4: "土台の年。地味な整備が、後年のすべてを支えます。",
  5: "変化の年。動く許可が出ています。留まるほうがリスクです。",
  6: "責任と愛の年。誰かを引き受ける場面が増えます。",
  7: "内省の年。外へ広げるより、深く掘るほうが正しい巡りです。",
  8: "収穫の年。努力が形になって返ります。",
  9: "完了の年。手放しと整理が主題。次の始まりの前夜です。",
};

export function buildChart(birth: string, name: string, now: Date): Chart {
  const seed = hash32(`${birth}|${name}`);
  const sign = getSign(birth);
  const lp = lifePath(birth);
  const num = NUMBERS[lp] ?? NUMBERS[9];
  const [y] = birth.split("-").map(Number);
  const branch = BRANCHES[(((y - 4) % 12) + 12) % 12];
  const r = rng(seed);

  // 五行の過不足：星座の元素と干支から寄せる
  const bal: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const signEl: Record<string, Element> = { 火: "火", 地: "土", 風: "金", 水: "水" };
  bal[signEl[sign.el]] += 3;
  bal[branch.el as Element] += 2;
  bal[(["木", "火", "土", "金", "水"] as Element[])[lp % 5]] += 2;
  (Object.keys(bal) as Element[]).forEach((k) => { bal[k] += r() * 2; });
  const sorted = (Object.entries(bal) as [Element, number][]).sort((a, b) => b[1] - a[1]);
  const domEl = sorted[0][0], weakEl = sorted[4][0];

  const py = personalYear(birth, now);
  const birthDate = new Date(birth);

  const months: MonthPoint[] = [];
  for (let i = 0; i < 12; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth() + i, 15);
    const b = biorhythm(birthDate, dt);
    const pm = personalMonth(personalYear(birth, dt), dt.getMonth() + 1);
    const boost = [0, 14, 4, 12, 2, 10, 8, -2, 16, 6][pm] ?? 0;
    const raw = 50 + (b.p * 12 + b.e * 14 + b.i * 10) + boost + (rng(seed + i * 7919)() * 10 - 5);
    months.push({ date: dt, label: `${dt.getMonth() + 1}月`, year: dt.getFullYear(), pm, score: Math.max(8, Math.min(98, Math.round(raw))) });
  }
  const best = [...months].sort((a, b) => b.score - a.score)[0];
  const worst = [...months].sort((a, b) => a.score - b.score)[0];

  // 転機の日：最良月のうち、感情の波が最も高い日
  let turning = best.date, tb = -2;
  const yy = best.date.getFullYear(), mm = best.date.getMonth();
  for (let d = 1; d <= new Date(yy, mm + 1, 0).getDate(); d++) {
    const dt = new Date(yy, mm, d);
    const b = biorhythm(birthDate, dt);
    const v = b.e * 1.15 + b.p + b.i * 0.85;
    if (v > tb) { tb = v; turning = dt; }
  }

  const luckyNums = [...new Set([lp, (lp * 3) % 9 || 9, (y % 9) || 9])].slice(0, 3);

  return {
    birth, name, seed, sign, lp, num, branch, domEl, weakEl,
    py, pyLine: PY_LINE[py] ?? "",
    months, best, worst, turning,
    luckyNums, dir: ELEMENTS[domEl].dir,
    code: `HY-${String(seed % 100000).padStart(5, "0")}-${sign.en.slice(0, 2).toUpperCase()}${lp}`,
  };
}

/* ---------- 日付の書式 ---------- */
const WD = ["日", "月", "火", "水", "木", "金", "土"];
export const jd = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`;
export const jm = (d: Date) => `${d.getFullYear()}年${d.getMonth() + 1}月`;
export const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/* ---------- 月齢（新月の再訪導線に使う） ---------- */
const SYNODIC = 29.53058867;
export function moonAge(at: Date): number {
  const base = Date.UTC(2000, 0, 6, 18, 14);
  return (((at.getTime() - base) / 86400000) % SYNODIC + SYNODIC) % SYNODIC;
}
export function nextNewMoon(from: Date): Date {
  const age = moonAge(from);
  return new Date(from.getTime() + (SYNODIC - age) * 86400000);
}
