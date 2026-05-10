import { TILE_SIZE, MAP_COLS, MAP_ROWS } from "./constants";

export type VehicleType = "car" | "bus" | "tricycle" | "truck" | "schoolbus";
export type VehicleAxis = "h" | "v";

export interface Vehicle {
  id: number;
  type: VehicleType;
  axis: VehicleAxis;
  dir: 1 | -1;
  lane: number;       // tile-row (h) or tile-col (v) the vehicle travels on
  pos: number;        // pixel position along the axis (front edge when dir=1, rear when dir=-1)
  speed: number;      // base (desired) speed px/s
  currentSpeed: number; // actual speed this frame (after traffic logic)
  stopped: boolean;
  stopTimer: number;
  color: string;
  color2: string;
  wheelAnim: number;
}

// ── Road lane definitions ──────────────────────────────────────────────────
// 2-lane roads: vehicles drive on adjacent tiles in opposite directions
export const H_ROADS: { row: number; dir: 1 | -1 }[] = [
  { row: 10, dir:  1 },   // top road: right-bound
  { row: 11, dir: -1 },   // top road: left-bound
  { row: 21, dir:  1 },   // bottom road: right-bound
  { row: 22, dir: -1 },   // bottom road: left-bound
];

export const V_ROADS: { col: number; dir: 1 | -1 }[] = [
  { col:  9, dir:  1 },   // left road: down-bound
  { col: 10, dir: -1 },   // left road: up-bound
  { col: 19, dir:  1 },   // right road: down-bound
  { col: 20, dir: -1 },   // right road: up-bound
];

// Vehicle pixel sizes [w × h] when travelling horizontally
const VEHICLE_SIZES: Record<VehicleType, { w: number; h: number }> = {
  car:       { w: 48, h: 28 },
  bus:       { w: 80, h: 30 },
  tricycle:  { w: 38, h: 24 },
  truck:     { w: 76, h: 30 },
  schoolbus: { w: 84, h: 30 },
};

const VEHICLE_SPEEDS: Record<VehicleType, number> = {
  car:       88,
  bus:       55,
  tricycle:  48,
  truck:     65,
  schoolbus: 50,
};

// ── Color palettes ─────────────────────────────────────────────────────────
const CAR_COLORS = [
  ["#e02020","#c01010"], ["#2060e0","#1040b0"], ["#20c040","#108030"],
  ["#f0c000","#c09000"], ["#c020c0","#800880"], ["#20c0c0","#008888"],
  ["#e08020","#b05010"], ["#e0e0e0","#b0b0b0"], ["#ff6688","#cc3355"],
];
const BUS_COLORS = [
  ["#f0c000","#c09000"], ["#e06020","#b03010"], ["#2080e0","#1050b0"],
];
const TRUCK_COLORS = [
  ["#808080","#505050"], ["#4060a0","#283060"],
  ["#e04020","#901010"], ["#408040","#205020"],
];
const TRICYCLE_COLORS = [
  ["#f0a000","#b07000"], ["#20b0e0","#1070a0"], ["#e02060","#901040"],
];
// School bus: classic American yellow
const SCHOOLBUS_COLORS = [
  ["#f8c800","#c89800"],
];

let _nextId = 1;

function randColor(palette: string[][]): [string, string] {
  const c = palette[Math.floor(Math.random() * palette.length)];
  return [c[0], c[1]];
}

// ── Get the length of a vehicle along its axis of travel ──────────────────
export function getVehicleLength(v: Vehicle): number {
  return v.axis === "h" ? VEHICLE_SIZES[v.type].w : VEHICLE_SIZES[v.type].h;
}

export function getVehicleSize(v: Vehicle): { w: number; h: number } {
  const base = VEHICLE_SIZES[v.type];
  return v.axis === "h"
    ? { w: base.w, h: base.h }
    : { w: base.h, h: base.w };
}

// ── Spawn a vehicle ────────────────────────────────────────────────────────
export function spawnVehicle(
  type: VehicleType,
  axis: VehicleAxis,
  lane: number,
  dir: 1 | -1
): Vehicle {
  let color: string, color2: string;
  if      (type === "bus")       { [color, color2] = randColor(BUS_COLORS); }
  else if (type === "truck")     { [color, color2] = randColor(TRUCK_COLORS); }
  else if (type === "tricycle")  { [color, color2] = randColor(TRICYCLE_COLORS); }
  else if (type === "schoolbus") { [color, color2] = randColor(SCHOOLBUS_COLORS); }
  else                           { [color, color2] = randColor(CAR_COLORS); }

  const mapPixels = axis === "h" ? MAP_COLS * TILE_SIZE : MAP_ROWS * TILE_SIZE;
  const len = VEHICLE_SIZES[type][axis === "h" ? "w" : "h"];
  // pos = position of the FRONT edge (dir=1) or REAR edge (dir=-1)
  const pos = dir === 1 ? -len - 8 : mapPixels + 8;
  const baseSpd = VEHICLE_SPEEDS[type] + (Math.random() - 0.5) * 16;

  return {
    id: _nextId++,
    type, axis, dir, lane, pos,
    speed: baseSpd,
    currentSpeed: baseSpd,
    stopped: false,
    stopTimer: 0,
    color, color2,
    wheelAnim: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  TRAFFIC LOGIC
//  "pos" represents the FRONT BUMPER position when dir=1,
//  or REAR BUMPER position when dir=-1.
//  So for dir=1 : front = pos,        rear  = pos - length
//     for dir=-1: front = pos + length, rear = pos
// ─────────────────────────────────────────────────────────────────────────────

function getFront(v: Vehicle): number {
  return v.dir === 1 ? v.pos + getVehicleLength(v) : v.pos;
}

function getRear(v: Vehicle): number {
  return v.dir === 1 ? v.pos : v.pos - getVehicleLength(v);
}

/**
 * Gap from this vehicle's nose to the rear bumper of the vehicle ahead.
 * Returns Infinity if no vehicle is in front on the same lane.
 */
function gapToVehicleAhead(v: Vehicle, others: Vehicle[]): number {
  const myNose   = getFront(v);
  const myLane   = v.lane;
  const myAxis   = v.axis;
  const myDir    = v.dir;

  let minGap = Infinity;

  for (const other of others) {
    if (other.id === v.id) continue;
    if (other.axis !== myAxis) continue;
    if (other.lane !== myLane) continue;
    if (other.dir  !== myDir)  continue; // opposite direction — different lane

    const otherRear = getRear(other);

    if (myDir === 1) {
      // We're going right/down — other is "ahead" if its rear is in front of our nose
      const gap = otherRear - myNose;
      if (gap > -4 && gap < minGap) minGap = gap; // -4 allows tiny overlap tolerance
    } else {
      // Going left/up — other's "rear" (which faces us) is its front edge
      const otherFront = getFront(other);
      const gap = myNose - otherFront;
      if (gap > -4 && gap < minGap) minGap = gap;
    }
  }

  return minGap;
}

// Pedestrian in front?
function isPedInFront(
  v: Vehicle,
  peds: { x: number; y: number }[],
  range: number
): boolean {
  const thick  = v.axis === "h" ? VEHICLE_SIZES[v.type].h : VEHICLE_SIZES[v.type].w;
  const laneCenter = v.lane * TILE_SIZE + TILE_SIZE / 2;

  for (const ped of peds) {
    const lateral = v.axis === "h" ? ped.y : ped.x;
    if (Math.abs(lateral - laneCenter) > thick * 0.62) continue;

    const pedLong = v.axis === "h" ? ped.x : ped.y;
    const vNose = getFront(v);
    if (v.dir === 1) {
      if (pedLong >= vNose && pedLong <= vNose + range) return true;
    } else {
      if (pedLong <= vNose && pedLong >= vNose - range) return true;
    }
  }
  return false;
}

// ── Intelligent Driver Model (simplified) ────────────────────────────────
//  Smooth follow: vehicle matches speed of leader + brakes for gap
const SAFE_GAP   = 10;   // px — minimum gap to maintain
const BRAKE_GAP  = 90;   // px — start easing at this gap
const STOP_GAP   =  6;   // px — hard stop if gap falls below this

export function updateVehicles(
  vehicles: Vehicle[],
  dt: number,
  peds: { x: number; y: number }[]
): void {
  const PED_STOP  = 48;
  const PED_SLOW  = 90;

  for (const v of vehicles) {
    // ── 1. Pedestrian check (hard stop) ──
    const pedStop = isPedInFront(v, peds, PED_STOP);
    const pedSlow = !pedStop && isPedInFront(v, peds, PED_SLOW);

    if (pedStop) {
      v.stopped = true;
      v.stopTimer += dt;
      v.currentSpeed = 0;
      continue;
    }

    // ── 2. Vehicle-ahead check ──
    const gap = gapToVehicleAhead(v, vehicles);

    let targetSpeed: number;

    if (gap <= STOP_GAP) {
      // Too close — hard stop
      v.stopped = true;
      v.stopTimer += dt;
      v.currentSpeed = 0;
      // Push back gently if actually overlapping
      if (gap < 0) {
        v.pos -= v.dir * Math.abs(gap) * 0.8;
      }
      continue;
    } else if (gap < SAFE_GAP) {
      // Very close — crawl
      targetSpeed = v.speed * 0.05;
      v.stopped = false;
      v.stopTimer = 0;
    } else if (gap < BRAKE_GAP) {
      // Approaching — proportionally slow down
      // At gap=SAFE_GAP → ~10% speed; at gap=BRAKE_GAP → 100% speed
      const t = (gap - SAFE_GAP) / (BRAKE_GAP - SAFE_GAP);
      targetSpeed = v.speed * Math.max(0.08, t * t); // quadratic for smoother feel
      v.stopped = false;
      v.stopTimer = 0;
    } else {
      // Clear road — full speed
      targetSpeed = pedSlow ? v.speed * 0.32 : v.speed;
      v.stopped = false;
      v.stopTimer = 0;
    }

    // ── 3. Smooth acceleration / deceleration ──
    // Decelerate faster than accelerate (like a real car)
    const accelRate  = 120 * (dt / 1000); // px/s per frame
    const brakeRate  = 280 * (dt / 1000);

    if (v.currentSpeed < targetSpeed) {
      v.currentSpeed = Math.min(targetSpeed, v.currentSpeed + accelRate);
    } else if (v.currentSpeed > targetSpeed) {
      v.currentSpeed = Math.max(targetSpeed, v.currentSpeed - brakeRate);
    }

    // ── 4. Move ──
    v.pos += v.dir * v.currentSpeed * (dt / 1000);
    v.wheelAnim += (v.currentSpeed / 24) * (dt / 1000) * 360;
  }
}

// ── Recycle vehicles that have left the map ────────────────────────────────
export function recycleVehicles(vehicles: Vehicle[]): void {
  const W = MAP_COLS * TILE_SIZE;
  const H = MAP_ROWS * TILE_SIZE;

  for (const v of vehicles) {
    const len   = getVehicleLength(v);
    const limit = v.axis === "h" ? W : H;
    const rear  = getRear(v);
    const front = getFront(v);

    if (v.dir === 1 && rear > limit + 16) {
      v.pos = -len - 8;
      v.currentSpeed = v.speed;
    } else if (v.dir === -1 && front < -16) {
      v.pos = limit + len + 8;
      v.currentSpeed = v.speed;
    }
  }
}

// ── Initial vehicle spread ─────────────────────────────────────────────────
const VTYPES: VehicleType[] = ["car","car","car","bus","tricycle","truck","schoolbus","car","tricycle"];

export function createInitialVehicles(): Vehicle[] {
  const vehicles: Vehicle[] = [];

  // Helper: spread N vehicles across a road with guaranteed minimum spacing
  function spreadVehicles(
    count: number,
    spread: number,
    dir: 1 | -1,
    minGap: number,
    offset: number
  ): number[] {
    const positions: number[] = [];
    // Place them evenly across the map so no two start too close
    const step = Math.max(minGap + 90, spread / (count + 1));
    for (let i = 0; i < count; i++) {
      const base = step * (i + 1) + offset + (Math.random() - 0.5) * 20;
      positions.push(dir === 1 ? base : spread - base);
    }
    return positions;
  }

  H_ROADS.forEach((road, ri) => {
    const count = 1;  // reduced from 2-3 → 1 vehicle per horizontal lane
    const spread = MAP_COLS * TILE_SIZE;
    const positions = spreadVehicles(count, spread, road.dir, 200, ri * 60);
    for (let i = 0; i < count; i++) {
      const type = VTYPES[Math.floor(Math.random() * VTYPES.length)];
      const v = spawnVehicle(type, "h", road.row, road.dir);
      v.pos = positions[i];
      v.currentSpeed = v.speed;
      vehicles.push(v);
    }
  });

  V_ROADS.forEach((road, ri) => {
    const count = 1;  // reduced from 1-2 → 1 vehicle per vertical lane
    const spread = MAP_ROWS * TILE_SIZE;
    const positions = spreadVehicles(count, spread, road.dir, 200, ri * 60);
    for (let i = 0; i < count; i++) {
      const type = VTYPES[Math.floor(Math.random() * VTYPES.length)];
      const v = spawnVehicle(type, "v", road.col, road.dir);
      v.pos = positions[i];
      v.currentSpeed = v.speed;
      vehicles.push(v);
    }
  });

  return vehicles;
}
