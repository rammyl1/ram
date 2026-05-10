import { TILE_SIZE, TILES, BUILDINGS, Building, NPC } from "./constants";
import {
  drawAboutBuilding,
  drawCoffeeBuilding,
  drawCVBuilding,
  drawContactBuilding,
  drawProjectsBuilding,
  drawMemoBuilding,
} from "./buildings";


interface Camera { x: number; y: number; }
interface Player {
  x: number;
  y: number;
  direction: number;
  animFrame: number;  // continuous seconds * WALK_FREQ — drives sine walk cycle
  isMoving?: boolean;
}

// ── Stardew Valley palette: warm, muted, organic earth tones ───────────────
const C = {
  // Grass — olive/yellow-green Stardew spring tones
  g1: "#6a9942",  // base — warm yellow-green
  g2: "#557e34",  // dark patch shadow
  g3: "#7eb054",  // light patch
  g4: "#3e6624",  // deep shadow
  g5: "#94c768",  // bright highlight patch
  g6: "#4f7a2c",  // mid-dark
  gT: "#a8d878",  // grass-tuft tip highlight
  gTb: "#5a8a36", // grass-tuft body
  gTs: "#365820", // grass-tuft shadow on ground
  gD: "#2c4a18",  // very dark dither speck

  // Road — warm dark asphalt with muted noise
  road:    "#3c3a40",  road2:    "#322f36",  roadHi:   "#4c4a52",
  roadDash:"#e8d840",  roadEdge: "#26242a",

  // Stone — warm grey cobble with mossy hints
  s1: "#a89c88", s2: "#bcb09a", s3: "#8a7e6c", s4: "#cdc1aa",
  sE: "#564a3a", sH: "#dccfb8", sM: "#5a7a3a",  // sM = moss

  // Tree — Stardew oak: deep green base, bright sun-highlights, brown trunk
  t1: "#1d3e1a",  // canopy deep shadow
  t2: "#2d5c26",  // canopy mid shadow
  t3: "#3e8232",  // canopy main body
  t4: "#54a142",  // canopy light side
  t5: "#6dbe54",  // canopy bright
  tH: "#88d268",  // canopy sunlit highlight
  tTk:  "#74471f",  // trunk base
  tTk2: "#522f10",  // trunk shadow side
  tTkH: "#8e5b2a",  // trunk highlight side
  tTkD: "#3a1e08",  // bark line

  // Flowers
  fR: "#d22e3e", fRH: "#ee5060", fY: "#eec028", fYH: "#f8de60",
  fP: "#a830d0", fPH: "#cc60dc", fB: "#3878d8", fBH: "#6098e8",
  fSt: "#3a6818", fW: "#f4eed0",

  // Bush — round leafy clusters with berries
  b1: "#1c4216", b2: "#2c6826", b3: "#3a8a32", bH: "#54b246",
  bD: "#0e2c0a", bF: "#d8253a", bFH: "#f06070",

  // Dirt — warm rusty farm soil
  d1: "#9a6e3e", d2: "#b08550", d3: "#c79b66", dD: "#6a4a22", dH: "#daba84",
  dPb: "#4a2e10",  // pebble outline

  // Fence — sun-bleached wood
  fW1: "#7a5230", fW2: "#9a6e44", fWH: "#b8855a", fWD: "#4a2e14",
};

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

// ── Stepped-pixel ellipse helper for ROUND organic shapes ──────────────────
function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy*dy)/(ry*ry))));
    if (w > 0) ctx.fillRect(Math.floor(cx - w), Math.floor(cy + dy), w * 2, 1);
  }
}

// ── Stardew-signature GRASS TUFT (the tiny 'V' shaped grass blades) ───────
// Each tuft is the iconic 4x4 sprite: bright tip, dark body, ground shadow.
function drawTuft(ctx: CanvasRenderingContext2D, x: number, y: number, big: boolean) {
  if (big) {
    // 5x5 large tuft
    r(ctx, x+2, y,   1, 1, C.gT);   // tip
    r(ctx, x+1, y+1, 3, 1, C.gTb);  // upper body
    r(ctx, x+2, y+1, 1, 1, C.gT);
    r(ctx, x,   y+2, 5, 1, C.gTb);  // wide body
    r(ctx, x+2, y+2, 1, 1, C.gT);
    r(ctx, x+1, y+3, 3, 1, C.gTs);  // shadow on ground
  } else {
    // 3x3 small tuft
    r(ctx, x+1, y,   1, 1, C.gT);
    r(ctx, x,   y+1, 3, 1, C.gTb);
    r(ctx, x+1, y+1, 1, 1, C.gT);
    r(ctx, x,   y+2, 3, 1, C.gTs);
  }
}

// ── GRASS — Stardew warm olive base + organic patches + tufts ──────────────
function drawGrass(ctx: CanvasRenderingContext2D, sx: number, sy: number, seed: number) {
  const T = TILE_SIZE;
  // Warm yellow-green base
  r(ctx, sx, sy, T, T, C.g1);

  // Organic shaded patches (use ellipses for soft-edged blobs, not rectangles!)
  const v = seed % 9;
  if (v === 0) {
    ellipse(ctx, sx+8,  sy+8,  6, 5, C.g2);
    ellipse(ctx, sx+22, sy+20, 5, 4, C.g3);
  } else if (v === 1) {
    ellipse(ctx, sx+18, sy+10, 7, 5, C.g6);
    ellipse(ctx, sx+6,  sy+22, 5, 4, C.g4);
  } else if (v === 2) {
    ellipse(ctx, sx+24, sy+6,  5, 4, C.g3);
    ellipse(ctx, sx+10, sy+24, 6, 4, C.g2);
  } else if (v === 3) {
    ellipse(ctx, sx+5,  sy+5,  4, 3, C.g5);  // bright sunlit patch
    ellipse(ctx, sx+18, sy+18, 6, 5, C.g6);
  } else if (v === 4) {
    ellipse(ctx, sx+4,  sy+18, 7, 5, C.g4);  // shadow blob
  } else if (v === 5) {
    ellipse(ctx, sx+15, sy+8,  5, 4, C.g3);
    ellipse(ctx, sx+25, sy+22, 4, 3, C.g5);
  }

  // GRASS TUFTS — Stardew's signature organic look (3-5 per tile, varied sizes)
  const tuftCount = 3 + (seed % 3);
  for (let i = 0; i < tuftCount; i++) {
    const tx = ((seed * (i+1) * 7 + 3) % 26) + 2;
    const ty = ((seed * (i+1) * 11 + 5) % 25) + 2;
    drawTuft(ctx, sx + tx, sy + ty, (i + seed) % 3 === 0);
  }

  // Subtle dither — single pixels for noise
  ctx.fillStyle = C.gD;
  const dx1 = (seed * 13) % 28, dy1 = (seed * 17) % 28;
  ctx.fillRect(Math.floor(sx + dx1), Math.floor(sy + dy1), 1, 1);
  ctx.fillRect(Math.floor(sx + (dx1 + 7) % 28), Math.floor(sy + (dy1 + 11) % 28), 1, 1);
  ctx.fillStyle = C.g5;
  ctx.fillRect(Math.floor(sx + (dx1 + 14) % 28), Math.floor(sy + (dy1 + 6) % 28), 1, 1);

  // Rare clover (3-leaf cluster)
  if (seed % 19 === 0) {
    ctx.fillStyle = "#9bd068";
    ctx.fillRect(Math.floor(sx+13), Math.floor(sy+13), 2, 2);
    ctx.fillRect(Math.floor(sx+15), Math.floor(sy+12), 2, 2);
    ctx.fillRect(Math.floor(sx+14), Math.floor(sy+15), 2, 2);
  }
  // Trodden earth speck
  if (seed % 23 === 0) {
    ctx.fillStyle = "#8a6a40";
    ctx.fillRect(Math.floor(sx+8), Math.floor(sy+22), 4, 2);
  }
}

// ── ASPHALT ROAD ──────────────────────────────────────────────────────────
function drawRoad(ctx: CanvasRenderingContext2D, sx: number, sy: number, isHorizontal: boolean, seed: number, globalFrame: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.road);
  // Granular noise (Stardew paths have visible pixel noise)
  const h = (seed * 3) % 22, v2 = (seed * 7) % 22;
  r(ctx, sx+h, sy+v2, 4, 3, C.road2);
  r(ctx, sx+(h+14)%28, sy+(v2+16)%28, 3, 2, C.roadHi);
  r(ctx, sx+(h+8)%26, sy+(v2+8)%26, 2, 2, C.road2);
  // Curb / shoulder
  ctx.fillStyle = C.roadEdge;
  if (isHorizontal) {
    ctx.fillRect(Math.floor(sx), Math.floor(sy), T, 2);
    ctx.fillRect(Math.floor(sx), Math.floor(sy+T-2), T, 2);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(Math.floor(sx), Math.floor(sy+2), T, 1);
    ctx.fillRect(Math.floor(sx), Math.floor(sy+T-3), T, 1);
  } else {
    ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, T);
    ctx.fillRect(Math.floor(sx+T-2), Math.floor(sy), 2, T);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(Math.floor(sx+2), Math.floor(sy), 1, T);
    ctx.fillRect(Math.floor(sx+T-3), Math.floor(sy), 1, T);
  }
  // Yellow center dashes (animated)
  const dashOff = Math.floor(globalFrame * 0.5) % (T * 2);
  ctx.fillStyle = C.roadDash;
  if (isHorizontal) {
    const dy = sy + Math.floor(T/2) - 1;
    for (let d = 0; d < 2; d++) {
      const dx = sx + (d*T - dashOff + T*2) % (T*2);
      if (dx >= sx && dx < sx+T) ctx.fillRect(Math.floor(dx), Math.floor(dy), Math.min(12, sx+T-dx), 2);
    }
  } else {
    const ddx = sx + Math.floor(T/2) - 1;
    for (let d = 0; d < 2; d++) {
      const ddy = sy + (d*T - dashOff + T*2) % (T*2);
      if (ddy >= sy && ddy < sy+T) ctx.fillRect(Math.floor(ddx), Math.floor(ddy), 2, Math.min(12, sy+T-ddy));
    }
  }
}

// ── STONE — Stardew warm cobble with irregular rounded stones + moss ──────
function drawStone(ctx: CanvasRenderingContext2D, sx: number, sy: number, seed: number) {
  const T = TILE_SIZE;
  // Mortar base (dark grey-brown)
  r(ctx, sx, sy, T, T, C.sE);

  // Draw individual rounded cobblestones (4 per tile, slightly irregular)
  const drawStoneShape = (cx: number, cy: number, rx: number, ry: number, mainCol: string) => {
    ellipse(ctx, cx, cy, rx, ry, mainCol);
    // Top-left highlight (consistent upper-left light)
    ellipse(ctx, cx-1, cy-1, Math.max(1, rx-2), Math.max(1, ry-2), C.sH);
    // Bottom-right shadow
    ctx.fillStyle = C.sE;
    ctx.fillRect(Math.floor(cx + rx - 2), Math.floor(cy + ry - 1), 2, 1);
  };

  // 4 stones with slight variation by seed
  const off = (seed % 2 === 0) ? 0 : 2;
  drawStoneShape(sx+8 + off,  sy+8,  6, 5, C.s2);
  drawStoneShape(sx+23 - off, sy+8,  6, 5, C.s1);
  drawStoneShape(sx+9 - off,  sy+22, 6, 5, C.s3);
  drawStoneShape(sx+24 + off, sy+22, 5, 5, C.s2);

  // Small filler stones in gaps
  if (seed % 3 === 0) {
    ellipse(ctx, sx+16, sy+16, 2, 2, C.s4);
  }
  if (seed % 4 === 0) {
    ellipse(ctx, sx+4,  sy+15, 2, 1, C.s3);
  }

  // Moss in mortar cracks (rare)
  if (seed % 5 === 0) {
    ctx.fillStyle = C.sM;
    ctx.fillRect(Math.floor(sx+14), Math.floor(sy+15), 3, 2);
  }
  if (seed % 7 === 0) {
    ctx.fillStyle = C.sM;
    ctx.fillRect(Math.floor(sx+5), Math.floor(sy+27), 4, 1);
  }

  // Tiny wear pixels on stones
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(Math.floor(sx+12), Math.floor(sy+11), 1, 1);
  ctx.fillRect(Math.floor(sx+26), Math.floor(sy+24), 1, 1);
}

// ── TREE — Round Stardew oak with bark, roots, sunlit canopy ──────────────
function drawTree(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.g1);

  // ── GROUND SHADOW (soft elliptical) ──
  ellipse(ctx, sx+T/2+1, sy+T-3, 12, 3, "rgba(0,0,0,0.28)");
  ellipse(ctx, sx+T/2+1, sy+T-3, 14, 4, "rgba(0,0,0,0.12)");

  // ── TRUNK (thick, with bark texture) ──
  // Main trunk body
  r(ctx, sx+12, sy+T-18, 8, 16, C.tTk);
  // Shadow side (right)
  r(ctx, sx+17, sy+T-18, 3, 16, C.tTk2);
  // Highlight side (left, sunlit from upper-left)
  r(ctx, sx+12, sy+T-18, 2, 16, C.tTkH);
  // Bark vertical lines (3-4 short dark strokes)
  ctx.fillStyle = C.tTkD;
  ctx.fillRect(Math.floor(sx+14), Math.floor(sy+T-15), 1, 4);
  ctx.fillRect(Math.floor(sx+15), Math.floor(sy+T-10), 1, 3);
  ctx.fillRect(Math.floor(sx+13), Math.floor(sy+T-7),  1, 3);
  ctx.fillRect(Math.floor(sx+16), Math.floor(sy+T-12), 1, 2);

  // Visible roots flaring out at base
  r(ctx, sx+9,  sy+T-6, 3, 4, C.tTk);
  r(ctx, sx+8,  sy+T-4, 2, 2, C.tTk2);
  r(ctx, sx+20, sy+T-6, 3, 4, C.tTk);
  r(ctx, sx+22, sy+T-4, 2, 2, C.tTk2);
  // Root highlights
  r(ctx, sx+9,  sy+T-5, 2, 1, C.tTkH);
  r(ctx, sx+20, sy+T-5, 2, 1, C.tTkH);

  // ── CANOPY — layered round ellipses for organic Stardew shape ──
  // Layer 1: deep shadow base (back, slightly larger)
  ellipse(ctx, sx+T/2,    sy+13, 14, 12, C.t1);
  ellipse(ctx, sx+T/2-2,  sy+11, 13, 11, C.t1);
  // Layer 2: mid-shade body
  ellipse(ctx, sx+T/2,    sy+12, 13, 11, C.t2);
  ellipse(ctx, sx+T/2-1,  sy+11, 12, 10, C.t2);
  // Layer 3: main green (the "body")
  ellipse(ctx, sx+T/2-1,  sy+10, 12, 10, C.t3);
  ellipse(ctx, sx+T/2-2,  sy+10, 11, 9, C.t3);
  // Layer 4: bright green on light side (upper-left)
  ellipse(ctx, sx+T/2-3,  sy+9,  10, 8, C.t4);
  ellipse(ctx, sx+T/2-4,  sy+8,  9, 7, C.t4);
  // Layer 5: brightest sunlit cluster (top-left highlight)
  ellipse(ctx, sx+T/2-5,  sy+7,  6, 5, C.t5);
  ellipse(ctx, sx+T/2-6,  sy+6,  4, 4, C.t5);
  // Layer 6: tiny brightest specks (sun glints)
  ellipse(ctx, sx+T/2-7,  sy+6,  3, 2, C.tH);
  r(ctx, sx+T/2-8, sy+5, 2, 2, C.tH);

  // Individual visible leaf-cluster bumps (silhouette texture)
  ellipse(ctx, sx+5,  sy+15, 3, 3, C.t2);  // bottom-left bump
  ellipse(ctx, sx+27, sy+13, 3, 3, C.t2);  // bottom-right bump
  ellipse(ctx, sx+24, sy+5,  3, 2, C.t3);  // upper-right bump

  // Underside shadow (very bottom of canopy where it meets trunk)
  r(ctx, sx+10, sy+19, 12, 2, C.t1);
}

// ── FLOWER — Stardew bloom: stem with leaves, 4-petal cross, bright center ─
function drawFlower(ctx: CanvasRenderingContext2D, sx: number, sy: number, seed: number) {
  drawGrass(ctx, sx, sy, seed);
  const types = [
    [C.fR, C.fRH], [C.fY, C.fYH], [C.fP, C.fPH], [C.fB, C.fBH],
  ];
  const [pC, pH] = types[seed % 4];
  const fx = sx + 4 + (seed % 5) * 4;
  const fy = sy + 4 + (seed % 4) * 4;

  // Stem with subtle curve (Stardew stems aren't ramrod straight)
  ctx.fillStyle = C.fSt;
  ctx.fillRect(Math.floor(fx+3), Math.floor(fy+6),  1, 4);
  ctx.fillRect(Math.floor(fx+2), Math.floor(fy+10), 1, 4);
  ctx.fillRect(Math.floor(fx+3), Math.floor(fy+14), 1, 4);
  // Stem highlight
  ctx.fillStyle = "#5aa030";
  ctx.fillRect(Math.floor(fx+3), Math.floor(fy+7), 1, 2);

  // Leaves on stem (small ovals)
  ellipse(ctx, fx,   fy+11, 2, 1, C.fSt);
  ellipse(ctx, fx+5, fy+13, 2, 1, C.fSt);

  // Flower head — round 4-petal pattern
  // Outer petals (round shape)
  ellipse(ctx, fx+3, fy+4, 3, 3, pC);
  // Petal highlights (upper-left, sunlit)
  ellipse(ctx, fx+2, fy+3, 2, 2, pH);
  // Center pistil (Stardew flowers have a clear bright center)
  r(ctx, fx+2, fy+3, 2, 2, C.fW);
  ctx.fillStyle = C.fY;
  ctx.fillRect(Math.floor(fx+3), Math.floor(fy+4), 1, 1);
}

// ── BUSH — Round Stardew leafy bush with optional berries ─────────────────
function drawBush(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.g1);

  // Ground shadow
  ellipse(ctx, sx+T/2, sy+T-3, 13, 3, "rgba(0,0,0,0.25)");

  // Layered round leaf clusters — Stardew style "fluffy" silhouette
  // Base shadow layer
  ellipse(ctx, sx+T/2,   sy+T/2+3, 14, 10, C.bD);
  // Mid-dark
  ellipse(ctx, sx+T/2,   sy+T/2+2, 13, 9,  C.b1);
  // Main body
  ellipse(ctx, sx+T/2-1, sy+T/2+1, 12, 8,  C.b2);
  // Bright on top
  ellipse(ctx, sx+T/2-2, sy+T/2,   10, 7,  C.b3);
  // Individual cluster bumps (3 visible "lumps" on silhouette top)
  ellipse(ctx, sx+8,     sy+8,     5, 4, C.b2);
  ellipse(ctx, sx+16,    sy+5,     5, 4, C.b3);
  ellipse(ctx, sx+24,    sy+9,     4, 3, C.b2);
  // Sunlit highlight on upper-left of each cluster
  ellipse(ctx, sx+7,     sy+7,     2, 2, C.bH);
  ellipse(ctx, sx+15,    sy+4,     2, 2, C.bH);
  ellipse(ctx, sx+23,    sy+8,     2, 1, C.bH);
  // Tiny brightest specks (sun glint)
  r(ctx, sx+6,  sy+6, 1, 1, "#7ad858");
  r(ctx, sx+14, sy+3, 1, 1, "#7ad858");

  // Berries (some bushes have them — based on position seed)
  if ((sx + sy) % 96 < 32) {
    // Cluster of 3-4 red berries
    const berryPositions = [[10, 14], [13, 12], [18, 14], [21, 11]];
    for (const [bx, by] of berryPositions) {
      ctx.fillStyle = C.bF;
      ctx.fillRect(Math.floor(sx+bx),   Math.floor(sy+by), 3, 3);
      // Darker outline
      ctx.fillStyle = "#8a1020";
      ctx.fillRect(Math.floor(sx+bx),   Math.floor(sy+by+2), 3, 1);
      ctx.fillRect(Math.floor(sx+bx+2), Math.floor(sy+by),   1, 3);
      // Highlight shine
      ctx.fillStyle = C.bFH;
      ctx.fillRect(Math.floor(sx+bx),   Math.floor(sy+by),   1, 1);
    }
  }

  // Dark underside outline
  ellipse(ctx, sx+T/2, sy+T/2+5, 11, 3, C.bD);
}

// ── DIRT — Warm Stardew farm soil with dither + pebbles ──────────────────
function drawDirt(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  // Warm rusty base
  r(ctx, sx, sy, T, T, C.d1);

  // Soft organic shaded patches (use ellipses for natural look)
  ellipse(ctx, sx+8,  sy+8,  5, 4, C.d2);
  ellipse(ctx, sx+22, sy+10, 6, 4, C.d3);
  ellipse(ctx, sx+12, sy+22, 7, 4, C.d2);
  ellipse(ctx, sx+24, sy+24, 5, 4, C.dH);
  ellipse(ctx, sx+5,  sy+18, 4, 3, C.d3);
  ellipse(ctx, sx+25, sy+5,  3, 3, C.dH);

  // Heavy dithering (Stardew dirt has tons of speckle)
  ctx.fillStyle = C.dD;
  // Dark specks
  ctx.fillRect(Math.floor(sx+6),  Math.floor(sy+11), 2, 1);
  ctx.fillRect(Math.floor(sx+15), Math.floor(sy+6),  1, 2);
  ctx.fillRect(Math.floor(sx+19), Math.floor(sy+15), 2, 1);
  ctx.fillRect(Math.floor(sx+11), Math.floor(sy+26), 2, 1);
  ctx.fillRect(Math.floor(sx+24), Math.floor(sy+19), 1, 2);
  ctx.fillRect(Math.floor(sx+3),  Math.floor(sy+24), 2, 1);

  // Light highlights (sand pixels)
  ctx.fillStyle = C.dH;
  ctx.fillRect(Math.floor(sx+9),  Math.floor(sy+5),  2, 1);
  ctx.fillRect(Math.floor(sx+18), Math.floor(sy+22), 2, 1);
  ctx.fillRect(Math.floor(sx+27), Math.floor(sy+13), 1, 2);
  ctx.fillRect(Math.floor(sx+1),  Math.floor(sy+15), 1, 2);

  // Small pebbles (3-4 with shadow + highlight)
  const drawPebble = (px: number, py: number) => {
    ctx.fillStyle = C.dPb;
    ctx.fillRect(Math.floor(sx+px),   Math.floor(sy+py),   3, 3);  // outline
    ctx.fillStyle = "#8a8478";
    ctx.fillRect(Math.floor(sx+px),   Math.floor(sy+py),   3, 2);  // body
    ctx.fillStyle = "#a89e8c";
    ctx.fillRect(Math.floor(sx+px),   Math.floor(sy+py),   2, 1);  // highlight
  };
  // Procedural pebbles based on tile position
  const pebbleSeed = (sx + sy * 7) & 7;
  if (pebbleSeed > 0) drawPebble(13, 10);
  if (pebbleSeed > 2) drawPebble(7,  21);
  if (pebbleSeed > 4) drawPebble(22, 17);
}

// ── FENCE ─────────────────────────────────────────────────────────────────
function drawFence(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.g1);
  // Post (thick, wood-grain textured)
  r(ctx, sx+T/2-3, sy, 6, T, C.fW1);
  r(ctx, sx+T/2-1, sy, 3, T, C.fW2);
  r(ctx, sx+T/2+1, sy, 1, T, C.fWH); // highlight strip
  // Post cap (beveled top)
  r(ctx, sx+T/2-4, sy,   8, 3, C.fWH);
  r(ctx, sx+T/2-4, sy+2, 8, 1, C.fW1);
  // Horizontal rails (two, with wood grain)
  r(ctx, sx, sy+7,  T, 5, C.fW1);
  r(ctx, sx, sy+8,  T, 2, C.fW2);
  r(ctx, sx, sy+9,  T, 1, C.fWH);
  r(ctx, sx, sy+21, T, 5, C.fW1);
  r(ctx, sx, sy+22, T, 2, C.fW2);
  r(ctx, sx, sy+23, T, 1, C.fWH);
  // Rail shadow underside
  ctx.fillStyle = C.fWD;
  ctx.fillRect(Math.floor(sx), Math.floor(sy+12), T, 1);
  ctx.fillRect(Math.floor(sx), Math.floor(sy+26), T, 1);
  // Nail details
  ctx.fillStyle = "#404040";
  ctx.fillRect(Math.floor(sx+T/2-1), Math.floor(sy+8),  2, 2);
  ctx.fillRect(Math.floor(sx+T/2-1), Math.floor(sy+22), 2, 2);
}

// ── TILE DISPATCH ─────────────────────────────────────────────────────────
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: number,
  gx: number, gy: number,
  sx: number, sy: number,
  globalFrame = 0
) {
  const seed = (gx * 7 + gy * 13 + gx * gy * 3) % 100;
  switch (tile) {
    case TILES.GRASS:         drawGrass(ctx, sx, sy, seed); break;
    case TILES.PATH_H:        drawRoad(ctx, sx, sy, true, seed, globalFrame); break;
    case TILES.PATH_V:        drawRoad(ctx, sx, sy, false, seed, globalFrame); break;
    case TILES.PATH_CROSS:    drawRoad(ctx, sx, sy, true, seed, globalFrame); break;
    case TILES.STONE:         drawStone(ctx, sx, sy, seed); break;
    case TILES.TREE:          drawTree(ctx, sx, sy); break;
    case TILES.FLOWER:        drawFlower(ctx, sx, sy, seed); break;
    case TILES.BUSH:          drawBush(ctx, sx, sy); break;
    case TILES.FENCE:         drawFence(ctx, sx, sy); break;
    case TILES.DIRT:          drawDirt(ctx, sx, sy); break;
    case TILES.BUILDING_FLOOR:
      r(ctx, sx, sy, TILE_SIZE, TILE_SIZE, "#383028"); break;
    default:                  drawGrass(ctx, sx, sy, seed); break;
  }
}

// ── BUILDING (dispatches to unique per-building renderers) ─────────────────
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  building: Building,
  cam: Camera,
  time = 0
) {
  const T = TILE_SIZE;
  const bx = Math.floor(building.x * T - cam.x);
  const by = Math.floor(building.y * T - cam.y);
  const bw = building.width * T;
  const bh = building.height * T;

  // Route to unique facade
  switch (building.id) {
    case "about":        drawAboutBuilding(ctx, bx, by, bw, bh); return;
    case "coffee":       drawCoffeeBuilding(ctx, bx, by, bw, bh, time); return;
    case "cv":           drawCVBuilding(ctx, bx, by, bw, bh); return;
    case "contact":      drawContactBuilding(ctx, bx, by, bw, bh, time); return;
    case "projects":     drawProjectsBuilding(ctx, bx, by, bw, bh); return;
    case "memo":         drawMemoBuilding(ctx, bx, by, bw, bh); return;
  }

  // ── Fallback generic building ──────────────────────────────────────────
  // Drop shadow
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.fillRect(bx+8, by+12, bw+4, bh+6);

  // Foundation strip
  ctx.fillStyle = "#2e2818";
  ctx.fillRect(bx-3, by+bh-8, bw+6, 12);

  // ── WALLS ──
  ctx.fillStyle = building.color;
  ctx.fillRect(bx, by+12, bw, bh-10);

  // Horizontal plank lines
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let py = by+18; py < by+bh-8; py += 7) {
    ctx.fillRect(bx+1, py, bw-2, 1);
  }
  // Left shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(bx, by+12, 6, bh-10);
  // Right light
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  ctx.fillRect(bx+bw-6, by+12, 6, bh-10);

  // ── ROOF ──
  const rC = building.roofColor;
  // Back peak
  ctx.fillStyle = shiftColor(rC, -20);
  ctx.fillRect(bx-5, by-2, bw+10, 14);
  // Front face of roof
  ctx.fillStyle = rC;
  ctx.fillRect(bx-5, by+8, bw+10, 8);
  // Overhang shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(bx-5, by+14, bw+10, 4);
  // Roof highlight
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(bx-3, by, bw+6, 3);
  // Shingle pattern
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  for (let rx = bx-3; rx < bx+bw+3; rx += 10) {
    ctx.fillRect(rx, by+2, 5, 12);
  }
  // Chimney / roof accent
  ctx.fillStyle = shiftColor(rC, -40);
  ctx.fillRect(bx+bw-20, by-10, 10, 12);
  ctx.fillStyle = "#2e2818";
  ctx.fillRect(bx+bw-22, by-12, 14, 4);

  // ── WINDOWS ──
  const winCount = building.width >= 5 ? 2 : 1;
  for (let wi = 0; wi < winCount; wi++) {
    const wx = bx + Math.floor((wi+1) * bw / (winCount+1)) - 11;
    const wy = by + 22;
    // Outer frame (dark wood)
    ctx.fillStyle = "#1c1208";
    ctx.fillRect(wx-3, wy-3, 26, 26);
    // Window sill
    ctx.fillStyle = "#6a4e28";
    ctx.fillRect(wx-4, wy+20, 30, 5);
    // Glass – sky blue
    ctx.fillStyle = "#6ab0d8";
    ctx.fillRect(wx, wy, 20, 20);
    // Cross dividers
    ctx.fillStyle = "#1c1208";
    ctx.fillRect(wx+9, wy, 2, 20);
    ctx.fillRect(wx, wy+9, 20, 2);
    // Shine
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(wx+2, wy+2, 5, 4);
    ctx.fillRect(wx+12, wy+2, 4, 3);
    // Indoor shadow
    ctx.fillStyle = "rgba(10,20,40,0.35)";
    ctx.fillRect(wx+1, wy+12, 8, 7);
    ctx.fillRect(wx+12, wy+12, 7, 7);
  }

  // ── DOOR ──
  const dw = 22, dh = 26;
  const dx = bx + Math.floor(bw/2) - dw/2;
  const dy = by + bh - dh - 2;
  // Frame
  ctx.fillStyle = "#180c04";
  ctx.fillRect(dx-3, dy-4, dw+6, dh+7);
  // Arch top
  ctx.fillStyle = "#180c04";
  ctx.fillRect(dx, dy-7, dw, 8);
  // Door body
  ctx.fillStyle = "#8c6030";
  ctx.fillRect(dx, dy, dw, dh);
  ctx.fillStyle = "#6a4018";
  ctx.fillRect(dx+11, dy, dw-11, dh);
  // Panels
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(dx+2, dy+3, 7, 9);
  ctx.fillRect(dx+13, dy+3, 7, 9);
  ctx.fillRect(dx+2, dy+15, 7, 9);
  ctx.fillRect(dx+13, dy+15, 7, 9);
  // Knob
  ctx.fillStyle = "#f0c000";
  ctx.fillRect(dx+dw-5, dy+Math.floor(dh/2), 4, 4);
  ctx.fillStyle = "#c09000";
  ctx.fillRect(dx+dw-4, dy+Math.floor(dh/2)+1, 2, 2);

  // ── SIGN BOARD ──
  const sw = bw - 12;
  const sh = 18;
  const signX = bx + 6;
  const signY = by + 46;
  // Posts
  ctx.fillStyle = "#6a4820";
  ctx.fillRect(signX+5, signY-10, 4, 12);
  ctx.fillRect(signX+sw-9, signY-10, 4, 12);
  // Frame
  ctx.fillStyle = "#180c04";
  ctx.fillRect(signX-2, signY-2, sw+4, sh+4);
  // Board
  const sg = ctx.createLinearGradient(signX, signY, signX, signY+sh);
  sg.addColorStop(0, "#d8a040");
  sg.addColorStop(1, "#a87028");
  ctx.fillStyle = sg;
  ctx.fillRect(signX, signY, sw, sh);
  // Sign shine
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(signX+1, signY+1, sw-2, 3);
  // Text
  ctx.fillStyle = "#180a00";
  const fs = Math.max(8, Math.min(11, Math.floor(sw / building.label.length * 0.9)));
  ctx.font = `bold ${fs}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(building.label, bx+bw/2, signY+sh/2);

  // Interact hint (pulsing yellow [E])
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("[E]", bx+bw/2, by+bh+18);
}

function shiftColor(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#",""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const rr = clamp((n>>16) + amt);
  const gg = clamp(((n>>8)&0xff) + amt);
  const bb = clamp((n&0xff) + amt);
  return `rgb(${rr},${gg},${bb})`;
}

// ── PLAYER — smooth sine-wave walk cycle ────────────────────────────────────
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: Player,
  cam: Camera
) {
  const T = TILE_SIZE;
  const sx = Math.round(player.x * T - cam.x);
  const sy = Math.round(player.y * T - cam.y);
  const dir = player.direction;
  const moving = player.isMoving ?? false;

  // ── Continuous sine-wave walk cycle ──
  // animFrame is driven by real time (seconds × WALK_FREQ), so it advances
  // smoothly at a constant rate regardless of tile-step timing.
  const phase = player.animFrame * Math.PI * 2; // full cycle = 1 animFrame unit

  // Body vertical bob: peaks twice per stride (up on each footfall)
  const bob   = moving ? Math.round(Math.abs(Math.sin(phase)) * -2) : 0;

  // Leg swing: left leg forward when sin > 0, right leg forward when sin < 0
  const swing = moving ? Math.sin(phase) : 0;           // –1 → +1 continuous
  const legL  = moving ? Math.round(swing  * 4) : 0;   // left leg offset (px)
  const legR  = moving ? Math.round(-swing * 4) : 0;   // right leg (opposite)

  // Arm swing: opposite to legs
  const armL  = moving ? Math.round(-swing * 3) : 0;
  const armR  = moving ? Math.round( swing * 3) : 0;

  const p = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.floor(sx + x), Math.floor(sy + y), w, h);
  };

  // ── Shadow ──
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(sx + 8, sy + T - 5, 16, 4);

  // ── LEGS & FEET ──
  if (dir === 0 || dir === 1) {
    // Facing front/back — legs side by side, stagger vertically
    // Left leg
    p(9,  T - 18 + bob + legL, 7, 10, "#1a2a50");
    p(9,  T - 9  + bob + legL, 7,  7, "#0a0808");   // shoe L
    p(10, T - 9  + bob + legL, 3,  2, "#282020");   // shine
    // Right leg
    p(16, T - 18 + bob + legR, 7, 10, "#1a2a50");
    p(16, T - 9  + bob + legR, 7,  7, "#0a0808");   // shoe R
    p(17, T - 9  + bob + legR, 3,  2, "#282020");   // shine
    // Seam
    p(13, T - 18 + bob, 2, 10, "#0e1e40");
  } else {
    // Side-facing — one leg in front, one behind
    const frontOff = Math.round(swing * 5);
    // Back leg (drawn first, behind)
    p(10, T - 18 + bob - frontOff, 12, 10, "#152040");
    p(10, T - 9  + bob - frontOff, 12,  7, "#080606");
    // Front leg
    p(10, T - 18 + bob + frontOff, 12, 10, "#1a2a50");
    p(10, T - 9  + bob + frontOff, 12,  7, "#0a0808");
    p(11, T - 9  + bob + frontOff,  4,  2, "#282020");
  }

  // ── BELT ──
  p(7, T - 20 + bob, 18, 3, "#100808");
  p(14, T - 20 + bob, 5, 3, "#c0a020");
  p(15, T - 20 + bob, 3, 1, "#e8c040");

  // ── SUIT JACKET ──
  p(7, 12 + bob, 18, 14, "#181818");
  // Left & right panels
  p(7,  13 + bob, 6, 12, "#181818");
  p(19, 13 + bob, 6, 12, "#181818");
  // Lapels / shirt
  p(12, 13 + bob, 8, 12, "#e8e0d0");
  // Tie
  p(14, 14 + bob, 4, 10, "#1a2a70");
  p(15, 14 + bob, 2, 10, "#0a1850");
  // Button
  p(15, 22 + bob, 2, 2, "#404040");
  // Left shadow
  p(7, 12 + bob, 4, 14, "#0e0e0e");
  // Right highlight
  p(21, 12 + bob, 3, 14, "#282828");

  // ── ARMS ──
  if (dir === 0 || dir === 1) {
    // Front/back: arms swing forward-back (y offset)
    p(2, 13 + bob + armL, 6, 13, "#181818");   // left arm
    p(2, 24 + bob + armL, 6,  4, "#e0d8c8");   // cuff
    p(2, 27 + bob + armL, 6,  5, "#c8a070");   // hand
    p(24, 13 + bob + armR, 6, 13, "#181818");  // right arm
    p(24, 24 + bob + armR, 6,  4, "#e0d8c8");
    p(24, 27 + bob + armR, 6,  5, "#c8a070");
  } else if (dir === 2) {
    // Left-facing: visible arm swings in y
    p(2, 13 + bob + armL, 6, 13, "#181818");
    p(2, 24 + bob + armL, 6,  4, "#e0d8c8");
    p(2, 27 + bob + armL, 6,  5, "#c8a070");
    // Far arm (right side, less visible)
    p(24, 13 + bob + armR, 5, 12, "#141414");
  } else {
    // Right-facing
    p(24, 13 + bob + armR, 6, 13, "#181818");
    p(24, 24 + bob + armR, 6,  4, "#e0d8c8");
    p(24, 27 + bob + armR, 6,  5, "#c8a070");
    p(2, 13 + bob + armL, 5, 12, "#141414");
  }

  // ── NECK ──
  p(13, 9 + bob, 6, 5, "#c8a070");

  // ── HEAD ──
  p(9, 2 + bob, 14, 12, "#d4a878");
  // Cheeks
  p(9,  8 + bob, 3, 5, "#c09060");
  p(20, 8 + bob, 3, 5, "#c09060");

  // ── HAIR ──
  p(9,  2 + bob, 14, 4, "#1a1208");
  p(9,  2 + bob,  3, 8, "#1a1208");
  p(20, 2 + bob,  3, 5, "#1a1208");
  p(12, 2 + bob,  5, 2, "#302010");  // highlight

  // ── EYES & FACE ──
  if (dir === 0) {
    // Front — two eyes + mouth
    p(11, 8 + bob, 4, 3, "#e8f0ff");
    p(17, 8 + bob, 4, 3, "#e8f0ff");
    p(12, 8 + bob, 2, 3, "#3080e0");
    p(18, 8 + bob, 2, 3, "#3080e0");
    p(12, 9 + bob, 1, 2, "#0a0a1a");
    p(18, 9 + bob, 1, 2, "#0a0a1a");
    p(13, 11 + bob, 6, 2, "#a06040");  // mouth
  } else if (dir === 2) {
    // Left
    p(10, 8 + bob, 4, 3, "#e8f0ff");
    p(11, 8 + bob, 2, 3, "#3080e0");
    p(10, 9 + bob, 1, 2, "#0a0a1a");
  } else if (dir === 3) {
    // Right
    p(18, 8 + bob, 4, 3, "#e8f0ff");
    p(19, 8 + bob, 2, 3, "#3080e0");
    p(20, 9 + bob, 1, 2, "#0a0a1a");
  } else {
    // Back — just hair covering head
    p(9, 2 + bob, 14, 12, "#1a1208");
    p(11, 3 + bob, 10, 3, "#302010");
  }
}

// ── NPC ──────────────────────────────────────────────────────────────────
export function drawNPC(
  ctx: CanvasRenderingContext2D,
  npc: NPC,
  cam: Camera,
  animFrame: number
) {
  const T = TILE_SIZE;
  const sx = Math.floor(npc.x * T - cam.x);
  const sy = Math.floor(npc.y * T - cam.y);
  const fr = Math.floor(animFrame) % 4;
  const bob = (fr === 1 || fr === 3) ? -1 : 0;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(sx+8, sy+T-6, 16, 4);

  // Shoes
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(sx+9, sy+T-8+bob, 6, 6);
  ctx.fillRect(sx+17, sy+T-8+bob, 6, 6);

  // Legs
  ctx.fillStyle = "#3a286a";
  ctx.fillRect(sx+10, sy+T-15+bob, 6, 8);
  ctx.fillRect(sx+17, sy+T-15+bob, 5, 8);

  // Body
  ctx.fillStyle = npc.color;
  ctx.fillRect(sx+8, sy+14+bob, 16, 12);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(sx+8, sy+14+bob, 4, 12);

  // Arms
  ctx.fillStyle = npc.color;
  ctx.fillRect(sx+3, sy+15+bob, 5, 10);
  ctx.fillRect(sx+24, sy+15+bob, 5, 10);

  // Neck
  ctx.fillStyle = "#c89060";
  ctx.fillRect(sx+13, sy+10+bob, 6, 5);

  // Head
  ctx.fillStyle = "#d4a070";
  ctx.fillRect(sx+10, sy+3+bob, 12, 10);

  // Hair
  ctx.fillStyle = "#2a1808";
  ctx.fillRect(sx+10, sy+3+bob, 12, 3);
  ctx.fillRect(sx+10, sy+3+bob, 2, 7);

  // Eyes
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(sx+12, sy+8+bob, 2, 2);
  ctx.fillRect(sx+18, sy+8+bob, 2, 2);
  ctx.fillStyle = "#e0e8ff";
  ctx.fillRect(sx+12, sy+8+bob, 1, 1);
  ctx.fillRect(sx+18, sy+8+bob, 1, 1);

  // Name bubble
  const nw = npc.name.length * 5 + 10;
  ctx.fillStyle = "rgba(5,10,20,0.85)";
  ctx.fillRect(sx+16-nw/2, sy-17, nw, 13);
  ctx.strokeStyle = "#c8a020";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx+16-nw/2, sy-17, nw, 13);
  ctx.fillStyle = "#f0d050";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(npc.name, sx+16, sy-10);
}

// ── STREET LAMP (like reference – globe lamp) ──────────────────────────────
export function drawLamp(
  ctx: CanvasRenderingContext2D,
  gx: number, gy: number,
  cam: Camera,
  time: number
) {
  const T = TILE_SIZE;
  const sx = Math.floor(gx * T - cam.x);
  const sy = Math.floor(gy * T - cam.y);

  // Glow halo
  const glowA = 0.12 + Math.sin(time * 0.7) * 0.03;
  const grd = ctx.createRadialGradient(sx+5, sy-8, 2, sx+5, sy-8, 28);
  grd.addColorStop(0, `rgba(255,230,140,${glowA})`);
  grd.addColorStop(1, "rgba(255,200,80,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(sx-23, sy-36, 56, 56);

  // Pole
  ctx.fillStyle = "#3a3848";
  ctx.fillRect(sx+3, sy-20, 5, T+8);
  ctx.fillStyle = "#4a4858";
  ctx.fillRect(sx+4, sy-20, 2, T+8);

  // Globe base
  ctx.fillStyle = "#2a2838";
  ctx.fillRect(sx-2, sy-24, 14, 7);
  // Globe
  ctx.fillStyle = "#f8f0d0";
  ctx.fillRect(sx-1, sy-30, 12, 10);
  ctx.fillStyle = "rgba(255,240,180,0.9)";
  ctx.fillRect(sx+1, sy-29, 8, 7);
  // Globe top cap
  ctx.fillStyle = "#2a2838";
  ctx.fillRect(sx+1, sy-32, 8, 4);
  // Inner glow
  ctx.fillStyle = "#fff8d0";
  ctx.fillRect(sx+2, sy-28, 6, 5);
}

// ── FOUNTAIN ──────────────────────────────────────────────────────────────
export function drawFountain(
  ctx: CanvasRenderingContext2D,
  gx: number, gy: number,
  cam: Camera,
  time: number
) {
  const T = TILE_SIZE;
  const sx = Math.floor(gx * T - cam.x);
  const sy = Math.floor(gy * T - cam.y);
  const S = T * 2;

  // Stone base rim
  ctx.fillStyle = "#8a7e6e";
  ctx.fillRect(sx-2, sy+S-10, S+4, 14);
  // Inner basin
  ctx.fillStyle = "#6a6258";
  ctx.fillRect(sx+2, sy+S-14, S-4, 10);
  // Water
  const wA = 0.75 + Math.sin(time*2.5)*0.1;
  ctx.fillStyle = `rgba(48,148,208,${wA})`;
  ctx.fillRect(sx+4, sy+S-12, S-8, 7);
  // Water shimmer
  ctx.fillStyle = `rgba(160,220,255,${0.5+Math.sin(time*4)*0.2})`;
  ctx.fillRect(sx+6, sy+S-11, 10, 2);
  ctx.fillRect(sx+S-14, sy+S-10, 8, 2);
  // Center pillar
  ctx.fillStyle = "#9a8e7e";
  ctx.fillRect(sx+S/2-4, sy+6, 8, S-14);
  // Ball top
  ctx.fillStyle = "#b4a890";
  ctx.fillRect(sx+S/2-6, sy+0, 12, 9);
  ctx.fillStyle = "#c8bca8";
  ctx.fillRect(sx+S/2-4, sy+1, 8, 5);
  // Spray
  const sH = 6 + Math.abs(Math.sin(time*3.5)) * 8;
  ctx.fillStyle = `rgba(180,230,255,0.65)`;
  ctx.fillRect(sx+S/2-1, sy+6-sH, 2, sH);
  ctx.fillRect(sx+S/2-3, sy+6-sH*0.6, 1, sH*0.6);
  ctx.fillRect(sx+S/2+2, sy+6-sH*0.6, 1, sH*0.6);
  // Droplets
  ctx.fillStyle = `rgba(180,230,255,0.5)`;
  ctx.fillRect(sx+S/2-5, sy+6-sH*0.3, 1, 2);
  ctx.fillRect(sx+S/2+4, sy+6-sH*0.4, 1, 2);
}

// ── MINIMAP ───────────────────────────────────────────────────────────────
export function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  map: number[][],
  player: Player,
  _W: number,
  H: number
) {
  const MS = 130;
  const MX = 12;
  const MY = H - MS - 12;
  const tW = MS / map[0].length;
  const tH = MS / map.length;

  // ── Metal frame (like reference) ──
  // Outer metal casing
  ctx.fillStyle = "#5a5868";
  ctx.fillRect(MX-10, MY-10, MS+20, MS+20);
  // Rivets
  const rivetPos = [
    [MX-8, MY-8],[MX+MS+4, MY-8],
    [MX-8, MY+MS+4],[MX+MS+4, MY+MS+4],
  ];
  for (const [rx, ry] of rivetPos) {
    ctx.fillStyle = "#7a7888";
    ctx.fillRect(rx, ry, 5, 5);
    ctx.fillStyle = "#9a98a8";
    ctx.fillRect(rx+1, ry+1, 2, 2);
  }
  // Inner inset
  ctx.fillStyle = "#2a2838";
  ctx.fillRect(MX-6, MY-6, MS+12, MS+12);
  // Screen bezel
  ctx.fillStyle = "#0a0c14";
  ctx.fillRect(MX-2, MY-2, MS+4, MS+4);

  // ── Map tiles ──
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const t = map[y][x];
      let col = "#4a7c30";
      if (t === TILES.PATH_H || t === TILES.PATH_V || t === TILES.PATH_CROSS) col = "#303035";
      else if (t === TILES.STONE) col = "#8a8070";
      else if (t === TILES.BUILDING_FLOOR) col = "#6a4820";
      else if (t === TILES.TREE) col = "#204818";
      else if (t === TILES.FLOWER) col = "#c02840";
      else if (t === TILES.BUSH) col = "#184014";
      else if (t === TILES.DIRT) col = "#7a5838";
      ctx.fillStyle = col;
      ctx.fillRect(
        Math.floor(MX + x*tW), Math.floor(MY + y*tH),
        Math.ceil(tW)+0.5, Math.ceil(tH)+0.5
      );
    }
  }

  // Building markers
  for (const b of BUILDINGS) {
    ctx.fillStyle = "#e8c030";
    ctx.fillRect(
      Math.floor(MX + b.x*tW), Math.floor(MY + b.y*tH),
      Math.ceil(b.width*tW), Math.ceil(b.height*tH)
    );
  }

  // Player dot (red with white core)
  ctx.fillStyle = "#ff2020";
  ctx.fillRect(Math.floor(MX + player.x*tW - 2), Math.floor(MY + player.y*tH - 2), 5, 5);
  ctx.fillStyle = "#ff8080";
  ctx.fillRect(Math.floor(MX + player.x*tW - 1), Math.floor(MY + player.y*tH - 1), 2, 2);

  // Label
  ctx.fillStyle = "#c8a020";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("MAP", MX+2, MY+2);
}
