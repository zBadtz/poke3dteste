export type WarpKind = "step" | "door" | "stair";
export type Warp = {
  x: number;
  y: number;
  to: string;
  tx: number;
  ty: number;
  facing?: Dir;
  /** step = ao pisar, door = apertando A de frente, stair = ao pisar em cima */
  kind?: WarpKind;
};
export type Dir = "down" | "up" | "left" | "right";
export type NPC = {
  id: string;
  x: number;
  y: number;
  sheet: string;
  facing: Dir;
  lines: string[];
  /** número de quadros na folha de sprite (12 = animado, 4 = estático) */
  frames?: number;
};
export type Sign = { x: number; y: number; lines: string[] };

/** Recorte da imagem do mapa que deixa de ser chão e passa a ficar "em pé" (2.5D). */
export type Prop = { x: number; y: number; w: number; h: number };

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
  props: Prop[];
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

/** transforma um retângulo de tiles numa coluna de props de 1 tile de largura */
function strip(x0: number, y0: number, x1: number, y1: number, h = 2): Prop[] {
  const out: Prop[] = [];
  for (let x = x0; x <= x1; x++)
    for (let y = y0; y <= y1; y += h) out.push({ x, y, w: 1, h: Math.min(h, y1 - y + 1) });
  return out;
}

const TOWN_COLS = 24;
const TOWN_ROWS = 21;

const TOWN_TREES: Prop[] = [
  ...strip(0, 0, 1, 18),
  ...strip(22, 0, 23, 18),
  ...strip(2, 0, 12, 1),
  ...strip(14, 0, 21, 1),
];

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
      [0, 0, 1, 20],
      [22, 0, 23, 20],
      [0, 0, 12, 1],
      [14, 0, 23, 1],
      [0, 19, 23, 20],
      [5, 3, 9, 7], // casa do jogador
      [14, 3, 19, 7], // casa do rival
      [13, 9, 20, 13], // laboratório
      [4, 6, 4, 6], // caixa de correio
      [13, 6, 13, 6], // caixa de correio
      [5, 11, 9, 11], // cerca da horta
      [5, 12, 8, 13], // flores
      [5, 14, 5, 14], // placa
      [13, 16, 19, 16], // cerca sul
      [7, 17, 10, 18], // água
    ]),
    props: [
      ...TOWN_TREES,
      { x: 5, y: 3, w: 5, h: 5 },
      { x: 14, y: 3, w: 6, h: 5 },
      { x: 13, y: 9, w: 8, h: 5 },
      { x: 5, y: 11, w: 5, h: 1 },
      { x: 13, y: 16, w: 7, h: 1 },
      { x: 5, y: 14, w: 1, h: 1 },
      { x: 4, y: 6, w: 1, h: 1 },
      { x: 13, y: 6, w: 1, h: 1 },
    ],
    warps: [
      { x: 6, y: 7, to: "house1f", tx: 4, ty: 8, facing: "up", kind: "door" },
      { x: 15, y: 7, to: "rivalhouse", tx: 4, ty: 8, facing: "up", kind: "door" },
      { x: 16, y: 13, to: "lab", tx: 7, ty: 9, facing: "up", kind: "door" },
      { x: 13, y: 1, to: "route1", tx: 10, ty: 27, facing: "up", kind: "step" },
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
      { x: 5, y: 14, lines: ["PALLET TOWN", "Uma janela para um mundo tão puro quanto branco."] },
      { x: 13, y: 16, lines: ["LAB. DO PROF. CARVALHO"] },
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
      [0, 0, 12, 2],
      [0, 0, 0, 9],
      [0, 9, 12, 9],
      [11, 0, 12, 2],
      [12, 4, 12, 8],
      [5, 4, 8, 5],
      [1, 6, 1, 7],
    ]),
    props: [{ x: 0, y: 0, w: 13, h: 3 }],
    warps: [
      { x: 4, y: 8, to: "pallet", tx: 6, ty: 8, facing: "down", kind: "step" },
      { x: 11, y: 3, to: "house2f", tx: 8, ty: 3, facing: "down", kind: "stair" },
    ],
    npcs: [
      {
        id: "mae",
        x: 2,
        y: 4,
        sheet: "/game/npc_mom.png",
        frames: 4,
        facing: "right",
        lines: [
          "Todos os garotos deixam a cidade um dia. É o que dizem.",
          "O PROF. CARVALHO estava te procurando, querido!",
        ],
      },
    ],
    signs: [{ x: 6, y: 2, lines: ["Está passando um programa sobre treinadores na TV."] }],
  },
  rivalhouse: {
    id: "rivalhouse",
    image: "/game/house1f.png",
    wpx: 208,
    hpx: 160,
    cols: 13,
    rows: 10,
    outdoor: false,
    solid: grid(13, 10, [
      [0, 0, 12, 2],
      [0, 0, 0, 9],
      [0, 9, 12, 9],
      [11, 0, 12, 2],
      [12, 4, 12, 8],
      [5, 4, 8, 5],
      [1, 6, 1, 7],
    ]),
    props: [{ x: 0, y: 0, w: 13, h: 3 }],
    warps: [{ x: 4, y: 8, to: "pallet", tx: 15, ty: 8, facing: "down", kind: "step" }],
    npcs: [
      {
        id: "irma",
        x: 9,
        y: 4,
        sheet: "/game/npc_mom.png",
        frames: 4,
        facing: "left",
        lines: [
          "MARGARIDA: Meu irmão saiu correndo para o laboratório.",
          "MARGARIDA: Ele nunca espera por ninguém!",
        ],
      },
    ],
    signs: [{ x: 6, y: 2, lines: ["Um mapa de KANTO cheio de anotações."] }],
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
      [0, 0, 10, 2],
      [0, 0, 0, 8],
      [0, 8, 10, 8],
      [10, 2, 10, 3],
      [1, 5, 2, 6],
      [6, 4, 6, 6],
    ]),
    props: [{ x: 0, y: 0, w: 11, h: 3 }],
    warps: [{ x: 8, y: 3, to: "house1f", tx: 11, ty: 3, facing: "down", kind: "stair" }],
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
      [0, 0, 14, 2],
      [0, 0, 0, 10],
      [14, 0, 14, 10],
      [0, 10, 14, 10],
      [1, 3, 4, 5],
      [1, 7, 6, 9],
      [9, 7, 14, 9],
      [9, 4, 12, 5],
    ]),
    props: [{ x: 0, y: 0, w: 15, h: 3 }],
    warps: [{ x: 7, y: 9, to: "pallet", tx: 16, ty: 14, facing: "down", kind: "step" }],
    npcs: [
      {
        id: "carvalho",
        x: 7,
        y: 3,
        sheet: "/game/oak_ow.png",
        frames: 4,
        facing: "down",
        lines: [
          "PROF. CARVALHO: Aí está você!",
          "PROF. CARVALHO: Escolha uma POKé BOLA sobre a mesa.",
          "PROF. CARVALHO: Esse POKéMON será seu para sempre!",
        ],
      },
      {
        id: "rival",
        x: 12,
        y: 3,
        sheet: "/game/rival.png",
        facing: "down",
        lines: [
          "Vovô, já cansei de esperar!",
          "Vai logo, escolhe o seu. Eu fico com o que for melhor!",
        ],
      },
    ],
    signs: [],
  },
  route1: {
    id: "route1",
    image: "/game/route1.png",
    wpx: 320,
    hpx: 448,
    cols: 20,
    rows: 28,
    outdoor: true,
    solid: grid(20, 28, [
      [0, 0, 4, 27],
      [15, 0, 19, 27],
      [0, 0, 19, 0],
    ]),
    props: [...strip(0, 1, 4, 26), ...strip(15, 1, 19, 26)],
    warps: [{ x: 10, y: 27, to: "pallet", tx: 13, ty: 2, facing: "down", kind: "step" }],
    npcs: [],
    signs: [{ x: 6, y: 24, lines: ["ROTA 1", "PALLET TOWN - VIRIDIAN CITY"] }],
    grass: [
      [6, 6, 9, 11],
      [11, 14, 14, 20],
      [6, 18, 8, 22],
    ],
  } as GameMap & { grass: [number, number, number, number][] },
};

export const isSolid = (map: GameMap, x: number, y: number) =>
  x < 0 || y < 0 || x >= map.cols || y >= map.rows || !!map.solid[y]?.[x];

export const inGrass = (map: GameMap, x: number, y: number) => {
  const g = (map as GameMap & { grass?: [number, number, number, number][] }).grass;
  if (!g) return false;
  return g.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
};
