import { useEffect, useRef, useState, useCallback } from "react";
import { TILE_SIZE, MAP_COLS, MAP_ROWS, BUILDINGS, NPC } from "../game/constants";
import { generateMap, isSolid } from "../game/mapGenerator";
import {
  drawTile, drawBuilding, drawPlayer, drawNPC, drawMiniMap, drawLamp, drawFountain,
} from "../game/renderer";
import {
  Vehicle, createInitialVehicles, updateVehicles, recycleVehicles, getVehicleSize,
  spawnVehicle, H_ROADS, V_ROADS, VehicleType, getVehicleLength,
} from "../game/vehicles";
import { drawVehicle, drawVehicleOnMinimap } from "../game/vehicleRenderer";
import {
  Dog as Cat,
  createDogs as createCats,
  updateDogs as updateCats,
  drawDog as drawCat,
  drawPark, drawCarnival,
} from "../game/decorations";
import ContentOverlay from "./ContentOverlay";

// ── Map zone constants ─────────────────────────────────────────────────────
const PARK_TILE_X = 12, PARK_TILE_Y = 24, PARK_TILE_W = 7, PARK_TILE_H = 6;
const CARN_TILE_X = 22, CARN_TILE_Y = 24, CARN_TILE_W = 7, CARN_TILE_H = 6;

// ── Types ──────────────────────────────────────────────────────────────────
interface PlayerLogical {
  x: number; y: number; direction: number; animFrame: number; moving: boolean;
}
interface PlayerRender {
  px: number; py: number; direction: number; animFrame: number; isMoving: boolean;
}

const MOVE_SPEED = 5.5;
const MOVE_DELAY = 160;
const WALK_FREQ  = 7.0;

const LAMP_POSITIONS = [
  [8,8],[8,19],[12,8],[18,8],[22,8],[28,8],
  [8,12],[8,22],[12,19],[18,19],[22,19],[28,19],
];

const INITIAL_NPCS: NPC[] = [
  {
    id:"npc1", x:14, y:11, color:"#e05030", direction:0, moveTimer:0,
    path:[{x:14,y:11},{x:15,y:11},{x:16,y:11},{x:17,y:11},{x:17,y:12},{x:16,y:12},{x:15,y:12},{x:14,y:12},{x:14,y:11}],
    pathIndex:0, name:"Villager",
    dialogue:"Welcome to Rammyl's Town! Explore the buildings to learn more!",
  },
  {
    id:"npc2", x:25, y:21, color:"#30a860", direction:1, moveTimer:0,
    path:[{x:25,y:21},{x:25,y:20},{x:26,y:20},{x:26,y:21},{x:25,y:21}],
    pathIndex:0, name:"Guide",
    dialogue:"Press E or Space near buildings to explore. WASD / Arrow keys to move!",
  },
  {
    id:"npc3", x:5, y:21, color:"#c060e0", direction:2, moveTimer:150,
    path:[{x:5,y:21},{x:6,y:21},{x:7,y:21},{x:7,y:20},{x:6,y:20},{x:5,y:20},{x:5,y:21}],
    pathIndex:0, name:"Merchant",
    dialogue:"The coffee shop gives +5 cozy stat. Very recommended!",
  },
  {
    id:"npc4", x:15, y:21, color:"#e0a030", direction:0, moveTimer:300,
    path:[{x:15,y:21},{x:16,y:21},{x:16,y:20},{x:15,y:20},{x:15,y:21}],
    pathIndex:0, name:"Traveler",
    dialogue:"I heard the IT Specialist here is top-notch. 5 stars! ★★★★★",
  },
];

const map = generateMap();

// ── Spawn timer config ─────────────────────────────────────────────────────
const VEHICLE_TYPES: VehicleType[] = ["car","car","car","bus","tricycle","truck","car","car","tricycle"];
const SPAWN_INTERVAL_MS = 4500;  // spawn a new vehicle every N ms

export default function PixelGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const logRef = useRef<PlayerLogical>({ x:15, y:22, direction:0, animFrame:0, moving:false });
  const renRef = useRef<PlayerRender>({
    px: 15 * TILE_SIZE, py: 22 * TILE_SIZE, direction:0, animFrame:0, isMoving:false,
  });
  const npcsRef     = useRef<NPC[]>(JSON.parse(JSON.stringify(INITIAL_NPCS)));
  const vehiclesRef = useRef<Vehicle[]>(createInitialVehicles());
  const catsRef     = useRef<Cat[]>(createCats(
    PARK_TILE_X * TILE_SIZE + TILE_SIZE,
    PARK_TILE_Y * TILE_SIZE + TILE_SIZE,
    (PARK_TILE_W - 2) * TILE_SIZE,
    (PARK_TILE_H - 2) * TILE_SIZE
  ));
  const spawnTimerRef = useRef<number>(0);

  const keysRef       = useRef<Set<string>>(new Set());
  const animRef       = useRef<number>(0);
  const lastTimeRef   = useRef<number>(0);
  const globalTimeRef = useRef<number>(0);
  const globalFrameRef= useRef<number>(0);
  const moveAccRef    = useRef<number>(MOVE_DELAY);
  const heldRef       = useRef<boolean>(false);
  const camRef        = useRef({ x: 15*TILE_SIZE, y: 22*TILE_SIZE });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [notification,  setNotification]  = useState<string>(
    "Welcome to Rammyl's Town! WASD/Arrows to move, E to interact."
  );
  const [showControls, setShowControls] = useState(true);
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setNotification(""), 5000);
    return () => clearTimeout(t);
  }, []);

  const showNotif = useCallback((msg: string, dur = 3000) => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification(msg);
    notifTimerRef.current = setTimeout(() => setNotification(""), dur);
  }, []);

  const getTargetCam = useCallback((px: number, py: number, W: number, H: number) => {
    const tx = px - W/2 + TILE_SIZE/2;
    const ty = py - H/2 + TILE_SIZE/2;
    return {
      x: Math.max(0, Math.min(tx, MAP_COLS*TILE_SIZE - W)),
      y: Math.max(0, Math.min(ty, MAP_ROWS*TILE_SIZE - H)),
    };
  }, []);

  const checkInteraction = useCallback(() => {
    const p = logRef.current;
    for (const bldg of BUILDINGS) {
      if (Math.abs(p.x - bldg.interactX) + Math.abs(p.y - bldg.interactY) <= 2) {
        setActiveSection(bldg.section); return;
      }
    }
    for (const npc of npcsRef.current) {
      if (Math.abs(p.x - npc.x) + Math.abs(p.y - npc.y) <= 1) {
        showNotif(npc.dialogue, 6000); return;
      }
    }
  }, [showNotif]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
      if ((e.key==="e"||e.key===" "||e.key==="Enter") && !activeSection) checkInteraction();
      if (e.key==="Escape" && activeSection) setActiveSection(null);
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [activeSection, checkInteraction]);

  // ── NPC–NPC solid check ──────────────────────────────────────────────────
  const isNpcAt = useCallback((tx: number, ty: number, excludeId?: string): boolean => {
    for (const npc of npcsRef.current) {
      if (npc.id === excludeId) continue;
      if (npc.x === tx && npc.y === ty) return true;
    }
    return false;
  }, []);

  // ── Player–vehicle check (tile-level) ───────────────────────────────────
  const isVehicleAt = useCallback((tx: number, ty: number): boolean => {
    const pxX = tx * TILE_SIZE + TILE_SIZE / 2;
    const pxY = ty * TILE_SIZE + TILE_SIZE / 2;
    for (const v of vehiclesRef.current) {
      const len = getVehicleLength(v);
      const thick = v.axis === "h"
        ? (v.type === "bus" ? 30 : v.type === "truck" ? 30 : v.type === "car" ? 28 : 24)
        : (v.type === "bus" ? 30 : v.type === "truck" ? 30 : v.type === "car" ? 28 : 24);
      const laneCenter = v.lane * TILE_SIZE + TILE_SIZE / 2;
      // Front bumper pos
      const front = v.dir === 1 ? v.pos + len : v.pos;
      const rear  = v.dir === 1 ? v.pos       : v.pos - len;
      if (v.axis === "h") {
        const minX = Math.min(front, rear);
        const maxX = Math.max(front, rear);
        if (pxX >= minX && pxX <= maxX && Math.abs(pxY - laneCenter) < thick / 2 + 4) return true;
      } else {
        const minY = Math.min(front, rear);
        const maxY = Math.max(front, rear);
        if (pxY >= minY && pxY <= maxY && Math.abs(pxX - laneCenter) < thick / 2 + 4) return true;
      }
    }
    return false;
  }, []);

  const updateNPCs = useCallback((dt: number) => {
    for (const npc of npcsRef.current) {
      npc.moveTimer += dt;
      if (npc.moveTimer > 650) {
        npc.moveTimer = 0;
        npc.pathIndex = (npc.pathIndex+1) % npc.path.length;
        const t = npc.path[npc.pathIndex];
        const player = logRef.current;
        const playerOccupiesTarget = player.x === t.x && player.y === t.y;
        // Don't move if destination is occupied by another NPC, player, solid tile, or vehicle.
        if (!isNpcAt(t.x, t.y, npc.id) && !playerOccupiesTarget && !isSolid(map, t.x, t.y) && !isVehicleAt(t.x, t.y)) {
          const ddx = t.x - npc.x, ddy = t.y - npc.y;
          npc.direction = ddx>0?3:ddx<0?2:ddy>0?0:1;
          npc.x = t.x; npc.y = t.y;
        }
        // else stay in place this tick
      }
    }
  }, [isNpcAt, isVehicleAt]);

  const tryStep = useCallback(() => {
    if (activeSection) return;
    const p = logRef.current;
    const keys = keysRef.current;
    let dx=0, dy=0;
    if (keys.has("arrowleft")||keys.has("a"))       { dx=-1; p.direction=2; }
    else if (keys.has("arrowright")||keys.has("d")) { dx= 1; p.direction=3; }
    else if (keys.has("arrowup")||keys.has("w"))    { dy=-1; p.direction=1; }
    else if (keys.has("arrowdown")||keys.has("s"))  { dy= 1; p.direction=0; }
    renRef.current.direction = p.direction;
    if (!dx && !dy) { heldRef.current=false; return; }
    heldRef.current = true;
    const nx=p.x+dx, ny=p.y+dy;
    // Block: map solid, NPC occupying tile, or vehicle on that tile
    if (!isSolid(map, nx, ny) && !isNpcAt(nx, ny) && !isVehicleAt(nx, ny)) {
      p.x=nx; p.y=ny; p.moving=true; p.animFrame++;
      for (const bldg of BUILDINGS) {
        if (Math.abs(p.x-bldg.interactX)+Math.abs(p.y-bldg.interactY)<=2) {
          showNotif(`Press [E] to enter — ${bldg.sign||bldg.label}`, 2200); break;
        }
      }
    }
  }, [activeSection, showNotif]);

  // ── Collect pedestrian pixel positions (for vehicle collision) ────────────
  const getPedPositions = useCallback((): { x: number; y: number }[] => {
    const log = logRef.current;
    const ren = renRef.current;
    const peds: { x: number; y: number }[] = [
      // Player — use smooth rendered pos + half tile to get center
      { x: ren.px + TILE_SIZE/2, y: ren.py + TILE_SIZE/2 },
    ];
    for (const npc of npcsRef.current) {
      peds.push({ x: npc.x*TILE_SIZE + TILE_SIZE/2, y: npc.y*TILE_SIZE + TILE_SIZE/2 });
    }
    // Suppress unused warning on log
    void log;
    return peds;
  }, []);

  // ── Spawn new vehicle on a random lane ───────────────────────────────────
  const spawnNewVehicle = useCallback(() => {
    const type = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
    const useH = Math.random() < 0.6;
    if (useH) {
      const road = H_ROADS[Math.floor(Math.random() * H_ROADS.length)];
      vehiclesRef.current.push(spawnVehicle(type, "h", road.row, road.dir));
    } else {
      const road = V_ROADS[Math.floor(Math.random() * V_ROADS.length)];
      vehiclesRef.current.push(spawnVehicle(type, "v", road.col, road.dir));
    }
    // Keep max 20 vehicles to avoid overcrowding
    if (vehiclesRef.current.length > 20) {
      vehiclesRef.current.shift();
    }
  }, []);

  // ── Main render loop ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    renRef.current.px = logRef.current.x * TILE_SIZE;
    renRef.current.py = logRef.current.y * TILE_SIZE;

    const loop = (ts: number) => {
      const dt = Math.min(ts - lastTimeRef.current, 50);
      lastTimeRef.current = ts;
      globalTimeRef.current += dt/1000;
      globalFrameRef.current += dt/200;

      updateNPCs(dt);
      updateCats(catsRef.current, dt);

      // ── Vehicle update ──
      const peds = getPedPositions();
      updateVehicles(vehiclesRef.current, dt, peds);
      recycleVehicles(vehiclesRef.current);

      // ── Spawn timer ──
      spawnTimerRef.current += dt;
      if (spawnTimerRef.current >= SPAWN_INTERVAL_MS) {
        spawnTimerRef.current = 0;
        spawnNewVehicle();
      }

      // ── Player step ──
      const keys = keysRef.current;
      const anyDir = keys.has("arrowleft")||keys.has("a")||keys.has("arrowright")||keys.has("d")||
                     keys.has("arrowup")||keys.has("w")||keys.has("arrowdown")||keys.has("s");
      if (anyDir && !activeSection) {
        moveAccRef.current += dt;
        const threshold = heldRef.current ? 1000/MOVE_SPEED : MOVE_DELAY;
        if (moveAccRef.current >= threshold) { moveAccRef.current=0; tryStep(); }
      } else {
        moveAccRef.current = heldRef.current ? 1000/MOVE_SPEED : MOVE_DELAY;
        heldRef.current = false;
        logRef.current.moving = false;
      }

      // ── Lerp player render pos ──
      const log = logRef.current;
      const ren = renRef.current;
      const targetPx = log.x * TILE_SIZE;
      const targetPy = log.y * TILE_SIZE;
      const lf = Math.min(1, (dt/1000) * MOVE_SPEED * 9);
      ren.px += (targetPx - ren.px) * lf;
      ren.py += (targetPy - ren.py) * lf;
      ren.direction = log.direction;
      const pixDist = Math.abs(targetPx-ren.px) + Math.abs(targetPy-ren.py);
      ren.isMoving = log.moving || pixDist > 0.5;
      ren.animFrame = ren.isMoving ? ren.animFrame + (dt/1000)*WALK_FREQ : 0;

      // ── Camera lerp ──
      const cam = camRef.current;
      const W = canvas.width, H = canvas.height;
      const tCam = getTargetCam(ren.px, ren.py, W, H);
      const cl = Math.min(1, (dt/1000)*10);
      cam.x += (tCam.x - cam.x)*cl;
      cam.y += (tCam.y - cam.y)*cl;

      const ctx = canvas.getContext("2d");
      if (!ctx) { animRef.current = requestAnimationFrame(loop); return; }
      const time = globalTimeRef.current;
      const gf   = globalFrameRef.current;

      // ── Clear ──
      ctx.fillStyle = "#1c2418";
      ctx.fillRect(0, 0, W, H);

      // ── Tiles ──
      const x0=Math.max(0,Math.floor(cam.x/TILE_SIZE)-1);
      const y0=Math.max(0,Math.floor(cam.y/TILE_SIZE)-1);
      const x1=Math.min(MAP_COLS, x0+Math.ceil(W/TILE_SIZE)+3);
      const y1=Math.min(MAP_ROWS, y0+Math.ceil(H/TILE_SIZE)+3);
      for (let ty=y0; ty<y1; ty++)
        for (let tx=x0; tx<x1; tx++)
          drawTile(ctx, map[ty][tx], tx, ty, tx*TILE_SIZE-cam.x, ty*TILE_SIZE-cam.y, gf);

      // Ambient
      const dayG = ctx.createLinearGradient(0,0,0,H);
      dayG.addColorStop(0,"rgba(200,220,255,0.022)");
      dayG.addColorStop(1,"rgba(255,180,80,0.022)");
      ctx.fillStyle = dayG; ctx.fillRect(0,0,W,H);

      // ── Fountain ──
      drawFountain(ctx, 15, 11, cam, time);

      // ── Lamps ──
      for (const [lx,ly] of LAMP_POSITIONS) {
        const lsx=lx*TILE_SIZE-cam.x, lsy=ly*TILE_SIZE-cam.y;
        if (lsx>-80&&lsx<W+80&&lsy>-80&&lsy<H+80) drawLamp(ctx,lx,ly,cam,time);
      }

      // ── Buildings ──
      for (const bldg of BUILDINGS) {
        const bsx=bldg.x*TILE_SIZE-cam.x, bsy=bldg.y*TILE_SIZE-cam.y;
        if (bsx+bldg.width*TILE_SIZE>-64&&bsx<W+64&&bsy+bldg.height*TILE_SIZE>-64&&bsy<H+64)
          drawBuilding(ctx, bldg, cam, time);
      }

      // ── Park decorations ──
      const parkWX = PARK_TILE_X * TILE_SIZE - cam.x;
      const parkWY = PARK_TILE_Y * TILE_SIZE - cam.y;
      const parkPxW = PARK_TILE_W * TILE_SIZE;
      const parkPxH = PARK_TILE_H * TILE_SIZE;
      if (parkWX + parkPxW > -64 && parkWX < W + 64 && parkWY + parkPxH > -64 && parkWY < H + 64) {
        drawPark(ctx, parkWX, parkWY, parkPxW, parkPxH, time);
      }

      // ── Carnival decorations ──
      const carnWX = CARN_TILE_X * TILE_SIZE - cam.x;
      const carnWY = CARN_TILE_Y * TILE_SIZE - cam.y;
      const carnPxW = CARN_TILE_W * TILE_SIZE;
      const carnPxH = CARN_TILE_H * TILE_SIZE;
      if (carnWX + carnPxW > -64 && carnWX < W + 64 && carnWY + carnPxH > -64 && carnWY < H + 64) {
        drawCarnival(ctx, carnWX, carnWY, carnPxW, carnPxH, time);
      }

      // ── Vehicles (behind NPCs/player so they appear "on road") ──
      for (const v of vehiclesRef.current) {
        const vs = getVehicleSize(v);
        const vsx = v.axis==="h" ? v.pos-cam.x : v.lane*TILE_SIZE-cam.x;
        const vsy = v.axis==="h" ? v.lane*TILE_SIZE-cam.y : v.pos-cam.y;
        if (vsx+vs.w>-80&&vsx<W+80&&vsy+vs.h>-80&&vsy<H+80)
          drawVehicle(ctx, v, cam);
      }

      // ── Cats (in cat park) ──
      for (const cat of catsRef.current) {
        const dsx = cat.x - cam.x, dsy = cat.y - cam.y;
        if (dsx > -64 && dsx < W+64 && dsy > -64 && dsy < H+64)
          drawCat(ctx, cat, cam);
      }

      // ── NPCs ──
      for (const npc of npcsRef.current) {
        const ns=npc.x*TILE_SIZE-cam.x, nt=npc.y*TILE_SIZE-cam.y;
        if (ns>-64&&ns<W+64&&nt>-64&&nt<H+64) drawNPC(ctx, npc, cam, gf);
      }

      // ── Player ──
      drawPlayer(ctx,
        { x:ren.px/TILE_SIZE, y:ren.py/TILE_SIZE, direction:ren.direction, animFrame:ren.animFrame, isMoving:ren.isMoving },
        { x:cam.x, y:cam.y });

      // CRT scanlines
      ctx.fillStyle="rgba(0,0,0,0.03)";
      for (let sl=0; sl<H; sl+=4) ctx.fillRect(0,sl,W,1);

      // ── Minimap ──
      drawMinimapWithVehicles(ctx, map, log, vehiclesRef.current, W, H);

      // Vignette
      const vig=ctx.createRadialGradient(W/2,H/2,H*0.22,W/2,H/2,H*0.9);
      vig.addColorStop(0,"rgba(0,0,0,0)");
      vig.addColorStop(1,"rgba(0,0,0,0.42)");
      ctx.fillStyle=vig; ctx.fillRect(0,0,W,H);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, [getTargetCam, updateNPCs, tryStep, getPedPositions, spawnNewVehicle, activeSection]);

  const touchStep = useCallback((dir: string) => {
    const p = logRef.current;
    const m: Record<string, {dx:number;dy:number;d:number}> = {
      up:{dx:0,dy:-1,d:1}, down:{dx:0,dy:1,d:0}, left:{dx:-1,dy:0,d:2}, right:{dx:1,dy:0,d:3},
    };
    const mv=m[dir]; if(!mv) return;
    p.direction=mv.d; renRef.current.direction=mv.d;
    const nx=p.x+mv.dx, ny=p.y+mv.dy;
    if (!isSolid(map,nx,ny)) { p.x=nx; p.y=ny; p.moving=true; p.animFrame++; }
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      <canvas ref={canvasRef} className="absolute inset-0" style={{ imageRendering:"pixelated" }} />

      {/* ── TOP NAV BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5"
        style={{ background:"rgba(8,12,20,0.9)", borderBottom:"2px solid rgba(200,160,30,0.3)" }}>
        <div className="flex items-center gap-2">
          <button onClick={onExit}
            className="px-3 py-1 font-mono text-xs text-yellow-400 transition-all"
            style={{ background:"rgba(20,30,50,0.9)", border:"2px solid rgba(200,160,30,0.6)", boxShadow:"2px 2px 0 rgba(0,0,0,0.5)" }}
            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(200,160,30,0.2)"}
            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(20,30,50,0.9)"}
          >◄ EXIT</button>
          <div className="hidden sm:flex items-center gap-1.5 pl-2">
            <span className="text-white font-mono font-bold text-sm tracking-wide">RAMMYL</span>
            <span className="text-yellow-600 font-mono text-xs">MATABALAN</span>
            <span className="text-gray-600 font-mono text-xs pl-1">· PORTFOLIO ·</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {BUILDINGS.filter(b=>b.id!=="coffee").map(bldg=>(
            <button key={bldg.id} onClick={()=>setActiveSection(bldg.section)}
              className="px-2.5 py-1 font-mono text-xs text-gray-200 transition-all hidden sm:block"
              style={{ background:"rgba(30,40,60,0.9)", border:"2px solid rgba(150,160,180,0.4)", boxShadow:"2px 2px 0 rgba(0,0,0,0.5)" }}
              onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="rgba(200,160,30,0.25)";b.style.borderColor="rgba(200,160,30,0.8)";b.style.color="#ffd700";}}
              onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="rgba(30,40,60,0.9)";b.style.borderColor="rgba(150,160,180,0.4)";b.style.color="#e0e0e0";}}
            >{bldg.sign}</button>
          ))}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="px-5 py-2.5 font-mono text-sm text-yellow-200 text-center max-w-sm"
            style={{ background:"rgba(5,10,20,0.92)", border:"2px solid #c8a020", boxShadow:"2px 2px 0 rgba(0,0,0,0.6)" }}>
            <span className="text-yellow-500">▸ </span>{notification}
          </div>
        </div>
      )}

      {/* Controls hint */}
      {showControls && (
        <div className="absolute z-10 font-mono text-xs"
          style={{ bottom:"168px", left:"12px", background:"rgba(5,10,20,0.88)", border:"1px solid rgba(100,120,160,0.4)", padding:"8px 12px" }}>
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-yellow-500 font-bold tracking-wider">CONTROLS</span>
            <button onClick={()=>setShowControls(false)} className="text-gray-600 hover:text-white">✕</button>
          </div>
          <div className="text-gray-400 space-y-0.5">
            <div>WASD / ↑↓←→ — Move</div>
            <div>E / Space — Interact</div>
            <div>Watch out for traffic! 🚗</div>
          </div>
        </div>
      )}

      {/* Mobile D-pad */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 md:hidden">
        <div className="grid grid-cols-3 gap-1.5">
          <div />
          <button onTouchStart={e=>{e.preventDefault();touchStep("up");}}
            className="w-14 h-14 font-bold text-2xl text-yellow-400 flex items-center justify-center active:opacity-60"
            style={{background:"rgba(5,10,20,0.88)",border:"2px solid rgba(200,160,30,0.6)"}}>↑</button>
          <button onTouchStart={e=>{e.preventDefault();checkInteraction();}}
            className="w-14 h-14 font-bold text-sm text-green-400 flex items-center justify-center active:opacity-60 font-mono"
            style={{background:"rgba(5,10,20,0.88)",border:"2px solid rgba(80,200,80,0.6)"}}>E</button>
          <button onTouchStart={e=>{e.preventDefault();touchStep("left");}}
            className="w-14 h-14 font-bold text-2xl text-yellow-400 flex items-center justify-center active:opacity-60"
            style={{background:"rgba(5,10,20,0.88)",border:"2px solid rgba(200,160,30,0.6)"}}>←</button>
          <div className="w-14 h-14 flex items-center justify-center opacity-25"
            style={{border:"1px solid rgba(200,160,30,0.3)"}}>
            <div className="w-4 h-4 bg-yellow-700"/>
          </div>
          <button onTouchStart={e=>{e.preventDefault();touchStep("right");}}
            className="w-14 h-14 font-bold text-2xl text-yellow-400 flex items-center justify-center active:opacity-60"
            style={{background:"rgba(5,10,20,0.88)",border:"2px solid rgba(200,160,30,0.6)"}}>→</button>
          <div />
          <button onTouchStart={e=>{e.preventDefault();touchStep("down");}}
            className="w-14 h-14 font-bold text-2xl text-yellow-400 flex items-center justify-center active:opacity-60"
            style={{background:"rgba(5,10,20,0.88)",border:"2px solid rgba(200,160,30,0.6)"}}>↓</button>
          <div />
        </div>
      </div>

      {activeSection && (
        <ContentOverlay section={activeSection} onClose={()=>setActiveSection(null)} />
      )}
    </div>
  );
}

// ── Minimap with vehicles ─────────────────────────────────────────────────
function drawMinimapWithVehicles(
  ctx: CanvasRenderingContext2D,
  map: number[][],
  player: { x: number; y: number },
  vehicles: Vehicle[],
  W: number,
  H: number
) {
  // Draw base minimap
  drawMiniMap(ctx, map, { ...player, direction: 0, animFrame: 0 }, W, H);

  // Overlay vehicle dots
  const MS = 130;
  const MX = 12;
  const MY = H - MS - 12;
  const tW = MS / map[0].length;
  const tH = MS / map.length;

  for (const v of vehicles) {
    drawVehicleOnMinimap(ctx, v, MX, MY, tW, tH);
  }
}
