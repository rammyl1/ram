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

// ── Palette (Peter Oravec / Stardew-inspired) ──────────────────────────────
const C = {
  // Grass – vivid, layered greens
  g1: "#5c9e3c",   // base
  g2: "#4c8c30",   // dark
  g3: "#70b84c",   // bright
  g4: "#3a7228",   // very dark
  gH: "#82cc5e",   // highlight blade
  // Asphalt road – dark grey with texture
  road: "#2e2e32",
  roadLine: "#3e3e44",
  roadDash: "#e8e000",
  roadEdge: "#1e1e22",
  // Stone sidewalk / cobble
  stone1: "#9a9080",
  stone2: "#b4a898",
  stone3: "#7e7668",
  stoneEdge: "#5a5248",
  stoneHi: "#ccc4b8",
  // Trees
  t1: "#1e4818",   // darkest
  t2: "#2e6828",   // mid
  t3: "#3e8838",   // bright
  t4: "#52a84c",   // lightest
  tH: "#6ec060",   // highlight
  tTrk: "#7c5230", // trunk
  tTrk2: "#5c3818",
  // Flowers
  fr: "#e02850",   // red petal
  frH: "#ff6888",
  fy: "#f8d000",   // yellow
  fyH: "#ffe44c",
  fSt: "#38681c",  // stem
  fW: "#fff8e0",   // white center
  // Bushes
  bu1: "#1a4c14",
  bu2: "#267020",
  bu3: "#32902c",
  buH: "#42aa3a",
  // Dirt / path near doors
  dr1: "#8c7050",
  dr2: "#a8896c",
  dr3: "#c0a484",
};

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

// ── GRASS ──────────────────────────────────────────────────────────────────
function drawGrass(ctx: CanvasRenderingContext2D, sx: number, sy: number, seed: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.g1);

  // Variation patches
  const v = seed % 11;
  if (v < 2)       { r(ctx, sx+4, sy+4, 9, 6, C.g2);  r(ctx, sx+20, sy+18, 7, 5, C.g3); }
  else if (v < 4)  { r(ctx, sx+10, sy+6, 12, 5, C.g2); r(ctx, sx+2, sy+22, 8, 4, C.g4); }
  else if (v < 6)  { r(ctx, sx+18, sy+2, 8, 6, C.g3);  r(ctx, sx+4, sy+20, 6, 5, C.g2); }
  else if (v < 8)  { r(ctx, sx+0, sy+12, 5, 8, C.g4);  r(ctx, sx+26, sy+10, 5, 7, C.g3); }

  // Grass blades
  ctx.fillStyle = C.gH;
  const bx1 = ((seed * 5) % 18) + 3;
  const bx2 = ((seed * 9) % 14) + 14;
  ctx.fillRect(Math.floor(sx+bx1), Math.floor(sy+2), 1, 4);
  ctx.fillRect(Math.floor(sx+bx1+2), Math.floor(sy+1), 1, 5);
  ctx.fillRect(Math.floor(sx+bx2), Math.floor(sy+24), 1, 4);
  ctx.fillRect(Math.floor(sx+bx2+3), Math.floor(sy+22), 1, 5);

  // Tiny dark specks
  ctx.fillStyle = C.g4;
  if (v % 3 === 0) {
    ctx.fillRect(Math.floor(sx+15), Math.floor(sy+14), 2, 2);
    ctx.fillRect(Math.floor(sx+7), Math.floor(sy+26), 2, 2);
  }
}

// ── ASPHALT ROAD ──────────────────────────────────────────────────────────
function drawRoad(ctx: CanvasRenderingContext2D, sx: number, sy: number, isHorizontal: boolean, seed: number, globalFrame: number) {
  const T = TILE_SIZE;
  // Base asphalt
  r(ctx, sx, sy, T, T, C.road);
  // Subtle texture noise
  ctx.fillStyle = C.roadLine;
  const tx = (seed * 3) % 24;
  const ty2 = (seed * 7) % 24;
  ctx.fillRect(Math.floor(sx+tx), Math.floor(sy+ty2), 3, 2);
  ctx.fillRect(Math.floor(sx+(tx+12)%28), Math.floor(sy+(ty2+14)%28), 2, 2);

  // Edge stripes
  ctx.fillStyle = "#252528";
  if (isHorizontal) {
    ctx.fillRect(Math.floor(sx), Math.floor(sy), T, 2);
    ctx.fillRect(Math.floor(sx), Math.floor(sy+T-2), T, 2);
  } else {
    ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, T);
    ctx.fillRect(Math.floor(sx+T-2), Math.floor(sy), 2, T);
  }

  // Yellow dash in center (animated)
  const dashOffset = Math.floor(globalFrame * 0.5) % (T * 2);
  ctx.fillStyle = C.roadDash;
  if (isHorizontal) {
    // Center H line at y+T/2
    const dy = sy + Math.floor(T / 2) - 1;
    // Draw two dashes per tile
    for (let d = 0; d < 2; d++) {
      const dx = sx + (d * T - dashOffset + T * 2) % (T * 2);
      if (dx >= sx && dx < sx + T) {
        ctx.fillRect(Math.floor(dx), Math.floor(dy), Math.min(12, sx + T - dx), 2);
      }
    }
  } else {
    const ddx = sx + Math.floor(T / 2) - 1;
    for (let d = 0; d < 2; d++) {
      const ddy = sy + (d * T - dashOffset + T * 2) % (T * 2);
      if (ddy >= sy && ddy < sy + T) {
        ctx.fillRect(Math.floor(ddx), Math.floor(ddy), 2, Math.min(12, sy + T - ddy));
      }
    }
  }
}

// ── STONE SIDEWALK ─────────────────────────────────────────────────────────
function drawStone(ctx: CanvasRenderingContext2D, sx: number, sy: number, seed: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.stone1);

  // Cobble blocks — 2×2 grid of stones
  const offsets = [
    [1,1,13,13],[15,1,16,13],[1,15,13,15],[15,15,15,15],
  ];
  const stoneColors = [C.stone2, C.stone1, C.stone3, C.stone2];
  offsets.forEach(([ox,oy,ow,oh], i) => {
    r(ctx, sx+ox, sy+oy, ow, oh, stoneColors[(i + seed) % 4]);
  });

  // Highlights
  ctx.fillStyle = C.stoneHi;
  ctx.fillRect(Math.floor(sx+2), Math.floor(sy+2), 4, 2);
  ctx.fillRect(Math.floor(sx+16), Math.floor(sy+4), 6, 2);
  ctx.fillRect(Math.floor(sx+4), Math.floor(sy+16), 4, 2);
  ctx.fillRect(Math.floor(sx+18), Math.floor(sy+18), 4, 2);

  // Mortar lines (dark)
  ctx.fillStyle = C.stoneEdge;
  ctx.fillRect(Math.floor(sx), Math.floor(sy+14), T, 2);
  ctx.fillRect(Math.floor(sx+14), Math.floor(sy), 2, T);
}

// ── TREE ──────────────────────────────────────────────────────────────────
function drawTree(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  // Ground under tree
  r(ctx, sx, sy, T, T, C.g1);

  // Shadow on ground
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(Math.floor(sx+7), Math.floor(sy+T-12), 20, 10);

  // Trunk
  r(ctx, sx+12, sy+T-18, 8, 16, C.tTrk);
  r(ctx, sx+14, sy+T-18, 3, 16, C.tTrk2);
  // Trunk root spread
  r(ctx, sx+9, sy+T-10, 3, 8, C.tTrk);
  r(ctx, sx+20, sy+T-10, 3, 8, C.tTrk);
  // Trunk highlight
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(Math.floor(sx+16), Math.floor(sy+T-16), 2, 12);

  // Foliage — layered circles (pixel style like reference)
  // Dark back layer
  r(ctx, sx+2, sy+5, 28, 22, C.t1);
  // Lower sides
  r(ctx, sx+0, sy+10, 6, 14, C.t1);
  r(ctx, sx+26, sy+10, 6, 14, C.t1);
  // Main mid
  r(ctx, sx+3, sy+2, 26, 22, C.t2);
  r(ctx, sx+0, sy+8, 32, 14, C.t2);
  // Top bright cone
  r(ctx, sx+6, sy+0, 20, 18, C.t3);
  r(ctx, sx+2, sy+6, 28, 12, C.t3);
  // Highlight cluster top-left
  r(ctx, sx+7, sy+2, 10, 6, C.t4);
  r(ctx, sx+4, sy+7, 6, 5, C.t4);
  r(ctx, sx+9, sy+0, 6, 4, C.tH);
  // Dark outline border
  r(ctx, sx+6, sy+0, 20, 2, C.t1);
  r(ctx, sx+2, sy+4, 4, 3, C.t1);
  r(ctx, sx+26, sy+4, 4, 3, C.t1);
}

// ── FLOWER ────────────────────────────────────────────────────────────────
function drawFlower(ctx: CanvasRenderingContext2D, sx: number, sy: number, seed: number) {
  drawGrass(ctx, sx, sy, seed);
  const off = seed % 6;
  const fx = sx + 4 + off * 3;
  const fy = sy + 5 + (seed % 5) * 3;
  const yellow = seed % 3 === 0;
  const pC = yellow ? C.fy : C.fr;
  const pH = yellow ? C.fyH : C.frH;
  // Stem
  r(ctx, fx+2, fy+6, 2, 10, C.fSt);
  // Petals
  r(ctx, fx, fy+4, 6, 4, pC);
  r(ctx, fx+2, fy+1, 2, 8, pC);
  // Highlight
  r(ctx, fx+2, fy+2, 2, 2, pH);
  r(ctx, fx, fy+4, 2, 2, pH);
  // Center
  r(ctx, fx+1, fy+4, 4, 3, C.fW);
  r(ctx, fx+2, fy+5, 2, 1, C.fy);
}

// ── BUSH ──────────────────────────────────────────────────────────────────
function drawBush(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.g1);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(Math.floor(sx+4), Math.floor(sy+T-12), 24, 10);
  r(ctx, sx+2, sy+11, 28, 20, C.bu1);
  r(ctx, sx+4, sy+8, 24, 18, C.bu2);
  r(ctx, sx+6, sy+5, 20, 16, C.bu3);
  r(ctx, sx+8, sy+6, 8, 6, C.buH);
  r(ctx, sx+20, sy+8, 6, 5, C.buH);
  r(ctx, sx+2, sy+5, 28, 2, C.bu1);
}

// ── DIRT ──────────────────────────────────────────────────────────────────
function drawDirt(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  r(ctx, sx, sy, T, T, C.dr1);
  r(ctx, sx+3, sy+3, 11, 7, C.dr2);
  r(ctx, sx+19, sy+19, 9, 6, C.dr2);
  r(ctx, sx+2, sy+20, 7, 5, C.dr3);
  r(ctx, sx+18, sy+4, 8, 5, C.dr3);
}

// ── FENCE ─────────────────────────────────────────────────────────────────
function drawFence(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
  const T = TILE_SIZE;
  // Grass base
  r(ctx, sx, sy, T, T, C.g1);
  // Fence post
  r(ctx, sx + T/2 - 2, sy, 4, T, "#7a5828");
  r(ctx, sx + T/2 - 1, sy, 2, T, "#9a7848");
  // Horizontal rails
  r(ctx, sx, sy + 6, T, 4, "#8a6838");
  r(ctx, sx, sy + 20, T, 4, "#8a6838");
  r(ctx, sx+1, sy+7, T-2, 2, "#aa8858");
  // Post cap
  r(ctx, sx + T/2 - 3, sy, 6, 4, "#b09060");
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
