import { TILES, MAP_COLS, MAP_ROWS, BUILDINGS } from "./constants";

export function generateMap(): number[][] {
  // Initialize with grass
  const map: number[][] = Array.from({ length: MAP_ROWS }, () =>
    Array(MAP_COLS).fill(TILES.GRASS)
  );

  // ── ASPHALT ROADS (PATH_H = horizontal, PATH_V = vertical) ──────────────
  // Main horizontal roads
  for (let x = 0; x < MAP_COLS; x++) {
    map[10][x] = TILES.PATH_H;
    map[11][x] = TILES.PATH_H;
    map[12][x] = TILES.PATH_H;
  }
  for (let x = 0; x < MAP_COLS; x++) {
    map[21][x] = TILES.PATH_H;
    map[22][x] = TILES.PATH_H;
    map[23][x] = TILES.PATH_H;
  }
  // Main vertical roads
  for (let y = 0; y < MAP_ROWS; y++) {
    map[y][9] = TILES.PATH_V;
    map[y][10] = TILES.PATH_V;
    map[y][11] = TILES.PATH_V;
  }
  for (let y = 0; y < MAP_ROWS; y++) {
    map[y][19] = TILES.PATH_V;
    map[y][20] = TILES.PATH_V;
    map[y][21] = TILES.PATH_V;
  }

  // ── STONE SIDEWALKS ──────────────────────────────────────────────────────
  // Around top district blocks (rows 8-9)
  for (let x = 2; x <= 8; x++)  { map[8][x] = TILES.STONE; map[9][x] = TILES.STONE; }
  for (let x = 12; x <= 18; x++) { map[8][x] = TILES.STONE; map[9][x] = TILES.STONE; }
  for (let x = 22; x <= 28; x++) { map[8][x] = TILES.STONE; map[9][x] = TILES.STONE; }

  // Around middle district blocks (rows 18-20)
  for (let x = 2; x <= 8; x++)  { map[18][x] = TILES.STONE; map[19][x] = TILES.STONE; map[20][x] = TILES.STONE; }
  for (let x = 12; x <= 18; x++) { map[18][x] = TILES.STONE; map[19][x] = TILES.STONE; map[20][x] = TILES.STONE; }
  for (let x = 22; x <= 28; x++) { map[18][x] = TILES.STONE; map[19][x] = TILES.STONE; map[20][x] = TILES.STONE; }

  // Around bottom district (rows 27-28)
  for (let x = 2; x <= 8; x++)  { map[27][x] = TILES.STONE; map[28][x] = TILES.STONE; }
  for (let x = 12; x <= 18; x++) { map[27][x] = TILES.STONE; map[28][x] = TILES.STONE; }
  for (let x = 22; x <= 28; x++) { map[27][x] = TILES.STONE; map[28][x] = TILES.STONE; }

  // Vertical sidewalk connectors along blocks
  for (let y = 8; y <= 9; y++) {
    map[y][8] = TILES.STONE;
    map[y][12] = TILES.STONE;
    map[y][18] = TILES.STONE;
    map[y][22] = TILES.STONE;
    map[y][28] = TILES.STONE;
  }

  // ── BUILDING FOOTPRINTS ──────────────────────────────────────────────────
  for (const bldg of BUILDINGS) {
    for (let by = bldg.y; by < bldg.y + bldg.height; by++) {
      for (let bx = bldg.x; bx < bldg.x + bldg.width; bx++) {
        if (by < MAP_ROWS && bx < MAP_COLS) {
          map[by][bx] = TILES.BUILDING_FLOOR;
        }
      }
    }
    // Dirt at door base
    const doorRow = bldg.y + bldg.height;
    const midX = Math.floor(bldg.x + bldg.width / 2);
    for (let dx = -1; dx <= 1; dx++) {
      const tx = midX + dx;
      if (tx >= 0 && tx < MAP_COLS && doorRow < MAP_ROWS) {
        if (map[doorRow][tx] === TILES.GRASS || map[doorRow][tx] === TILES.STONE) {
          map[doorRow][tx] = TILES.DIRT;
        }
      }
    }
  }

  // ── TREES ────────────────────────────────────────────────────────────────
  const trees = [
    // Four corner clusters
    [0,0],[0,1],[1,0],[1,1],
    [0,28],[0,29],[1,28],[1,29],
    [28,0],[29,0],[28,1],[29,1],
    [28,28],[28,29],[29,28],[29,29],
    // Left border
    [0,13],[0,14],[0,15],[0,16],[0,17],[0,18],[0,19],[0,20],
    [1,14],[1,16],[1,18],[1,20],
    // Right border
    [0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
    [29,2],[29,3],[29,4],[29,5],[29,6],[29,7],
    [29,13],[29,14],[29,15],[29,16],[29,17],[29,18],[29,19],[29,20],
    [28,14],[28,16],[28,18],[28,20],
    // Top gaps between buildings
    [0,0],[1,0],[0,1],[1,1],
    [4,0],[4,1],[5,0],[5,1],
    [14,0],[14,1],[15,0],[15,1],
    [24,0],[24,1],[25,0],[25,1],
    // Between-district dividers
    [3,13],[4,13],[7,13],[8,13],
    [13,13],[14,13],[17,13],[18,13],
    [23,13],[24,13],[27,13],[28,13],
    [3,24],[4,24],[7,24],[8,24],
    [13,24],[14,24],[17,24],[18,24],
    [23,24],[24,24],[27,24],[28,24],
    // Bottom border
    [29,24],[29,25],[29,26],[29,27],
    [0,24],[0,25],[0,26],[0,27],
  ];
  for (const [ty, tx] of trees) {
    if (ty >= 0 && ty < MAP_ROWS && tx >= 0 && tx < MAP_COLS && map[ty][tx] === TILES.GRASS) {
      map[ty][tx] = TILES.TREE;
    }
  }

  // ── FLOWERS ──────────────────────────────────────────────────────────────
  const flowers = [
    // Between buildings and sidewalks
    [3,10],[5,10],[7,10],
    [3,13],[5,13],[7,13],
    [13,10],[15,10],[17,10],
    [13,13],[15,13],[17,13],
    [23,10],[25,10],[27,10],
    [23,13],[25,13],[27,13],
    [3,21],[5,21],[7,21],
    [3,24],[5,24],[7,24],
    [13,21],[15,21],[17,21],
    [13,24],[15,24],[17,24],
    [23,21],[25,21],[27,21],
    [23,24],[25,24],[27,24],
    // Near road edges
    [9,2],[9,6],[9,16],[9,26],
    [20,2],[20,6],[20,16],[20,26],
  ];
  for (const [fy, fx] of flowers) {
    if (fy >= 0 && fy < MAP_ROWS && fx >= 0 && fx < MAP_COLS && map[fy][fx] === TILES.GRASS) {
      map[fy][fx] = TILES.FLOWER;
    }
  }

  // ── BUSHES ───────────────────────────────────────────────────────────────
  const bushes = [
    [9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],
    [9,22],[9,23],[9,24],[9,25],[9,26],[9,27],[9,28],
    [20,2],[20,3],[20,4],[20,5],[20,6],[20,7],[20,8],
    [20,22],[20,23],[20,24],[20,25],[20,26],[20,27],[20,28],
    [9,12],[9,13],[9,14],[9,15],[9,16],[9,17],[9,18],
    [20,12],[20,13],[20,14],[20,15],[20,16],[20,17],[20,18],
    [2,0],[3,0],[6,0],[7,0],
    [2,1],[3,1],[6,1],[7,1],
  ];
  for (const [by2, bx2] of bushes) {
    if (by2 >= 0 && by2 < MAP_ROWS && bx2 >= 0 && bx2 < MAP_COLS && map[by2][bx2] === TILES.GRASS) {
      map[by2][bx2] = TILES.BUSH;
    }
  }

  // ── CAT PARK (cols 12-18, rows 24-29) — below Tech Skills, beside carnival ─
  // Reset this block to grass first so the old sidewalk pattern becomes a park.
  for (let py = 24; py <= 29; py++) {
    for (let px = 12; px <= 18; px++) {
      if (map[py][px] !== TILES.PATH_H && map[py][px] !== TILES.PATH_V) {
        map[py][px] = TILES.GRASS;
      }
    }
  }
  // Fence perimeter. Interior stays walkable for the cats and player.
  for (let fx = 12; fx <= 18; fx++) {
    map[24][fx] = TILES.FENCE;
    map[29][fx] = TILES.FENCE;
  }
  for (let fy = 24; fy <= 29; fy++) {
    map[fy][12] = TILES.FENCE;
    map[fy][18] = TILES.FENCE;
  }
  // Gate opening on north side, accessible from the road below the tech building.
  map[24][14] = TILES.DIRT;
  map[24][15] = TILES.DIRT;
  map[24][16] = TILES.DIRT;

  // ── CARNIVAL FENCE (cols 22-28, rows 24-29) ──────────────────────────────
  for (let fx = 22; fx <= 28; fx++) {
    if (map[24][fx] === TILES.GRASS) map[24][fx] = TILES.FENCE;
    if (fx <= 28 && map[29][fx] === TILES.GRASS) map[29][fx] = TILES.FENCE;
  }
  for (let fy = 24; fy <= 29; fy++) {
    if (map[fy][22] === TILES.GRASS) map[fy][22] = TILES.FENCE;
    if (map[fy][28] === TILES.GRASS) map[fy][28] = TILES.FENCE;
  }
  // Carnival gate (row 24, cols 24-26)
  map[24][24] = TILES.DIRT;
  map[24][25] = TILES.DIRT;

  return map;
}

export function isSolid(map: number[][], x: number, y: number): boolean {
  if (x < 0 || x >= MAP_COLS || y < 0 || y >= MAP_ROWS) return true;
  const t = map[y][x];
  return (
    t === TILES.BUILDING_FLOOR ||
    t === TILES.TREE ||
    t === TILES.BUSH ||
    t === TILES.FENCE
  );
}

// Check if a pixel position is on a road tile (for vehicle collision)
export function isOnRoad(map: number[][], tileX: number, tileY: number): boolean {
  if (tileX < 0 || tileX >= MAP_COLS || tileY < 0 || tileY >= MAP_ROWS) return false;
  const t = map[tileY][tileX];
  return t === TILES.PATH_H || t === TILES.PATH_V;
}
