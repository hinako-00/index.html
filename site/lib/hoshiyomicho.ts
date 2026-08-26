/* =========================================================
   星詠帳（この端末に残る控え）
   ・無料保存 → 課金の手前に置く小さな承諾（一貫性）
   ・保存期限 → 先に渡してから失う形にする（保有効果）
   ・前回との差分 → 再訪の理由を「変化の確認」に変える
   ・連続日数 → 無料の習慣を有料の試用につなぐ
   すべて localStorage。読み書きは必ず try/catch で包む。
   ========================================================= */

const KEY = "hoshiyomicho.v1";
const KEEP_DAYS = 7;

export type Saved = {
  readingId: string;
  title: string;
  at: number;              // 保存時刻
  birth: string;
  concern: string;
  question?: string;
  picks?: number[];
  /** 差分表示のために、前回の要点だけを残す */
  gist: { verdict: string; bestMonth: string; turning: string; py: number; cards: string[] };
  unlocked: boolean;
};

export type Book = {
  saved: Saved[];
  streak: { count: number; lastDay: string };
  profile: { name: string; birth: string; concern: string };
};

const EMPTY: Book = { saved: [], streak: { count: 0, lastDay: "" }, profile: { name: "", birth: "", concern: "self" } };

export function load(): Book {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const b = JSON.parse(raw) as Book;
    // 期限切れを落とす（本当に運用する）
    const cutoff = Date.now() - KEEP_DAYS * 86400000;
    return { ...EMPTY, ...b, saved: (b.saved ?? []).filter((s) => s.unlocked || s.at >= cutoff) };
  } catch {
    return EMPTY;
  }
}

function save(b: Book) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(b)); } catch { /* 保存できなくても表示は続ける */ }
}

export function remember(entry: Saved): Book {
  const b = load();
  const next = { ...b, saved: [entry, ...b.saved.filter((s) => !(s.readingId === entry.readingId && s.at === entry.at))].slice(0, 40) };
  save(next);
  return next;
}

export function markUnlocked(readingId: string): Book {
  const b = load();
  const next = { ...b, saved: b.saved.map((s) => (s.readingId === readingId ? { ...s, unlocked: true } : s)) };
  save(next);
  return next;
}

export function setProfile(p: Partial<Book["profile"]>): Book {
  const b = load();
  const next = { ...b, profile: { ...b.profile, ...p } };
  save(next);
  return next;
}

/** 前回の同じ鑑定（差分表示のもと） */
export function previous(readingId: string, exceptAt?: number): Saved | null {
  return load().saved.find((s) => s.readingId === readingId && s.at !== exceptAt) ?? null;
}

/** 連続日数：毎日引く習慣を可視化する（変動報酬） */
export function touchStreak(now: Date): { count: number; isNewDay: boolean } {
  const b = load();
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  if (b.streak.lastDay === day) return { count: b.streak.count, isNewDay: false };
  const yest = new Date(now.getTime() - 86400000);
  const yKey = `${yest.getFullYear()}-${yest.getMonth() + 1}-${yest.getDate()}`;
  const count = b.streak.lastDay === yKey ? b.streak.count + 1 : 1;
  save({ ...b, streak: { count, lastDay: day } });
  return { count, isNewDay: true };
}

export const daysLeft = (at: number) =>
  Math.max(0, KEEP_DAYS - Math.floor((Date.now() - at) / 86400000));

/* ---------- 再訪の節目（フレッシュスタート効果） ---------- */
export type Landmark = { when: Date; label: string; why: string };

/** 誕生日・月初・新月のうち、次に来るものを返す */
export function nextLandmark(birth: string, now: Date, newMoon: Date): Landmark {
  const cands: Landmark[] = [];
  if (birth) {
    const [, m, d] = birth.split("-").map(Number);
    let bd = new Date(now.getFullYear(), m - 1, d);
    if (bd < now) bd = new Date(now.getFullYear() + 1, m - 1, d);
    cands.push({ when: bd, label: "誕生日", why: "一年の巡りが切り替わり、個人年が動きます。" });
  }
  const firstOfNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  cands.push({ when: firstOfNext, label: "月のはじめ", why: "月の主題が入れ替わります。" });
  cands.push({ when: newMoon, label: "新月", why: "始めたことが根づきやすい日です。" });
  return cands.sort((a, b) => a.when.getTime() - b.when.getTime())[0];
}
