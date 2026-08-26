/* =========================================================
   鑑定札を一枚の画像にして持ち帰らせる。
   SNSに出るのは文章ではなく画像なので、拡散の単位をここで作る。
   ========================================================= */

export type SealInput = {
  title: string; who: string; code: string;
  verdict: string; guide: string; seal: string; nextDate: string;
};

const W = 1080, H = 1620;

export function drawSealImage(inp: SealInput) {
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  if (!g) return;

  // 地
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#120f22");
  bg.addColorStop(0.55, "#0a0714");
  bg.addColorStop(1, "#170f26");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // 星
  for (let i = 0; i < 160; i++) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const y = (Math.sin(i * 78.233) * 43758.5453) % 1;
    const r = Math.abs(Math.sin(i * 3.7)) * 1.6 + 0.4;
    g.globalAlpha = 0.14 + Math.abs(Math.cos(i)) * 0.42;
    g.fillStyle = "#f3dfac";
    g.beginPath();
    g.arc(Math.abs(x) * W, Math.abs(y) * H, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // 枠
  g.strokeStyle = "rgba(216,184,107,.55)";
  g.lineWidth = 2;
  g.strokeRect(56, 56, W - 112, H - 112);
  g.strokeStyle = "rgba(216,184,107,.25)";
  g.lineWidth = 1;
  g.strokeRect(72, 72, W - 144, H - 144);

  const serif = '"Yu Mincho","Hiragino Mincho ProN",serif';
  const center = (t: string, y: number, size: number, color: string, font = serif, weight = "") => {
    g.font = `${weight} ${size}px ${font}`;
    g.fillStyle = color;
    g.textAlign = "center";
    g.fillText(t, W / 2, y);
  };

  center("✦", 190, 54, "#d8b86b");
  center("星 詠 堂", 262, 40, "#f3dfac");
  g.font = "18px Georgia, serif";
  g.fillStyle = "rgba(216,184,107,.75)";
  g.textAlign = "center";
  g.fillText("H O S H I Y O M I - D O", W / 2, 296);

  // 罫
  g.strokeStyle = "rgba(216,184,107,.3)";
  g.beginPath(); g.moveTo(200, 340); g.lineTo(W - 200, 340); g.stroke();

  center(inp.title, 430, 62, "#f4efe4", serif, "bold");
  center(inp.who, 486, 24, "rgba(244,239,228,.62)");

  // 託宣（折り返し）
  const wrapped = wrap(g, inp.verdict, W - 260, 34, serif);
  let y = 640;
  wrapped.slice(0, 6).forEach((line) => {
    center(line, y, 34, "#f3dfac");
    y += 62;
  });

  // 次の日
  g.strokeStyle = "rgba(216,184,107,.3)";
  g.beginPath(); g.moveTo(260, y + 40); g.lineTo(W - 260, y + 40); g.stroke();
  center("次にひらくべき日", y + 110, 22, "rgba(244,239,228,.55)");
  center(inp.nextDate, y + 168, 40, "#d8b86b", serif, "bold");

  // 落款
  const sx = W / 2, sy = H - 300;
  g.fillStyle = "#8c2b2b";
  roundRect(g, sx - 58, sy - 58, 116, 116, 8);
  g.fill();
  g.font = `bold 58px ${serif}`;
  g.fillStyle = "#f4efe4";
  g.textAlign = "center";
  g.fillText(inp.seal, sx, sy + 21);

  center(`${inp.guide}　視`, H - 190, 26, "rgba(244,239,228,.8)");
  g.font = "16px Georgia, serif";
  g.fillStyle = "rgba(216,184,107,.6)";
  g.fillText(`STAR SEAL · ${inp.code}`, W / 2, H - 140);
  g.font = "15px " + serif;
  g.fillStyle = "rgba(244,239,228,.32)";
  g.fillText("占いは娯楽としてお楽しみください", W / 2, H - 104);

  cv.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hoshiyomido-${inp.code}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number, size: number, font: string): string[] {
  g.font = `${size}px ${font}`;
  const out: string[] = [];
  let line = "";
  for (const ch of text) {
    if (g.measureText(line + ch).width > maxW || ch === "\n") {
      out.push(line); line = ch === "\n" ? "" : ch;
    } else line += ch;
  }
  if (line) out.push(line);
  return out;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
