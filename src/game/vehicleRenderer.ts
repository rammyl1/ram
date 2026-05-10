/**
 * Vehicle pixel-art renderer — top-down RPG perspective.
 *
 * Reference style: wheels are dark rectangles that peek out slightly
 * from the body corners (not floating circles on the sides).
 * Each vehicle type has a distinct silhouette so it's instantly readable.
 *
 *  CAR      — short, rounded roof, two windshields
 *  BUS      — long, flat roof, many windows, wide body
 *  TRICYCLE — small, asymmetric sidecar box + motorcycle half
 *  TRUCK    — long flat cargo bed, separate short cab
 */

import { TILE_SIZE } from "./constants";
import { Vehicle, getVehicleSize } from "./vehicles";

type Ctx = CanvasRenderingContext2D;

// Pixel-fill shorthand
function f(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = c;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

// Darker variant of a hex color
function dark(hex: string, amt = 40): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `rgb(${clamp((n>>16)-amt)},${clamp(((n>>8)&0xff)-amt)},${clamp((n&0xff)-amt)})`;
}
function light(hex: string, amt = 35): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `rgb(${clamp((n>>16)+amt)},${clamp(((n>>8)&0xff)+amt)},${clamp((n&0xff)+amt)})`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Shared sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Wheel: a dark rounded rectangle peeking out from body edge */
function wheel(ctx: Ctx, x: number, y: number, w: number, h: number) {
  f(ctx, x,   y,   w, h, "#111111");   // tire (very dark)
  f(ctx, x+1, y+1, w-2, h-2, "#444444"); // rim
  f(ctx, x+2, y+1, 2,   1,   "#888888"); // rim highlight
}

/** Windshield / window pane */
function glass(ctx: Ctx, x: number, y: number, w: number, h: number, tint = "#2a3a4a") {
  f(ctx, x, y, w, h, tint);
  // diagonal glare strip
  f(ctx, x+1, y+1, Math.max(1, Math.floor(w*0.4)), 1, "rgba(255,255,255,0.45)");
  f(ctx, x+1, y+2, Math.max(1, Math.floor(w*0.25)), 1, "rgba(255,255,255,0.2)");
}

// ─────────────────────────────────────────────────────────────────────────────
//  CAR  (W=48 H=28 when going RIGHT)
//  Top-down: you see the roof as the central bright rectangle,
//  wheels are 4 dark nubs at the four corners sticking out 3px.
// ─────────────────────────────────────────────────────────────────────────────
function drawCar(
  ctx: Ctx, sx: number, sy: number,
  col: string, _col2: string, dir: 1|-1, _anim: number
) {
  const W = 48, H = 28;
  const shadow = "rgba(0,0,0,0.30)";

  // ── Drop shadow ──
  f(ctx, sx+4, sy+4, W, H, shadow);

  // ── Wheels (corners, peeking 3px past body) ──
  // Front-left, front-right, rear-left, rear-right
  // "Front" = direction of travel
  const fw = 7, fh = 10; // wheel footprint
  const wx = (front: boolean) => front
    ? (dir === 1 ? sx+W-4 : sx-3)
    : (dir === 1 ? sx-3    : sx+W-4);

  wheel(ctx, wx(true),  sy+1,      fw, fh);
  wheel(ctx, wx(true),  sy+H-1-fh, fw, fh);
  wheel(ctx, wx(false), sy+1,      fw, fh);
  wheel(ctx, wx(false), sy+H-1-fh, fw, fh);

  // ── Body base (side panels — slightly darker) ──
  f(ctx, sx, sy+4, W, H-8, dark(col, 18));

  // ── Roof (central bright pad) ──
  f(ctx, sx+8,  sy+6,  W-16, H-12, col);
  // roof highlight (top-left corner)
  f(ctx, sx+9,  sy+7,  Math.floor((W-18)*0.55), 3, light(col, 40));
  // roof center crease line
  f(ctx, sx+8,  sy+H/2-1, W-16, 1, dark(col, 30));

  // ── Windshields ──
  const windW = 10, windH = H-14;
  if (dir === 1) {
    // Front windshield (right)
    glass(ctx, sx+W-14, sy+7, windW, windH, "#1e3040");
    // Rear windshield (left) — darker
    glass(ctx, sx+4,    sy+7, windW-2, windH, "#162830");
  } else {
    glass(ctx, sx+4,    sy+7, windW, windH, "#1e3040");
    glass(ctx, sx+W-14, sy+7, windW-2, windH, "#162830");
  }

  // ── Hood (front) ──
  const hoodX = dir === 1 ? sx+W-6 : sx;
  f(ctx, hoodX, sy+5, 6, H-10, dark(col, 8));

  // ── Headlights ──
  const hlX = dir === 1 ? sx+W-3 : sx;
  f(ctx, hlX, sy+5,   3, 4, "#ffffc0");
  f(ctx, hlX, sy+H-9, 3, 4, "#ffffc0");

  // ── Tail lights ──
  const tlX = dir === 1 ? sx : sx+W-3;
  f(ctx, tlX, sy+5,   3, 4, "#cc0000");
  f(ctx, tlX, sy+H-9, 3, 4, "#cc0000");

  // ── Door seam ──
  f(ctx, sx + Math.floor(W/2)-1, sy+4, 1, H-8, dark(col, 35));

  // ── Side mirror nubs ──
  const mX = dir === 1 ? sx+W-16 : sx+8;
  f(ctx, mX, sy+2,   3, 2, dark(col, 20));
  f(ctx, mX, sy+H-4, 3, 2, dark(col, 20));
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUS  (W=80 H=30)
//  Long body, flat roof, row of side windows, wide square silhouette
// ─────────────────────────────────────────────────────────────────────────────
function drawBus(
  ctx: Ctx, sx: number, sy: number,
  col: string, col2: string, dir: 1|-1, _anim: number
) {
  const W = 80, H = 30;

  // Drop shadow
  f(ctx, sx+5, sy+5, W, H, "rgba(0,0,0,0.28)");

  // ── Wheels (6 — two axles visible from top) ──
  const ww = 8, wh = 11;
  const fxW = dir === 1 ? sx+W-5 : sx-3;
  const rxW = dir === 1 ? sx-3   : sx+W-5;
  wheel(ctx, fxW, sy+1,      ww, wh);   // front top
  wheel(ctx, fxW, sy+H-1-wh, ww, wh);   // front bot
  wheel(ctx, rxW, sy+1,      ww, wh);   // rear top
  wheel(ctx, rxW, sy+H-1-wh, ww, wh);   // rear bot
  // middle axle
  const mxW = sx + Math.floor(W/2) - 4;
  wheel(ctx, mxW, sy+1,      ww, wh);
  wheel(ctx, mxW, sy+H-1-wh, ww, wh);

  // ── Body base ──
  f(ctx, sx, sy+3, W, H-6, dark(col, 10));

  // ── Roof ──
  f(ctx, sx+4, sy+4, W-8, H-8, col);
  // Roof highlight strip
  f(ctx, sx+5, sy+5, W-10, 3, light(col, 45));

  // ── Stripe along sides ──
  f(ctx, sx+4, sy+4,    W-8, 3,   col2);
  f(ctx, sx+4, sy+H-7,  W-8, 3,   col2);

  // ── Side windows (top side) ──
  for (let wi = 0; wi < 5; wi++) {
    const wx2 = sx + 6 + wi*14;
    glass(ctx, wx2, sy+5, 10, 5, "#1a3050");
  }
  // ── Side windows (bottom side) ──
  for (let wi = 0; wi < 5; wi++) {
    const wx2 = sx + 6 + wi*14;
    glass(ctx, wx2, sy+H-10, 10, 5, "#1a3050");
  }

  // ── Front windshield ──
  const fwX = dir === 1 ? sx+W-12 : sx+2;
  glass(ctx, fwX, sy+5, 10, H-10, "#1e3848");
  // Wiper line
  f(ctx, fwX+1, sy+H/2, 8, 1, dark(col, 50));

  // ── Rear ──
  const rwX = dir === 1 ? sx : sx+W-12;
  glass(ctx, rwX+2, sy+6, 8, H-12, "#162830");

  // ── Headlights ──
  const hlX2 = dir === 1 ? sx+W-2 : sx;
  f(ctx, hlX2, sy+6,    2, 5, "#ffffa0");
  f(ctx, hlX2, sy+H-11, 2, 5, "#ffffa0");

  // ── Tail lights ──
  const tlX2 = dir === 1 ? sx : sx+W-2;
  f(ctx, tlX2, sy+6,    2, 5, "#dd0000");
  f(ctx, tlX2, sy+H-11, 2, 5, "#dd0000");

  // ── Door marker ──
  const doorX = dir === 1 ? sx+12 : sx+W-20;
  f(ctx, doorX, sy+4, 8, H-8, dark(col, 25));
  f(ctx, doorX+3, sy+4, 1, H-8, dark(col, 50));

  // ── BUS label on roof ──
  ctx.fillStyle = light(col2, 40);
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("BUS", sx+W/2, sy+H/2);
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRUCK  (W=76 H=30)
//  Short cab at front, long flat cargo bed behind — very different from car
// ─────────────────────────────────────────────────────────────────────────────
function drawTruck(
  ctx: Ctx, sx: number, sy: number,
  col: string, col2: string, dir: 1|-1, _anim: number
) {
  const W = 76, H = 30;
  const CAB = 22;    // cab length in pixels
  const BED = W - CAB;

  // Drop shadow
  f(ctx, sx+5, sy+5, W, H, "rgba(0,0,0,0.32)");

  // positions depend on direction
  const cabX  = dir === 1 ? sx + BED : sx;
  const bedX  = dir === 1 ? sx       : sx + CAB;

  // ── Wheels ──
  const ww = 8, wh = 12;
  // Front axle (under cab front)
  const faxX = dir === 1 ? cabX + CAB - 5 : cabX - 3;
  wheel(ctx, faxX, sy+1,      ww, wh);
  wheel(ctx, faxX, sy+H-1-wh, ww, wh);
  // Rear dual axle (under bed rear)
  const rax1X = dir === 1 ? bedX - 3      : bedX + BED - ww - 5;
  const rax2X = dir === 1 ? bedX + 8      : bedX + BED - ww + 6;
  wheel(ctx, rax1X, sy+1,      ww, wh);
  wheel(ctx, rax1X, sy+H-1-wh, ww, wh);
  wheel(ctx, rax2X, sy+1,      ww, wh);
  wheel(ctx, rax2X, sy+H-1-wh, ww, wh);

  // ── Cargo bed ──
  f(ctx, bedX, sy+3, BED, H-6, dark(col, 5));
  // Bed floor planks
  f(ctx, bedX+2, sy+4, BED-4, H-8, "#9a7a50");
  const plankCol = "rgba(0,0,0,0.12)";
  for (let pp = bedX+2; pp < bedX+BED-4; pp += 9) {
    f(ctx, pp, sy+4, 1, H-8, plankCol);
  }
  // Bed rails (sides)
  f(ctx, bedX+2, sy+4,   BED-4, 3, dark(col, 0));
  f(ctx, bedX+2, sy+H-7, BED-4, 3, dark(col, 0));
  // Bed end gate
  const gateX = dir === 1 ? bedX : bedX + BED - 4;
  f(ctx, gateX, sy+4, 4, H-8, col2);

  // ── Cab ──
  f(ctx, cabX, sy+2, CAB, H-4, dark(col2, 5));
  // Cab roof
  f(ctx, cabX+2, sy+4, CAB-4, H-8, col2);
  f(ctx, cabX+3, sy+5, CAB-6, 3, light(col2, 45));
  // Windshield
  const wsX = dir === 1 ? cabX+2 : cabX+6;
  glass(ctx, wsX, sy+6, CAB-10, H-12, "#1a3040");
  // Headlights
  const hlX3 = dir === 1 ? cabX+CAB-2 : cabX;
  f(ctx, hlX3, sy+5,    2, 5, "#ffffa0");
  f(ctx, hlX3, sy+H-10, 2, 5, "#ffffa0");
  // Tail lights (bed end)
  const tlX3 = dir === 1 ? bedX : bedX+BED-2;
  f(ctx, tlX3, sy+5,    2, 5, "#cc0000");
  f(ctx, tlX3, sy+H-10, 2, 5, "#cc0000");
  // Cab-bed junction line
  const jX = dir === 1 ? cabX : cabX + CAB;
  f(ctx, jX, sy+2, 2, H-4, "#111111");

  // "TRUCK" label on cargo bed
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const labelX = dir === 1 ? bedX + BED/2 : bedX + BED/2;
  ctx.fillText("TRUCK", labelX, sy+H/2);
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRICYCLE  (W=38 H=24) — Filipino motorized tricycle
//  Visible asymmetry: sidecar box on one side, narrow moto body
// ─────────────────────────────────────────────────────────────────────────────
function drawTricycle(
  ctx: Ctx, sx: number, sy: number,
  col: string, col2: string, dir: 1|-1, _anim: number
) {
  const W = 38, H = 24;

  // Drop shadow
  f(ctx, sx+3, sy+3, W, H, "rgba(0,0,0,0.22)");

  // ── 3 Wheels (2 rear on sidecar, 1 front on moto) ──
  const fwX2 = dir === 1 ? sx+W-5 : sx-2;
  wheel(ctx, fwX2, sy+H/2-4, 7, 8);        // front (single moto wheel)

  // two rear wheels (wide stance of sidecar)
  const rwX2 = dir === 1 ? sx-2 : sx+W-5;
  wheel(ctx, rwX2, sy+2,      7, 8);   // rear top
  wheel(ctx, rwX2, sy+H-10,   7, 8);   // rear bot

  // ── Sidecar box (bottom half of vehicle width) ──
  f(ctx, sx+3, sy+8, W-8, H-11, dark(col, 10));
  f(ctx, sx+4, sy+9, W-10, H-13, col);
  // Sidecar roof
  f(ctx, sx+3, sy+8, W-8, 3, col2);
  f(ctx, sx+3, sy+H-5, W-8, 3, col2);
  // Sidecar window
  glass(ctx, sx+6, sy+10, W-14, H-15, "#1a3040");

  // ── Motorcycle body (top portion) ──
  const motoW = Math.floor(W*0.45);
  const motoX = dir === 1 ? sx+W-motoW-2 : sx+2;
  f(ctx, motoX, sy+2, motoW, 8, col2);
  f(ctx, motoX+2, sy+3, motoW-4, 4, light(col2, 30));
  // handlebars
  f(ctx, motoX, sy+2, 3, 3, "#555555");

  // ── Headlight / tail ──
  const hlX4 = dir === 1 ? sx+W-2 : sx;
  f(ctx, hlX4, sy+H/2-2, 2, 4, "#ffffc0");
  const tlX4 = dir === 1 ? sx : sx+W-2;
  f(ctx, tlX4, sy+H/2-2, 2, 4, "#cc0000");

  // ── Colorful Filipino decoration flags ──
  const flagY = sy + 8;
  const colors = ["#ff3333","#ffff33","#33ff33","#3333ff","#ff33ff"];
  for (let fi = 0; fi < 5; fi++) {
    f(ctx, sx+6+fi*5, flagY, 3, 2, colors[fi]);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Brake-light glow overlay
// ─────────────────────────────────────────────────────────────────────────────
function drawBrakeLights(ctx: Ctx, sx: number, sy: number, w: number, h: number, v: Vehicle) {
  if (!v.stopped) return;
  const pulse = 0.45 + Math.abs(Math.sin(v.stopTimer / 180)) * 0.45;
  // Glow at rear
  const rearX = v.dir === 1 ? sx - 6 : sx + w;
  const grad = ctx.createRadialGradient(
    rearX, sy + h/2, 0,
    rearX, sy + h/2, 18
  );
  grad.addColorStop(0, `rgba(255,30,30,${pulse * 0.85})`);
  grad.addColorStop(1, "rgba(255,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(rearX - 18, sy + h/2 - 18, 36, 36);

  // Stop indicator
  if (v.stopTimer > 400) {
    ctx.fillStyle = `rgba(255,80,80,${pulse})`;
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("▐▌", sx + w/2, sy - 3);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Vertical-axis drawing (rotate the horizontal draw by 90°)
// ─────────────────────────────────────────────────────────────────────────────
function drawVertical(
  ctx: Ctx,
  v: Vehicle,
  cam: { x: number; y: number },
  drawFn: (ctx: Ctx, sx: number, sy: number, c: string, c2: string, d: 1|-1, a: number) => void
) {
  // pos = FRONT bumper pixel position along Y axis
  // dir=1 (going down): front is bottom edge → top of vehicle = pos - vLength
  // dir=-1 (going up):  front is top edge    → top of vehicle = pos
  const hSize = getVehicleSize({ ...v, axis: "h" } as Vehicle);
  const vLength = hSize.w; // when rotated, the "length" becomes height on screen

  const screenX = v.lane * TILE_SIZE + TILE_SIZE/2 - cam.x;
  const topY = v.dir === 1
    ? v.pos - vLength - cam.y
    : v.pos - cam.y;
  const vSize = getVehicleSize(v);

  // Centre point on screen
  const cx = screenX;
  const cy = topY + vSize.h/2;

  ctx.save();
  ctx.translate(cx, cy);
  // dir 1 = going DOWN → rotate +90°; dir -1 = UP → rotate -90°
  ctx.rotate(v.dir === 1 ? Math.PI/2 : -Math.PI/2);
  drawFn(ctx, -hSize.w/2, -hSize.h/2, v.color, v.color2, v.dir, v.wheelAnim);
  drawBrakeLights(ctx, -hSize.w/2, -hSize.h/2, hSize.w, hSize.h, v);
  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  SCHOOL BUS  (W=84 H=30) — Iconic American yellow school bus
//  Distinct from the regular bus: longer, classic stop sign, black stripe,
//  more squared/box-y shape, "SCHOOL BUS" text.
// ─────────────────────────────────────────────────────────────────────────────
function drawSchoolBus(
  ctx: Ctx, sx: number, sy: number,
  col: string, col2: string, dir: 1|-1, _anim: number
) {
  const W = 84, H = 30;

  // Drop shadow
  f(ctx, sx+5, sy+5, W, H, "rgba(0,0,0,0.3)");

  // ── Wheels (4 large + 2 dual rear) ──
  const ww = 9, wh = 12;
  const fxW = dir === 1 ? sx+W-7 : sx-2;
  const rxW = dir === 1 ? sx-2   : sx+W-7;
  wheel(ctx, fxW, sy+1,      ww, wh);   // front top
  wheel(ctx, fxW, sy+H-1-wh, ww, wh);   // front bot
  wheel(ctx, rxW, sy+1,      ww, wh);   // rear top
  wheel(ctx, rxW, sy+H-1-wh, ww, wh);   // rear bot

  // ── Body base (yellow, slightly darker shade for shadow) ──
  f(ctx, sx, sy+3, W, H-6, dark(col, 12));

  // ── Main yellow body ──
  f(ctx, sx+4, sy+4, W-8, H-8, col);

  // ── Top yellow highlight strip ──
  f(ctx, sx+5, sy+5, W-10, 2, light(col, 35));

  // ── Black stripe along the middle ──
  f(ctx, sx+4, sy+H/2-1, W-8, 2, "#1a1a1a");

  // ── Side windows (row of square windows along top) ──
  for (let wi = 0; wi < 6; wi++) {
    const wx2 = sx + 7 + wi*12;
    glass(ctx, wx2, sy+6, 8, 6, "#1e3850");
    // Black window frame
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(Math.floor(wx2-1), Math.floor(sy+6),  1, 6);
    ctx.fillRect(Math.floor(wx2+8), Math.floor(sy+6),  1, 6);
  }

  // ── Bottom row windows (one per door panel) ──
  for (let wi = 0; wi < 6; wi++) {
    const wx2 = sx + 7 + wi*12;
    glass(ctx, wx2, sy+H-12, 8, 6, "#1e3850");
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(Math.floor(wx2-1), Math.floor(sy+H-12), 1, 6);
    ctx.fillRect(Math.floor(wx2+8), Math.floor(sy+H-12), 1, 6);
  }

  // ── Front windshield (large, slanted look via offset) ──
  const fwX = dir === 1 ? sx+W-12 : sx+2;
  glass(ctx, fwX, sy+5, 10, H-10, "#2c4a60");
  // Wiper line
  f(ctx, fwX+1, sy+H/2, 8, 1, "#2a2a2a");
  // Black trim around windshield
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(Math.floor(fwX-1), Math.floor(sy+5),     1, H-10);
  ctx.fillRect(Math.floor(fwX+10),Math.floor(sy+5),     1, H-10);

  // ── Rear ──
  const rwX = dir === 1 ? sx : sx+W-12;
  glass(ctx, rwX+2, sy+6, 8, H-12, "#162830");

  // ── Headlights (large round) ──
  const hlX = dir === 1 ? sx+W-3 : sx;
  f(ctx, hlX, sy+7,     3, 4, "#ffffc0");
  f(ctx, hlX, sy+H-11,  3, 4, "#ffffc0");
  // Inner glow
  ctx.fillStyle = "#fff8e0";
  ctx.fillRect(Math.floor(hlX), Math.floor(sy+7),    1, 1);
  ctx.fillRect(Math.floor(hlX), Math.floor(sy+H-11), 1, 1);

  // ── Tail lights (red) ──
  const tlX = dir === 1 ? sx : sx+W-3;
  f(ctx, tlX, sy+7,     3, 4, "#dd0000");
  f(ctx, tlX, sy+H-11,  3, 4, "#dd0000");

  // ── STOP SIGN (the iconic deployable arm) ──
  // Always shown on the LEFT side (regardless of direction)
  const stopY = sy + Math.floor(H/2) - 5;
  const stopX = sx + Math.floor(W/2) - 5;
  // Arm
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(Math.floor(stopX-1), Math.floor(stopY+4), 12, 2);
  // Octagonal red sign (8 directional pixels for octagon look)
  ctx.fillStyle = "#cc1010";
  ctx.fillRect(Math.floor(stopX+1), Math.floor(stopY),   8, 10);
  ctx.fillRect(Math.floor(stopX),   Math.floor(stopY+1), 10, 8);
  // White border
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(Math.floor(stopX+2), Math.floor(stopY+1), 6, 1);
  ctx.fillRect(Math.floor(stopX+2), Math.floor(stopY+8), 6, 1);
  ctx.fillRect(Math.floor(stopX+1), Math.floor(stopY+2), 1, 6);
  ctx.fillRect(Math.floor(stopX+8), Math.floor(stopY+2), 1, 6);
  // STOP text (smaller white)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 4px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("STOP", stopX+5, stopY+5);

  // ── "SCHOOL BUS" text on side, below the stripe ──
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 5px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SCHOOL BUS", sx+W/2, sy+H-15);

  // ── Yellow flashing/warning lights on top corners ──
  ctx.fillStyle = "#ff5040";
  ctx.fillRect(Math.floor(sx+8),  Math.floor(sy+2), 3, 2);
  ctx.fillRect(Math.floor(sx+W-11), Math.floor(sy+2), 3, 2);
  ctx.fillStyle = "#ffaa20";
  ctx.fillRect(Math.floor(sx+8),  Math.floor(sy+2), 1, 1);
  ctx.fillRect(Math.floor(sx+W-11), Math.floor(sy+2), 1, 1);

  // Suppress unused col2 warning
  void col2;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Main dispatch
// ─────────────────────────────────────────────────────────────────────────────
type DrawFn = (ctx: Ctx, sx: number, sy: number, c: string, c2: string, d: 1|-1, a: number) => void;

const DRAW_FNS: Record<string, DrawFn> = {
  car:       drawCar,
  bus:       drawBus,
  truck:     drawTruck,
  tricycle:  drawTricycle,
  schoolbus: drawSchoolBus,
};

export function drawVehicle(
  ctx: Ctx,
  v: Vehicle,
  cam: { x: number; y: number }
) {
  const fn = DRAW_FNS[v.type] ?? drawCar;

  if (v.axis === "v") {
    drawVertical(ctx, v, cam, fn);
    return;
  }

  // Horizontal — pos is the FRONT bumper pixel
  // dir=1 (going right): front is right edge → draw origin = pos - size.w
  // dir=-1 (going left): front is left edge  → draw origin = pos
  const size = getVehicleSize(v);
  const sx = v.dir === 1
    ? v.pos - size.w - cam.x
    : v.pos - cam.x;
  const sy = v.lane * TILE_SIZE + TILE_SIZE/2 - cam.y - size.h/2;

  fn(ctx, sx, sy, v.color, v.color2, v.dir, v.wheelAnim);
  drawBrakeLights(ctx, sx, sy, size.w, size.h, v);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Minimap vehicle dots
// ─────────────────────────────────────────────────────────────────────────────
export function drawVehicleOnMinimap(
  ctx: Ctx,
  v: Vehicle,
  mmX: number, mmY: number,
  tW: number, tH: number
) {
  let dotX: number, dotY: number, dw: number, dh: number;

  const lenLookup = (t: string) =>
    t === "schoolbus" ? 84
    : t === "bus"     ? 80
    : t === "truck"   ? 76
    : t === "car"     ? 48
    :                   38;
  const len = lenLookup(v.type);
  // Centre of vehicle in map pixels
  const centerPos = v.dir === 1 ? v.pos - len/2 : v.pos + len/2;

  const longSize = v.type === "schoolbus" ? 8
                 : v.type === "bus"       ? 7
                 : v.type === "truck"     ? 6
                 :                          4;

  if (v.axis === "h") {
    dotX = mmX + (centerPos / TILE_SIZE) * tW;
    dotY = mmY + v.lane * tH;
    dw = longSize;
    dh = 2;
  } else {
    dotX = mmX + v.lane * tW;
    dotY = mmY + (centerPos / TILE_SIZE) * tH;
    dw = 2;
    dh = longSize;
  }

  const col = v.type === "schoolbus" ? "#f8c800"
            : v.type === "bus"       ? "#f0c000"
            : v.type === "truck"     ? "#909090"
            : v.type === "tricycle"  ? "#ff8800"
            : v.color;

  ctx.fillStyle = col;
  ctx.fillRect(Math.floor(dotX - dw/2), Math.floor(dotY - dh/2), dw, dh);
}
