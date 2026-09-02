export type Warp = { x: number; y: number; to: string; tx: number; ty: number; facing?: Dir };
export type Dir = "down" | "up" | "left" | "right";
export type NPC = {
  id: string;
  x: number;
  y: number;
  sheet: string;
  facing: Dir;
  lines: string[];
};
export type Sign = { x: number; y: number; lines: string[] };

export type GameMap = {
  id: string;
  image: string;
  wpx: number;
  hpx: number;
  cols: number;
  rows: number;
  solid: boolean[][];
  warps: Warp[];
  npcs: NPC[];
  signs: Sign[];
  outdoor: boolean;
};

function grid(cols: number, rows: number, rects: [number, number, number, number][]) {
  const g: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (const [x0, y0, x1, y1] of rects) {
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) if (g[y] && g[y]![x] !== undefined) g[y]![x] = true;
  }
  return g;
}

const TOWN_COLS = 24;
const TOWN_ROWS = 21;

export const MAPS: Record<string, GameMap> = {
  pallet: {
    id: "pallet",
    image: "/game/pallet.png",
    wpx: 384,
    hpx: 336,
    cols: TOWN_COLS,
    rows: TOWN_ROWS,
    outdoor: true,
    solid: grid(TOWN_COLS, TOWN_ROWS, [
      [0, 0, 1, 20], // árvores esquerda
      [22, 0, 23, 20], // árvores direita
      [0, 0, 23, 1], // topo
      [0, 19, 23, 20], // base
      [4, 3, 10, 7], // casa do jogador
      [14, 3, 19, 7], // casa do rival
      [13, 9, 20, 13], // laboratório
      [4, 11, 9, 11], // cerca da horta
      [4, 12, 8, 14], // horta
      [13, 17, 19, 17], // cerca sul
      [7, 17, 10, 18], // água
    ]),
    warps: [
      { x: 7, y: 7, to: "house1f", tx: 4, ty: 8, facing: "up" },
      { x: 16, y: 13, to: "lab", tx: 7, ty: 9, facing: "up" },
    ],
    npcs: [
      {
        id: "vizinho",
        x: 12,
        y: 15,
        sheet: "/game/npc_man.png",
        facing: "down",
        lines: [
          "Tecnologia é incrível!",
          "Agora você pode guardar e trocar POKéMON pela internet.",
        ],
      },
    ],
    signs: [
      { x: 9, y: 11, lines: ["PALLET TOWN", "Uma janela para um mundo tão puro quanto branco."] },
      { x: 4, y: 14, lines: ["LAB. DO PROF. CARVALHO"] },
    ],
  },
  house1f: {
    id: "house1f",
    image: "/game/house1f.png",
    wpx: 208,
    hpx: 160,
    cols: 13,
    rows: 10,
    outdoor: false,
    solid: grid(13, 10, [
      [0, 0, 12, 2], // parede/bancadas do fundo
      [0, 0, 0, 9], // borda esquerda
      [0, 9, 12, 9], // borda inferior
      [11, 0, 12, 3], // escada
      [12, 4, 12, 8], // parede direita
      [5, 4, 8, 5], // mesa e cadeiras
      [1, 6, 1, 7], // vaso esquerdo
    ]),
    warps: [
      { x: 4, y: 8, to: "pallet", tx: 7, ty: 8, facing: "down" },
      { x: 11, y: 4, to: "house2f", tx: 8, ty: 4, facing: "down" },
    ],
    npcs: [
      {
        id: "mae",
        x: 2,
        y: 4,
        sheet: "/game/npc_mom.png",
        facing: "right",
        lines: [
          "Todos os garotos deixam a cidade um dia. É o que dizem.",
          "O PROF. CARVALHO estava te procurando, querido!",
        ],
      },
    ],
    signs: [{ x: 6, y: 2, lines: ["Está passando um programa sobre treinadores na TV."] }],
  },
  house2f: {
    id: "house2f",
    image: "/game/house2f.png",
    wpx: 176,
    hpx: 144,
    cols: 11,
    rows: 9,
    outdoor: false,
    solid: grid(11, 9, [
      [0, 0, 10, 2], // parede, PC, estante e escada
      [0, 0, 0, 8], // borda esquerda
      [0, 8, 10, 8], // borda inferior
      [10, 2, 10, 3], // pôster/parede direita
      [1, 5, 2, 6], // cama
      [6, 4, 6, 6], // televisão e videogame
    ]),
    warps: [{ x: 8, y: 3, to: "house1f", tx: 11, ty: 4, facing: "down" }],
    npcs: [],
    signs: [
      { x: 6, y: 4, lines: ["O seu videogame. Talvez depois da aventura..."] },
      { x: 2, y: 5, lines: ["A sua cama. Ainda está quentinha."] },
    ],
  },
  lab: {
    id: "lab",
    image: "/game/lab.png",
    wpx: 236,
    hpx: 176,
    cols: 15,
    rows: 11,
    outdoor: false,
    solid: grid(15, 11, [
      [0, 0, 14, 2], // bancadas do fundo
      [0, 0, 0, 10], // borda esquerda
      [14, 0, 14, 10], // borda direita
      [0, 10, 14, 10], // borda inferior
      [1, 3, 4, 5], // máquina grande
      [1, 7, 6, 9], // estantes esquerdas
      [9, 7, 14, 9], // estantes direitas
      [9, 4, 12, 5], // mesa das poké bolas
    ]),

    warps: [{ x: 7, y: 9, to: "pallet", tx: 16, ty: 14, facing: "down" }],
    npcs: [],
    signs: [],
  },
};

export const isSolid = (map: GameMap, x: number, y: number) =>
  x < 0 || y < 0 || x >= map.cols || y >= map.rows || !!map.solid[y]?.[x];
