// ─────────────────────────────────────────────────────────────────────────────
//  Stardew Valley-style 2D pixel-art building facades
//  Each function receives (ctx, bx, by, bw, bh, time) and draws the building
//  from scratch – walls, roof, windows, door, signage, decorations.
//  Every building features the signature Stardew look:
//    - Pitched triangular shingled roof with individual visible shingles
//    - Stone foundation block
//    - Wood plank or stone block walls with visible grain/outline
//    - Window frames with sky reflection + lit interior
//    - Door with hinges, handles, panels, brass knob
//    - Hanging sign with chains
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

// ─────────────────────────────────────────────────────────────────────────────
//  Shared helpers — Stardew-style building components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pitched triangular shingled roof — Stardew's signature look.
 * Draws a peak in the center with shingles cascading down on both sides.
 * Includes visible individual shingle tiles, dark outline, ridge cap.
 */
function drawPitchedRoof(
  ctx: Ctx,
  bx: number,
  by: number,
  bw: number,
  roofColor: string,
  peakHeight = 22
) {
  const rDark = shiftHex(roofColor, -35);
  const rDarker = shiftHex(roofColor, -55);
  const rLight = shiftHex(roofColor, 18);
  const rLighter = shiftHex(roofColor, 35);

  const cx = bx + Math.floor(bw / 2);
  const peakY = by - peakHeight;
  const baseY = by + 12;
  const overhang = 6;
  const leftX = bx - overhang;
  const rightX = bx + bw + overhang;

  // ── Base eaves shadow (subtle ground line) ──
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(Math.floor(leftX - 2), Math.floor(baseY + 2), bw + overhang * 2 + 4, 3);

  // ── Build the triangular roof row by row, drawing pixel shingles ──
  const totalRows = baseY - peakY;
  for (let row = 0; row < totalRows; row++) {
    const y = peakY + row;
    const t = row / totalRows;
    // Roof width grows from peak (4px) to full width
    const rowWidthLeft = Math.floor((cx - leftX) * t) + 2;
    const rowWidthRight = Math.floor((rightX - cx) * t) + 2;
    const rowX = cx - rowWidthLeft;
    const rowW = rowWidthLeft + rowWidthRight;

    // Pick shingle color band based on row (darker at top, base color middle, slight light at bottom)
    let band: string;
    if (row < 3) band = rDarker;
    else if (row < totalRows - 4) {
      // Alternating shingle rows for texture
      band = (Math.floor(row / 2) % 2 === 0) ? roofColor : rDark;
    } else {
      band = roofColor;
    }
    px(ctx, rowX, y, rowW, 1, band);

    // Highlight on top edge of roof (sunlit)
    if (row === 0 || row === 1) {
      px(ctx, rowX, y, rowW, 1, rLighter);
    }
    // Subtle highlight strip
    if (row === 2) {
      px(ctx, rowX + 2, y, rowW - 4, 1, rLight);
    }
  }

  // ── Individual shingle tiles (vertical seam lines) ──
  ctx.fillStyle = rDarker;
  const shingleW = 8;
  for (let row = 4; row < totalRows - 2; row += 4) {
    const y = peakY + row;
    const t = row / totalRows;
    const rowWidthLeft = Math.floor((cx - leftX) * t) + 2;
    const rowWidthRight = Math.floor((rightX - cx) * t) + 2;
    const rowX = cx - rowWidthLeft;
    const rowW = rowWidthLeft + rowWidthRight;
    // Stagger shingle seams
    const offset = (Math.floor(row / 4) % 2 === 0) ? 0 : shingleW / 2;
    for (let sx = rowX + offset; sx < rowX + rowW; sx += shingleW) {
      ctx.fillRect(Math.floor(sx), Math.floor(y), 1, 3);
    }
  }

  // ── Roof edge dark outline (left and right slopes) ──
  ctx.fillStyle = rDarker;
  for (let row = 0; row < totalRows; row++) {
    const y = peakY + row;
    const t = row / totalRows;
    const rowWidthLeft = Math.floor((cx - leftX) * t) + 2;
    const rowWidthRight = Math.floor((rightX - cx) * t) + 2;
    ctx.fillRect(Math.floor(cx - rowWidthLeft), Math.floor(y), 2, 1);
    ctx.fillRect(Math.floor(cx + rowWidthRight - 2), Math.floor(y), 2, 1);
  }

  // ── Roof peak ridge cap ──
  ctx.fillStyle = rDarker;
  ctx.fillRect(Math.floor(cx - 3), Math.floor(peakY), 6, 4);
  ctx.fillStyle = rLighter;
  ctx.fillRect(Math.floor(cx - 2), Math.floor(peakY + 1), 4, 1);

  // ── Bottom roof edge (eave shadow) ──
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(Math.floor(leftX), Math.floor(baseY), bw + overhang * 2, 2);
  ctx.fillStyle = rDarker;
  ctx.fillRect(Math.floor(leftX), Math.floor(baseY + 2), bw + overhang * 2, 2);
}

/**
 * Stone foundation — visible block pattern at the bottom of the wall.
 */
function drawStoneFoundation(
  ctx: Ctx,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  baseColor = "#8a7c68"
) {
  const fy = by + bh - 12;
  const fh = 14;
  const dark = shiftHex(baseColor, -30);
  const light = shiftHex(baseColor, 20);

  // Base
  px(ctx, bx - 2, fy, bw + 4, fh, baseColor);
  // Dark outline at very bottom
  px(ctx, bx - 2, fy + fh - 2, bw + 4, 2, dark);

  // Stone blocks (irregular, offset rows)
  ctx.fillStyle = dark;
  const blockW = 12;
  // Top row of blocks
  for (let sx = bx; sx < bx + bw; sx += blockW) {
    ctx.fillRect(Math.floor(sx), Math.floor(fy + 6), 1, 6);
  }
  // Bottom row offset
  for (let sx = bx + blockW / 2; sx < bx + bw; sx += blockW) {
    ctx.fillRect(Math.floor(sx), Math.floor(fy + 12), 1, 2);
  }
  // Horizontal mortar lines
  ctx.fillStyle = dark;
  ctx.fillRect(Math.floor(bx - 2), Math.floor(fy + 6), bw + 4, 1);
  // Stone highlights (top of each block, sunlit)
  ctx.fillStyle = light;
  for (let sx = bx; sx < bx + bw; sx += blockW) {
    ctx.fillRect(Math.floor(sx + 1), Math.floor(fy + 1), Math.min(4, bw - (sx - bx) - 2), 1);
  }
  for (let sx = bx + blockW / 2; sx < bx + bw; sx += blockW) {
    ctx.fillRect(Math.floor(sx + 1), Math.floor(fy + 7), Math.min(4, bw - (sx - bx) - 2), 1);
  }
}

/**
 * Wooden plank wall — Stardew's signature horizontal wood plank pattern.
 */
function drawPlankWall(
  ctx: Ctx,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  wallColor: string
) {
  const wallTop = by + 12;
  const wallBottom = by + bh - 12;
  const wallH = wallBottom - wallTop;
  const dark = shiftHex(wallColor, -25);
  const darker = shiftHex(wallColor, -45);
  const light = shiftHex(wallColor, 15);

  // Base wall
  px(ctx, bx, wallTop, bw, wallH, wallColor);
  // Dark outline left/right edges
  px(ctx, bx, wallTop, 2, wallH, darker);
  px(ctx, bx + bw - 2, wallTop, 2, wallH, darker);

  // Horizontal plank lines
  const plankH = 8;
  for (let py = wallTop + plankH; py < wallBottom; py += plankH) {
    // Plank shadow line
    ctx.fillStyle = darker;
    ctx.fillRect(Math.floor(bx + 2), Math.floor(py), bw - 4, 1);
    // Plank highlight (top of next plank)
    ctx.fillStyle = light;
    ctx.fillRect(Math.floor(bx + 2), Math.floor(py + 1), bw - 4, 1);
  }

  // Vertical plank seams (random for wood-grain feel)
  ctx.fillStyle = dark;
  const seams = [bw * 0.25, bw * 0.55, bw * 0.78];
  for (let py = wallTop; py < wallBottom; py += plankH) {
    const seamX = bx + seams[Math.floor(py / plankH) % 3];
    ctx.fillRect(Math.floor(seamX), Math.floor(py + 1), 1, plankH - 1);
  }

  // Wood grain knots (small dark specks)
  ctx.fillStyle = darker;
  ctx.fillRect(Math.floor(bx + bw * 0.3), Math.floor(wallTop + 4), 2, 1);
  ctx.fillRect(Math.floor(bx + bw * 0.7), Math.floor(wallTop + 18), 2, 1);
  ctx.fillRect(Math.floor(bx + bw * 0.4), Math.floor(wallTop + wallH - 8), 2, 1);

  // Subtle right-side shadow (depth)
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(Math.floor(bx + bw - 6), Math.floor(wallTop), 4, wallH);
}

/**
 * Stone block wall — for stone-style buildings.
 */
function drawStoneWall(
  ctx: Ctx,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  baseColor: string
) {
  const wallTop = by + 12;
  const wallBottom = by + bh - 12;
  const wallH = wallBottom - wallTop;
  const dark = shiftHex(baseColor, -30);
  const darker = shiftHex(baseColor, -50);
  const light = shiftHex(baseColor, 20);

  // Base
  px(ctx, bx, wallTop, bw, wallH, baseColor);
  // Dark edges
  px(ctx, bx, wallTop, 2, wallH, darker);
  px(ctx, bx + bw - 2, wallTop, 2, wallH, darker);

  // Stone blocks (4 rows, offset)
  const blockH = 10;
  const blockW = 18;
  ctx.fillStyle = dark;
  for (let row = 0; row * blockH < wallH; row++) {
    const py = wallTop + row * blockH;
    // Horizontal mortar
    ctx.fillRect(Math.floor(bx + 2), Math.floor(py + blockH - 1), bw - 4, 1);
    // Vertical mortar (offset)
    const offset = row % 2 === 0 ? 0 : blockW / 2;
    for (let sx = bx + offset; sx < bx + bw; sx += blockW) {
      if (sx > bx + 2 && sx < bx + bw - 2) {
        ctx.fillRect(Math.floor(sx), Math.floor(py), 1, blockH - 1);
      }
    }
  }

  // Highlights on top of blocks
  ctx.fillStyle = light;
  for (let row = 0; row * blockH < wallH; row++) {
    const py = wallTop + row * blockH;
    const offset = row % 2 === 0 ? 0 : blockW / 2;
    for (let sx = bx + offset; sx < bx + bw; sx += blockW) {
      ctx.fillRect(Math.floor(sx + 1), Math.floor(py), Math.min(blockW - 2, bx + bw - sx - 3), 1);
    }
  }
}

/**
 * Stardew window — wooden frame, blue glass with sky reflection, sill.
 */
function drawWindow(
  ctx: Ctx,
  wx: number,
  wy: number,
  ww = 20,
  wh = 20,
  glassColor = "#7ec8e8",
  lit = false
) {
  const frameDark = "#2a1808";
  const frameWood = "#6a4828";
  const frameLight = "#8a6840";
  const sill = "#5a3818";

  // Outer dark frame
  px(ctx, wx - 3, wy - 3, ww + 6, wh + 6, frameDark);
  // Inner wooden frame
  px(ctx, wx - 2, wy - 2, ww + 4, wh + 4, frameWood);
  // Frame highlight (top)
  px(ctx, wx - 2, wy - 2, ww + 4, 1, frameLight);
  // Frame shadow (bottom)
  px(ctx, wx - 2, wy + wh + 1, ww + 4, 1, frameDark);

  // Window sill (extended ledge)
  px(ctx, wx - 5, wy + wh + 2, ww + 10, 4, sill);
  px(ctx, wx - 5, wy + wh + 2, ww + 10, 1, frameLight);
  px(ctx, wx - 5, wy + wh + 5, ww + 10, 1, frameDark);

  // Glass — lit (warm yellow) or sky reflection (light blue)
  if (lit) {
    px(ctx, wx, wy, ww, wh, "#f8d860");
    // Inner warm glow gradient
    px(ctx, wx, wy, ww, Math.floor(wh / 2), "#fae888");
    px(ctx, wx + 1, wy + 1, ww - 2, 2, "#fff8c0");
  } else {
    px(ctx, wx, wy, ww, wh, glassColor);
    // Sky gradient
    px(ctx, wx, wy, ww, Math.floor(wh / 3), shiftHex(glassColor, 25));
    // Darker bottom (glass thickness)
    px(ctx, wx, wy + wh - 2, ww, 2, shiftHex(glassColor, -30));
  }

  // Cross dividers (window panes)
  px(ctx, wx + Math.floor(ww / 2) - 1, wy, 2, wh, frameWood);
  px(ctx, wx, wy + Math.floor(wh / 2) - 1, ww, 2, frameWood);
  px(ctx, wx + Math.floor(ww / 2) - 1, wy, 1, wh, frameDark);
  px(ctx, wx, wy + Math.floor(wh / 2) - 1, ww, 1, frameDark);

  // Reflection highlights (Stardew always has these diagonal shines)
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillRect(Math.floor(wx + 2), Math.floor(wy + 2), 4, 1);
  ctx.fillRect(Math.floor(wx + 2), Math.floor(wy + 3), 1, 3);
  ctx.fillRect(Math.floor(wx + Math.floor(ww / 2) + 2), Math.floor(wy + 2), 4, 1);
  ctx.fillRect(Math.floor(wx + Math.floor(ww / 2) + 2), Math.floor(wy + 3), 1, 3);
}

/**
 * Stardew door — wooden with metal hinges, panels, brass knob.
 */
function drawDoor(
  ctx: Ctx,
  dx: number,
  dy: number,
  dw = 22,
  dh = 28,
  color = "#7a4818"
) {
  const dark = shiftHex(color, -30);
  const darker = shiftHex(color, -55);
  const light = shiftHex(color, 18);

  // Door frame (stone arch around door)
  px(ctx, dx - 4, dy - 4, dw + 8, dh + 6, "#5a4838");
  px(ctx, dx - 3, dy - 3, dw + 6, dh + 4, darker);
  // Frame highlight (top)
  px(ctx, dx - 4, dy - 4, dw + 8, 1, "#7a6848");

  // Door body
  px(ctx, dx, dy, dw, dh, color);
  // Wood grain shadows
  px(ctx, dx, dy, 2, dh, darker);
  px(ctx, dx + dw - 2, dy, 2, dh, dark);
  // Wood grain highlights
  px(ctx, dx + 2, dy, 1, dh, light);

  // Horizontal plank divisions (3 wood panels)
  ctx.fillStyle = darker;
  ctx.fillRect(Math.floor(dx + 2), Math.floor(dy + Math.floor(dh / 3)), dw - 4, 1);
  ctx.fillRect(Math.floor(dx + 2), Math.floor(dy + Math.floor((dh * 2) / 3)), dw - 4, 1);
  ctx.fillStyle = light;
  ctx.fillRect(Math.floor(dx + 2), Math.floor(dy + Math.floor(dh / 3) + 1), dw - 4, 1);
  ctx.fillRect(Math.floor(dx + 2), Math.floor(dy + Math.floor((dh * 2) / 3) + 1), dw - 4, 1);

  // Recessed panels (inset rectangles)
  const panelInset = 3;
  const panelH = Math.floor(dh / 3) - 4;
  for (let p = 0; p < 3; p++) {
    const py = dy + Math.floor((dh * p) / 3) + 2;
    // Panel shadow (top-left inset)
    px(ctx, dx + panelInset, py, dw - panelInset * 2, 1, darker);
    px(ctx, dx + panelInset, py, 1, panelH, darker);
    // Panel highlight (bottom-right)
    px(ctx, dx + panelInset, py + panelH - 1, dw - panelInset * 2, 1, light);
    px(ctx, dx + dw - panelInset - 1, py, 1, panelH, light);
  }

  // Iron hinges (left side)
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(Math.floor(dx + 1), Math.floor(dy + 4), 4, 4);
  ctx.fillRect(Math.floor(dx + 1), Math.floor(dy + dh - 8), 4, 4);
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(Math.floor(dx + 1), Math.floor(dy + 4), 4, 1);
  ctx.fillRect(Math.floor(dx + 1), Math.floor(dy + dh - 8), 4, 1);

  // Brass doorknob with shadow
  ctx.fillStyle = "#3a2a08";
  ctx.fillRect(Math.floor(dx + dw - 6), Math.floor(dy + Math.floor(dh / 2) - 1), 5, 5);
  ctx.fillStyle = "#e8a020";
  ctx.fillRect(Math.floor(dx + dw - 6), Math.floor(dy + Math.floor(dh / 2) - 1), 4, 4);
  ctx.fillStyle = "#fad858";
  ctx.fillRect(Math.floor(dx + dw - 6), Math.floor(dy + Math.floor(dh / 2) - 1), 2, 2);
  ctx.fillStyle = "#fff8c0";
  ctx.fillRect(Math.floor(dx + dw - 5), Math.floor(dy + Math.floor(dh / 2)), 1, 1);

  // Door step (stone slab in front)
  ctx.fillStyle = "#6a6258";
  ctx.fillRect(Math.floor(dx - 2), Math.floor(dy + dh), dw + 4, 3);
  ctx.fillStyle = "#8a8278";
  ctx.fillRect(Math.floor(dx - 2), Math.floor(dy + dh), dw + 4, 1);
  ctx.fillStyle = "#4a4238";
  ctx.fillRect(Math.floor(dx - 2), Math.floor(dy + dh + 2), dw + 4, 1);
}

/**
 * Hanging wooden sign — board suspended by chains from above.
 */
function drawHangingSign(
  ctx: Ctx,
  bx: number,
  by: number,
  bw: number,
  text: string,
  bgColor = "#8a5828"
) {
  const sw = Math.min(bw - 16, Math.max(70, text.length * 8));
  const sh = 18;
  const sx = bx + Math.floor((bw - sw) / 2);
  const sy = by + 22;

  const dark = shiftHex(bgColor, -35);
  const darker = shiftHex(bgColor, -55);
  const light = shiftHex(bgColor, 18);

  // Mounting bar (horizontal post)
  ctx.fillStyle = darker;
  ctx.fillRect(Math.floor(bx + bw / 2 - sw / 2 - 4), Math.floor(sy - 12), sw + 8, 3);
  ctx.fillStyle = "#3a2810";
  ctx.fillRect(Math.floor(bx + bw / 2 - sw / 2 - 4), Math.floor(sy - 12), sw + 8, 1);

  // Chains (left and right)
  ctx.fillStyle = "#3a3a3a";
  for (let cy = sy - 9; cy < sy - 1; cy += 3) {
    ctx.fillRect(Math.floor(sx + 4), Math.floor(cy), 2, 2);
    ctx.fillRect(Math.floor(sx + sw - 6), Math.floor(cy), 2, 2);
  }
  ctx.fillStyle = "#6a6a6a";
  for (let cy = sy - 9; cy < sy - 1; cy += 3) {
    ctx.fillRect(Math.floor(sx + 4), Math.floor(cy), 1, 1);
    ctx.fillRect(Math.floor(sx + sw - 6), Math.floor(cy), 1, 1);
  }

  // Sign board outer dark outline
  ctx.fillStyle = darker;
  ctx.fillRect(Math.floor(sx - 1), Math.floor(sy - 1), sw + 2, sh + 2);
  // Board face
  px(ctx, sx, sy, sw, sh, bgColor);
  // Wood grain horizontal lines
  ctx.fillStyle = dark;
  ctx.fillRect(Math.floor(sx + 1), Math.floor(sy + 5), sw - 2, 1);
  ctx.fillRect(Math.floor(sx + 1), Math.floor(sy + 11), sw - 2, 1);
  // Highlight strip (top)
  ctx.fillStyle = light;
  ctx.fillRect(Math.floor(sx + 1), Math.floor(sy + 1), sw - 2, 1);
  // Bottom shadow
  ctx.fillStyle = darker;
  ctx.fillRect(Math.floor(sx + 1), Math.floor(sy + sh - 2), sw - 2, 1);

  // Iron rivets at corners
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(Math.floor(sx + 2), Math.floor(sy + 2), 2, 2);
  ctx.fillRect(Math.floor(sx + sw - 4), Math.floor(sy + 2), 2, 2);
  ctx.fillRect(Math.floor(sx + 2), Math.floor(sy + sh - 4), 2, 2);
  ctx.fillRect(Math.floor(sx + sw - 4), Math.floor(sy + sh - 4), 2, 2);

  // Text
  ctx.fillStyle = "#f8e8c0";
  const fs = Math.max(8, Math.min(11, Math.floor(sw / (text.length * 0.62))));
  ctx.font = `bold ${fs}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, Math.floor(bx + bw / 2), Math.floor(sy + sh / 2 + 1));
  // Text shadow for crispness
  ctx.fillStyle = darker;
  ctx.fillText(text, Math.floor(bx + bw / 2 + 1), Math.floor(sy + sh / 2 + 2));
  ctx.fillStyle = "#f8e8c0";
  ctx.fillText(text, Math.floor(bx + bw / 2), Math.floor(sy + sh / 2 + 1));
}

/**
 * Soft drop-shadow under the building.
 */
function drawShadow(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(Math.floor(bx + 6), Math.floor(by + bh - 4), bw + 4, 8);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(Math.floor(bx + 4), Math.floor(by + bh - 2), bw + 8, 6);
}

function drawInteractHint(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(Math.floor(bx + bw / 2 - 14), Math.floor(by + bh + 12), 28, 14);
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("[ E ]", Math.floor(bx + bw / 2), Math.floor(by + bh + 19));
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: ABOUT ME — Cozy Stardew-style log cabin
// ─────────────────────────────────────────────────────────────────────────────
export function drawAboutBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  drawStoneFoundation(ctx, bx, by, bw, bh, "#7a6a58");

  // Log/plank wall — warm honey-brown
  drawPlankWall(ctx, bx, by, bw, bh, "#a07840");

  // ── Pitched shingled roof — Stardew dark teal/green ──
  drawPitchedRoof(ctx, bx, by, bw, "#3a6448", 24);

  // Stone chimney with brick texture
  const chx = bx + bw - 22;
  const chy = by - 18;
  px(ctx, chx, chy, 12, 22, "#6a5848");
  px(ctx, chx + 1, chy + 1, 10, 20, "#7a6a58");
  // Brick pattern on chimney
  ctx.fillStyle = "#4a3828";
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 6), 10, 1);
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 12), 10, 1);
  ctx.fillRect(Math.floor(chx + 5), Math.floor(chy + 1), 1, 5);
  ctx.fillRect(Math.floor(chx + 7), Math.floor(chy + 7), 1, 5);
  ctx.fillRect(Math.floor(chx + 4), Math.floor(chy + 13), 1, 8);
  // Chimney cap (wider top)
  px(ctx, chx - 2, chy - 3, 16, 4, "#3a2818");
  px(ctx, chx - 1, chy - 2, 14, 2, "#5a4838");

  // Animated smoke puffs (3 layered puffs rising)
  ctx.fillStyle = "rgba(220,220,220,0.4)";
  ctx.fillRect(Math.floor(chx + 3), Math.floor(chy - 12), 6, 5);
  ctx.fillStyle = "rgba(200,200,200,0.35)";
  ctx.fillRect(Math.floor(chx + 5), Math.floor(chy - 20), 7, 6);
  ctx.fillStyle = "rgba(180,180,180,0.25)";
  ctx.fillRect(Math.floor(chx + 8), Math.floor(chy - 28), 8, 7);

  // Windows — warm yellow lit from inside (cozy cabin feel)
  drawWindow(ctx, bx + 10, by + 28, 18, 18, "#7ec8e8", true);
  if (bw > 130) drawWindow(ctx, bx + bw - 28, by + 28, 18, 18, "#7ec8e8", true);

  // Wooden flower box under window
  ctx.fillStyle = "#5a3818";
  ctx.fillRect(Math.floor(bx + 7), Math.floor(by + 48), 24, 5);
  ctx.fillStyle = "#7a5028";
  ctx.fillRect(Math.floor(bx + 7), Math.floor(by + 48), 24, 1);
  ctx.fillStyle = "#3a2008";
  ctx.fillRect(Math.floor(bx + 7), Math.floor(by + 52), 24, 1);
  // Tiny flowers in box
  ctx.fillStyle = "#e02858"; ctx.fillRect(Math.floor(bx + 9),  Math.floor(by + 45), 3, 4);
  ctx.fillStyle = "#f8d000"; ctx.fillRect(Math.floor(bx + 14), Math.floor(by + 44), 3, 5);
  ctx.fillStyle = "#c848e0"; ctx.fillRect(Math.floor(bx + 19), Math.floor(by + 45), 3, 4);
  ctx.fillStyle = "#50c840"; ctx.fillRect(Math.floor(bx + 24), Math.floor(by + 46), 3, 3);
  ctx.fillStyle = "#fff8d0"; ctx.fillRect(Math.floor(bx + 14), Math.floor(by + 45), 1, 1);

  // Door
  const dw = 22;
  const dh = 32;
  const dx2 = bx + Math.floor(bw / 2) - dw / 2;
  const dy2 = by + bh - dh - 8;
  drawDoor(ctx, dx2, dy2, dw, dh, "#7a4818");

  // Holiday wreath on door
  ctx.fillStyle = "#1a4216";
  ctx.beginPath();
  ctx.arc(dx2 + dw / 2, dy2 + 8, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3e8232";
  ctx.beginPath();
  ctx.arc(dx2 + dw / 2, dy2 + 8, 4, 0, Math.PI * 2);
  ctx.fill();
  // Wreath berries
  ctx.fillStyle = "#d22e3e";
  ctx.fillRect(Math.floor(dx2 + dw / 2 - 3), Math.floor(dy2 + 6), 1, 1);
  ctx.fillRect(Math.floor(dx2 + dw / 2 + 2), Math.floor(dy2 + 7), 1, 1);
  ctx.fillRect(Math.floor(dx2 + dw / 2),     Math.floor(dy2 + 11), 1, 1);
  // Wreath bow
  ctx.fillStyle = "#d22e3e";
  ctx.fillRect(Math.floor(dx2 + dw / 2 - 1), Math.floor(dy2 + 12), 3, 2);

  // Hanging lantern beside door (left)
  const lx = dx2 - 12;
  const ly = dy2 + 4;
  // Lantern hanger
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(Math.floor(lx + 2), Math.floor(ly - 6), 1, 6);
  // Lantern frame
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(Math.floor(lx), Math.floor(ly), 6, 8);
  // Glass
  ctx.fillStyle = "#fadd60";
  ctx.fillRect(Math.floor(lx + 1), Math.floor(ly + 1), 4, 6);
  // Light glow
  ctx.fillStyle = "#fff8b0";
  ctx.fillRect(Math.floor(lx + 2), Math.floor(ly + 2), 2, 3);
  // Lantern top cap
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(Math.floor(lx - 1), Math.floor(ly - 1), 8, 2);

  drawHangingSign(ctx, bx, by, bw, "ABOUT ME", "#8a5828");
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: COFFEE SHOP — Stardew-style cozy café with awning
// ─────────────────────────────────────────────────────────────────────────────
export function drawCoffeeBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number, time: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  drawStoneFoundation(ctx, bx, by, bw, bh, "#6a5848");

  // Cream/tan plank wall
  drawPlankWall(ctx, bx, by, bw, bh, "#c8a878");

  // Pitched terracotta tile roof
  drawPitchedRoof(ctx, bx, by, bw, "#b85838", 24);

  // Brick chimney (right side)
  const chx = bx + bw - 18;
  const chy = by - 14;
  px(ctx, chx, chy, 10, 18, "#8a4828");
  px(ctx, chx + 1, chy + 1, 8, 16, "#a05838");
  ctx.fillStyle = "#5a2818";
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 5), 8, 1);
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 11), 8, 1);
  px(ctx, chx - 2, chy - 2, 14, 3, "#3a1808");

  // Steam/smoke from chimney
  const steamA = 0.4 + Math.sin(time * 2) * 0.15;
  ctx.fillStyle = `rgba(220,220,220,${steamA})`;
  ctx.fillRect(Math.floor(chx + 2), Math.floor(chy - 8), 5, 5);
  ctx.fillStyle = `rgba(200,200,200,${steamA - 0.1})`;
  ctx.fillRect(Math.floor(chx + 4), Math.floor(chy - 14), 6, 5);

  // ── Striped awning (red & white) ──
  const aw = bw + 12;
  const ah = 14;
  const ax = bx - 6;
  const ay = by + 14;
  // Stripes
  for (let s = 0; s < Math.ceil(aw / 8); s++) {
    ctx.fillStyle = s % 2 === 0 ? "#d83040" : "#f8f0e0";
    ctx.fillRect(Math.floor(ax + s * 8), Math.floor(ay), 8, ah);
  }
  // Top dark border
  ctx.fillStyle = "#8a1810";
  ctx.fillRect(Math.floor(ax), Math.floor(ay), aw, 2);
  // Bottom shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(Math.floor(ax), Math.floor(ay + ah), aw, 3);
  // Triangular fringe (zig-zag bottom)
  for (let f = 0; f < Math.floor(aw / 8); f++) {
    const fx = ax + f * 8;
    ctx.fillStyle = f % 2 === 0 ? "#d83040" : "#f8f0e0";
    // Triangle: 4 width point
    ctx.fillRect(Math.floor(fx), Math.floor(ay + ah), 8, 2);
    ctx.fillRect(Math.floor(fx + 1), Math.floor(ay + ah + 2), 6, 1);
    ctx.fillRect(Math.floor(fx + 2), Math.floor(ay + ah + 3), 4, 1);
    ctx.fillRect(Math.floor(fx + 3), Math.floor(ay + ah + 4), 2, 1);
  }

  // Café windows (large display windows)
  drawWindow(ctx, bx + 8, by + 36, Math.floor(bw / 2) - 14, 22, "#9adceb", true);
  drawWindow(ctx, bx + Math.floor(bw / 2) + 6, by + 36, Math.floor(bw / 2) - 14, 22, "#9adceb", true);

  // Coffee bean signs on windows (small painted)
  ctx.fillStyle = "#3a1808";
  ctx.font = "bold 13px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("☕", Math.floor(bx + bw * 0.27), Math.floor(by + 47));
  ctx.fillText("☕", Math.floor(bx + bw * 0.73), Math.floor(by + 47));

  // Door with glass window
  const dw = 22;
  const dh = 32;
  const cdx = bx + Math.floor(bw / 2) - dw / 2;
  const cdy = by + bh - dh - 8;
  drawDoor(ctx, cdx, cdy, dw, dh, "#5a3018");
  // Door glass viewport
  px(ctx, cdx + 4, cdy + 4, dw - 8, 12, "#9adceb");
  px(ctx, cdx + 4, cdy + 4, dw - 8, 1, "#bee8f4");
  px(ctx, cdx + 4, cdy + 15, dw - 8, 1, "#2a4858");
  // Reflection
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(Math.floor(cdx + 5), Math.floor(cdy + 5), 3, 4);

  // Outdoor café table & chair (right of door)
  // Table
  const tableX = bx + bw - 18;
  const tableY = by + bh - 18;
  ctx.fillStyle = "#5a3818";
  ctx.fillRect(Math.floor(tableX), Math.floor(tableY), 14, 3);
  ctx.fillStyle = "#7a5028";
  ctx.fillRect(Math.floor(tableX), Math.floor(tableY), 14, 1);
  // Table leg
  ctx.fillStyle = "#3a2008";
  ctx.fillRect(Math.floor(tableX + 6), Math.floor(tableY + 3), 2, 6);
  // Coffee cup on table
  ctx.fillStyle = "#f8e8c0";
  ctx.fillRect(Math.floor(tableX + 4), Math.floor(tableY - 4), 4, 4);
  ctx.fillStyle = "#3a1808";
  ctx.fillRect(Math.floor(tableX + 4), Math.floor(tableY - 4), 4, 1);
  ctx.fillRect(Math.floor(tableX + 5), Math.floor(tableY - 3), 2, 1);
  // Cup handle
  ctx.fillStyle = "#f8e8c0";
  ctx.fillRect(Math.floor(tableX + 8), Math.floor(tableY - 3), 1, 2);
  // Animated steam from cup
  const steamY = -2 + Math.sin(time * 4) * 1;
  ctx.fillStyle = `rgba(220,220,220,${0.5 + Math.sin(time * 3) * 0.2})`;
  ctx.fillRect(Math.floor(tableX + 5), Math.floor(tableY - 8 + steamY), 1, 3);
  ctx.fillRect(Math.floor(tableX + 7), Math.floor(tableY - 9 + steamY), 1, 3);

  // Potted plant on left
  const potX = bx + 4;
  const potY = by + bh - 14;
  // Pot
  ctx.fillStyle = "#8a4828";
  ctx.fillRect(Math.floor(potX), Math.floor(potY), 8, 8);
  ctx.fillStyle = "#a05838";
  ctx.fillRect(Math.floor(potX), Math.floor(potY), 8, 1);
  ctx.fillStyle = "#5a2818";
  ctx.fillRect(Math.floor(potX), Math.floor(potY + 7), 8, 1);
  // Leaves
  ctx.fillStyle = "#3a8232";
  ctx.fillRect(Math.floor(potX), Math.floor(potY - 4), 8, 5);
  ctx.fillStyle = "#54a142";
  ctx.fillRect(Math.floor(potX + 1), Math.floor(potY - 6), 6, 3);
  ctx.fillStyle = "#6dbe54";
  ctx.fillRect(Math.floor(potX + 2), Math.floor(potY - 7), 4, 2);

  drawHangingSign(ctx, bx, by, bw, "COFFEE", "#6a3818");
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: GEAR SHOP / TECH SKILLS — Stardew blacksmith with wood & stone
// ─────────────────────────────────────────────────────────────────────────────
export function drawGearBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number, time: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  drawStoneFoundation(ctx, bx, by, bw, bh, "#5a5848");

  // Stone block wall (sturdy workshop look)
  drawStoneWall(ctx, bx, by, bw, bh, "#7a7868");

  // Pitched dark grey roof
  drawPitchedRoof(ctx, bx, by, bw, "#3a3838", 22);

  // Big stone chimney with smoke
  const chx = bx + 8;
  const chy = by - 22;
  px(ctx, chx, chy, 14, 26, "#5a4838");
  px(ctx, chx + 1, chy + 1, 12, 24, "#6a5848");
  // Stone block details
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 6), 12, 1);
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 13), 12, 1);
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 20), 12, 1);
  ctx.fillRect(Math.floor(chx + 6), Math.floor(chy + 1), 1, 5);
  ctx.fillRect(Math.floor(chx + 4), Math.floor(chy + 7), 1, 6);
  ctx.fillRect(Math.floor(chx + 8), Math.floor(chy + 14), 1, 6);
  // Cap
  px(ctx, chx - 2, chy - 4, 18, 5, "#2a1808");
  px(ctx, chx - 1, chy - 3, 16, 3, "#4a3828");

  // Animated smoke (worker smoke - more billowy)
  const t = time * 1.5;
  ctx.fillStyle = `rgba(80,80,80,${0.5 + Math.sin(t) * 0.1})`;
  ctx.fillRect(Math.floor(chx + 3), Math.floor(chy - 12), 8, 7);
  ctx.fillStyle = `rgba(120,120,120,${0.4 + Math.sin(t + 1) * 0.1})`;
  ctx.fillRect(Math.floor(chx + 6), Math.floor(chy - 22), 9, 8);
  ctx.fillStyle = `rgba(160,160,160,${0.3 + Math.sin(t + 2) * 0.1})`;
  ctx.fillRect(Math.floor(chx + 10), Math.floor(chy - 32), 10, 8);

  // Workshop window (small, with iron bars)
  drawWindow(ctx, bx + 12, by + 30, 22, 18, "#f08030", true);
  // Iron bars over window (3 vertical)
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(Math.floor(bx + 16), Math.floor(by + 28), 1, 22);
  ctx.fillRect(Math.floor(bx + 22), Math.floor(by + 28), 1, 22);
  ctx.fillRect(Math.floor(bx + 28), Math.floor(by + 28), 1, 22);
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(Math.floor(bx + 16), Math.floor(by + 28), 1, 1);
  ctx.fillRect(Math.floor(bx + 22), Math.floor(by + 28), 1, 1);
  ctx.fillRect(Math.floor(bx + 28), Math.floor(by + 28), 1, 1);

  // Forge glow from window (animated)
  const glow = 0.2 + Math.sin(time * 4) * 0.1;
  ctx.fillStyle = `rgba(255,140,40,${glow})`;
  ctx.fillRect(Math.floor(bx + 6), Math.floor(by + 48), 36, 12);

  // Big wooden workshop door
  const dw = 32;
  const dh = 36;
  const dx2 = bx + Math.floor(bw / 2) + 8;
  const dy2 = by + bh - dh - 6;
  drawDoor(ctx, dx2, dy2, dw, dh, "#5a3018");
  // Iron reinforcements (X pattern)
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(Math.floor(dx2 + 4), Math.floor(dy2 + 4), dw - 8, 2);
  ctx.fillRect(Math.floor(dx2 + 4), Math.floor(dy2 + dh - 6), dw - 8, 2);
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(Math.floor(dx2 + 4), Math.floor(dy2 + 4), dw - 8, 1);
  ctx.fillRect(Math.floor(dx2 + 4), Math.floor(dy2 + dh - 6), dw - 8, 1);

  // ── Tools displayed outside ──
  // Anvil to the left of door
  const anvilX = bx + 8;
  const anvilY = by + bh - 14;
  // Base
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(Math.floor(anvilX), Math.floor(anvilY + 8), 14, 4);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(Math.floor(anvilX), Math.floor(anvilY + 11), 14, 1);
  // Body
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(Math.floor(anvilX + 4), Math.floor(anvilY + 4), 6, 5);
  // Top horn (the pointy part)
  ctx.fillStyle = "#4a4a4a";
  ctx.fillRect(Math.floor(anvilX + 1), Math.floor(anvilY + 1), 12, 4);
  ctx.fillRect(Math.floor(anvilX), Math.floor(anvilY + 2), 14, 2);
  // Highlight
  ctx.fillStyle = "#6a6a6a";
  ctx.fillRect(Math.floor(anvilX), Math.floor(anvilY + 1), 14, 1);

  // Hanging tools on wall (right side)
  const toolX = bx + bw - 6;
  // Hammer
  ctx.fillStyle = "#5a3818";
  ctx.fillRect(Math.floor(toolX), Math.floor(by + 32), 1, 14);
  ctx.fillStyle = "#7a5028";
  ctx.fillRect(Math.floor(toolX + 1), Math.floor(by + 32), 1, 14);
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(Math.floor(toolX - 2), Math.floor(by + 30), 6, 4);
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(Math.floor(toolX - 2), Math.floor(by + 30), 6, 1);
  // Wrench
  ctx.fillStyle = "#5a5a5a";
  ctx.fillRect(Math.floor(toolX), Math.floor(by + 50), 2, 12);
  ctx.fillRect(Math.floor(toolX - 2), Math.floor(by + 48), 6, 4);
  ctx.fillRect(Math.floor(toolX - 2), Math.floor(by + 60), 6, 4);
  ctx.fillStyle = "#7a7a7a";
  ctx.fillRect(Math.floor(toolX - 2), Math.floor(by + 48), 6, 1);

  // Spinning gear sign on the front (animated)
  const spinAngle = time * 0.6;
  const gearCx = bx + bw - 22;
  const gearCy = by + 28;
  ctx.save();
  ctx.translate(gearCx, gearCy);
  ctx.rotate(spinAngle);
  // Gear body
  ctx.fillStyle = "#3a2810";
  ctx.fillRect(-9, -2, 18, 4);
  ctx.fillRect(-2, -9, 4, 18);
  ctx.fillStyle = "#e8a020";
  ctx.fillRect(-8, -1, 16, 2);
  ctx.fillRect(-1, -8, 2, 16);
  // Center hub
  ctx.fillStyle = "#3a2810";
  ctx.fillRect(-3, -3, 6, 6);
  ctx.fillStyle = "#fad858";
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();

  drawHangingSign(ctx, bx, by, bw, "GEAR SHOP", "#3a3a48");
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: CV / WORK — Stardew-style office (more like a guildhall)
// ─────────────────────────────────────────────────────────────────────────────
export function drawCVBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  drawStoneFoundation(ctx, bx, by, bw, bh, "#5a5868");

  // Blue-grey stone block wall
  drawStoneWall(ctx, bx, by, bw, bh, "#6a7888");

  // Pitched roof — slate blue
  drawPitchedRoof(ctx, bx, by, bw, "#445870", 24);

  // Large stone chimney
  const chx = bx + bw - 20;
  const chy = by - 16;
  px(ctx, chx, chy, 12, 20, "#4a4858");
  px(ctx, chx + 1, chy + 1, 10, 18, "#5a5868");
  ctx.fillStyle = "#2a2838";
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 6), 10, 1);
  ctx.fillRect(Math.floor(chx + 1), Math.floor(chy + 13), 10, 1);
  px(ctx, chx - 2, chy - 3, 16, 4, "#1a1828");

  // Two windows side by side
  drawWindow(ctx, bx + 10, by + 30, 22, 22, "#7ec8e8");
  drawWindow(ctx, bx + bw - 32, by + 30, 22, 22, "#7ec8e8");

  // Window planters
  for (const wx of [bx + 7, bx + bw - 35]) {
    ctx.fillStyle = "#5a3818";
    ctx.fillRect(Math.floor(wx), Math.floor(by + 54), 28, 4);
    ctx.fillStyle = "#7a5028";
    ctx.fillRect(Math.floor(wx), Math.floor(by + 54), 28, 1);
    // Tiny flowers
    ctx.fillStyle = "#3878d8";
    ctx.fillRect(Math.floor(wx + 4), Math.floor(by + 52), 2, 3);
    ctx.fillRect(Math.floor(wx + 12), Math.floor(by + 51), 2, 4);
    ctx.fillRect(Math.floor(wx + 22), Math.floor(by + 52), 2, 3);
  }

  // Grand wooden door (centered, larger)
  const dw = 26;
  const dh = 38;
  const ddx = bx + Math.floor(bw / 2) - dw / 2;
  const ddy = by + bh - dh - 8;
  drawDoor(ctx, ddx, ddy, dw, dh, "#3a4858");
  // Brass plate above door
  ctx.fillStyle = "#3a2810";
  ctx.fillRect(Math.floor(ddx + 2), Math.floor(ddy - 5), dw - 4, 5);
  ctx.fillStyle = "#e8a020";
  ctx.fillRect(Math.floor(ddx + 3), Math.floor(ddy - 4), dw - 6, 3);
  ctx.fillStyle = "#fad858";
  ctx.fillRect(Math.floor(ddx + 3), Math.floor(ddy - 4), dw - 6, 1);

  // Twin lamps on each side of door
  for (const lx of [ddx - 12, ddx + dw + 4]) {
    const ly = ddy + 6;
    // Bracket
    ctx.fillStyle = "#3a2818";
    ctx.fillRect(Math.floor(lx + 3), Math.floor(ly - 8), 1, 8);
    // Lamp body
    ctx.fillStyle = "#3a2818";
    ctx.fillRect(Math.floor(lx), Math.floor(ly), 8, 10);
    // Glass
    ctx.fillStyle = "#fadd60";
    ctx.fillRect(Math.floor(lx + 1), Math.floor(ly + 1), 6, 8);
    // Inner glow
    ctx.fillStyle = "#fff8b0";
    ctx.fillRect(Math.floor(lx + 2), Math.floor(ly + 2), 4, 4);
    // Top cap
    ctx.fillStyle = "#1a1808";
    ctx.fillRect(Math.floor(lx - 1), Math.floor(ly - 1), 10, 2);
  }

  drawHangingSign(ctx, bx, by, bw, "WORK", "#3a4858");
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: CONTACT — Stardew-style mail/post office with mailbox
// ─────────────────────────────────────────────────────────────────────────────
export function drawContactBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number, time: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  drawStoneFoundation(ctx, bx, by, bw, bh, "#6a5848");

  // White/cream plank wall
  drawPlankWall(ctx, bx, by, bw, bh, "#d8c8a8");

  // Pitched purple roof
  drawPitchedRoof(ctx, bx, by, bw, "#583878", 24);

  // Roof finial (decorative spire with envelope)
  const cx = bx + Math.floor(bw / 2);
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(Math.floor(cx - 1), Math.floor(by - 30), 2, 8);
  ctx.fillStyle = "#e8a020";
  ctx.fillRect(Math.floor(cx - 3), Math.floor(by - 32), 6, 4);
  ctx.fillStyle = "#fad858";
  ctx.fillRect(Math.floor(cx - 2), Math.floor(by - 32), 4, 1);

  // Arched windows (post office style)
  for (let wi = 0; wi < 2; wi++) {
    const wx = bx + 10 + wi * (bw / 2 - 4);
    const wy = by + 28;
    // Arch frame
    ctx.fillStyle = "#3a2018";
    ctx.fillRect(Math.floor(wx - 3), Math.floor(wy - 4), 22, 28);
    // Arch top (rounded)
    ctx.fillRect(Math.floor(wx - 1), Math.floor(wy - 8), 18, 5);
    ctx.fillRect(Math.floor(wx + 2), Math.floor(wy - 10), 12, 3);
    ctx.fillRect(Math.floor(wx + 5), Math.floor(wy - 12), 6, 2);
    // Frame inner
    ctx.fillStyle = "#5a3828";
    ctx.fillRect(Math.floor(wx - 2), Math.floor(wy - 3), 20, 26);
    // Glass
    ctx.fillStyle = "#9a8ad8";
    ctx.fillRect(Math.floor(wx), Math.floor(wy - 1), 16, 22);
    // Sky reflection top
    ctx.fillStyle = "#bcaae8";
    ctx.fillRect(Math.floor(wx), Math.floor(wy - 1), 16, 8);
    // Cross dividers
    ctx.fillStyle = "#3a2018";
    ctx.fillRect(Math.floor(wx + 7), Math.floor(wy - 1), 2, 22);
    ctx.fillRect(Math.floor(wx), Math.floor(wy + 9), 16, 2);
    // Reflection
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(Math.floor(wx + 1), Math.floor(wy), 3, 1);
    ctx.fillRect(Math.floor(wx + 1), Math.floor(wy + 1), 1, 3);
  }

  // Door (purple to match theme)
  const dw = 24;
  const dh = 34;
  const pdx = bx + Math.floor(bw / 2) - dw / 2;
  const pdy = by + bh - dh - 8;
  drawDoor(ctx, pdx, pdy, dw, dh, "#3a2058");
  // Letter slot in door
  ctx.fillStyle = "#1a0828";
  ctx.fillRect(Math.floor(pdx + 6), Math.floor(pdy + 12), dw - 12, 3);
  ctx.fillStyle = "#5a3878";
  ctx.fillRect(Math.floor(pdx + 6), Math.floor(pdy + 12), dw - 12, 1);

  // Big mailbox to the side
  const mbx = bx + bw + 4;
  const mby = by + bh - 30;
  // Post
  ctx.fillStyle = "#3a2018";
  ctx.fillRect(Math.floor(mbx + 5), Math.floor(mby + 14), 4, 18);
  ctx.fillStyle = "#5a3018";
  ctx.fillRect(Math.floor(mbx + 6), Math.floor(mby + 14), 2, 18);
  // Mailbox body (rounded blue)
  ctx.fillStyle = "#1a3868";
  ctx.fillRect(Math.floor(mbx), Math.floor(mby), 14, 16);
  ctx.fillStyle = "#2a5898";
  ctx.fillRect(Math.floor(mbx + 1), Math.floor(mby + 1), 12, 14);
  // Top arch (rounded mailbox top)
  ctx.fillStyle = "#1a3868";
  ctx.fillRect(Math.floor(mbx + 1), Math.floor(mby - 2), 12, 2);
  ctx.fillRect(Math.floor(mbx + 3), Math.floor(mby - 3), 8, 1);
  ctx.fillStyle = "#2a5898";
  ctx.fillRect(Math.floor(mbx + 2), Math.floor(mby - 1), 10, 1);
  // Mail slot
  ctx.fillStyle = "#0a1828";
  ctx.fillRect(Math.floor(mbx + 3), Math.floor(mby + 4), 8, 2);
  // Envelope label
  ctx.fillStyle = "#f8f0e0";
  ctx.fillRect(Math.floor(mbx + 4), Math.floor(mby + 8), 6, 5);
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(Math.floor(mbx + 4), Math.floor(mby + 8), 6, 1);
  ctx.fillRect(Math.floor(mbx + 4), Math.floor(mby + 10), 3, 1);
  ctx.fillRect(Math.floor(mbx + 7), Math.floor(mby + 10), 3, 1);
  // Flag (animated)
  const flagY = Math.floor(mby - 2 + Math.sin(time * 1.5) * 1);
  ctx.fillStyle = "#3a2818";
  ctx.fillRect(Math.floor(mbx + 13), Math.floor(mby - 2), 1, 8);
  ctx.fillStyle = "#d83040";
  ctx.fillRect(Math.floor(mbx + 14), Math.floor(flagY), 6, 5);
  ctx.fillStyle = "#f04050";
  ctx.fillRect(Math.floor(mbx + 14), Math.floor(flagY), 6, 1);

  drawHangingSign(ctx, bx, by, bw, "✉ POST", "#3a2058");
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: PROJECTS — Stardew workshop/forge with brick walls
// ─────────────────────────────────────────────────────────────────────────────
export function drawProjectsBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  drawStoneFoundation(ctx, bx, by, bw, bh, "#5a3818");

  // Brick wall
  const wallTop = by + 12;
  const wallBottom = by + bh - 12;
  const wallH = wallBottom - wallTop;
  px(ctx, bx, wallTop, bw, wallH, "#9a5838");
  // Brick pattern
  ctx.fillStyle = "#7a4828";
  const brickH = 7;
  const brickW = 18;
  for (let row = 0; row * brickH < wallH; row++) {
    const py = wallTop + row * brickH;
    // Mortar horizontal
    ctx.fillRect(Math.floor(bx + 2), Math.floor(py + brickH - 1), bw - 4, 1);
    // Mortar vertical (offset every other row)
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let sx = bx + offset; sx < bx + bw; sx += brickW) {
      if (sx > bx + 2 && sx < bx + bw - 2) {
        ctx.fillRect(Math.floor(sx), Math.floor(py), 1, brickH - 1);
      }
    }
  }
  // Brick highlights (top of each brick)
  ctx.fillStyle = "#b06848";
  for (let row = 0; row * brickH < wallH; row++) {
    const py = wallTop + row * brickH;
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let sx = bx + offset; sx < bx + bw; sx += brickW) {
      ctx.fillRect(Math.floor(sx + 1), Math.floor(py), Math.min(brickW - 2, bx + bw - sx - 3), 1);
    }
  }
  // Wall edges
  px(ctx, bx, wallTop, 2, wallH, "#3a1808");
  px(ctx, bx + bw - 2, wallTop, 2, wallH, "#3a1808");

  // Pitched dark brown roof
  drawPitchedRoof(ctx, bx, by, bw, "#3a1808", 24);

  // Big chimney (forge fireplace)
  const chx = bx + 12;
  const chy = by - 26;
  px(ctx, chx, chy, 14, 30, "#5a3818");
  px(ctx, chx + 1, chy + 1, 12, 28, "#7a4828");
  // Brick details
  ctx.fillStyle = "#3a1808";
  for (let cy = chy + 5; cy < chy + 28; cy += 6) {
    ctx.fillRect(Math.floor(chx + 1), Math.floor(cy), 12, 1);
  }
  ctx.fillRect(Math.floor(chx + 6), Math.floor(chy + 1), 1, 4);
  ctx.fillRect(Math.floor(chx + 4), Math.floor(chy + 6), 1, 5);
  ctx.fillRect(Math.floor(chx + 8), Math.floor(chy + 12), 1, 5);
  ctx.fillRect(Math.floor(chx + 5), Math.floor(chy + 18), 1, 5);
  // Cap
  px(ctx, chx - 2, chy - 4, 18, 5, "#1a0808");
  px(ctx, chx - 1, chy - 3, 16, 3, "#3a2018");

  // Sparks coming out of chimney (animated indirectly by position)
  ctx.fillStyle = "#ff8030";
  ctx.fillRect(Math.floor(chx + 4), Math.floor(chy - 10), 2, 4);
  ctx.fillStyle = "#ffa040";
  ctx.fillRect(Math.floor(chx + 7), Math.floor(chy - 14), 2, 3);
  ctx.fillStyle = "#ffd060";
  ctx.fillRect(Math.floor(chx + 9), Math.floor(chy - 8), 1, 2);
  // Smoke
  ctx.fillStyle = "rgba(80,80,80,0.5)";
  ctx.fillRect(Math.floor(chx + 4), Math.floor(chy - 18), 8, 6);
  ctx.fillStyle = "rgba(120,120,120,0.3)";
  ctx.fillRect(Math.floor(chx + 6), Math.floor(chy - 28), 10, 7);

  // Forge window (glowing orange — main feature)
  drawWindow(ctx, bx + 10, by + 28, 24, 18, "#ff8030", true);
  // Iron grille over forge window
  ctx.fillStyle = "#1a1a1a";
  for (let gx = bx + 14; gx < bx + 32; gx += 4) {
    ctx.fillRect(Math.floor(gx), Math.floor(by + 26), 1, 22);
  }
  ctx.fillRect(Math.floor(bx + 10), Math.floor(by + 36), 24, 1);

  // Wide workshop door (double door)
  const dw = 32;
  const dh = 36;
  const pjdx = bx + Math.floor(bw / 2) + 8;
  const pjdy = by + bh - dh - 6;
  drawDoor(ctx, pjdx, pjdy, dw, dh, "#3a1808");
  // Split door line (double doors)
  ctx.fillStyle = "#1a0808";
  ctx.fillRect(Math.floor(pjdx + dw / 2 - 1), Math.floor(pjdy), 2, dh);
  // Two handles (one per door)
  ctx.fillStyle = "#3a2810";
  ctx.fillRect(Math.floor(pjdx + dw / 2 - 6), Math.floor(pjdy + dh / 2), 4, 4);
  ctx.fillRect(Math.floor(pjdx + dw / 2 + 2), Math.floor(pjdy + dh / 2), 4, 4);
  ctx.fillStyle = "#e8a020";
  ctx.fillRect(Math.floor(pjdx + dw / 2 - 6), Math.floor(pjdy + dh / 2), 3, 3);
  ctx.fillRect(Math.floor(pjdx + dw / 2 + 2), Math.floor(pjdy + dh / 2), 3, 3);

  // Stack of crates outside
  const crX = bx + 8;
  const crY = by + bh - 16;
  ctx.fillStyle = "#5a3818";
  ctx.fillRect(Math.floor(crX), Math.floor(crY), 12, 10);
  ctx.fillStyle = "#7a5028";
  ctx.fillRect(Math.floor(crX + 1), Math.floor(crY + 1), 10, 8);
  ctx.fillStyle = "#3a2008";
  ctx.fillRect(Math.floor(crX), Math.floor(crY + 9), 12, 1);
  ctx.fillRect(Math.floor(crX + 5), Math.floor(crY), 1, 10);
  ctx.fillRect(Math.floor(crX), Math.floor(crY + 4), 12, 1);
  ctx.fillStyle = "#9a7048";
  ctx.fillRect(Math.floor(crX + 1), Math.floor(crY + 1), 10, 1);

  drawHangingSign(ctx, bx, by, bw, "WORKSHOP", "#3a1808");
  drawInteractHint(ctx, bx, by, bw, bh);
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUILDING: MEMO — Stardew town hall with bulletin board
// ─────────────────────────────────────────────────────────────────────────────
export function drawMemoBuilding(ctx: Ctx, bx: number, by: number, bw: number, bh: number) {
  drawShadow(ctx, bx, by, bw, bh);

  // Stone foundation
  drawStoneFoundation(ctx, bx, by, bw, bh, "#5a4868");

  // Stone block wall (town hall)
  drawStoneWall(ctx, bx, by, bw, bh, "#7a78a0");

  // Pitched roof — deep purple/indigo
  drawPitchedRoof(ctx, bx, by, bw, "#3a3858", 26);

  // Star on top (gold finial)
  const cx = bx + Math.floor(bw / 2);
  ctx.fillStyle = "#3a2810";
  ctx.fillRect(Math.floor(cx - 1), Math.floor(by - 32), 2, 8);
  ctx.fillStyle = "#fad858";
  // Star shape (simple cross)
  ctx.fillRect(Math.floor(cx - 4), Math.floor(by - 36), 8, 2);
  ctx.fillRect(Math.floor(cx - 1), Math.floor(by - 39), 2, 8);
  ctx.fillStyle = "#e8a020";
  ctx.fillRect(Math.floor(cx - 1), Math.floor(by - 36), 2, 2);

  // Two columns flanking the door (Stardew town hall style)
  const colW = 8;
  for (const colX of [bx + 4, bx + bw - 12]) {
    // Column shaft
    ctx.fillStyle = "#5a5878";
    ctx.fillRect(Math.floor(colX), Math.floor(by + 14), colW, bh - 24);
    ctx.fillStyle = "#8a88b0";
    ctx.fillRect(Math.floor(colX + 1), Math.floor(by + 14), 2, bh - 24);
    ctx.fillStyle = "#3a3858";
    ctx.fillRect(Math.floor(colX + colW - 2), Math.floor(by + 14), 2, bh - 24);
    // Column capital (top)
    ctx.fillStyle = "#6a68a0";
    ctx.fillRect(Math.floor(colX - 1), Math.floor(by + 14), colW + 2, 4);
    ctx.fillStyle = "#9a98c0";
    ctx.fillRect(Math.floor(colX - 1), Math.floor(by + 14), colW + 2, 1);
    // Column base (bottom)
    ctx.fillStyle = "#3a3858";
    ctx.fillRect(Math.floor(colX - 1), Math.floor(by + bh - 12), colW + 2, 4);
    ctx.fillStyle = "#5a5878";
    ctx.fillRect(Math.floor(colX - 1), Math.floor(by + bh - 12), colW + 2, 1);
  }

  // Two windows
  drawWindow(ctx, bx + 18, by + 30, 18, 22, "#7e98e0");
  drawWindow(ctx, bx + bw - 36, by + 30, 18, 22, "#7e98e0");

  // Arched grand door
  const dw = 28;
  const dh = 38;
  const mdx = bx + Math.floor(bw / 2) - dw / 2;
  const mdy = by + bh - dh - 8;
  drawDoor(ctx, mdx, mdy, dw, dh, "#2a2848");
  // Arched top above door
  ctx.fillStyle = "#1a1838";
  ctx.fillRect(Math.floor(mdx - 3), Math.floor(mdy - 8), dw + 6, 5);
  ctx.fillRect(Math.floor(mdx - 1), Math.floor(mdy - 11), dw + 2, 3);
  ctx.fillRect(Math.floor(mdx + 4), Math.floor(mdy - 13), dw - 8, 2);

  // ── Bulletin board outside building (right side) ──
  const bbX = bx + bw + 4;
  const bbY = by + bh - 56;
  const bbW = 30;
  const bbH = 38;
  // Wood frame
  ctx.fillStyle = "#3a2008";
  ctx.fillRect(Math.floor(bbX), Math.floor(bbY), bbW, bbH);
  ctx.fillStyle = "#5a3818";
  ctx.fillRect(Math.floor(bbX + 2), Math.floor(bbY + 2), bbW - 4, bbH - 4);
  // Cork board background
  ctx.fillStyle = "#c8a060";
  ctx.fillRect(Math.floor(bbX + 4), Math.floor(bbY + 4), bbW - 8, bbH - 8);
  // Cork texture (specks)
  ctx.fillStyle = "#a88040";
  ctx.fillRect(Math.floor(bbX + 6), Math.floor(bbY + 8), 1, 1);
  ctx.fillRect(Math.floor(bbX + 14), Math.floor(bbY + 12), 1, 1);
  ctx.fillRect(Math.floor(bbX + 22), Math.floor(bbY + 16), 1, 1);
  ctx.fillRect(Math.floor(bbX + 8), Math.floor(bbY + 20), 1, 1);
  ctx.fillRect(Math.floor(bbX + 18), Math.floor(bbY + 26), 1, 1);
  // Pinned notes (3)
  // Note 1 (white)
  ctx.fillStyle = "#f8f0d0";
  ctx.fillRect(Math.floor(bbX + 6), Math.floor(bbY + 6), 9, 11);
  ctx.fillStyle = "#5a4818";
  ctx.fillRect(Math.floor(bbX + 7), Math.floor(bbY + 8), 7, 1);
  ctx.fillRect(Math.floor(bbX + 7), Math.floor(bbY + 11), 5, 1);
  ctx.fillRect(Math.floor(bbX + 7), Math.floor(bbY + 14), 6, 1);
  // Pin
  ctx.fillStyle = "#8a1818";
  ctx.fillRect(Math.floor(bbX + 10), Math.floor(bbY + 5), 2, 2);
  ctx.fillStyle = "#d83040";
  ctx.fillRect(Math.floor(bbX + 10), Math.floor(bbY + 5), 1, 1);

  // Note 2 (yellow)
  ctx.fillStyle = "#f8e060";
  ctx.fillRect(Math.floor(bbX + 17), Math.floor(bbY + 7), 9, 10);
  ctx.fillStyle = "#5a4818";
  ctx.fillRect(Math.floor(bbX + 18), Math.floor(bbY + 9), 7, 1);
  ctx.fillRect(Math.floor(bbX + 18), Math.floor(bbY + 12), 5, 1);
  // Pin
  ctx.fillStyle = "#1a4868";
  ctx.fillRect(Math.floor(bbX + 21), Math.floor(bbY + 6), 2, 2);
  ctx.fillStyle = "#3878d8";
  ctx.fillRect(Math.floor(bbX + 21), Math.floor(bbY + 6), 1, 1);

  // Note 3 (pink)
  ctx.fillStyle = "#f8a8c8";
  ctx.fillRect(Math.floor(bbX + 8), Math.floor(bbY + 20), 11, 12);
  ctx.fillStyle = "#5a4818";
  ctx.fillRect(Math.floor(bbX + 9), Math.floor(bbY + 22), 9, 1);
  ctx.fillRect(Math.floor(bbX + 9), Math.floor(bbY + 25), 7, 1);
  ctx.fillRect(Math.floor(bbX + 9), Math.floor(bbY + 28), 8, 1);
  // Pin
  ctx.fillStyle = "#1a6818";
  ctx.fillRect(Math.floor(bbX + 13), Math.floor(bbY + 19), 2, 2);
  ctx.fillStyle = "#3eb842";
  ctx.fillRect(Math.floor(bbX + 13), Math.floor(bbY + 19), 1, 1);

  // Stand pole for bulletin board
  ctx.fillStyle = "#3a2008";
  ctx.fillRect(Math.floor(bbX + bbW / 2 - 2), Math.floor(bbY + bbH), 4, 18);
  ctx.fillStyle = "#5a3818";
  ctx.fillRect(Math.floor(bbX + bbW / 2 - 1), Math.floor(bbY + bbH), 2, 18);

  drawHangingSign(ctx, bx, by, bw, "TOWN HALL", "#2a2848");
  drawInteractHint(ctx, bx, by, bw, bh);
}
