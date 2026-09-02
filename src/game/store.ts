import { create } from "zustand";
import { createMon, RIVAL_PICK, type Mon, type StarterKey } from "./data";
import type { Dir } from "./maps";

export type Phase = "title" | "intro" | "overworld" | "battle";

export type SaveData = {
  playerName: string;
  rivalName: string;
  mapId: string;
  x: number;
  y: number;
  facing: Dir;
  starter: StarterKey | null;
  flags: Record<string, boolean>;
};

const KEY = "kanto-save-v1";

/** Repositório de save — hoje localStorage, amanhã nuvem. */
export const SaveRepository = {
  load(): SaveData | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SaveData) : null;
    } catch {
      return null;
    }
  },
  save(data: SaveData) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  },
  clear() {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  },
};

type State = {
  phase: Phase;
  playerName: string;
  rivalName: string;
  mapId: string;
  x: number;
  y: number;
  facing: Dir;
  starter: StarterKey | null;
  party: Mon[];
  rivalParty: Mon[];
  flags: Record<string, boolean>;
  dialogue: string[] | null;
  onDialogueEnd: (() => void) | null;
  setPhase: (p: Phase) => void;
  startNewGame: (playerName: string, rivalName: string) => void;
  continueGame: () => boolean;
  setPosition: (mapId: string, x: number, y: number, facing: Dir) => void;
  say: (lines: string[], onEnd?: () => void) => void;
  advanceDialogue: () => void;
  chooseStarter: (key: StarterKey) => void;
  setFlag: (f: string, v?: boolean) => void;
  persist: () => void;
};

export const useGame = create<State>((set, get) => ({
  phase: "title",
  playerName: "VERMELHO",
  rivalName: "AZUL",
  mapId: "house2f",
  x: 5,
  y: 5,
  facing: "down",
  starter: null,
  party: [],
  rivalParty: [],
  flags: {},
  dialogue: null,
  onDialogueEnd: null,

  setPhase: (phase) => set({ phase }),

  startNewGame: (playerName, rivalName) => {
    set({
      playerName: playerName || "VERMELHO",
      rivalName: rivalName || "AZUL",
      mapId: "house2f",
      x: 5,
      y: 5,
      facing: "down",
      starter: null,
      party: [],
      rivalParty: [],
      flags: {},
      dialogue: null,
      phase: "overworld",
    });
    get().persist();
  },

  continueGame: () => {
    const s = SaveRepository.load();
    if (!s) return false;
    set({
      ...s,
      party: s.starter ? [createMon(s.starter, 5)] : [],
      rivalParty: s.starter ? [createMon(RIVAL_PICK[s.starter], 5)] : [],
      phase: "overworld",
      dialogue: null,
    });
    return true;
  },

  setPosition: (mapId, x, y, facing) => {
    set({ mapId, x, y, facing });
    get().persist();
  },

  say: (lines, onEnd) => set({ dialogue: lines, onDialogueEnd: onEnd ?? null }),

  advanceDialogue: () => {
    const { dialogue, onDialogueEnd } = get();
    if (!dialogue) return;
    if (dialogue.length > 1) set({ dialogue: dialogue.slice(1) });
    else {
      set({ dialogue: null, onDialogueEnd: null });
      onDialogueEnd?.();
    }
  },

  chooseStarter: (key) => {
    set({
      starter: key,
      party: [createMon(key, 5)],
      rivalParty: [createMon(RIVAL_PICK[key], 5)],
    });
    get().setFlag("gotStarter");
    get().persist();
  },

  setFlag: (f, v = true) => {
    set({ flags: { ...get().flags, [f]: v } });
    get().persist();
  },

  persist: () => {
    const s = get();
    SaveRepository.save({
      playerName: s.playerName,
      rivalName: s.rivalName,
      mapId: s.mapId,
      x: s.x,
      y: s.y,
      facing: s.facing,
      starter: s.starter,
      flags: s.flags,
    });
  },
}));
