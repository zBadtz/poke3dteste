import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import * as THREE from "three";
import { MAPS, isSolid, type Dir, type GameMap } from "./maps";
import { useGame } from "./store";
import { STARTERS, SPECIES, type StarterKey } from "./data";

const TILE = 16;
const DIR_ROW: Record<Dir, number> = { down: 0, up: 3, left: 6, right: 9 };
const STEP_TIME = 0.18;

const keys: Record<string, boolean> = {};
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });
}

function pixelate(t: THREE.Texture) {
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Sprite({
  url,
  frame,
  x,
  y,
  frames = 12,
  w = 16,
  h = 24,
  shadow = true,
}: {
  url: string;
  frame: number;
  x: number;
  y: number;
  frames?: number;
  w?: number;
  h?: number;
  shadow?: boolean;
}) {
  const base = useTexture(url, (t) => pixelate(t as THREE.Texture));
  const tex = useMemo(() => {
    const c = (base as THREE.Texture).clone();
    pixelate(c);
    c.repeat.set(1 / frames, 1);
    c.needsUpdate = true;
    return c;
  }, [base, frames]);

  useEffect(() => {
    tex.offset.x = (frame % frames) / frames;
    tex.needsUpdate = true;
  }, [frame, frames, tex]);

  const order = Math.round(y * 10) + 1000;

  return (
    <group position={[x, -y, 0]}>
      {shadow && (
        <mesh position={[0, -h / 2 + 1.5, 0]} renderOrder={order - 1}>
          <circleGeometry args={[6, 16]} />
          <meshBasicMaterial color="#000" transparent opacity={0.22} depthTest={false} />
        </mesh>
      )}
      <mesh renderOrder={order}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.5} depthTest={false} />
      </mesh>
    </group>
  );
}

function MapPlane({ map }: { map: GameMap }) {
  const tex = useTexture(map.image, (t) => pixelate(t as THREE.Texture));
  return (
    <mesh position={[map.wpx / 2, -map.hpx / 2, 0]} renderOrder={0}>
      <planeGeometry args={[map.wpx, map.hpx]} />
      <meshBasicMaterial map={tex as THREE.Texture} depthTest={false} />
    </mesh>
  );
}

function PokeBall({ x, y, taken }: { x: number; y: number; taken: boolean }) {
  if (taken) return null;
  return (
    <group position={[x, -y, 0]} renderOrder={2000}>
      <mesh renderOrder={2000}>
        <circleGeometry args={[5, 20]} />
        <meshBasicMaterial color="#e8e8e8" depthTest={false} />
      </mesh>
      <mesh position={[0, 1.4, 0]} renderOrder={2001}>
        <circleGeometry args={[5, 20, 0, Math.PI]} />
        <meshBasicMaterial color="#e04b3a" depthTest={false} />
      </mesh>
      <mesh position={[0, 0, 0]} renderOrder={2002}>
        <planeGeometry args={[10, 1.5]} />
        <meshBasicMaterial color="#1a1a1a" depthTest={false} />
      </mesh>
    </group>
  );
}

type Player = {
  px: number;
  py: number;
  dir: Dir;
  moving: boolean;
  t: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  animT: number;
  step: number;
};

function Scene({ onWarp }: { onWarp: (to: string, tx: number, ty: number, facing: Dir) => void }) {
  const { camera, size } = useThree();
  const state = useGame();
  const map = MAPS[state.mapId] ?? MAPS["pallet"]!;
  const p = useRef<Player>({
    px: state.x * TILE + TILE / 2,
    py: state.y * TILE + TILE / 2,
    dir: state.facing,
    moving: false,
    t: 0,
    fromX: state.x,
    fromY: state.y,
    toX: state.x,
    toY: state.y,
    animT: 0,
    step: 0,
  });
  const [, force] = useState(0);
  const interactRef = useRef(false);

  useEffect(() => {
    p.current = {
      ...p.current,
      px: state.x * TILE + TILE / 2,
      py: state.y * TILE + TILE / 2,
      dir: state.facing,
      moving: false,
      t: 0,
      fromX: state.x,
      fromY: state.y,
      toX: state.x,
      toY: state.y,
    };
  }, [state.mapId, state.x, state.y]);

  // ação (Z / Enter) para interagir
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["z", "Z", "Enter", " "].includes(e.key)) interactRef.current = true;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function interact() {
    const s = useGame.getState();
    if (s.dialogue) return;
    const d = p.current.dir;
    const fx = p.current.toX + (d === "left" ? -1 : d === "right" ? 1 : 0);
    const fy = p.current.toY + (d === "up" ? -1 : d === "down" ? 1 : 0);

    const npc = map.npcs.find((n) => n.x === fx && n.y === fy);
    if (npc) return s.say(npc.lines);

    const sign = map.signs.find((n) => n.x === fx && n.y === fy);
    if (sign) return s.say(sign.lines);

    if (map.id === "lab" && fy === 5 && fx >= 9 && fx <= 11 && d === "up") {
      const key = STARTERS[fx - 9] as StarterKey;
      if (s.starter) return s.say(["Você já escolheu o seu parceiro!"]);
      const sp = SPECIES[key]!;
      return s.say(
        [
          `Então você quer ${sp.name}?`,
          sp.dex,
          `${s.playerName} recebeu ${sp.name}!`,
          `${s.rivalName}: Eu fico com este aqui então! Vamos batalhar agora mesmo!`,
        ],
        () => {
          useGame.getState().chooseStarter(key);
          useGame.getState().setPhase("battle");
        },
      );
    }

    if (map.id === "lab" && fx === 7 && fy === 4) {
      return s.say([
        "PROF. CARVALHO: Aí está você!",
        "Escolha uma POKé BOLA sobre a mesa. Um POKéMON será seu para sempre!",
      ]);
    }
  }

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = useGame.getState();
    const cur = p.current;

    if (interactRef.current) {
      interactRef.current = false;
      if (s.dialogue) s.advanceDialogue();
      else interact();
    }

    if (!cur.moving && !s.dialogue && s.phase === "overworld") {
      let dir: Dir | null = null;
      if (keys["ArrowUp"] || keys["w"]) dir = "up";
      else if (keys["ArrowDown"] || keys["s"]) dir = "down";
      else if (keys["ArrowLeft"] || keys["a"]) dir = "left";
      else if (keys["ArrowRight"] || keys["d"]) dir = "right";

      if (dir) {
        cur.dir = dir;
        const nx = cur.toX + (dir === "left" ? -1 : dir === "right" ? 1 : 0);
        const ny = cur.toY + (dir === "up" ? -1 : dir === "down" ? 1 : 0);
        const blockedByNpc = map.npcs.some((n) => n.x === nx && n.y === ny);
        if (!isSolid(map, nx, ny) && !blockedByNpc) {
          cur.fromX = cur.toX;
          cur.fromY = cur.toY;
          cur.toX = nx;
          cur.toY = ny;
          cur.moving = true;
          cur.t = 0;
        }
      }
    }

    if (cur.moving) {
      cur.t += dt;
      const k = Math.min(1, cur.t / STEP_TIME);
      cur.px = (cur.fromX + (cur.toX - cur.fromX) * k) * TILE + TILE / 2;
      cur.py = (cur.fromY + (cur.toY - cur.fromY) * k) * TILE + TILE / 2;
      cur.animT += dt;
      if (cur.animT > STEP_TIME / 2) {
        cur.animT = 0;
        cur.step = cur.step === 1 ? 2 : 1;
      }
      if (k >= 1) {
        cur.moving = false;
        cur.step = 0;
        s.setPosition(map.id, cur.toX, cur.toY, cur.dir);
        const warp = map.warps.find((w) => w.x === cur.toX && w.y === cur.toY);
        if (warp) onWarp(warp.to, warp.tx, warp.ty, warp.facing ?? cur.dir);
      }
    }

    // câmera segue o jogador, presa aos limites do mapa
    const zoom = Math.max(2, Math.floor(Math.min(size.width / 260, size.height / 190)));
    camera.zoom = zoom;
    const halfW = size.width / (2 * zoom);
    const halfH = size.height / (2 * zoom);
    const cx =
      map.wpx <= halfW * 2
        ? map.wpx / 2
        : THREE.MathUtils.clamp(cur.px, halfW, map.wpx - halfW);
    const cy =
      map.hpx <= halfH * 2
        ? -map.hpx / 2
        : -THREE.MathUtils.clamp(cur.py, halfH, map.hpx - halfH);
    camera.position.lerp(new THREE.Vector3(cx, cy, 100), 1 - Math.exp(-14 * dt));
    camera.updateProjectionMatrix();
    force((n) => (n + 1) % 1000000);
  });

  const cur = p.current;
  const frame = DIR_ROW[cur.dir] + cur.step;

  return (
    <>
      <MapPlane map={map} />
      {map.npcs.map((n) => (
        <Sprite
          key={n.id}
          url={n.sheet}
          frame={DIR_ROW[n.facing]}
          x={n.x * TILE + TILE / 2}
          y={n.y * TILE + TILE / 2 - 4}
        />
      ))}
      {map.id === "lab" && (
        <>
          <Sprite
            url="/game/oak_ow.png"
            frames={4}
            frame={0}
            x={7 * TILE + TILE / 2}
            y={4 * TILE + TILE / 2 - 4}
          />
          {[0, 1, 2].map((i) => (
            <PokeBall
              key={i}
              x={(9 + i) * TILE + TILE / 2}
              y={5 * TILE + TILE / 2}
              taken={!!state.starter}
            />
          ))}
        </>
      )}
      <Sprite url="/game/player.png" frame={frame} x={cur.px} y={cur.py - 4} />
    </>
  );
}

export function Overworld() {
  const setPosition = useGame((s) => s.setPosition);
  const [fade, setFade] = useState(false);

  function onWarp(to: string, tx: number, ty: number, facing: Dir) {
    setFade(true);
    setTimeout(() => {
      setPosition(to, tx, ty, facing);
      setFade(false);
    }, 260);
  }

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        orthographic
        dpr={1}
        gl={{ antialias: false }}
        camera={{ position: [0, 0, 100], zoom: 3, near: -1000, far: 1000 }}
      >
        <Suspense fallback={null}>
          <Scene onWarp={onWarp} />
        </Suspense>
      </Canvas>
      <div
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-200 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      />
      <TouchPad />
    </div>
  );
}

function TouchPad() {
  const press = (k: string) => ({
    onPointerDown: (e: RPointerEvent) => {
      e.preventDefault();
      keys[k] = true;
      window.dispatchEvent(new KeyboardEvent("keydown", { key: k }));
    },
    onPointerUp: () => {
      keys[k] = false;
    },
    onPointerLeave: () => {
      keys[k] = false;
    },
  });
  const btn =
    "pixel flex h-12 w-12 items-center justify-center rounded-md border-2 border-black bg-white/80 text-[10px] text-black active:bg-white";
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4 sm:hidden">
      <div className="pointer-events-auto grid grid-cols-3 gap-1">
        <span />
        <button className={btn} {...press("ArrowUp")}>▲</button>
        <span />
        <button className={btn} {...press("ArrowLeft")}>◀</button>
        <span />
        <button className={btn} {...press("ArrowRight")}>▶</button>
        <span />
        <button className={btn} {...press("ArrowDown")}>▼</button>
        <span />
      </div>
      <button className={`${btn} pointer-events-auto h-14 w-14 rounded-full`} {...press("z")}>
        A
      </button>
    </div>
  );
}
