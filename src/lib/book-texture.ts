import * as THREE from "three";
import type { Book } from "@/lib/types";

const textureCache = new Map<string, THREE.CanvasTexture>();

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawClothGrain(ctx: CanvasRenderingContext2D, w: number, h: number, alpha = 0.045) {
  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  for (let y = 0; y < h; y += 3) {
    ctx.fillRect(0, y, w, 1);
  }
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 1.1})`;
  for (let x = 0; x < w; x += 4) {
    ctx.fillRect(x, 0, 1, h);
  }
  ctx.restore();
}

function drawPatternMotif(
  ctx: CanvasRenderingContext2D,
  pattern: Book["coverPalette"]["pattern"],
  accent: string,
  w: number,
  h: number
) {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;
  ctx.lineWidth = 2;

  const cx = w / 2;
  const cy = h * 0.56;

  if (pattern === "arch") {
    ctx.globalAlpha = 0.36;
    for (let i = 0; i < 4; i++) {
      const r = 70 + i * 26;
      ctx.beginPath();
      ctx.arc(cx, cy + 40, r, Math.PI, 0);
      ctx.lineTo(cx + r, cy + 165);
      ctx.lineTo(cx - r, cy + 165);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy - 20, 14, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern === "orbital") {
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy + 30, 130 - i * 22, 54 - i * 9, (i * Math.PI) / 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy + 30, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (pattern === "botanical") {
    ctx.globalAlpha = 0.38;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 70);
    ctx.lineTo(cx, cy + 160);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      const y = cy + i * 38;
      ctx.beginPath();
      ctx.ellipse(cx - 32, y, 32, 12, -0.45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + 32, y, 32, 12, 0.45, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (pattern === "monolith") {
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 5; i++) {
      const inset = i * 22;
      ctx.strokeRect(cx - 110 + inset, cy - 80 + inset, 220 - inset * 2, 230 - inset * 2);
    }
  } else if (pattern === "horizon") {
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 7; i++) {
      const y = cy - 40 + i * 26;
      ctx.beginPath();
      ctx.moveTo(85, y);
      ctx.quadraticCurveTo(cx, y + (i % 2 === 0 ? -18 : 18), w - 85, y);
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = 0.3;
    for (let x = 90; x <= w - 90; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, cy - 85);
      ctx.lineTo(x, cy + 150);
      ctx.stroke();
    }
    for (let y = cy - 85; y <= cy + 150; y += 34) {
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.lineTo(w - 90, y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function getBookCoverTexture(book: Book): THREE.CanvasTexture {
  const key = `cover:${book.id}:${book.title}:${book.coverPalette.primary}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 512, 768);
  grad.addColorStop(0, book.coverPalette.primary);
  grad.addColorStop(1, book.coverPalette.secondary);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 768);

  drawClothGrain(ctx, 512, 768);

  // Subtle spine hinge shadow on left
  const hinge = ctx.createLinearGradient(0, 0, 28, 0);
  hinge.addColorStop(0, "rgba(0,0,0,0.36)");
  hinge.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = hinge;
  ctx.fillRect(0, 0, 28, 768);

  // Architectural gold foil frame
  ctx.strokeStyle = book.coverPalette.accent;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(32, 32, 512 - 64, 768 - 64);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55;
  ctx.strokeRect(42, 42, 512 - 84, 768 - 84);
  ctx.globalAlpha = 1;

  // Category eyebrow
  ctx.fillStyle = book.coverPalette.accent;
  ctx.font = "600 16px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText(book.category.toUpperCase(), 256, 86);

  // Title
  ctx.fillStyle = book.coverPalette.text;
  ctx.font = "700 36px Georgia, serif";
  const lines = wrapText(ctx, book.title, 368);
  lines.slice(0, 3).forEach((line, idx) => {
    ctx.fillText(line, 256, 152 + idx * 44);
  });

  // Motif
  drawPatternMotif(ctx, book.coverPalette.pattern, book.coverPalette.accent, 512, 768);

  // Author & Colophon at bottom
  ctx.fillStyle = book.coverPalette.text;
  ctx.font = "500 21px Georgia, serif";
  ctx.fillText(book.authorName, 256, 654);

  ctx.fillStyle = book.coverPalette.accent;
  ctx.font = "600 13px sans-serif";
  ctx.fillText("UTTORON PROKASONI", 256, 704);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}

export function getBookSpineTexture(book: Book): THREE.CanvasTexture {
  const key = `spine:${book.id}:${book.spineColor}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = book.spineColor || book.coverPalette.primary;
  ctx.fillRect(0, 0, 128, 768);
  drawClothGrain(ctx, 128, 768, 0.035);

  ctx.fillStyle = book.coverPalette.accent;
  ctx.fillRect(14, 52, 100, 3);
  ctx.fillRect(14, 712, 100, 3);

  ctx.save();
  ctx.translate(64, 384);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = book.coverPalette.text;
  ctx.font = "700 22px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const shortTitle =
    book.title.length > 34 ? `${book.title.slice(0, 31)}...` : book.title;
  ctx.fillText(shortTitle, 0, 0);
  ctx.restore();

  ctx.fillStyle = book.coverPalette.accent;
  ctx.font = "700 14px Georgia, serif";
  ctx.textAlign = "center";
  ctx.fillText("UP", 64, 686);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

export function getBookBackTexture(book: Book): THREE.CanvasTexture {
  const key = `back:${book.id}:${book.coverPalette.primary}`;
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = book.coverPalette.secondary;
  ctx.fillRect(0, 0, 512, 768);
  drawClothGrain(ctx, 512, 768);

  ctx.strokeStyle = book.coverPalette.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, 512 - 64, 768 - 64);

  ctx.fillStyle = book.coverPalette.accent;
  ctx.font = "600 15px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(book.publisherName.toUpperCase(), 256, 98);

  ctx.fillStyle = book.coverPalette.text;
  ctx.font = "400 20px Georgia, serif";
  const descLines = wrapText(ctx, book.description, 356);
  descLines.slice(0, 8).forEach((line, idx) => {
    ctx.fillText(line, 256, 210 + idx * 34);
  });

  // ISBN barcode plaque
  ctx.fillStyle = "#FAF6EE";
  ctx.fillRect(156, 598, 200, 74);
  ctx.fillStyle = "#141615";
  for (let i = 0; i < 36; i++) {
    const bw = i % 3 === 0 ? 3 : 1.5;
    ctx.fillRect(172 + i * 4.6, 608, bw, 38);
  }
  ctx.font = "600 12px monospace";
  ctx.fillText(book.isbn, 256, 662);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

export function getPageEdgeTexture(): THREE.CanvasTexture {
  const key = "pages:cream";
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#EFE7D6";
  ctx.fillRect(0, 0, 256, 512);

  for (let x = 0; x < 256; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? "rgba(110, 88, 52, 0.16)" : "rgba(255, 252, 245, 0.35)";
    ctx.fillRect(x, 0, 1, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

export function getWalnutWoodTexture(): THREE.CanvasTexture {
  const key = "wood:walnut";
  const cached = textureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#3B2416";
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const wave = Math.sin(y * 0.045) * 10 + Math.cos(y * 0.11) * 5;
    ctx.strokeStyle =
      y % 8 === 0
        ? "rgba(24, 13, 7, 0.45)"
        : y % 4 === 0
        ? "rgba(92, 56, 33, 0.35)"
        : "rgba(65, 39, 24, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + wave, 340, y - wave, 512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

