/**
 * Pixel-art decorations: Cat Park, Carnival, Cats, Ferris Wheel
 */

type Ctx = CanvasRenderingContext2D;

function f(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = c;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h));
}

// ─────────────────────────────────────────────────────────────────────────────
//  PARK decorations (drawn in world space before camera offset is applied)
//  Park occupies tile cols 12-18, rows 13-20 (the middle-center block)
// ─────────────────────────────────────────────────────────────────────────────

export function drawPark(
  ctx: Ctx,
  worldX: number, worldY: number,  // top-left pixel of park tile block
  _parkW: number, parkH: number,    // pixel size of park
  time: number
) {
  // ── Grass base (already drawn by tile renderer — just add details) ──

  // Pond / water feature in top-left of park
  const px = worldX + 8, py = worldY + 8;
  const pw = 52, ph = 36;
  f(ctx, px,   py,   pw, ph, "#2a6890");
  f(ctx, px+2, py+2, pw-4, ph-4, "#3a88b8");
  // Water shimmer
  const shimA = 0.3 + Math.sin(time * 2.5) * 0.15;
  ctx.fillStyle = `rgba(120,200,255,${shimA})`;
  ctx.fillRect(Math.floor(px+4), Math.floor(py+4), 18, 4);
  ctx.fillRect(Math.floor(px+28), Math.floor(py+16), 14, 4);
  // Pond edge rocks
  f(ctx, px-2,  py+ph/2-3, 4, 6, "#8a7a68");
  f(ctx, px+pw-2, py+ph/2-3, 4, 6, "#8a7a68");
  f(ctx, px+pw/2-5, py-2, 10, 4, "#8a7a68");
  f(ctx, px+pw/2-5, py+ph-2, 10, 4, "#8a7a68");
  // Lily pad
  f(ctx, px+20, py+18, 10, 6, "#2a8a2a");
  f(ctx, px+24, py+19, 4, 1, "#ff4488"); // flower on lily

  // Park bench #1
  drawBench(ctx, worldX + 70, worldY + 12);
  // Park bench #2
  drawBench(ctx, worldX + 70, worldY + 56);
  // Park bench #3 (rotated look)
  drawBench(ctx, worldX + 12, worldY + 70);

  // Flower beds
  drawFlowerBed(ctx, worldX + 100, worldY + 10, time);
  drawFlowerBed(ctx, worldX + 140, worldY + 60, time);
  drawFlowerBed(ctx, worldX + 10,  worldY + 100, time);

  // Path through park (light stone)
  f(ctx, worldX + 64,  worldY, 12, parkH, "#bfb8a8");
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(Math.floor(worldX+64), Math.floor(worldY), 1, parkH);
  ctx.fillRect(Math.floor(worldX+75), Math.floor(worldY), 1, parkH);

  // Lamp post in park
  drawParkLamp(ctx, worldX + 80, worldY + 40, time);
  drawParkLamp(ctx, worldX + 80, worldY + 140, time);

  // "CAT PARK" sign at entrance
  f(ctx, worldX + 52, worldY, 38, 10, "#5a7a30");
  ctx.fillStyle = "#d0f060";
  ctx.font = "bold 7px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CAT PARK", worldX + 71, worldY + 5);

  // Cat scratch post / toy corner
  f(ctx, worldX + 120, worldY + 100, 4, 28, "#8a6030");
  f(ctx, worldX + 117, worldY + 98, 10, 5, "#b08040");
  f(ctx, worldX + 116, worldY + 126, 12, 5, "#6a4820");
  f(ctx, worldX + 130, worldY + 110, 10, 10, "#ff88cc");
  f(ctx, worldX + 133, worldY + 113, 4, 4, "#ffd0e8");
}

function drawBench(ctx: Ctx, x: number, y: number) {
  // Legs
  f(ctx, x, y+8, 3, 8, "#6a4820");
  f(ctx, x+18, y+8, 3, 8, "#6a4820");
  // Seat
  f(ctx, x-1, y+6, 23, 4, "#9a7040");
  f(ctx, x-1, y+5, 23, 2, "#b08050");
  // Backrest
  f(ctx, x-1, y, 23, 3, "#9a7040");
  f(ctx, x-1, y-1, 23, 2, "#b08050");
  // Armrests
  f(ctx, x, y, 3, 9, "#7a5030");
  f(ctx, x+18, y, 3, 9, "#7a5030");
}

function drawFlowerBed(ctx: Ctx, x: number, y: number, time: number) {
  // Soil
  f(ctx, x, y, 24, 14, "#6a4820");
  // Flowers
  const colors = ["#ff4488","#ffdd00","#ff6600","#cc44ff","#44ddff"];
  for (let i = 0; i < 5; i++) {
    const fx = x + 2 + i * 4;
    const fy = y + 2;
    const bob = Math.round(Math.sin(time * 2 + i * 1.2) * 1);
    f(ctx, fx + 1, fy + 4, 2, 6 + bob, "#3a7a20");
    f(ctx, fx, fy + bob, 4, 4, colors[i]);
    f(ctx, fx+1, fy+1+bob, 2, 2, "#ffffff");
  }
}

function drawParkLamp(ctx: Ctx, x: number, y: number, time: number) {
  // Glow
  const ga = 0.08 + Math.sin(time*0.8)*0.02;
  const grd = ctx.createRadialGradient(x, y-14, 0, x, y-14, 22);
  grd.addColorStop(0, `rgba(255,240,160,${ga})`);
  grd.addColorStop(1, "rgba(255,200,80,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(x-22, y-36, 44, 44);
  // Pole
  f(ctx, x-1, y-28, 3, 28, "#6a6878");
  f(ctx, x, y-28, 1, 28, "#8a88a0");
  // Head
  f(ctx, x-5, y-32, 12, 6, "#3a3848");
  f(ctx, x-4, y-30, 10, 4, "#f8f0d0");
  f(ctx, x-2, y-29, 6, 2, "#fff8e0");
}

// ─────────────────────────────────────────────────────────────────────────────
//  CARNIVAL decorations
//  Carnival occupies tile cols 22-28, rows 24-29 (bottom-right block)
// ─────────────────────────────────────────────────────────────────────────────

export function drawCarnival(
  ctx: Ctx,
  worldX: number, worldY: number,
  carnW: number, carnH: number,
  time: number
) {
  // Colorful bunting/flags across top
  drawBunting(ctx, worldX, worldY, carnW, time);

  // Ground: slightly warm tint
  ctx.fillStyle = "rgba(255,200,80,0.06)";
  ctx.fillRect(Math.floor(worldX), Math.floor(worldY), carnW, carnH);

  // ── Ferris Wheel (centerpiece) ──
  drawFerrisWheel(ctx, worldX + carnW/2 - 20, worldY + 20, time);

  // ── Striped ticket booth ──
  drawTicketBooth(ctx, worldX + 8, worldY + 50);

  // ── Balloon stand ──
  drawBalloonStand(ctx, worldX + carnW - 30, worldY + 60, time);

  // ── Carnival sign ──
  f(ctx, worldX + 50, worldY + 2, 80, 14, "#cc2020");
  f(ctx, worldX + 52, worldY + 3, 76, 10, "#ee3030");
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("★ CARNIVAL ★", worldX + 90, worldY + 9);

  // Confetti-like dots
  const confetti = ["#ff4444","#44ff44","#4444ff","#ffff44","#ff44ff","#44ffff"];
  for (let i = 0; i < 18; i++) {
    const cx2 = worldX + ((i * 37 + 11) % (carnW - 8)) + 4;
    const cy2 = worldY + ((i * 53 + 7) % (carnH - 20)) + 16;
    const bob = Math.abs(Math.sin(time * 1.5 + i)) * 3;
    f(ctx, cx2, cy2 - bob, 3, 3, confetti[i % confetti.length]);
  }
}

function drawBunting(ctx: Ctx, x: number, y: number, w: number, time: number) {
  const colors = ["#ff2020","#ffee00","#20cc20","#2020ff","#cc20cc","#ff8800"];
  // string line
  ctx.strokeStyle = "#5a3010";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(Math.floor(x), Math.floor(y + 8));
  ctx.lineTo(Math.floor(x + w), Math.floor(y + 8));
  ctx.stroke();
  // flags
  for (let i = 0; i < Math.floor(w / 14); i++) {
    const fx = x + i * 14 + 2;
    const drop = Math.sin(time * 1.2 + i * 0.7) * 2;
    const col = colors[i % colors.length];
    // triangle flag
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(fx, y + 8 + drop);
    ctx.lineTo(fx + 10, y + 8 + drop);
    ctx.lineTo(fx + 5, y + 18 + drop);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawFerrisWheel(ctx: Ctx, cx: number, cy: number, time: number) {
  const R = 38;   // wheel radius
  const rotation = time * 0.4;  // slow spin

  // Support legs (A-frame)
  ctx.strokeStyle = "#5a4828";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(Math.floor(cx), Math.floor(cy));
  ctx.lineTo(Math.floor(cx - 28), Math.floor(cy + R + 18));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(Math.floor(cx), Math.floor(cy));
  ctx.lineTo(Math.floor(cx + 28), Math.floor(cy + R + 18));
  ctx.stroke();
  // Cross brace
  ctx.beginPath();
  ctx.moveTo(Math.floor(cx - 18), Math.floor(cy + R + 4));
  ctx.lineTo(Math.floor(cx + 18), Math.floor(cy + R + 4));
  ctx.stroke();
  // Base platform
  f(ctx, cx - 32, cy + R + 14, 64, 8, "#6a5030");
  f(ctx, cx - 28, cy + R + 18, 56, 5, "#8a7050");

  // Wheel rim (outer)
  ctx.strokeStyle = "#c8a040";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  // Inner ring
  ctx.strokeStyle = "#a88030";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2);
  ctx.stroke();
  // Hub
  f(ctx, cx-5, cy-5, 10, 10, "#e0b040");
  f(ctx, cx-3, cy-3, 6, 6, "#f8d060");

  // Spokes (8)
  ctx.strokeStyle = "#b09030";
  ctx.lineWidth = 2;
  for (let s = 0; s < 8; s++) {
    const a = rotation + (s * Math.PI * 2) / 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }

  // Gondolas / cabins (6)
  const gondolaColors = ["#ff4444","#44aaff","#ffee44","#44ee44","#ff88ff","#ff8844"];
  for (let g = 0; g < 6; g++) {
    const a = rotation + (g * Math.PI * 2) / 6;
    const gx = cx + Math.cos(a) * R;
    const gy = cy + Math.sin(a) * R;
    // Hanging rod
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.floor(gx), Math.floor(gy));
    ctx.lineTo(Math.floor(gx), Math.floor(gy + 6));
    ctx.stroke();
    // Cabin box
    const gc = gondolaColors[g];
    f(ctx, gx - 6, gy + 5, 12, 10, gc);
    f(ctx, gx - 5, gy + 6, 10, 4, `rgba(255,255,255,0.3)`);
    // Window
    f(ctx, gx - 3, gy + 7, 6, 5, "#1a3040");
    f(ctx, gx - 2, gy + 8, 2, 2, "rgba(255,255,255,0.6)");
  }

  // Glow around wheel
  const grd = ctx.createRadialGradient(cx, cy, R-4, cx, cy, R+12);
  grd.addColorStop(0, "rgba(255,220,80,0.0)");
  grd.addColorStop(0.5, `rgba(255,220,80,${0.04 + Math.sin(time*3)*0.02})`);
  grd.addColorStop(1, "rgba(255,220,80,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, R+12, 0, Math.PI*2);
  ctx.fill();
}

function drawTicketBooth(ctx: Ctx, x: number, y: number) {
  const W = 30, H = 38;
  // Body
  f(ctx, x,   y+4, W, H-4, "#cc2020");
  // Stripes
  for (let s = 0; s < 4; s++) {
    f(ctx, x + s*8, y+4, 4, H-4, "#ffffff");
  }
  f(ctx, x, y+4, W, H-4, "rgba(0,0,0,0)"); // clip (browser ignores, just for logic)
  // Actual alternating
  for (let s = 0; s < 4; s++) {
    if (s % 2 === 0) f(ctx, x+s*8, y+4, 7, H-4, "rgba(255,255,255,0.25)");
  }
  // Roof (pointed)
  ctx.fillStyle = "#ee3030";
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 6);
  ctx.lineTo(x + W/2, y - 4);
  ctx.lineTo(x + W + 3, y + 6);
  ctx.closePath();
  ctx.fill();
  // Window
  f(ctx, x+5, y+12, 20, 14, "#1a3040");
  f(ctx, x+7, y+14, 16, 6, "#3a80b0");
  f(ctx, x+8, y+15, 5, 4, "rgba(255,255,255,0.5)");
  // Counter shelf
  f(ctx, x+3, y+24, 24, 4, "#8a5020");
  // Sign
  f(ctx, x+2, y+7, 26, 8, "#ffee00");
  ctx.fillStyle = "#cc0000";
  ctx.font = "bold 6px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("TICKETS", x + W/2, y + 11);
}

function drawBalloonStand(ctx: Ctx, x: number, y: number, time: number) {
  // Pole
  f(ctx, x+4, y, 3, 40, "#6a4820");
  f(ctx, x+5, y, 1, 40, "#9a7050");
  // Base
  f(ctx, x, y+36, 12, 6, "#5a3818");
  // Balloons on strings
  const balloonColors = ["#ff2020","#2080ff","#ffee00","#20cc20","#ff80ff","#ff8800"];
  for (let b = 0; b < 6; b++) {
    const bx = x - 10 + (b % 3) * 14;
    const by = y - 20 - Math.floor(b / 3) * 18;
    const bob = Math.sin(time * 1.8 + b * 1.1) * 3;
    // String
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.floor(x + 5), Math.floor(y + 2));
    ctx.lineTo(Math.floor(bx + 5), Math.floor(by + 16 + bob));
    ctx.stroke();
    // Balloon
    const bc = balloonColors[b];
    f(ctx, bx, by + bob, 11, 14, bc);
    f(ctx, bx+2, by+bob, 7, 10, bc);
    // Highlight
    f(ctx, bx+2, by+1+bob, 4, 4, "rgba(255,255,255,0.45)");
    // Tie
    f(ctx, bx+4, by+14+bob, 3, 3, "#5a3010");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CAT NPCs (wandering in the cat park)
// ─────────────────────────────────────────────────────────────────────────────

export interface Dog {
  x: number;       // pixel X in world space
  y: number;       // pixel Y
  tx: number;      // target X
  ty: number;      // target Y
  color: string;
  color2: string;  // underbelly
  speed: number;
  animTimer: number;
  animFrame: number;
  sitting: boolean;
  sitTimer: number;
  // park bounds (pixel space)
  minX: number; maxX: number;
  minY: number; maxY: number;
}

const DOG_COLORS = [
  ["#d89040","#f0c078"],  // orange tabby
  ["#303030","#606060"],  // black cat
  ["#e8e0d0","#c8b8a0"],  // cream cat
  ["#8a6848","#c8a080"],  // brown cat
  ["#c8c8c8","#f0f0f0"],  // grey/white cat
];

export function createDogs(parkPixelX: number, parkPixelY: number, parkW: number, parkH: number): Dog[] {
  return Array.from({ length: 5 }, (_, i) => {
    const [color, color2] = DOG_COLORS[i % DOG_COLORS.length];
    const x = parkPixelX + 20 + Math.random() * (parkW - 40);
    const y = parkPixelY + 20 + Math.random() * (parkH - 40);
    return {
      x, y, tx: x, ty: y,
      color, color2,
      speed: 20 + Math.random() * 18,
      animTimer: 0,
      animFrame: 0,
      sitting: false,
      sitTimer: Math.random() * 2000,
      minX: parkPixelX + 10,
      maxX: parkPixelX + parkW - 30,
      minY: parkPixelY + 10,
      maxY: parkPixelY + parkH - 30,
    };
  });
}

export function updateDogs(dogs: Dog[], dt: number): void {
  for (const dog of dogs) {
    dog.animTimer += dt;

    if (dog.sitting) {
      dog.sitTimer -= dt;
      if (dog.sitTimer <= 0) {
        dog.sitting = false;
        dog.sitTimer = 3000 + Math.random() * 4000;
        // Pick new wander target inside the cat park
        dog.tx = dog.minX + Math.random() * (dog.maxX - dog.minX);
        dog.ty = dog.minY + Math.random() * (dog.maxY - dog.minY);
      }
      continue;
    }

    // Move toward target
    const dx = dog.tx - dog.x;
    const dy = dog.ty - dog.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 4) {
      // Reached target — loaf/sit for a bit
      dog.sitting = true;
      dog.sitTimer = 1500 + Math.random() * 3000;
    } else {
      const spd = dog.speed * (dt / 1000);
      dog.x += (dx / dist) * spd;
      dog.y += (dy / dist) * spd;
      if (dog.animTimer > 120) {
        dog.animTimer = 0;
        dog.animFrame = (dog.animFrame + 1) % 4;
      }
    }
  }
}

export function drawDog(ctx: Ctx, dog: Dog, cam: { x: number; y: number }) {
  const sx = Math.floor(dog.x - cam.x);
  const sy = Math.floor(dog.y - cam.y);
  const fr = dog.animFrame;
  const sitting = dog.sitting;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(sx+1, sy+14, 15, 4);

  if (sitting) {
    // Sitting/loafing cat
    // Loaf body
    f(ctx, sx+2, sy+7, 13, 8, dog.color);
    f(ctx, sx+3, sy+8, 11, 5, dog.color);
    // Belly / paws
    f(ctx, sx+4, sy+12, 7, 2, dog.color2);
    // Head
    f(ctx, sx+8, sy+2, 8, 7, dog.color);
    f(ctx, sx+9, sy+3, 6, 5, dog.color);
    // Triangle ears
    f(ctx, sx+8, sy, 3, 4, dog.color);
    f(ctx, sx+13, sy, 3, 4, dog.color);
    f(ctx, sx+9, sy+1, 1, 2, dog.color2);
    f(ctx, sx+14, sy+1, 1, 2, dog.color2);
    // Eyes
    f(ctx, sx+10, sy+5, 1, 2, "#101010");
    f(ctx, sx+14, sy+5, 1, 2, "#101010");
    // Nose/whiskers
    f(ctx, sx+12, sy+7, 2, 1, "#ffb0c0");
    f(ctx, sx+7, sy+7, 3, 1, "#f8f8f8");
    f(ctx, sx+15, sy+7, 3, 1, "#f8f8f8");
    // Curled tail
    f(ctx, sx, sy+8, 4, 3, dog.color);
    f(ctx, sx-1, sy+5, 3, 5, dog.color);
    return;
  }

  // Walking cat — small, stealthy 4-frame cycle
  const legOff = fr % 2 === 0 ? 2 : -2;

  // Body
  f(ctx, sx+2, sy+7, 14, 6, dog.color);
  f(ctx, sx+3, sy+8, 11, 3, dog.color2);

  // Head
  f(ctx, sx+12, sy+3, 8, 6, dog.color);
  f(ctx, sx+13, sy+4, 6, 4, dog.color);
  // Triangle ears
  f(ctx, sx+12, sy+1, 3, 4, dog.color);
  f(ctx, sx+17, sy+1, 3, 4, dog.color);
  // Eye
  f(ctx, sx+15, sy+5, 1, 2, "#101010");
  f(ctx, sx+18, sy+5, 1, 2, "#101010");
  // Nose/whiskers
  f(ctx, sx+19, sy+7, 2, 1, "#ffb0c0");
  f(ctx, sx+16, sy+7, 3, 1, "#f8f8f8");
  f(ctx, sx+20, sy+7, 3, 1, "#f8f8f8");

  // Legs (alternating)
  f(ctx, sx+3,  sy+11+legOff, 2, 5, dog.color);
  f(ctx, sx+8,  sy+11-legOff, 2, 5, dog.color);
  f(ctx, sx+12, sy+11-legOff, 2, 5, dog.color);
  f(ctx, sx+15, sy+11+legOff, 2, 5, dog.color);

  // Long curved tail (swishes)
  const tailWag = Math.sin(dog.animTimer / 80) * 3;
  f(ctx, sx, sy+5+tailWag, 5, 3, dog.color);
  f(ctx, sx-2, sy+2+tailWag, 3, 5, dog.color);
}
