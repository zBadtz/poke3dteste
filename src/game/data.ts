export type TypeName =
  | "normal" | "fire" | "water" | "grass" | "electric" | "ice" | "fighting"
  | "poison" | "ground" | "flying" | "psychic" | "bug" | "rock" | "ghost"
  | "dragon";

const chart: Partial<Record<TypeName, Partial<Record<TypeName, number>>>> = {
  fire: { grass: 2, bug: 2, ice: 2, water: 0.5, fire: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5 },
  electric: { water: 2, flying: 2, grass: 0.5, electric: 0.5, dragon: 0.5, ground: 0 },
  normal: { rock: 0.5, ghost: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5 },
  bug: { grass: 2, psychic: 2, fire: 0.5, fighting: 0.5, flying: 0.5, poison: 0.5, ghost: 0.5 },
};

export function effectiveness(atk: TypeName, def: TypeName[]): number {
  return def.reduce((m, d) => m * (chart[atk]?.[d] ?? 1), 1);
}

export type Move = {
  name: string;
  type: TypeName;
  power: number;
  accuracy: number;
  pp: number;
  category: "physical" | "special" | "status";
  effect?: "lower-attack" | "lower-defense";
};

export const MOVES: Record<string, Move> = {
  tackle: { name: "INVESTIDA", type: "normal", power: 35, accuracy: 95, pp: 35, category: "physical" },
  scratch: { name: "ARRANHÃO", type: "normal", power: 40, accuracy: 100, pp: 35, category: "physical" },
  growl: { name: "ROSNAR", type: "normal", power: 0, accuracy: 100, pp: 40, category: "status", effect: "lower-attack" },
  tailwhip: { name: "CHICOTE", type: "normal", power: 0, accuracy: 100, pp: 30, category: "status", effect: "lower-defense" },
  ember: { name: "BRASA", type: "fire", power: 40, accuracy: 100, pp: 25, category: "special" },
  vinewhip: { name: "CHIC. VINHA", type: "grass", power: 45, accuracy: 100, pp: 25, category: "special" },
  bubble: { name: "BOLHA", type: "water", power: 40, accuracy: 100, pp: 30, category: "special" },
  leer: { name: "OLHAR FEIO", type: "normal", power: 0, accuracy: 100, pp: 30, category: "status", effect: "lower-defense" },
  gust: { name: "RAJADA", type: "flying", power: 40, accuracy: 100, pp: 35, category: "special" },
  quickattack: { name: "ATAQUE RÁPIDO", type: "normal", power: 40, accuracy: 100, pp: 30, category: "physical" },
  sandattack: { name: "ATQ. DE AREIA", type: "ground", power: 0, accuracy: 100, pp: 15, category: "status", effect: "lower-attack" },
};


export type Species = {
  id: number;
  name: string;
  types: TypeName[];
  base: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  moves: string[];
  cry?: string;
  dex: string;
};

export const SPECIES: Record<string, Species> = {
  bulbasaur: {
    id: 1, name: "BULBASAUR", types: ["grass", "poison"],
    base: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
    moves: ["tackle", "growl", "vinewhip", "leer"],
    dex: "Uma semente estranha foi plantada em suas costas ao nascer.",
  },
  charmander: {
    id: 4, name: "CHARMANDER", types: ["fire"],
    base: { hp: 39, atk: 52, def: 43, spa: 60, spd: 50, spe: 65 },
    moves: ["scratch", "growl", "ember", "leer"],
    dex: "A chama em sua cauda mostra a força de sua vida.",
  },
  squirtle: {
    id: 7, name: "SQUIRTLE", types: ["water"],
    base: { hp: 44, atk: 48, def: 65, spa: 50, spd: 64, spe: 43 },
    moves: ["tackle", "tailwhip", "bubble", "leer"],
    dex: "Após o nascimento, suas costas incham e endurecem em um casco.",
  },
};

export const STARTERS = ["bulbasaur", "charmander", "squirtle"] as const;
export type StarterKey = (typeof STARTERS)[number];

/** Quem o rival escolhe: sempre o tipo com vantagem sobre o seu inicial. */
export const RIVAL_PICK: Record<StarterKey, StarterKey> = {
  bulbasaur: "charmander",
  charmander: "squirtle",
  squirtle: "bulbasaur",
};

export type Mon = {
  key: string;
  species: Species;
  level: number;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  moves: { key: string; pp: number }[];
  xp: number;
  stages: { atk: number; def: number };
};

const statCalc = (b: number, lvl: number, hp = false) =>
  hp
    ? Math.floor(((2 * b + 31) * lvl) / 100) + lvl + 10
    : Math.floor(((2 * b + 31) * lvl) / 100) + 5;

export function createMon(key: string, level: number): Mon {
  const s = SPECIES[key]!;
  const maxHp = statCalc(s.base.hp, level, true);
  return {
    key,
    species: s,
    level,
    maxHp,
    hp: maxHp,
    atk: statCalc(s.base.atk, level),
    def: statCalc(s.base.def, level),
    spa: statCalc(s.base.spa, level),
    spd: statCalc(s.base.spd, level),
    spe: statCalc(s.base.spe, level),
    moves: s.moves.slice(0, 4).map((m) => ({ key: m, pp: MOVES[m]!.pp })),
    xp: 0,
    stages: { atk: 0, def: 0 },
  };
}

const stageMul = (s: number) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

export function damage(attacker: Mon, defender: Mon, move: Move) {
  if (move.power === 0) return { dmg: 0, eff: 1, crit: false };
  const phys = move.category === "physical";
  const a = (phys ? attacker.atk * stageMul(attacker.stages.atk) : attacker.spa);
  const d = (phys ? defender.def * stageMul(defender.stages.def) : defender.spd);
  const crit = Math.random() < 1 / 16;
  const stab = attacker.species.types.includes(move.type) ? 1.5 : 1;
  const eff = effectiveness(move.type, defender.species.types);
  const rand = 0.85 + Math.random() * 0.15;
  const base =
    (((2 * attacker.level) / 5 + 2) * move.power * (a / d)) / 50 + 2;
  const dmg = Math.max(1, Math.floor(base * stab * eff * rand * (crit ? 1.5 : 1)));
  return { dmg, eff, crit };
}

export const xpToNext = (level: number) => Math.floor((4 * Math.pow(level + 1, 3)) / 5) - Math.floor((4 * Math.pow(level, 3)) / 5);

export const spriteUrl = (id: number, back = false) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/${back ? "back/" : ""}${id}.png`;
