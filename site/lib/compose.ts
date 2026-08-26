/* =========================================================
   鑑定書の組み立て
   出力は次の4つすべてから決まる：
     ① どの鑑定を選んだか  ② 生年月日（＋個人年）
     ③ 選んだ悩み          ④ 引いた札
   どれか一つでも変われば、文章が変わる。
   ========================================================= */
import {
  Chart, buildChart, jd, jm, pickBy, ELEMENTS, PM_THEME, moonAge, nextNewMoon,
} from "./engine";
import { Drawn, Lens, LENS_REV, lensLine, drawFromPicks } from "./tarot";
import { Reading } from "./readings";
import { GUIDES, guideFor } from "./guides";

export type Block =
  | { t: "p"; html: string }
  | { t: "quote"; html: string }
  | { t: "verdict"; label: string; big: string; sub: string }
  | { t: "kv"; rows: [string, string][] }
  | { t: "months"; data: { label: string; score: number; theme: string; note: string }[] }
  | { t: "cards"; data: Drawn[]; pos: string[]; lens: Lens }
  | { t: "steps"; items: [string, string][] }
  | { t: "list"; items: string[] };

export type Chapter = { no: string; title: string; en: string; blocks: Block[]; chars: number };
export type Doc = {
  head: { kind: string; title: string; who: string; code: string; pillars: [string, string][] };
  free: Chapter[];
  paid: Chapter[];
  gate: { lead: string; h: string; why: string; list: { title: string; teaser: string; chars: number }[]; totalChars: number };
  guide: (typeof GUIDES)[number];
  nextDate: string;      // ピーク・エンド：次に来るべき日
  savedUntil: string;    // 保有効果：保存期限
};

/* ---------- 記法 ---------- */
const HL = (s: string) => `<em class="hl">${s}</em>`;
const WARN = (s: string) => `<em class="warn">${s}</em>`;
const CALM = (s: string) => `<em class="calm">${s}</em>`;
const MK = (s: string) => `<span class="mark">${s}</span>`;
const HLL_SAFE = (s: string) => `<em class="hl-lg">${s}</em>`;
const esc = (s: string) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]!));

const KAN = ["壱","弐","参","肆","伍","陸","漆","捌","玖","拾"];
function chapter(i: number, title: string, en: string, blocks: Block[]): Chapter {
  const chars = blocks.reduce((a, b) => a + blockChars(b), 0);
  return { no: KAN[i] ?? String(i + 1), title, en, blocks, chars };
}
function blockChars(b: Block): number {
  const strip = (h: string) => h.replace(/<[^>]*>/g, "").length;
  switch (b.t) {
    case "p": case "quote": return strip(b.html);
    case "verdict": return strip(b.big) + strip(b.sub);
    case "kv": return b.rows.reduce((a, [k, v]) => a + k.length + strip(v), 0);
    case "months": return b.data.reduce((a, m) => a + m.note.length + 6, 0);
    case "cards": return b.data.length * 90;
    case "steps": return b.items.reduce((a, [t, d]) => a + t.length + strip(d), 0);
    case "list": return b.items.reduce((a, s) => a + strip(s), 0);
  }
}

/* ---------- 投影しやすい導入（バーナム） ---------- */
const SEE = [
  "あなたは、人前では平気な顔をしていられる人ですね。",
  "あなたは、頼まれると断れないほうですね。",
  "あなたは、いちばん近い人にほど本音を言えずにいますね。",
  "あなたは、自分より先に相手の事情を考えてしまう人ですね。",
  "あなたは、期待に応えることで自分の居場所を作ってきた人ですね。",
  "あなたは、決めるまでが長く、決めたあとは早い人ですね。",
  "あなたは、去られることに人一倍敏感な人ですね。",
  "あなたは、誰かに大丈夫と言いながら、自分にはまだ言えていませんね。",
];
const SEE2 = [
  "そしてそれを、誰にも「しんどい」と言えないまま来たはずです。",
  "それを性格だと言われ続けて、もう疑うこともやめてしまった。",
  "周りからは「しっかりしている」と言われるのに、内側ではずっと心細い。",
  "本当は、一度でいいから誰かに全部預けてしまいたいと思っている。",
  "なのに、いざ差し出されると受け取れない。そういう不器用さがあります。",
];

/* 悩みの見出し（本文で必ず引用して返す） */
export const CONCERNS = [
  { id:"love",    mark:"恋", title:"相手の気持ち",   text:"言葉になっていない関係を視る", pick:"t-honne",     alts:["a-honne","l-kataomoi"] },
  { id:"meet",    mark:"縁", title:"出会い・結婚",   text:"ご縁が動く時期と条件を視る",   pick:"l-deai",      alts:["l-kekkon","a-marry"] },
  { id:"work",    mark:"財", title:"仕事・お金",     text:"動く時期と自分の強みを視る",   pick:"w-tenshoku",  alts:["w-timing","w-kinun"] },
  { id:"self",    mark:"命", title:"自分・宿命",     text:"繰り返すパターンを読み解く",   pick:"f-shukumei",  alts:["f-kage","f-year"] },
  { id:"people",  mark:"人", title:"人間関係",       text:"疲れる関係と境界線を整理する", pick:"w-ningen",    alts:["a-friend","f-innen"] },
  { id:"unknown", mark:"？", title:"何を占うか決めかねている", text:"星に選ばせる", pick:"",  alts:[] },
] as const;
export type ConcernId = (typeof CONCERNS)[number]["id"];
export const concernById = (id: string) => CONCERNS.find((c) => c.id === id) ?? CONCERNS[3];

/* 「星に選ばせる」：選択のコストをゼロにする導線 */
export function assignedReading(birth: string, now: Date, pool: Reading[]): Reading {
  const h = Math.abs(
    [...`${birth}|${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`]
      .reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619), 2166136261)
  );
  return pool[h % pool.length];
}

export type Input = {
  reading: Reading;
  birth: string;
  name: string;
  concern: ConcernId;
  question?: string;   // 自分で書いた問い（努力の正当化）
  picks?: number[];    // 選んだ札の位置
  partnerBirth?: string;
  now: Date;
};

export function compose(inp: Input): Doc {
  const { reading: R, now } = inp;
  const c = buildChart(inp.birth, inp.name, now);
  const guide = guideFor(R.group, R.lens);
  const con = concernById(inp.concern);
  const who = inp.name ? `${esc(inp.name)}さん` : "あなた";
  const lens = R.lens;

  const draw: Drawn[] = R.engine === "tarot" && inp.picks?.length
    ? drawFromPicks(inp.picks, `${R.id}|${inp.birth}|${now.toDateString()}`)
    : [];

  const free: Chapter[] = [];
  const paid: Chapter[] = [];

  /* ===== 壱 星痕：投影＋その人の実データ ===== */
  const seeBlocks: Block[] = [
    { t:"p", html:
      `<strong>${pickBy(SEE, c.seed)}</strong><br>${pickBy(SEE2, c.seed >>> 5)}` },
    { t:"p", html:
      `${who}の命式には、${HL(c.sign.jp)}の${HL(c.sign.gift)}と、運命数${HL(String(c.lp))}——${c.num.title}が出ています。` +
      `この二つが重なる人は、${c.num.gift}を持ちながら、${WARN(c.num.trap)}を同時に抱えます。` +
      `${c.sign.shadow}という癖も、ここから来ています。` },
    { t:"p", html:
      `いま${who}は${HL(`個人年${c.py}`)}の巡りにいます。${c.pyLine}` +
      `主たる気は${HL(c.domEl)}、薄いのは${WARN(c.weakEl)}。${ELEMENTS[c.domEl].strong}` +
      `逆に${c.weakEl}が薄いぶん、${WARN(ELEMENTS[c.weakEl].weak)}` },
    { t:"p", html:
      `${HL(c.branch.jp)}年生まれという配置も効いています。${c.branch.el}の気を帯びたこの年の生まれは、` +
      `${pickBy([
        "周囲が思うより慎重で、動き出す前に何度も確かめます。その慎重さは、過去に一度、急いで失敗した記憶から来ています。",
        "決めた後の粘りが強く、途中でやめられません。それが強みになる場面と、抜け出せなくなる場面の両方があります。",
        "人の感情の変化に早く気づきます。気づいてしまうぶん、先回りして疲れます。",
        "自分の手柄を主張するのが苦手です。結果として、実力より評価が一段低く見積もられがちです。",
      ], c.seed >>> 11)}` },
  ];
  // 選んだ悩みを、必ず本文で引用して返す
  if (inp.question?.trim()) {
    seeBlocks.push({ t:"quote", html:
      `「${esc(inp.question.trim().slice(0, 60))}」——そう置いてくださいましたね。<br>` +
      `この言葉には、${MK("事実より先に感情が置かれています")}。そこが入口です。` });
  } else {
    seeBlocks.push({ t:"p", html:
      `${who}が選んだのは${HL(`「${con.title}」`)}の門でした。${con.text}——` +
      `その入口を選ぶ人には、共通してひとつの傾向があります。${CALM("答えを知りたいのではなく、決めてよいという許可を探している")}という傾向です。` });
  }
  free.push(chapter(0, "星痕", "The Mark", seeBlocks));

  /* ===== 弐 影の正体：鑑定ごとに違う問いを立てる ===== */
  const shadowBlocks: Block[] = [
    { t:"p", html:
      `ここからは、少し言いにくいことを書きます。${who}がこの鑑定に置いた問いは、` +
      `${HL(`「${R.verdict.q}」`)}でした。` },
    { t:"p", html:
      `運命数${c.lp}の${who}にとって、この問いが重くなる理由ははっきりしています。${c.num.lesson}` +
      `それができていない時期、${WARN(c.num.trap)}が前に出ます。いまがその時期です。` },
  ];
  if (draw.length) {
    shadowBlocks.push({ t:"cards", data: draw, pos: R.pos ?? [], lens });
    const key = draw[Math.min(1, draw.length - 1)];
    shadowBlocks.push({ t:"p", html:
      `${who}が${draw.length > 1 ? `${Math.min(2, draw.length)}枚目に` : ""}選んだ` +
      `${HL(key.card.jp)}の${key.rev ? "逆位置" : "正位置"}が、それを裏づけています。` +
      `${key.rev ? LENS_REV[lens] : ""}${lensLine(key.card, lens)}` });
  }
  shadowBlocks.push({ t:"p", html:
    `${who}がこれまで、この場面で取ってきた手はおそらく一つです。` +
    `${WARN(pickBy([
      "もう少し様子を見る、という保留。",
      "相手の出方を待つ、という受け身。",
      "自分が我慢すれば収まる、という引き受け。",
      "情報をもっと集める、という準備。",
    ], c.seed >>> 13))}` +
    `それは間違いではありませんでした。${CALM("これまでは、それで足りていたからです。")}` +
    `ただし個人年${c.py}のいま、同じ手はもう効きません。` });
  shadowBlocks.push({ t:"p", html:
    `耳に痛いなら、そこが触れられた場所です。${CALM("反発は、当たっていない印ではありません。")}` +
    `——この問いの答えは、` });
  free.push(chapter(1, "影の正体", "The Shadow", shadowBlocks));

  /* ===== 参 核心：鑑定ごとに違う結論（ここが有料の入口） ===== */
  paid.push(chapter(2, "核心", "The Answer", [
    { t:"verdict", label:"託宣", big: R.verdict.a, sub:`条件はひとつ。${R.verdict.cond}` },
    { t:"p", html:
      `${R.verdict.a}${who}の場合、これは性格の問題ではありません。` +
      `${HL(c.sign.jp)}・運命数${HL(String(c.lp))}・${HL(`個人年${c.py}`)}の組み合わせが、いまこの形を作っています。` },
    { t:"p", html:
      `<strong>なぜそうなるのか。</strong>${who}は${c.num.gift}を持っています。` +
      `この力は、対象が決まっているときには強く働きます。ところが対象が定まらないと、同じ力が` +
      `${WARN("考え続けること")}に向かいます。いま起きているのは能力不足ではなく、${MK("力の向き先がない状態")}です。` +
      `${c.sign.jp}の${who}が${c.sign.shadow}のも、ここに理由があります。` },
    { t:"p", html:
      `<strong>何を失うか。</strong>どちらを選んでも、何かは失います。完全な正解を探している限り、${who}は選べません。` +
      `問うべきは「何を得たいか」ではなく、${HLL_SAFE("どの痛みなら引き受けられるか")}です。` +
      `${CALM("慣れた苦しさには中毒性があります。")}新しい不安より、古い不満のほうが楽だからです。` },
    { t:"p", html:
      `<strong>いつ動くか</strong>　${HL(jm(c.best.date))}（指数 ${c.best.score}）。` +
      `逆に${WARN(jm(c.worst.date))}（指数 ${c.worst.score}）の決断は避けてください。` +
      `決定的な一日は${HL(jd(c.turning))}です。この日の前後三日は、同じ言葉でも通り方が変わります。` },
    ...(draw.length ? [{ t:"p", html:
      `<strong>札が示す条件</strong>　${HL(draw[draw.length - 1].card.jp)}が結論に出ました。` +
      `${lensLine(draw[draw.length - 1].card, lens)}` } as Block] : []),
  ]));

  /* ===== 肆〜：ジャンルごとに章立てを変える ===== */
  paid.push(...genreChapters(R, c, who, lens, draw, inp));

  /* ===== 禁句と護符：どのジャンルにも要る実用部分 ===== */
  paid.push(chapter(paid.length + 2, "禁句", "What Closes It", [
    { t:"p", html:
      `<strong>この三つを口にした瞬間、いまの流れは閉じます。</strong>` +
      `運命数${c.lp}の${who}が、疲れているときに出やすい言い方です。` },
    { t:"list", items: [
      `${WARN("「どうせ私なんて」")}——責任を手放すための呪文です。言った瞬間、選択肢が本当に減ります。`,
      `${WARN("「いまは時期じゃない」")}——時期ではなく覚悟が足りないだけ、という場合があります。${HL(jm(c.best.date))}を過ぎても同じことを言っていたら、それは時期の話ではありません。`,
      `${WARN(pickBy([
        "「相手が変わってくれれば」", "「もう少し落ち着いたら」", "「私が我慢すればいい」", "「たぶん考えすぎ」",
      ], c.seed >>> 15))}——自分の境界線を、他人か時間に預けています。`,
    ]},
    { t:"p", html:
      `逆に、${who}が言うべき一言は決まっています。${HL(pickBy([
        "「少し考えます」", "「それは私の役目ではないです」", "「今日は先に帰ります」", "「助かりました」と、先に",
      ], c.seed >>> 17))}。${MK("一度言えたら、二度目からは驚くほど軽くなります")}。` },
  ]));

  paid.push(chapter(paid.length + 2, "護符", "Charms", [
    { t:"p", html:
      `明日から使える処方をまとめます。験担ぎと侮らないでください。` +
      `${MK("行動の前に小さな儀式があると、判断の質が変わります")}。` },
    { t:"kv", rows: [
      ["幸運の色", `${HL(c.sign.color)}。派手に取り入れる必要はありません。見えないところに一つあれば十分です。`],
      ["幸運の数", HL(c.luckyNums.join("・"))],
      ["吉方", `${HL(c.dir)}。大きな決断の前に、この方角へ足を運んでください。`],
      ["曜日", `${HL(c.sign.day)}。重要な連絡・面談はこの曜日に。`],
      ["養生", ELEMENTS[c.domEl].care],
      ["避けるもの", WARN(`${c.weakEl}を削る場面。${ELEMENTS[c.weakEl].weak}`)],
    ]},
  ]));

  /* ===== 結び：守護獣の署名 ===== */
  const nextDate = jd(c.turning);
  paid.push(chapter(paid.length + 2, "結び", "Closing", [
    { t:"p", html:
      `${who}。ここまで読んでくださって、ありがとうございました。` +
      `当たっているかどうかより、読んで少しでも息がしやすくなったなら、この鑑定は役目を果たしています。` },
    { t:"p", html:
      `${HL(c.sign.jp)}の、運命数${HL(String(c.lp))}の、${HL(c.branch.jp)}年生まれの${who}が、` +
      `次にこの扉を開くとき、少しでも軽くなっていますように。` },
    { t:"quote", html:
      `次にひらくなら、${HL(nextDate)}が良いでしょう。<br>その日、${who}の三つの周期が同時に上を向きます。` },
  ]));

  /* ===== ゲート（情報ギャップ：残り字数とその人固有の予告） ===== */
  const totalChars = paid.reduce((a, ch) => a + ch.chars, 0);
  const gate = {
    lead: `${guide.name}は、ここで一度口を閉じます。`,
    h: `${who}の場合、${HL(jm(c.best.date))}に一度ほどけます。`,
    why: `無料でお見せするのは「${who}が何者か」まで。その先——<strong>いつ、何をすべきか</strong>は、覚悟のある方にだけ。`,
    list: paid.map((ch) => ({
      title: ch.title,
      teaser: teaserFor(ch.title, c, R),
      chars: ch.chars,
    })),
    totalChars,
  };

  const saved = new Date(now.getTime() + 7 * 86400000);
  return {
    head: {
      kind: `${R.group} · 星詠堂秘儀`,
      title: R.title,
      who: `${who} / ${c.sign.jp} / 運命数${c.lp} / 個人年${c.py}`,
      code: c.code,
      pillars: [
        ["日", c.sign.jp], ["数", `${c.lp}・${c.num.title}`],
        ["支", c.branch.jp], ["気", c.domEl], ["年", `個人年${c.py}`],
      ],
    },
    free, paid, gate, guide,
    nextDate,
    savedUntil: jd(saved),
  };
}

function teaserFor(title: string, c: Chart, R: Reading): string {
  switch (title) {
    case "核心":   return `${R.verdict.q}——その答えと、満たすべき条件`;
    case "禁句":   return `いま言うと流れが閉じる三つの言い方`;
    case "護符":   return `色・数・方位・曜日・${c.sign.day}の使い方`;
    case "流れ":   return `${jm(c.best.date)}が最も強く、${jm(c.worst.date)}が谷`;
    case "人":     return `${c.weakEl}の気を持つ人が、いま鍵を握っています`;
    case "言葉":   return `場面ごとに、効く一言と禁句`;
    case "深層":   return `札と札のあいだに出ている流れ`;
    case "実践":   return `${jd(c.turning)}までの三十日の手順`;
    case "生涯":   return `どの数がいつ効くか、年代別に`;
    case "結び":   return `${c.sign.jp}のあなたへ、守護獣からの署名`;
    default:       return `${R.title}の続き`;
  }
}

/* =========================================================
   ジャンル別の章
   ========================================================= */
function genreChapters(R: Reading, c: Chart, who: string, lens: Lens, draw: Drawn[], inp: Input): Chapter[] {
  const out: Chapter[] = [];
  const monthBlock: Block = {
    t: "months",
    data: c.months.map((m) => {
      const th = PM_THEME[m.pm] ?? PM_THEME[1];
      return {
        label: `${m.label}`, score: m.score, theme: th[0],
        note: m.score >= 72 ? `${th[1]} 攻めてよい月です。`
            : m.score <= 38 ? `${th[1]} 新しい約束は控えめに。`
            : th[1],
      };
    }),
  };

  if (R.group === "タロット") {
    /* 深層：札と札のあいだ */
    const pairs: string[] = [];
    for (let i = 0; i < draw.length - 1; i++) {
      const A = draw[i], B = draw[i + 1];
      const as = A.rev ? A.card.rv : A.card.up, bs = B.rev ? B.card.rv : B.card.up;
      pairs.push(
        `<strong>${R.pos?.[i]} → ${R.pos?.[i + 1]}</strong>　${HL(A.card.jp)}から${HL(B.card.jp)}へ。` +
        `${MK(`${as.kw.split("・")[0]}が${bs.kw.split("・")[0]}に変わる`)}流れです。` +
        pickBy([
          "この移り変わりは、あなたが何かを手放した瞬間に起きます。",
          "ここには一度、落ち込む谷があります。谷を飛ばそうとすると戻されます。",
          "この間に、想定していない人が一人関わってきます。",
          "この変化は自然には起きません。あなたが先に一手を置く必要があります。",
        ], A.card.n * 7 + B.card.n)
      );
    }
    const revN = draw.filter((d) => d.rev).length;
    out.push(chapter(3, "深層", "Between the Cards", [
      { t:"p", html:
        `<strong>ここからは、札を一枚ずつではなく「並び」として読みます。</strong>` +
        `${MK("タロットの本当の答えは、札と札のあいだにあります")}。` },
      { t:"p", html: revN === 0
        ? `${who}が引いた${draw.length}枚は、すべて正位置でした。${HL("迷いが少ない配置")}です。答えはすでに出ていて、あとは踏み切るだけの段階にあります。`
        : revN === draw.length
        ? `${who}が引いた${draw.length}枚は、すべて逆位置でした。${WARN("いま無理に動かす時期ではありません")}。ただしこれは「駄目」ではなく「まだ」です。`
        : `${HL(`${revN}枚が逆位置`)}で出ました。進む力と止まる力が同時に働いている、${CALM("迷いのある配置")}です。` },
      ...pairs.map((h) => ({ t:"p", html: h } as Block)),
      { t:"kv", rows: [
        ["見落としている点", HL(pickBy([
          "すでに答えは出ていて、あなたは確認を求めているだけだということ。",
          "この件で疲れている理由が、実は別のところにあるということ。",
          "相手の反応を待っている間に、選択肢が一つ減っているということ。",
          "恐れているのは結果ではなく、決めた責任を負うことだということ。",
        ], c.seed >>> 5))],
        ["札が繰り返し示すこと", MK(pickBy([
          "待つのをやめること","抱えているものを一つ減らすこと",
          "本音を一人だけに伝えること","決める日を自分で決めること",
        ], c.seed >>> 9))],
      ]},
    ]));
    out.push(chapter(4, "流れ", "The Year Ahead", [
      { t:"p", html:
        `<strong>札は「いま」を映しますが、いまは十二か月の波の上にあります。</strong>` +
        `${who}の生年月日から出した指数を重ねると、この札がなぜ今日出たのかが見えます。` +
        `${MK("50を平常とし、70を超えると追い風、40を切ると向かい風")}です。` },
      monthBlock,
      { t:"p", html:
        `いまは${HL(`指数${c.months[0].score}`)}の月。${HL(jm(c.best.date))}に山が来ます。` +
        `${WARN(jm(c.worst.date))}は谷です。${CALM("札が厳しく出た月ほど、指数の谷と重なっていることが多い")}——` +
        `それは${who}の問題ではなく、周期です。` },
    ]));
    out.push(chapter(5, "実践", "Seven Days", [
      { t:"p", html: `<strong>七日間の手順に落とします。</strong>札は読んだだけでは動きません。` },
      { t:"steps", items: [
        ["一日目", `${HL(R.verdict.cond)}まずここから。`],
        ["二〜三日目", `結論を急がず、${MK("人に相談しないこと")}。この配置は他人の意見が入ると濁ります。`],
        ["四日目", "一度この件から丸一日離れてください。距離を取った日に答えが降りる配置です。"],
        ["五〜六日目", `合図が来ます。${HL(pickBy(["同じ話を三日以内に二度聞く","その人から先に連絡が来る","断る理由が消える"], c.seed))}。`],
        ["七日目", `<strong>ここで決めてください。</strong>この札の力が届くのは${HL("二週間以内")}です。`],
      ]},
    ]));
    return out;
  }

  if (R.group === "相性") {
    const b = inp.partnerBirth ? buildChart(inp.partnerBirth, "", inp.now) : null;
    out.push(chapter(3, "言葉", "What to Say", [
      { t:"p", html:
        `<strong>この関係では、何を言うかより「どう言うか」が結果を決めます。</strong>` +
        (b ? `${who}は${HL(c.sign.jp)}、お相手は${HL(b.sign.jp)}。` +
             `${c.domEl}と${b.domEl}の組み合わせは、${c.domEl === b.domEl ? "似すぎて逃げ場がなくなりやすい" : "見えている世界が違う"}配置です。` : "") },
      { t:"kv", rows: [
        ["距離が空いたとき", `○　${HL("「最近どう？」だけ送る")}<br>×　${WARN("「なんで連絡くれないの」")}`],
        ["相手が黙ったとき", `○　${HL("「今じゃなくていいよ」")}<br>×　${WARN("「何か言ってよ」")}`],
        ["謝るとき", `○　${HL("「私が急かした」と主語を自分に")}<br>×　${WARN("「そんなつもりじゃなかった」")}`],
        ["先に進めたいとき", `○　${HL("「どうしたい？」と相手に返す")}<br>×　${WARN("「私たちってどうなるの」")}`],
      ]},
      { t:"p", html:
        `<strong>この人に一番効く伝え方</strong>　${HL(pickBy([
          "短く、一度だけ。繰り返すと重さが消えます。",
          "結論から。前置きが長いと身構えられます。",
          "文字より声。この人は文面だと冷たく読む癖があります。",
          "相手が忙しくない時間に。内容よりタイミングで受け取り方が変わります。",
        ], c.seed + (b?.lp ?? 0)))}` },
    ]));
    out.push(chapter(4, "流れ", "Turning Points", [
      { t:"p", html: `<strong>この関係が、いつどう動くか。</strong>${MK("相性そのものより、この「時期」のほうが結果を左右します")}。` },
      monthBlock,
      { t:"p", html:
        `<strong>関係が動く月</strong>　${HL(jm(c.best.date))}。<br>` +
        `<strong>決定的な一日</strong>　${HL(jd(c.turning))}。この日の前後三日は${MK("言葉が普段の二倍の重さで届きます")}。<br>` +
        `<strong>気をつける月</strong>　${WARN(jm(c.worst.date))}。この時期の衝突は内容ではなく${WARN("タイミングのせい")}です。` },
    ]));
    return out;
  }

  if (R.group === "名前") {
    out.push(chapter(3, "生涯", "A Lifetime", [
      { t:"p", html:
        `<strong>名前は、人生のどの時期にどの数が前に出るかを示します。</strong>` +
        `${MK("いま効いている数と、これから効く数は違います")}。うまくいかない時期は「まだその数の番ではない」だけということが起こります。` },
      { t:"kv", rows: [
        ["〜25歳", "地格が主に働く時期。若さと勢いで通る場面が多く、正しさより速さが評価されます。"],
        ["26〜45歳", `人格が前に出る時期。対人でぶつかることの多くは、この数の癖から来ています。${c.num.lesson}`],
        ["46〜60歳", "外格が効く時期。外での立ち位置が定まり、頼まれ方が変わります。"],
        ["61歳〜", "総格が結論を出す時期。それまでに積んだものが、そのまま形になります。"],
      ]},
      { t:"p", html:
        `${who}の場合、いま働いているのは${HL(c.py <= 4 ? "地格から人格へ移る境目" : "人格の盛り")}です。` },
    ]));
    out.push(chapter(4, "流れ", "The Year Ahead", [
      { t:"p", html:
        `<strong>名前の力は、年によって出方が変わります。</strong>` +
        `${who}の十二か月の指数に、名前の格を重ねて読みます。` +
        `${MK("同じ名前でも、通る月と通らない月があります")}。` },
      monthBlock,
      { t:"p", html:
        `名乗りが最も通るのは${HL(jm(c.best.date))}。自己紹介・面談・申し込みはこの月に寄せてください。` +
        `逆に${WARN(jm(c.worst.date))}は、名前が誤解されやすい月です。` },
    ]));
    out.push(chapter(5, "開運", "How to Use It", [
      { t:"p", html: `<strong>画数は変えられませんが、${MK("どの名で呼ばれるかは選べます")}。</strong>ここが姓名判断の実用部分です。` },
      { t:"kv", rows: [
        ["最も運が動く呼ばれ方", `${HL("下の名前で呼ばれること")}。姓で呼ぶ関係は、外格の影響を強く受けます。`],
        ["署名の書き方", `${HL("姓と名のあいだを一字分あける")}こと。格の境目が曖昧だと、運の切り替わりも曖昧になります。`],
        ["吉日", `毎月${HL(`${(c.lp * 3) % 28 + 1}日`)}、および${HL(c.sign.day)}。契約・提出はこの日に。`],
        ["名を書く習慣", `${MK("毎朝一度、自分の名前を手書きすること")}。画数が身体を通るのは、書いたときだけです。`],
        ["避けること", `${WARN("略称だけで呼ばれ続けること")}。画数の働かない呼び名が主になると、格の力が薄まります。`],
      ]},
    ]));
    return out;
  }

  /* 恋愛 / 仕事・金運 / 人生・宿命（生年月日） */
  out.push(chapter(3, "流れ", "The Year Ahead", [
    { t:"p", html:
      `<strong>ここからは、${who}の十二か月を月ごとに開きます。</strong>` +
      `指数は生年月日から出した身体・感情・知性の周期に、個人年の巡りを重ねた数字です。` +
      `${MK("50を平常とし、70を超えると追い風、40を切ると向かい風")}と読んでください。` },
    monthBlock,
    { t:"p", html:
      `<strong>最も追い風の月</strong>　${HL(jm(c.best.date))}（指数 ${c.best.score}）。同じ行動でも通り方が変わります。<br>` +
      `<strong>最も重い月</strong>　${WARN(jm(c.worst.date))}（指数 ${c.worst.score}）。ここで起きることは、たいてい${CALM("あなたのせいではありません")}。<br>` +
      `<strong>決定的な一日</strong>　${HL(jd(c.turning))}。` },
  ]));

  out.push(chapter(4, "人", "People", [
    { t:"p", html:
      `<strong>人からどう見えているか</strong>と<strong>実際のあなた</strong>には、${HL("はっきりしたズレ")}があります。` +
      `命式では、それがそのまま人間関係の疲れ方に出ています。` },
    { t:"kv", rows: [
      ["第一印象", pickBy([
        "「しっかりしていて、頼りやすい人」","「穏やかで、当たりの柔らかい人」",
        "「何を考えているか少し掴めない人」","「気配りができて、隙のない人」",
      ], c.seed >>> 3)],
      ["実像", CALM(pickBy([
        "実際は、頼られるたびに少しずつ削れています。",
        "実際は、穏やかなのではなく、波風を立てない選択を毎回している。",
        "実際は、掴めないのではなく、掴ませたときに失う経験をしてきた。",
        "実際は、隙がないのではなく、隙を見せられる相手にまだ出会っていないだけ。",
      ], c.seed >>> 3))],
      ["支える人", `${HL(`${c.weakEl}の気を持つ人`)}。${ELEMENTS[c.weakEl].strong}あなたに欠けている視点を、当たり前に持っています。`],
      ["消耗させる人", WARN(pickBy([
        "善意で助言を重ねてくる人。悪気がないぶん、断れず溜まります。",
        "感情の起伏が大きい人。あなたが空気を整える係にされます。",
        "決めない人。あなたが代わりに決めることになり、責任だけが移ってきます。",
      ], c.seed >>> 7))],
      ["距離の取り方", `切らなくて構いません。${MK("会う頻度を三分の二にするだけ")}で、関係は保ったまま消耗が止まります。`],
    ]},
  ]));

  out.push(chapter(5, "実践", "Practice", [
    { t:"p", html:
      `最後に、${HL("明日から三十日の手順")}に落とします。` +
      `${MK("占いが変えるのは、小さな一手を実際に置いたときだけです")}。` },
    { t:"steps", items: [
      ["一日目　決める", `${R.verdict.cond}これがこの鑑定の要です。`],
      ["三日目まで　ひとつ断る", `${HL("気の進まない予定をひとつだけ断ってください")}。運は、空きがないところには入ってこられません。`],
      ["七日目まで　色を置く", `幸運の色は${HL(c.sign.color)}。見えないところに一つあれば十分です。`],
      ["十四日目まで　返事を返す", `保留にしている連絡に返してください。${MK("内容より、返したという事実が流れを変えます")}。`],
      ["二十一日目まで　方角へ", `吉方は${HL(c.dir)}。遠出でなくて構いません。その方角にある店や道を一度選んでください。`],
      [`三十日目　${jd(c.turning)}に備える`, `転機の日までに、${HL("決めておくべきことを一つだけ")}決めておいてください。`],
    ]},
    { t:"p", html: `${CALM("六つ全部やる必要はありません。")}二つできれば、三十日後のあなたは今日とは違う場所に立っています。` },
  ]));
  return out;
}

export { moonAge, nextNewMoon };
