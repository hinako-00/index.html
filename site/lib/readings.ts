/* =========================================================
   鑑定の目録（41種）
   uploaded 版の id をそのまま引き継ぐ。
   lens は「どのジャンルの眼で札と星を読むか」、
   chapters は鑑定ごとの章立て（ジャンルで変わる）。
   ========================================================= */
import type { Lens } from "./tarot";

export type Engine = "tarot" | "natal" | "pair" | "name";
export type Group = "恋愛" | "相性" | "タロット" | "名前" | "仕事・金運" | "人生・宿命";

export type Reading = {
  id: string; group: Group; mark: string; title: string; catchline: string;
  engine: Engine; lens: Lens;
  cards?: number;        // タロットで引く枚数
  pos?: string[];        // 各札の位置の名前
  free?: boolean;        // 全章無料
  popular?: boolean;
  seconds: number;       // 所要時間の目安（カードに出す）
  /** この鑑定だけの結論。ここが鑑定ごとに違うことが最も効く */
  verdict: { q: string; a: string; cond: string };
};

export const GROUPS: (Group | "すべて")[] = ["すべて", "恋愛", "相性", "タロット", "名前", "仕事・金運", "人生・宿命"];

export const READINGS: Reading[] = [
  /* ---- タロット（札を選ぶ） ---- */
  { id:"t-today", group:"タロット", mark:"札", title:"今日の一枚", catchline:"今日の流れと、意識したい一歩。",
    engine:"tarot", lens:"life", cards:1, pos:["今日"], free:true, popular:true, seconds:10,
    verdict:{ q:"今日、何に気をつければいいか", a:"今日のあなたは、決めることより「決めない時間の長さ」で消耗します。",
      cond:"夜までに、小さなことを一つだけ決め切ること。" } },
  { id:"t-honne", group:"タロット", mark:"札", title:"あの人の本音", catchline:"言葉の奥にある感情を三枚で。",
    engine:"tarot", lens:"love", cards:3, pos:["その人の表の顔","その人の本心","あなたへの気持ち"], popular:true, seconds:20,
    verdict:{ q:"あの人は本当はどう思っているか", a:"あの人は、あなたが思うより迷っています。冷たいのではなく、決めきれていません。",
      cond:"確かめる質問を、二週間だけやめること。" } },
  { id:"t-yesno", group:"タロット", mark:"札", title:"YES / NO", catchline:"迷いを二択にして、次の一歩へ。",
    engine:"tarot", lens:"life", cards:1, pos:["答え"], free:true, seconds:10,
    verdict:{ q:"進むべきか、止まるべきか", a:"答えは出ています。あなたが探しているのは答えではなく、許可です。",
      cond:"誰の許可も要らないと、一度声に出すこと。" } },
  { id:"t-cross", group:"タロット", mark:"札", title:"五枚展開", catchline:"現在・障害・根源・近未来・助言。",
    engine:"tarot", lens:"life", cards:5, pos:["現在","障害","根源","近い未来","結論"], seconds:35,
    verdict:{ q:"この問題の全体像は", a:"障害に見えているものは結果であって、原因は三枚目にあります。",
      cond:"表に出ている問題ではなく、その手前を一つ動かすこと。" } },
  { id:"t-love", group:"タロット", mark:"札", title:"恋の三か月", catchline:"関係が変わる流れを月ごとに。",
    engine:"tarot", lens:"love", cards:3, pos:["いまの関係","相手の気持ち","三か月後"], seconds:20,
    verdict:{ q:"この関係はどこへ向かうか", a:"三か月のうちに形が変わります。良し悪しではなく、いまの形では続きません。",
      cond:"あなたが先に、望みを一つ口にすること。" } },
  { id:"t-week", group:"タロット", mark:"札", title:"今週の流れ", catchline:"前半・後半・鍵になる日。",
    engine:"tarot", lens:"life", cards:3, pos:["週の前半","週の後半","鍵となる日"], free:true, seconds:20,
    verdict:{ q:"今週どう動けばいいか", a:"前半に決めたことが、後半の余白を決めます。急ぐべきは前半です。",
      cond:"週のはじめに、断るものを一つ決めておくこと。" } },
  { id:"t-career", group:"タロット", mark:"札", title:"仕事の展望", catchline:"いまの壁と突破口を読み解く。",
    engine:"tarot", lens:"work", cards:3, pos:["いまの現状","立ちはだかる壁","この先の展望"], seconds:20,
    verdict:{ q:"この仕事を続けるべきか", a:"続けるかどうかより、いまの役割を続けるかが問われています。場所と役割は別です。",
      cond:"担当の一つを、意識して手放すこと。" } },
  { id:"t-money", group:"タロット", mark:"札", title:"金運の兆し", catchline:"今日のお金との付き合い方。",
    engine:"tarot", lens:"money", cards:1, pos:["今日の金運"], free:true, seconds:10,
    verdict:{ q:"今日、お金をどう扱うか", a:"入りより出が主題の日です。減らす一手のほうが、増やす一手より効きます。",
      cond:"続いている支出を一つ、今日中に見直すこと。" } },

  /* ---- 恋愛（生年月日） ---- */
  { id:"l-honshitsu", group:"恋愛", mark:"恋", title:"恋愛パターン", catchline:"なぜ同じ場面で悩むのか。",
    engine:"natal", lens:"love", popular:true, seconds:15,
    verdict:{ q:"なぜ毎回、同じところでつまずくのか", a:"相手が変わっても同じ場面が来るのは、あなたが「選ばれる側」に回る癖を持っているからです。",
      cond:"次の関係で、最初に条件を出す側になること。" } },
  { id:"l-deai", group:"恋愛", mark:"恋", title:"出会いの時期", catchline:"ご縁が動きやすい月と場所。",
    engine:"natal", lens:"love", popular:true, seconds:15,
    verdict:{ q:"いつ、どこで出会うか", a:"出会いは新しい場所ではなく、一度離れた場所に戻ったときに起きます。",
      cond:"三年以内に行かなくなった場所へ、一度戻ること。" } },
  { id:"l-kekkon", group:"恋愛", mark:"恋", title:"結婚の流れ", catchline:"焦らず育てたい時期と条件。",
    engine:"natal", lens:"love", seconds:15,
    verdict:{ q:"結婚に向かう流れはあるか", a:"流れはあります。ただし恋愛の延長ではなく、生活の話を始めた側から動きます。",
      cond:"お金と住まいの話を、感情の話より先にすること。" } },
  { id:"l-kataomoi", group:"恋愛", mark:"恋", title:"片想いの行方", catchline:"待つ・動くを整理する鑑定。",
    engine:"natal", lens:"love", seconds:15,
    verdict:{ q:"待つべきか、動くべきか", a:"待つ時期は終わっています。ここから先の沈黙は、答えとして働きはじめます。",
      cond:"期限を自分で決めること。相手にではなく、自分に。" } },
  { id:"l-red", group:"恋愛", mark:"恋", title:"惹かれる相手", catchline:"あなたが安心できる関係の形。",
    engine:"natal", lens:"love", free:true, seconds:15,
    verdict:{ q:"どんな人となら続くか", a:"惹かれる人と、続く人は別です。あなたが安心できるのは、沈黙が気まずくならない相手です。",
      cond:"高揚ではなく、会った後の呼吸の深さで選ぶこと。" } },
  { id:"l-heal", group:"恋愛", mark:"恋", title:"別れのあと", catchline:"過去を責めず、次へ進むために。",
    engine:"natal", lens:"love", seconds:15,
    verdict:{ q:"いつになったら軽くなるか", a:"忘れられないのは未練ではなく、まだ言えていない一言が残っているからです。",
      cond:"渡さない前提で、その一言を書き出すこと。" } },

  /* ---- 相性（ふたりの生年月日） ---- */
  { id:"a-love", group:"相性", mark:"縁", title:"ふたりの相性", catchline:"価値観・会話・生活・感情・未来。",
    engine:"pair", lens:"love", popular:true, seconds:25,
    verdict:{ q:"このふたりは合うのか", a:"噛み合いは点数より扱い方で動きます。いまの点数は、いまの扱い方の結果です。",
      cond:"相手の速度を変えようとするのを、やめること。" } },
  { id:"a-honne", group:"相性", mark:"縁", title:"相手の受け取り方", catchline:"言葉がどう届いているかを視る。",
    engine:"pair", lens:"love", seconds:25,
    verdict:{ q:"なぜ伝わらないのか", a:"内容ではなく、渡す速度が合っていません。あなたの一往復が、相手には三往復に感じられています。",
      cond:"同じ話を、二度目は短く言うこと。" } },
  { id:"a-marry", group:"相性", mark:"縁", title:"長く続く条件", catchline:"一緒に暮らすときの強みと注意。",
    engine:"pair", lens:"love", seconds:25,
    verdict:{ q:"一緒に暮らして続くか", a:"続きます。ただし同化しようとした瞬間から、消耗戦に変わります。",
      cond:"別々の予定を、意図的に持ち続けること。" } },
  { id:"a-back", group:"相性", mark:"縁", title:"復縁の整理", catchline:"戻る前に確かめたい三つのこと。",
    engine:"pair", lens:"love", seconds:25,
    verdict:{ q:"戻るべきか", a:"戻れるかではなく、戻って同じ場面を繰り返さないかが問題です。原因は片方にはありません。",
      cond:"別れた理由を、相手のせいにせず一文で書けること。" } },
  { id:"a-friend", group:"相性", mark:"縁", title:"友人・同僚との相性", catchline:"組むと伸びる役割分担。",
    engine:"pair", lens:"work", free:true, seconds:25,
    verdict:{ q:"この人と組んでうまくいくか", a:"似ているから合うのではなく、欠けている場所が違うから噛み合います。",
      cond:"得意を分けるのではなく、苦手を先に申告すること。" } },
  { id:"a-family", group:"相性", mark:"縁", title:"家族・親子", catchline:"距離を近づける言葉と間合い。",
    engine:"pair", lens:"life", seconds:25,
    verdict:{ q:"この関係はどう扱えばいいか", a:"分かり合うことを目標にすると、こじれます。分からないまま並べる関係です。",
      cond:"説得をやめて、報告だけにすること。" } },

  /* ---- 名前（かな） ---- */
  { id:"s-basic", group:"名前", mark:"名", title:"名前の響き", catchline:"音と数から見る、名乗りの個性。",
    engine:"name", lens:"life", popular:true, seconds:20,
    verdict:{ q:"この名前は何を背負っているか", a:"あなたの名前は、外での見え方と内側の性質がずれる配置です。誤解されやすいのは性格ではなく画数です。",
      cond:"呼ばれ方を、自分で選び直すこと。" } },
  { id:"s-love", group:"名前", mark:"名", title:"名前と恋", catchline:"呼ばれ方に表れる恋愛傾向。",
    engine:"name", lens:"love", free:true, seconds:20,
    verdict:{ q:"名前は恋にどう出るか", a:"人格の数が、恋のときだけ強く出ます。ふだん穏やかな人ほど、恋では極端になります。",
      cond:"下の名前で呼び合う関係を選ぶこと。" } },
  { id:"s-work", group:"名前", mark:"名", title:"名前と仕事", catchline:"対人印象と役割の引き受け方。",
    engine:"name", lens:"work", seconds:20,
    verdict:{ q:"仕事でどう見られているか", a:"外格が示すのは、あなたが引き受けやすい役割です。頼まれ方に偏りがあるはずです。",
      cond:"署名を、姓と名で一字分あけて書くこと。" } },
  { id:"s-pair", group:"名前", mark:"名", title:"ふたつの名前", catchline:"呼び合う音の相性を読み解く。",
    engine:"name", lens:"love", seconds:30,
    verdict:{ q:"ふたつの名前は響き合うか", a:"総格の差がそのまま、人生の速度差として出ます。差は欠点ではなく、必要な手間です。",
      cond:"相手を、姓ではなく名で呼ぶこと。" } },
  { id:"s-brand", group:"名前", mark:"名", title:"活動名・屋号", catchline:"伝えたい印象に合う響きか。",
    engine:"name", lens:"work", seconds:20,
    verdict:{ q:"この名前で広がるか", a:"広がる名前と、信用される名前は画数が違います。いまの名は片方に寄っています。",
      cond:"用途を決めてから、名を選ぶこと。" } },

  /* ---- 仕事・金運（生年月日） ---- */
  { id:"w-tenshoku", group:"仕事・金運", mark:"財", title:"適職と強み", catchline:"能力が自然に生きる環境。",
    engine:"natal", lens:"work", popular:true, seconds:15,
    verdict:{ q:"自分に向いているのは何か", a:"向いていないのではなく、評価されない場所にいます。能力の話と環境の話が混ざっています。",
      cond:"実力ではなく、環境を先に疑うこと。" } },
  { id:"w-timing", group:"仕事・金運", mark:"財", title:"転職・独立の時期", catchline:"動く月と、準備に向く月。",
    engine:"natal", lens:"work", seconds:15,
    verdict:{ q:"いつ動けばいいか", a:"動く月は決まっています。準備が整ってから動くと、その月を越します。",
      cond:"準備を八割で切り上げること。" } },
  { id:"w-kinun", group:"仕事・金運", mark:"財", title:"お金の流れ", catchline:"入り方・使い方・守り方の傾向。",
    engine:"natal", lens:"money", popular:true, seconds:15,
    verdict:{ q:"なぜお金が残らないか", a:"稼ぎが足りないのではなく、出口が見えていません。漏れているのは金額ではなく頻度です。",
      cond:"毎月出ていく固定費を、一つ止めること。" } },
  { id:"w-ningen", group:"仕事・金運", mark:"財", title:"職場の人間関係", catchline:"消耗を減らす境界線の引き方。",
    engine:"natal", lens:"work", seconds:15,
    verdict:{ q:"なぜこんなに疲れるか", a:"苦手な人がいるからではなく、あなたが場の空気を整える係にされているからです。",
      cond:"整えるのを一度やめて、崩れるかどうか見ること。" } },
  { id:"w-side", group:"仕事・金運", mark:"財", title:"副業の方向性", catchline:"小さく始めやすい働き方。",
    engine:"natal", lens:"money", seconds:15,
    verdict:{ q:"何から始めればいいか", a:"新しく学ぶ必要はありません。すでに人から頼まれていることが、そのまま入口です。",
      cond:"直近三か月で頼まれたことを、書き出すこと。" } },
  { id:"w-creative", group:"仕事・金運", mark:"財", title:"創作・発信運", catchline:"届け方と続け方を整える。",
    engine:"natal", lens:"work", seconds:15,
    verdict:{ q:"なぜ続かないか", a:"才能ではなく、頻度の設計に無理があります。良いものを出そうとするほど、間隔が空きます。",
      cond:"完成度を下げて、間隔を固定すること。" } },

  /* ---- 人生・宿命（生年月日） ---- */
  { id:"f-shukumei", group:"人生・宿命", mark:"命", title:"宿命の設計図", catchline:"星・数・周期で自分を立体的に視る。",
    engine:"natal", lens:"life", popular:true, seconds:15,
    verdict:{ q:"自分はどういう設計になっているか", a:"あなたの設計は、決めるまでが長く、決めた後が速い形です。遅いのではなく、順番が違うだけです。",
      cond:"迷っている間に、決める日だけ先に決めること。" } },
  { id:"f-kage", group:"人生・宿命", mark:"命", title:"繰り返す影", catchline:"無意識の反応と、ほどき方。",
    engine:"natal", lens:"life", seconds:15,
    verdict:{ q:"なぜ同じ反応をしてしまうか", a:"その反応は、かつて必要だったから身についたものです。いまは要らないのに、まだ動いています。",
      cond:"反応が出た瞬間に、名前をつけて呼ぶこと。" } },
  { id:"f-year", group:"人生・宿命", mark:"命", title:"これから一年", catchline:"十二か月の波と過ごし方。",
    engine:"natal", lens:"life", popular:true, seconds:15,
    verdict:{ q:"この一年はどう動くか", a:"一年を通した波はすでに決まっています。問題は、谷の月に大きな決断を置いてしまうことです。",
      cond:"重い判断を、指数の高い月へ寄せること。" } },
  { id:"f-turn", group:"人生・宿命", mark:"命", title:"転機の季節", catchline:"決断を急がず活かすタイミング。",
    engine:"natal", lens:"life", seconds:15,
    verdict:{ q:"転機はいつ来るか", a:"転機は事件の形では来ません。断りづらい誘いか、面倒な頼まれごとの顔をして来ます。",
      cond:"その日までに、空きを一つ作っておくこと。" } },
  { id:"f-rest", group:"人生・宿命", mark:"命", title:"休むタイミング", catchline:"調子の波を責めずに整える。",
    engine:"natal", lens:"life", free:true, seconds:15,
    verdict:{ q:"いつ休めばいいか", a:"疲れているから調子が悪いのではなく、周期の谷にいます。責める必要のない不調です。",
      cond:"谷の月に、予定を二割減らすこと。" } },
  { id:"f-innen", group:"人生・宿命", mark:"命", title:"関係の学び", catchline:"出会いから持ち帰るテーマ。",
    engine:"natal", lens:"life", seconds:15,
    verdict:{ q:"この出会いの意味は何か", a:"その人はあなたに、断る練習をさせに来ています。好き嫌いの話ではありません。",
      cond:"一度だけ、理由を言わずに断ること。" } },
  { id:"f-month", group:"人生・宿命", mark:"命", title:"今月のテーマ", catchline:"今月、育てたいことと手放すこと。",
    engine:"natal", lens:"life", free:true, seconds:15,
    verdict:{ q:"今月は何をする月か", a:"今月は増やす月ではありません。整える月に増やそうとすると、両方が中途半端になります。",
      cond:"今月は、始めるものを一つに絞ること。" } },
  { id:"f-30", group:"人生・宿命", mark:"命", title:"30日行動計画", catchline:"鑑定を、毎日の小さな行動へ。",
    engine:"natal", lens:"life", seconds:15,
    verdict:{ q:"明日から何をすればいいか", a:"占いは読んだ時点では何も変わりません。変わるのは、小さな一手を実際に置いたときだけです。",
      cond:"六つのうち、二つだけやること。" } },
  { id:"f-90", group:"人生・宿命", mark:"命", title:"90日伴走", catchline:"目標と周期を重ねる三か月。",
    engine:"natal", lens:"life", seconds:15,
    verdict:{ q:"三か月で何が変わるか", a:"三か月は、周期がちょうど一巡する長さです。ここで変わらなければ、一年は同じ形が続きます。",
      cond:"月ごとに、主題を一つだけ置くこと。" } },
  { id:"f-question", group:"人生・宿命", mark:"命", title:"問いを見つける", catchline:"言葉にならない迷いを守護獣と整理。",
    engine:"natal", lens:"life", free:true, seconds:30,
    verdict:{ q:"自分は何に迷っているのか", a:"迷いの中身ではなく、迷い方に癖があります。あなたは選択肢を増やすことで、決断を先延ばしにします。",
      cond:"選択肢を増やすのをやめて、二つに絞ること。" } },
];

export const readingById = (id: string) => READINGS.find((r) => r.id === id);
