// ─────────────────────────────────────────────────────────────────────────────
//  Unique pixel-art building facades
//  Each function receives (ctx, bx, by, bw, bh, time) and draws the building
//  from scratch – walls, roof, windows, door, signage, decorations.
// ─────────────────────────────────────────────────────────────────────────────

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

function shiftHex(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return `rgb(${clamp((n >> 16) + amt)},${clamp(((n >> 8) & 0xff) + amt)},${clamp((n & 0xff) + amt)})`;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function drawRoof(ctx: Ctx, bx: number, by: number, bw: number, roofColor: string, style: "shingle" | "flat" | "awning" = "shingle") {
  if (style === "awning") return; // handled per-building
  const rDark = shiftHex(roofColor, -30);
  const rLight = shiftHex(roofColor, 25);
  // Back
  px(ctx, bx - 6, by - 4, bw + 12, 16, rDark);
  // Face
  px(ctx, bx - 6, by + 8, bw + 12, 8, roofColor);
  // Shadow underside
  px(ctx, bx - 6, by + 14, bw + 12, 4, "rgba(0,0,0,0.38)");
  // Highlight
  px(ctx, bx - 4, by - 2, bw + 8, 3, rLight);
  // Shingles
  if (style === "shingle") {
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let rx = bx - 4; rx < bx + bw + 4; rx += 11)
      ctx.fillRect(Math.floor(rx), Math.floor(by), 6, 14);
  }
}

function drawShadow(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fillRect(Math.floor(bx + 9), Math.floor(by + 14), Math.ceil(bw + 4), Math.ceil(bh + 6));
}

function drawWall(ctx: Ctx, bx: number, by: number, bw: number, bh: number, wallColor: string, plankLines = true) {
  px(ctx, bx, by + 14, bw, bh - 12, wallColor);
  if (plankLines) {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    for (let wy = by + 20; wy < by + bh - 8; wy += 7)
      ctx.fillRect(Math.floor(bx + 1), Math.floor(wy), Math.ceil(bw - 2), 1);
  }
  // Left shade, right highlight
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(Math.floor(bx), Math.floor(by + 14), 6, Math.ceil(bh - 12));
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(Math.floor(bx + bw - 6), Math.floor(by + 14), 6, Math.ceil(bh - 12));
}

function drawWindow(ctx: Ctx, wx: number, wy: number, ww = 20, wh = 20, glassColor = "#6ab0d8") {
  // Outer frame
  ctx.fillStyle = "#1a0e04";
  ctx.fillRect(Math.floor(wx - 3), Math.floor(wy - 3), ww + 6, wh + 6);
  // Sill
  ctx.fillStyle = "#6a4e28";
  ctx.fillRect(Math.floor(wx - 4), Math.floor(wy + wh), ww + 8, 5);
  // Glass
  px(ctx, wx, wy, ww, wh, glassColor);
  // Cross
  ctx.fillStyle = "#1a0e04";
  ctx.fillRect(Math.floor(wx + ww / 2 - 1), Math.floor(wy), 2, wh);
  ctx.fillRect(Math.floor(wx), Math.floor(wy + wh / 2 - 1), ww, 2);
  // Shine
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(Math.floor(wx + 2), Math.floor(wy + 2), 5, 4);
  ctx.fillRect(Math.floor(wx + ww / 2 + 2), Math.floor(wy + 2), 4, 3);
}

function drawDoor(ctx: Ctx, dx: number, dy: number, dw = 22, dh = 28, color = "#8c6030") {
  // Frame
  ctx.fillStyle = "#180c04";
  ctx.fillRect(Math.floor(dx - 3), Math.floor(dy - 5), dw + 6, dh + 8);
  // Arch
  ctx.fillRect(Math.floor(dx), Math.floor(dy - 8), dw, 9);
  // Body
  px(ctx, dx, dy, dw, dh, color);
  px(ctx, dx + Math.floor(dw / 2), dy, Math.ceil(dw / 2), dh, shiftHex(color, -20));
  // Panels
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(Math.floor(dx + 2), Math.floor(dy + 3), Math.floor(dw / 2) - 3, 9);
  ctx.fillRect(Math.floor(dx + dw / 2 + 1), Math.floor(dy + 3), Math.floor(dw / 2) - 3, 9);
  ctx.fillRect(Math.floor(dx + 2), Math.floor(dy + 15), Math.floor(dw / 2) - 3, 10);
  ctx.fillRect(Math.floor(dx + dw / 2 + 1), Math.floor(dy + 15), Math.floor(dw / 2) - 3, 10);
  // Knob
  ctx.fillStyle = "#f0c000";
  ctx.fillRect(Math.floor(dx + dw - 6), Math.floor(dy + Math.floor(dh / 2)), 4, 4);
  ctx.fillStyle = "#b09000";
  ctx.fillRect(Math.floor(dx + dw - 5), Math.floor(dy + Math.floor(dh / 2) + 1), 2, 2);
}

function drawSignBoard(ctx: Ctx, bx: number, by: number, bw: number, text: string, bgColor = "#c89040") {
  const sw = bw - 12, sh = 18;
  const sx = bx + 6, sy = by + 48;
  // Posts
  ctx.fillStyle = "#6a4820";
  ctx.fillRect(Math.floor(sx + 5), Math.floor(sy - 10), 4, 12);
  ctx.fillRect(Math.floor(sx + sw - 9), Math.floor(sy - 10), 4, 12);
  // Board frame
  ctx.fillStyle = "#180c04";
  ctx.fillRect(Math.floor(sx - 2), Math.floor(sy - 2), sw + 4, sh + 4);
  // Board fill
  px(ctx, sx, sy, sw, sh, bgColor);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(Math.floor(sx + 1), Math.floor(sy + 1), sw - 2, 3);
  // Text
  ctx.fillStyle = "#180800";
  const fs = Math.max(8, Math.min(11, Math.floor(sw / (text.length * 0.62))));
  ctx.font = `bold ${fs}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, Math.floor(bx + bw / 2), Math.floor(sy + sh / 2));
}

function drawInteractHint(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("[E]", Math.floor(bx + bw / 2), Math.floor(by + bh + 18));
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: ABOUT ME  –  Cozy wooden welcome inn / cabin
// ─────────────────────────────────────────────────────────────────────────────
export function drawAboutBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  px(ctx, bx - 2, by + bh - 8, bw + 4, 12, "#6a5a48");
  ctx.fillStyle = "#5a4a38";
  for (let fx = bx; fx < bx + bw; fx += 14)
    ctx.fillRect(Math.floor(fx), Math.floor(by + bh - 8), 11, 5);
  for (let fx = bx + 7; fx < bx + bw; fx += 14)
    ctx.fillRect(Math.floor(fx), Math.floor(by + bh - 4), 11, 4);

  // Log walls (warm brown)
  drawWall(ctx, bx, by, bw, bh, "#9c7038", false);
  // Log lines
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  for (let wy = by + 16; wy < by + bh - 8; wy += 6)
    ctx.fillRect(Math.floor(bx + 1), Math.floor(wy), Math.ceil(bw - 2), 2);
  // Log end knots
  ctx.fillStyle = "#7a5428";
  ctx.fillRect(Math.floor(bx + 1), Math.floor(by + 16), 4, bh - 24);
  ctx.fillRect(Math.floor(bx + bw - 5), Math.floor(by + 16), 4, bh - 24);

  // Roof (dark red/brown shingle)
  drawRoof(ctx, bx, by, bw, "#7a3c14");
  // Chimney
  px(ctx, bx + bw - 22, by - 18, 14, 20, "#6a4a38");
  px(ctx, bx + bw - 24, by - 20, 18, 5, "#4a2a18");
  // Smoke puffs
  ctx.fillStyle = "rgba(200,200,200,0.35)";
  ctx.fillRect(Math.floor(bx + bw - 18), Math.floor(by - 28), 6, 6);
  ctx.fillRect(Math.floor(bx + bw - 16), Math.floor(by - 34), 5, 5);
  ctx.fillRect(Math.floor(bx + bw - 14), Math.floor(by - 39), 4, 4);

  // Windows (warm yellow glass = light inside)
  drawWindow(ctx, bx + 8, by + 22, 20, 18, "#f8d060");
  if (bw > 128) drawWindow(ctx, bx + bw - 32, by + 22, 20, 18, "#f8d060");

  // Flower boxes under windows
  px(ctx, bx + 5, by + 41, 26, 6, "#5a3818");
  ctx.fillStyle = "#e02858"; ctx.fillRect(bx + 7, by + 39, 4, 4);
  ctx.fillStyle = "#f8d000"; ctx.fillRect(bx + 13, by + 38, 4, 5);
  ctx.fillStyle = "#e02858"; ctx.fillRect(bx + 20, by + 39, 4, 4);
  ctx.fillStyle = "#50c840"; ctx.fillRect(bx + 26, by + 40, 4, 3);

  // Door (arched wood)
  const dx2 = bx + Math.floor(bw / 2) - 11;
  const dy2 = by + bh - 30;
  drawDoor(ctx, dx2, dy2, 22, 28, "#8c6030");

  // "WELCOME" wooden arch sign above door
  px(ctx, dx2 - 6, dy2 - 16, 34, 13, "#7a5028");
  ctx.fillStyle = "#f0d060";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WELCOME", Math.floor(bx + bw / 2), Math.floor(dy2 - 10));

  // Lantern beside door
  px(ctx, dx2 - 12, dy2 - 2, 6, 10, "#8a7828");
  px(ctx, dx2 - 11, by + bh - 34, 4, 2, "#6a5818");
  ctx.fillStyle = "rgba(255,220,80,0.7)";
  ctx.fillRect(Math.floor(dx2 - 11), Math.floor(dy2), 4, 8);

  drawSignBoard(ctx, bx, by, bw, "ABOUT ME", "#c89040");
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: COFFEE SHOP  –  Cute café with striped awning & outdoor seating
// ─────────────────────────────────────────────────────────────────────────────
export function drawCoffeeBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number, time: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Wall – warm cream/tan
  drawWall(ctx, bx, by, bw, bh, "#c8a870", true);

  // Brick pattern on lower half
  ctx.fillStyle = "#a88050";
  for (let wy = by + bh - 30; wy < by + bh - 8; wy += 7) {
    for (let wx2 = bx + (Math.floor((wy - by) / 7) % 2 === 0 ? 0 : 8); wx2 < bx + bw; wx2 += 16)
      ctx.fillRect(Math.floor(wx2 + 1), Math.floor(wy), 14, 5);
  }

  // Roof – flat with terracotta tiles
  px(ctx, bx - 6, by - 4, bw + 12, 18, "#b84820");
  px(ctx, bx - 6, by + 10, bw + 12, 7, "#d05828");
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(Math.floor(bx - 6), Math.floor(by + 15), bw + 12, 4);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(Math.floor(bx - 4), Math.floor(by - 2), bw + 8, 3);
  // Tile marks
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let rx = bx - 4; rx < bx + bw + 4; rx += 12)
    ctx.fillRect(Math.floor(rx), Math.floor(by), 7, 16);

  // ── Striped awning ──
  const aw = bw + 14, ah = 18, ax = bx - 7, ay = by + 18;
  // Stripes (red & white)
  for (let s = 0; s < Math.ceil(aw / 8); s++) {
    ctx.fillStyle = s % 2 === 0 ? "#e03020" : "#f8f0e0";
    ctx.fillRect(Math.floor(ax + s * 8), Math.floor(ay), 8, ah);
  }
  // Awning clip top & bottom borders
  ctx.fillStyle = "#b82010";
  ctx.fillRect(Math.floor(ax), Math.floor(ay), aw, 3);
  ctx.fillStyle = "#d03020";
  ctx.fillRect(Math.floor(ax), Math.floor(ay + ah - 3), aw, 3);
  // Awning fringe
  for (let f = ax; f < ax + aw - 6; f += 7) {
    ctx.fillStyle = "#e03020";
    ctx.fillRect(Math.floor(f), Math.floor(ay + ah), 5, 6);
    ctx.fillStyle = "#f8f0e0";
    ctx.fillRect(Math.floor(f + 2), Math.floor(ay + ah), 2, 4);
  }

  // Windows (large café glass)
  drawWindow(ctx, bx + 6, by + 38, bw / 2 - 10, 22, "#a8d0e8");
  drawWindow(ctx, bx + bw / 2 + 4, by + 38, bw / 2 - 10, 22, "#a8d0e8");

  // Coffee cup sticker on window
  ctx.fillStyle = "#5a3010";
  ctx.font = "bold 14px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("☕", Math.floor(bx + bw * 0.27), Math.floor(by + 49));
  ctx.fillText("☕", Math.floor(bx + bw * 0.73), Math.floor(by + 49));

  // Door
  const cdx = bx + Math.floor(bw / 2) - 11;
  const cdy = by + bh - 32;
  drawDoor(ctx, cdx, cdy, 22, 30, "#7a4818");
  // Glass on door
  px(ctx, cdx + 3, cdy + 3, 16, 14, "#a8d0e8");
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(Math.floor(cdx + 5), Math.floor(cdy + 5), 5, 6);

  // Outdoor bench / table
  px(ctx, bx + bw - 20, by + bh - 6, 18, 4, "#9a7848");
  px(ctx, bx + bw - 18, by + bh - 14, 4, 8, "#7a5838");
  px(ctx, bx + bw - 8, by + bh - 14, 4, 8, "#7a5838");
  // Coffee cup on table
  ctx.font = "10px serif";
  ctx.textAlign = "center";
  ctx.fillText("☕", Math.floor(bx + bw - 11), Math.floor(by + bh - 8));

  // Steam animation
  const steamA = 0.5 + Math.sin(time * 3) * 0.3;
  ctx.fillStyle = `rgba(220,220,220,${steamA})`;
  ctx.fillRect(Math.floor(bx + bw - 12), Math.floor(by + bh - 20), 2, 4);
  ctx.fillRect(Math.floor(bx + bw - 10), Math.floor(by + bh - 22), 2, 3);

  // Hanging sign
  px(ctx, bx + 4, by + 16, bw - 8, 16, "#6a3010");
  ctx.fillStyle = "#f0c050";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("COFFEE SHOP", Math.floor(bx + bw / 2), Math.floor(by + 24));
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: GEAR SHOP / TECH SKILLS  –  Mechanic/workshop with metal shutters
// ─────────────────────────────────────────────────────────────────────────────
export function drawGearBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number, time: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Concrete/metal wall
  drawWall(ctx, bx, by, bw, bh, "#4a5a5a", false);
  // Metal panel seams
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  for (let wy = by + 16; wy < by + bh; wy += 20)
    ctx.fillRect(Math.floor(bx), Math.floor(wy), Math.ceil(bw), 2);
  for (let wx2 = bx + Math.floor(bw / 3); wx2 < bx + bw; wx2 += Math.floor(bw / 3))
    ctx.fillRect(Math.floor(wx2), Math.floor(by + 14), 2, Math.ceil(bh - 12));

  // Corrugated metal roof
  px(ctx, bx - 6, by - 4, bw + 12, 20, "#3a4a4a");
  ctx.fillStyle = "#4a5a5a";
  for (let rx = bx - 4; rx < bx + bw + 4; rx += 8)
    ctx.fillRect(Math.floor(rx), Math.floor(by - 2), 5, 18);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(Math.floor(bx - 4), Math.floor(by - 2), bw + 8, 3);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(Math.floor(bx - 6), Math.floor(by + 14), bw + 12, 4);

  // Large roller/garage door (main feature)
  const gx = bx + 4, gy = by + bh - 50, gw = bw - 8, gh = 38;
  px(ctx, gx - 2, gy - 2, gw + 4, gh + 4, "#2a3030");
  px(ctx, gx, gy, gw, gh, "#5a6868");
  // Shutter stripes
  ctx.fillStyle = "#4a5858";
  for (let shy = gy + 4; shy < gy + gh; shy += 8)
    ctx.fillRect(Math.floor(gx + 1), Math.floor(shy), Math.ceil(gw - 2), 5);
  // Handle bar
  px(ctx, gx + gw / 2 - 15, gy + gh - 8, 30, 5, "#7a8888");
  px(ctx, gx + gw / 2 - 10, gy + gh - 10, 20, 3, "#9aacac");
  // Bolt corners
  ctx.fillStyle = "#a0b0b0";
  for (const [bx2, by2] of [[gx+3,gy+3],[gx+gw-7,gy+3],[gx+3,gy+gh-7],[gx+gw-7,gy+gh-7]])
    ctx.fillRect(Math.floor(bx2), Math.floor(by2), 4, 4);

  // Small side window
  drawWindow(ctx, bx + bw - 34, by + 20, 26, 18, "#88b8a8");

  // Oil drum outside
  px(ctx, bx - 14, by + bh - 30, 12, 26, "#4a6070");
  px(ctx, bx - 14, by + bh - 32, 12, 5, "#5a7080");
  px(ctx, bx - 14, by + bh - 22, 12, 3, "#3a5060");
  ctx.fillStyle = "#e03020"; // hazard mark
  ctx.fillRect(Math.floor(bx - 13), Math.floor(by + bh - 18), 10, 5);

  // Gear/wrench icon sign
  const spinAngle = time * 0.8;
  ctx.save();
  ctx.translate(Math.floor(bx + bw - 16), Math.floor(by + 28));
  ctx.rotate(spinAngle);
  ctx.fillStyle = "#f0c000";
  ctx.fillRect(-8, -2, 16, 4);
  ctx.fillRect(-2, -8, 4, 16);
  ctx.restore();

  // Sign
  const sw2 = bw - 8;
  px(ctx, bx + 4, by + 14, sw2, 18, "#2a3838");
  ctx.fillStyle = "#f0c000";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⚙ GEAR SHOP ⚙", Math.floor(bx + bw / 2), Math.floor(by + 23));

  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: CV / WORK  –  Office building with glass facade
// ─────────────────────────────────────────────────────────────────────────────
export function drawCVBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Concrete wall
  drawWall(ctx, bx, by, bw, bh, "#58687a", false);
  // Horizontal floor lines
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  for (let wy = by + 16; wy < by + bh; wy += 18)
    ctx.fillRect(Math.floor(bx), Math.floor(wy), Math.ceil(bw), 2);

  // Glass facade panel in center
  const gfx = bx + 8, gfy = by + 16, gfw = bw - 16;
  px(ctx, gfx, gfy, gfw, bh - 28, "#3a6080");
  ctx.fillStyle = "rgba(180,220,255,0.12)";
  ctx.fillRect(Math.floor(gfx + 2), Math.floor(gfy + 2), Math.ceil(gfw - 4), Math.ceil(bh - 32));
  // Window grid
  ctx.fillStyle = "#4a5868";
  for (let wy = gfy + 12; wy < gfy + bh - 28; wy += 14)
    ctx.fillRect(Math.floor(gfx), Math.floor(wy), Math.ceil(gfw), 2);
  for (let wx2 = gfx + Math.floor(gfw / 3); wx2 < gfx + gfw; wx2 += Math.floor(gfw / 3))
    ctx.fillRect(Math.floor(wx2), Math.floor(gfy), 2, Math.ceil(bh - 28));
  // Reflections
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(Math.floor(gfx + 4), Math.floor(gfy + 4), 8, bh - 34);
  ctx.fillRect(Math.floor(gfx + gfw - 14), Math.floor(gfy + 10), 6, bh - 40);

  // Flat modern roof
  px(ctx, bx - 6, by - 4, bw + 12, 20, "#3a4858");
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(Math.floor(bx - 4), Math.floor(by - 2), bw + 8, 3);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(Math.floor(bx - 6), Math.floor(by + 14), bw + 12, 4);
  // AC units on roof
  px(ctx, bx + 6, by - 10, 16, 9, "#4a5868");
  px(ctx, bx + bw - 22, by - 10, 16, 9, "#4a5868");
  ctx.fillStyle = "#2a3848";
  ctx.fillRect(Math.floor(bx + 8), Math.floor(by - 8), 12, 5);
  ctx.fillRect(Math.floor(bx + bw - 20), Math.floor(by - 8), 12, 5);

  // Double glass door
  const ddx = bx + Math.floor(bw / 2) - 16;
  const ddy = by + bh - 34;
  px(ctx, ddx - 3, ddy - 5, 35, 38, "#2a3848");
  px(ctx, ddx, ddy, 15, 32, "#5090b8");
  px(ctx, ddx + 17, ddy, 15, 32, "#5090b8");
  // Door handles
  ctx.fillStyle = "#d0c000";
  ctx.fillRect(Math.floor(ddx + 12), Math.floor(ddy + 14), 3, 6);
  ctx.fillRect(Math.floor(ddx + 17), Math.floor(ddy + 14), 3, 6);
  // Glass shine
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillRect(Math.floor(ddx + 2), Math.floor(ddy + 2), 4, 10);
  ctx.fillRect(Math.floor(ddx + 19), Math.floor(ddy + 2), 4, 10);

  // "WORK" sign
  px(ctx, bx + 6, by + 14, bw - 12, 16, "#1e2a38");
  ctx.fillStyle = "#80c0f0";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EXPERIENCE", Math.floor(bx + bw / 2), Math.floor(by + 22));

  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: CONTACT  –  Post office / Mail building with mailbox
// ─────────────────────────────────────────────────────────────────────────────
export function drawContactBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number, time: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Wall – white/cream
  drawWall(ctx, bx, by, bw, bh, "#d8c8a8", false);
  // Stone blocks
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  for (let wy = by + 16; wy < by + bh - 8; wy += 14) {
    const offset = Math.floor((wy - by) / 14) % 2 === 0 ? 0 : 18;
    for (let wx2 = bx + offset; wx2 < bx + bw; wx2 += 36)
      ctx.fillRect(Math.floor(wx2 + 1), Math.floor(wy + 1), 34, 11);
  }

  // Roof – purple/mauve
  drawRoof(ctx, bx, by, bw, "#7030a0");
  // Roof finial (star on top)
  ctx.fillStyle = "#f0c000";
  ctx.font = "12px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✉", Math.floor(bx + bw / 2), Math.floor(by - 6));

  // Windows (arched style)
  const winY = by + 22;
  for (let wi = 0; wi < 2; wi++) {
    const wx2 = bx + 8 + wi * (bw / 2 - 4);
    // Arch frame
    ctx.fillStyle = "#4a1a6a";
    ctx.fillRect(Math.floor(wx2 - 3), Math.floor(winY - 6), 26, 30);
    // Arch top
    ctx.fillRect(Math.floor(wx2 + 5), Math.floor(winY - 10), 12, 8);
    // Glass
    px(ctx, wx2, winY, 20, 22, "#b088d8");
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillRect(Math.floor(wx2 + 2), Math.floor(winY + 2), 5, 8);
  }

  // Large MAIL sign
  px(ctx, bx + 6, by + 46, bw - 12, 20, "#5a1a7a");
  // Envelope icon
  ctx.fillStyle = "#f8f0e0";
  ctx.font = "bold 14px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✉  MAIL", Math.floor(bx + bw / 2), Math.floor(by + 56));

  // Door
  const pdx = bx + Math.floor(bw / 2) - 11;
  const pdy = by + bh - 32;
  drawDoor(ctx, pdx, pdy, 22, 30, "#5a1a7a");

  // Mailbox on side
  px(ctx, bx + bw + 2, by + bh - 26, 10, 18, "#c02020");
  px(ctx, bx + bw + 1, by + bh - 28, 12, 6, "#e03030");
  // Slot
  ctx.fillStyle = "#800000";
  ctx.fillRect(Math.floor(bx + bw + 3), Math.floor(by + bh - 22), 6, 3);
  // Flag
  ctx.fillStyle = "#e03020";
  const flagY = Math.floor(by + bh - 30 + Math.sin(time * 1.5) * 2);
  ctx.fillRect(Math.floor(bx + bw + 10), Math.floor(flagY), 8, 6);
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(Math.floor(bx + bw + 10), Math.floor(flagY), 2, 10);

  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: PROJECTS  –  Workshop / Forge with tools hanging outside
// ─────────────────────────────────────────────────────────────────────────────
export function drawProjectsBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Brick wall
  drawWall(ctx, bx, by, bw, bh, "#8a5838", false);
  // Brick pattern
  ctx.fillStyle = "#7a4828";
  for (let wy = by + 16; wy < by + bh - 8; wy += 8) {
    const off = Math.floor((wy - by - 16) / 8) % 2 === 0 ? 0 : 10;
    for (let wx2 = bx + off; wx2 < bx + bw; wx2 += 20)
      ctx.fillRect(Math.floor(wx2 + 1), Math.floor(wy + 1), 18, 6);
  }
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(Math.floor(bx), Math.floor(by + 14), 6, bh - 22);

  // Dark tile roof
  drawRoof(ctx, bx, by, bw, "#4a2808");
  // Chimney with sparks
  px(ctx, bx + 10, by - 20, 12, 22, "#6a4028");
  px(ctx, bx + 8, by - 22, 16, 5, "#3a2018");
  ctx.fillStyle = "#ff6020";
  ctx.fillRect(Math.floor(bx + 13), Math.floor(by - 30), 2, 6);
  ctx.fillStyle = "#ff4000";
  ctx.fillRect(Math.floor(bx + 17), Math.floor(by - 28), 1, 4);
  ctx.fillRect(Math.floor(bx + 11), Math.floor(by - 26), 1, 3);

  // Forge/anvil window (glowing)
  drawWindow(ctx, bx + 6, by + 24, 24, 20, "#f08020");
  // Orange glow
  ctx.fillStyle = "rgba(255,120,30,0.25)";
  ctx.fillRect(Math.floor(bx), Math.floor(by + 20), bw, bh - 30);

  // Tools hanging on wall
  // Hammer
  ctx.fillStyle = "#6a6a6a";
  ctx.fillRect(Math.floor(bx + bw + 2), Math.floor(by + 30), 4, 22);
  ctx.fillStyle = "#8a8a8a";
  ctx.fillRect(Math.floor(bx + bw), Math.floor(by + 28), 8, 8);
  // Wrench
  ctx.fillStyle = "#909090";
  ctx.fillRect(Math.floor(bx + bw + 8), Math.floor(by + 38), 3, 18);
  ctx.fillRect(Math.floor(bx + bw + 6), Math.floor(by + 36), 7, 5);
  ctx.fillRect(Math.floor(bx + bw + 6), Math.floor(by + 50), 7, 5);

  // Wide door (workshop entrance)
  const pjdx = bx + Math.floor(bw / 2) - 16;
  const pjdy = by + bh - 38;
  px(ctx, pjdx - 3, pjdy - 3, 35, 42, "#2a1808");
  px(ctx, pjdx, pjdy, 32, 38, "#5a3820");
  // Split door line
  ctx.fillStyle = "#2a1808";
  ctx.fillRect(Math.floor(pjdx + 14), Math.floor(pjdy), 3, 38);
  // Door handles
  ctx.fillStyle = "#c0a020";
  ctx.fillRect(Math.floor(pjdx + 9), Math.floor(pjdy + 16), 4, 7);
  ctx.fillRect(Math.floor(pjdx + 18), Math.floor(pjdy + 16), 4, 7);

  // "WORKSHOP" sign  
  px(ctx, bx + 4, by + 14, bw - 8, 18, "#2a1808");
  ctx.fillStyle = "#f09030";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WORKSHOP", Math.floor(bx + bw / 2), Math.floor(by + 23));

  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: MEMO  –  Notice board / Town Hall with bulletin board outside
// ─────────────────────────────────────────────────────────────────────────────
export function drawMemoBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Blue-grey wall (town hall style)
  drawWall(ctx, bx, by, bw, bh, "#5a5880", false);
  // Column details
  const colW = 8;
  for (const cx of [bx + 6, bx + bw - 14]) {
    px(ctx, cx, by + 14, colW, bh - 20, "#6a68a0");
    px(ctx, cx + 1, by + 14, 2, bh - 20, "rgba(255,255,255,0.1)");
    px(ctx, cx, by + 14, colW, 6, "#7a78b0");
    px(ctx, cx, by + bh - 12, colW, 6, "#4a4870");
  }

  // Grand roof / pediment
  px(ctx, bx - 6, by - 4, bw + 12, 20, "#3a3858");
  px(ctx, bx - 6, by + 12, bw + 12, 6, "#4a4870");
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(Math.floor(bx - 6), Math.floor(by + 16), bw + 12, 4);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(Math.floor(bx - 4), Math.floor(by - 2), bw + 8, 3);
  // Pediment triangle
  ctx.fillStyle = "#4a4870";
  ctx.beginPath();
  ctx.moveTo(bx + bw / 2, by - 14);
  ctx.lineTo(bx + bw + 6, by - 4);
  ctx.lineTo(bx - 6, by - 4);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.moveTo(bx + bw / 2, by - 12);
  ctx.lineTo(bx + bw + 4, by - 4);
  ctx.lineTo(bx - 4, by - 4);
  ctx.fill();
  // Clock / star on pediment
  ctx.fillStyle = "#f0d050";
  ctx.font = "11px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★", Math.floor(bx + bw / 2), Math.floor(by - 7));

  // Windows
  drawWindow(ctx, bx + 10, by + 24, 22, 20, "#a0a8e0");
  drawWindow(ctx, bx + bw - 32, by + 24, 22, 20, "#a0a8e0");

  // Arched door
  const mdx = bx + Math.floor(bw / 2) - 12;
  const mdy = by + bh - 34;
  drawDoor(ctx, mdx, mdy, 24, 32, "#3a3858");

  // Bulletin board outside building
  px(ctx, bx + bw + 2, by + bh - 50, 28, 36, "#7a5828");
  px(ctx, bx + bw + 4, by + bh - 48, 24, 32, "#c8a040");
  // Pinned notes
  ctx.fillStyle = "#f8f0d0";
  ctx.fillRect(Math.floor(bx + bw + 6), Math.floor(by + bh - 46), 9, 12);
  ctx.fillRect(Math.floor(bx + bw + 17), Math.floor(by + bh - 44), 8, 10);
  ctx.fillRect(Math.floor(bx + bw + 8), Math.floor(by + bh - 32), 10, 12);
  // Pins
  ctx.fillStyle = "#e02020";
  ctx.fillRect(Math.floor(bx + bw + 10), Math.floor(by + bh - 47), 2, 2);
  ctx.fillRect(Math.floor(bx + bw + 20), Math.floor(by + bh - 45), 2, 2);
  ctx.fillRect(Math.floor(bx + bw + 12), Math.floor(by + bh - 33), 2, 2);
  // Board pole
  px(ctx, bx + bw + 14, by + bh - 14, 4, 14, "#5a4018");

  // NOTICE sign
  px(ctx, bx + 6, by + 14, bw - 12, 18, "#2a2840");
  ctx.fillStyle = "#a0a8f8";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("MEMO BOARD", Math.floor(bx + bw / 2), Math.floor(by + 23));

  drawInteractHint(ctx, bx, by, bw, bh);
}
