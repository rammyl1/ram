export const TILE_SIZE = 32;
export const MAP_COLS = 30;
export const MAP_ROWS = 30;

export const TILES = {
  GRASS: 0,
  PATH_H: 1,    // horizontal asphalt road
  PATH_V: 2,    // vertical asphalt road
  PATH_CORNER_TL: 3,
  PATH_CORNER_TR: 4,
  PATH_CORNER_BL: 5,
  PATH_CORNER_BR: 6,
  TREE: 7,
  BUILDING_FLOOR: 8,
  WATER: 9,
  FLOWER: 10,
  STONE: 11,    // stone sidewalk cobble
  PATH_CROSS: 12,
  BUSH: 13,
  FENCE: 14,
  DIRT: 15,
};

export interface Building {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  color: string;
  roofColor: string;
  section: string;
  sign?: string;
  interactX: number;
  interactY: number;
}

export interface NPC {
  id: string;
  x: number;
  y: number;
  color: string;
  direction: number;
  moveTimer: number;
  path: { x: number; y: number }[];
  pathIndex: number;
  name: string;
  dialogue: string;
}

export const BUILDINGS: Building[] = [
  // ── Top row ──────────────────────────────────────────────────────────────
  {
    id: "about",
    x: 2, y: 1,
    width: 6, height: 6,
    label: "WELCOME",
    color: "#9c7038",
    roofColor: "#7a3c14",
    section: "about",
    sign: "ABOUT ME",
    interactX: 5, interactY: 8,
  },
  {
    id: "contact",
    x: 12, y: 1,
    width: 6, height: 6,
    label: "MAIL",
    color: "#6a3a8a",
    roofColor: "#4a1a6a",
    section: "contact",
    sign: "CONTACT",
    interactX: 15, interactY: 8,
  },
  {
    id: "cv",
    x: 22, y: 1,
    width: 6, height: 6,
    label: "WORK",
    color: "#5a6878",
    roofColor: "#3a4858",
    section: "cv",
    sign: "EXPERIENCE",
    interactX: 25, interactY: 8,
  },
  // ── Middle row ───────────────────────────────────────────────────────────
  {
    id: "projects",
    x: 2, y: 13,
    width: 6, height: 5,
    label: "WORKSHOP",
    color: "#7a4a2a",
    roofColor: "#5a2a0a",
    section: "projects",
    sign: "PROJECTS",
    interactX: 5, interactY: 19,
  },
  {
    id: "technologies",
    x: 12, y: 13,
    width: 6, height: 5,
    label: "GEAR SHOP",
    color: "#2a5a3a",
    roofColor: "#1a3a2a",
    section: "technologies",
    sign: "TECH SKILLS",
    interactX: 15, interactY: 19,
  },
  {
    id: "memo",
    x: 22, y: 13,
    width: 6, height: 5,
    label: "NOTICE",
    color: "#4a3a7a",
    roofColor: "#2a1a5a",
    section: "memo",
    sign: "MEMO",
    interactX: 25, interactY: 19,
  },
  // ── Bottom row ───────────────────────────────────────────────────────────
  {
    id: "coffee",
    x: 2, y: 24,
    width: 5, height: 4,
    label: "COFFEE",
    color: "#7a4820",
    roofColor: "#501a08",
    section: "coffee",
    sign: "COFFEE ☕",
    interactX: 4, interactY: 28,
  },
];
