import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as RPointerEvent,
} from "react";
import * as THREE from "three";
import { MAPS, isSolid, inGrass, type Dir, type GameMap, type Prop } from "./maps";
import { useGame } from "./store";
import { STARTERS, SPECIES, type StarterKey } from "./data";

const TILE = 16;
const DIR_ROW: Record<Dir, number> = { down: 0, up: 3, left: 6, right: 9 };
const DIR_4: Record<Dir, number> = { down: 0, up: 1, left: 2, right: 3 };
const STEP_TIME = 0.18;
/** inclinação da câmera: 0 = de lado, 90 = de cima */
const PITCH = THREE.MathUtils.degToRad(48);
const FOV = 26;

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

type MapTextures = { ground: THREE.Texture; props: THREE.Texture[] };

const keyOf = (r: number, g: number, b: number) =>
  ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

/**
 * Mantém o mapa original no chão e cria recortes transparentes dos objetos
 * verticais. Nunca preenchemos o retângulo de um prop com uma cor média: esse
 * preenchimento era a origem dos blocos cinza atrás das casas e árvores.
 */
function useMapTextures(map: GameMap, base: THREE.Texture): MapTextures {
  return useMemo(() => {
    const img = base.image as CanvasImageSource | undefined;
    if (!img) return { ground: base, props: [] };
    const W = map.wpx;
    const H = map.hpx;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, W, H);
    const src = ctx.getImageData(0, 0, W, H);
    const d = src.data;

    // marca quais tiles viraram objeto em pé
    const isProp: boolean[] = Array(map.cols * map.rows).fill(false);
    for (const p of map.props)
      for (let y = p.y; y < p.y + p.h; y++)
        for (let x = p.x; x < p.x + p.w; x++) isProp[y * map.cols + x] = true;

    // Cores do cenário acessível. Usar todas as cores (em vez de uma paleta
    // reduzida) preserva os detalhes do piso e remove o fundo dos recortes de
    // modo consistente, inclusive nas bordas com anti-aliased pixel art.
    const terrain = new Set<number>();
    for (let ty = 0; ty < map.rows; ty++) {
      for (let tx = 0; tx < map.cols; tx++) {
        if (isProp[ty * map.cols + tx] || isSolid(map, tx, ty)) continue;
        for (let y = ty * TILE; y < (ty + 1) * TILE; y++) {
          for (let x = tx * TILE; x < (tx + 1) * TILE; x++) {
            if (x >= W || y >= H) continue;
            const i = (y * W + x) * 4;
            terrain.add(keyOf(d[i]!, d[i + 1]!, d[i + 2]!));
          }
        }
      }
    }

    // Recorta cada objeto e deixa apenas os pixels reconhecidos como terreno
    // transparentes. O chão continua intacto sob o billboard, evitando uma
    // lacuna artificial caso um recorte tenha detalhes que não conseguimos
    // classificar.
    const props = map.props.map((p) => {
      const w = p.w * TILE;
      const h = p.h * TILE;
      const pc = document.createElement("canvas");
      pc.width = w;
      pc.height = h;
      const pctx = pc.getContext("2d")!;
      const out = pctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const sx = p.x * TILE + x;
          const sy = p.y * TILE + y;
          const si = (sy * W + sx) * 4;
          const di = (y * w + x) * 4;
          const r = d[si]!;
          const g = d[si + 1]!;
          const b = d[si + 2]!;
          out.data[di] = r;
          out.data[di + 1] = g;
          out.data[di + 2] = b;
          out.data[di + 3] = map.outdoor && terrain.has(keyOf(r, g, b)) ? 0 : 255;
        }
      }
      pctx.putImageData(out, 0, 0);
      const t = new THREE.CanvasTexture(pc);
      pixelate(t);
      return t;
    });

    return { ground: base, props };
  }, [map, base]);
}

function Ground({ map, tex }: { map: GameMap; tex: THREE.Texture }) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[map.wpx / 2, 0, map.hpx / 2]} receiveShadow>
      <planeGeometry args={[map.wpx, map.hpx]} />
      <meshBasicMaterial map={tex} />
    </mesh>
  );
}

/** Um recorte do mapa que fica de pé no mundo. */
function PropMesh({ p, tex }: { p: Prop; tex: THREE.Texture }) {
  const w = p.w * TILE;
  const h = p.h * TILE;
  return (
    <group position={[p.x * TILE + w / 2, 0, (p.y + p.h) * TILE - 1]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.2, -h / 3]}>
        <planeGeometry args={[w, (h * 2) / 3]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} />
      </mesh>
      <mesh position={[0, h / 2, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.5} />
      </mesh>
    </group>
  );
}

/** Personagem em pé (billboard) com sombra elíptica. */
function Character({
  url,
  frame,
  frames = 12,
  x,
  z,
  w = 16,
  h = 24,
  bob = 0,
}: {
  url: string;
  frame: number;
  frames?: number;
  x: number;
  z: number;
  w?: number;
  h?: number;
  bob?: number;
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

  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.3, 1]}>
        <circleGeometry args={[6, 18]} />
        <meshBasicMaterial color="#000" transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, h / 2 + bob, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} alphaTest={0.5} />
      </mesh>
    </group>
  );
}

function PokeBall({ x, z, taken }: { x: number; z: number; taken: boolean }) {
  const tex = useTexture("/game/pokeball.png", (t) => pixelate(t as THREE.Texture));
  if (taken) return null;
  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.3, 1]}>
        <circleGeometry args={[4, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.22} />
      </mesh>
      <mesh position={[0, 5, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial map={tex as THREE.Texture} transparent alphaTest={0.4} />
      </mesh>
    </group>
  );
}

/** Tufos de grama alta desenhados sobre as áreas de encontro. */
function GrassPatches({ map }: { map: GameMap }) {
  const areas = (map as GameMap & { grass?: [number, number, number, number][] }).grass;
  const tufts = useMemo(() => {
    if (!areas) return [];
    const out: [number, number][] = [];
    for (const [x0, y0, x1, y1] of areas)
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) out.push([x * TILE + TILE / 2, y * TILE + TILE]);
    return out;
  }, [areas]);
  if (!tufts.length) return null;
  return (
    <>
      {tufts.map(([x, z], i) => (
        <mesh key={i} position={[x, 4, z - 2]}>
          <planeGeometry args={[TILE, 8]} />
          <meshBasicMaterial color={i % 2 ? "#3f9c46" : "#4bb055"} transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  );
}

type Player = {
  px: number;
  pz: number;
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

function MapContent({ map }: { map: GameMap }) {
  const base = useTexture(map.image, (t) => pixelate(t as THREE.Texture));
  const { ground, props } = useMapTextures(map, base as THREE.Texture);
  return (
    <>
      <Ground map={map} tex={ground} />
      <GrassPatches map={map} />
      {map.props.map((p, i) => {
        const tex = props[i];
        return tex ? <PropMesh key={`${p.x}-${p.y}-${i}`} p={p} tex={tex} /> : null;
      })}
    </>
  );
}

function Scene({ onWarp }: { onWarp: (to: string, tx: number, ty: number, facing: Dir) => void }) {
  const { camera, size } = useThree();
  const state = useGame();
  const map = MAPS[state.mapId] ?? MAPS["pallet"]!;
  const p = useRef<Player>({
    px: state.x * TILE + TILE / 2,
    pz: state.y * TILE + TILE / 2,
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
  const stepsRef = useRef(0);

  useEffect(() => {
    p.current = {
      ...p.current,
      px: state.x * TILE + TILE / 2,
      pz: state.y * TILE + TILE / 2,
      dir: state.facing,
      moving: false,
      t: 0,
      fromX: state.x,
      fromY: state.y,
      toX: state.x,
      toY: state.y,
    };
  }, [state.mapId, state.x, state.y]);

  const approach = useRef<{ x: number; z: number; step: number; t: number } | null>(null);

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

    const door = map.warps.find((w) => w.kind === "door" && w.x === fx && w.y === fy);
    if (door) return onWarp(door.to, door.tx, door.ty, door.facing ?? "down");

    const sign = map.signs.find((n) => n.x === fx && n.y === fy);
    if (sign) return s.say(sign.lines);

    if (map.id === "lab" && fy === 5 && fx >= 9 && fx <= 11 && d === "up") {
      const key = STARTERS[fx - 9] as StarterKey;
      if (s.starter) return s.say(["Você já escolheu o seu parceiro!"]);
      const sp = SPECIES[key]!;
      return s.say(
        [
          `PROF. CARVALHO: Então você quer ${sp.name}?`,
          sp.dex,
          `${s.playerName} recebeu ${sp.name}!`,
          `${s.rivalName}: Eu fico com este aqui então! Vamos batalhar agora mesmo!`,
        ],
        () => {
          useGame.getState().chooseStarter(key);
          const rival = map.npcs.find((n) => n.id === "rival");
          approach.current = {
            x: (rival?.x ?? 12) * TILE + TILE / 2,
            z: (rival?.y ?? 3) * TILE + TILE / 2,
            step: 0,
            t: 0,
          };
        },
      );
    }

  }

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = useGame.getState();
    const cur = p.current;

    if (interactRef.current) {
      interactRef.current = false;
      if (s.dialogue) s.advanceDialogue();
      else if (!approach.current) interact();
    }

    // rival caminha até o jogador antes da batalha
    const ap = approach.current;
    if (ap) {
      const tgtX = cur.px + TILE;
      const tgtZ = cur.pz;
      const dx = tgtX - ap.x;
      const dz = tgtZ - ap.z;
      const dist = Math.hypot(dx, dz);
      ap.t += dt;
      ap.step = Math.floor(ap.t * 8) % 2 === 0 ? 1 : 2;
      if (dist < 3) {
        approach.current = null;
        s.say([`${s.rivalName}: Espera aí! Eu vou testar o meu POKéMON contra você!`], () =>
          useGame.getState().setPhase("battle"),
        );
      } else {
        const v = (60 * dt) / dist;
        ap.x += dx * Math.min(1, v);
        ap.z += dz * Math.min(1, v);
      }
      force((n) => (n + 1) % 1000000);
      return;
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
      cur.pz = (cur.fromY + (cur.toY - cur.fromY) * k) * TILE + TILE / 2;
      cur.animT += dt;
      if (cur.animT > STEP_TIME / 2) {
        cur.animT = 0;
        cur.step = cur.step === 1 ? 2 : 1;
      }
      if (k >= 1) {
        cur.moving = false;
        cur.step = 0;
        s.setPosition(map.id, cur.toX, cur.toY, cur.dir);
        const warp = map.warps.find(
          (w) => w.kind !== "door" && w.x === cur.toX && w.y === cur.toY,
        );
        if (warp) onWarp(warp.to, warp.tx, warp.ty, warp.facing ?? cur.dir);
        else if (inGrass(map, cur.toX, cur.toY)) {
          stepsRef.current++;
          if (stepsRef.current > 3 && Math.random() < 0.16) {
            stepsRef.current = 0;
            s.startWild(map.id);
          }
        }
      }
    }

    // câmera inclinada seguindo o jogador
    const aspect0 = size.width / size.height;
    const viewH = map.outdoor
      ? Math.min(190, (map.wpx * 0.9) / aspect0)
      : Math.min(map.hpx * 0.9, (map.wpx * 0.9) / aspect0);
    const dist = viewH / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const aspect = size.width / size.height;
    const viewW = viewH * aspect;
    const halfW = viewW / 2;
    const halfD = (viewH * Math.cos(PITCH)) / 2 + 40;

    const tx =
      map.wpx <= viewW ? map.wpx / 2 : THREE.MathUtils.clamp(cur.px, halfW, map.wpx - halfW);
    const tz =
      map.hpx <= halfD * 2
        ? map.hpx / 2
        : THREE.MathUtils.clamp(cur.pz, halfD, map.hpx - halfD);

    const target = new THREE.Vector3(tx, 8, tz);
    const wanted = new THREE.Vector3(
      target.x,
      target.y + Math.sin(PITCH) * dist,
      target.z + Math.cos(PITCH) * dist,
    );
    camera.position.lerp(wanted, 1 - Math.exp(-12 * dt));
    camera.lookAt(target.x, target.y, target.z);
    force((n) => (n + 1) % 1000000);
  });

  const cur = p.current;
  const frame = DIR_ROW[cur.dir] + cur.step;

  return (
    <>
      <MapContent map={map} />
      {map.npcs
        .filter((n) => !(approach.current && n.id === "rival"))
        .map((n) => (
          <Character
            key={n.id}
            url={n.sheet}
            frames={n.frames ?? 12}
            frame={n.frames === 4 ? DIR_4[n.facing] : DIR_ROW[n.facing]}
            x={n.x * TILE + TILE / 2}
            z={n.y * TILE + TILE / 2}
          />
        ))}
      {approach.current && (
        <Character
          url="/game/rival.png"
          frame={DIR_ROW["left"] + approach.current.step}
          x={approach.current.x}
          z={approach.current.z}
        />
      )}
      {map.id === "lab" && (
        <>
          {[0, 1, 2].map((i) => (
            <PokeBall
              key={i}
              x={(9 + i) * TILE + TILE / 2}
              z={5 * TILE + TILE / 2}
              taken={!!state.starter}
            />
          ))}
        </>
      )}
      <Character
        url="/game/player.png"
        frame={frame}
        x={cur.px}
        z={cur.pz}
        w={17}
        h={20}
        bob={cur.moving && cur.step === 1 ? 0.6 : 0}
      />
    </>
  );
}

export function Overworld() {
  const setPosition = useGame((s) => s.setPosition);
  const mapId = useGame((s) => s.mapId);
  const [fade, setFade] = useState(false);
  const outdoor = MAPS[mapId]?.outdoor ?? true;

  function onWarp(to: string, tx: number, ty: number, facing: Dir) {
    setFade(true);
    setTimeout(() => {
      setPosition(to, tx, ty, facing);
      setFade(false);
    }, 260);
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={1}
        gl={{ antialias: false }}
        camera={{ fov: FOV, position: [0, 200, 200], near: 1, far: 4000 }}
      >
        <color attach="background" args={[outdoor ? "#7fc8e8" : "#101018"]} />
        <fog attach="fog" args={[outdoor ? "#7fc8e8" : "#101018", 600, 1200]} />
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
