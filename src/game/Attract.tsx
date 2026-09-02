import { useEffect, useState } from "react";
import copyFrame from "../assets/intro/copy.png.asset.json";
import gf2 from "../assets/intro/gf2.png.asset.json";
import gf3 from "../assets/intro/gf3.png.asset.json";
import gf4 from "../assets/intro/gf4.png.asset.json";
import grass1 from "../assets/intro/grass1.png.asset.json";
import grass2 from "../assets/intro/grass2.png.asset.json";
import grass3 from "../assets/intro/grass3.png.asset.json";
import r2a from "../assets/intro/r2a.png.asset.json";
import r2b from "../assets/intro/r2b.png.asset.json";
import r3a from "../assets/intro/r3a.png.asset.json";
import scene1 from "../assets/intro/scene1.png.asset.json";
import scene2 from "../assets/intro/scene2.png.asset.json";
import t4 from "../assets/intro/t4.png.asset.json";

type Shot = { src: string; ms: number; fx?: "zoom" | "shake" | "flash" | "none" };

/** Sequência da abertura original do FireRed, montada com os quadros originais. */
const SHOTS: Shot[] = [
  { src: copyFrame.url, ms: 1600 },
  { src: gf2.url, ms: 900 },
  { src: gf3.url, ms: 900, fx: "flash" },
  { src: gf4.url, ms: 1100 },
  { src: grass1.url, ms: 350, fx: "zoom" },
  { src: grass2.url, ms: 350, fx: "zoom" },
  { src: grass3.url, ms: 500, fx: "zoom" },
  { src: scene1.url, ms: 1100 },
  { src: r3a.url, ms: 1000 },
  { src: r2a.url, ms: 600, fx: "flash" },
  { src: r2b.url, ms: 700 },
  { src: scene2.url, ms: 500, fx: "flash" },
  { src: r3a.url, ms: 800, fx: "shake" },
  { src: t4.url, ms: 1600, fx: "zoom" },
];

export function Attract({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  useEffect(() => {
    const shot = SHOTS[i];
    if (!shot) return;
    const t = setTimeout(() => {
      if (i + 1 >= SHOTS.length) onDone();
      else setI(i + 1);
    }, shot.ms);
    return () => clearTimeout(t);
  }, [i, onDone]);

  const shot: Shot = SHOTS[i] ?? SHOTS[0]!;

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black select-none"
      onClick={onDone}
    >
      {/* pré-carrega os quadros seguintes */}
      <div className="hidden">
        {SHOTS.map((s, k) => (
          <img key={k} src={s.src} alt="" />
        ))}
      </div>

      <img
        key={i}
        src={shot.src}
        alt=""
        className={`absolute inset-0 h-full w-full object-contain intro-shot ${
          shot.fx === "zoom"
            ? "intro-zoom"
            : shot.fx === "shake"
              ? "intro-shake"
              : shot.fx === "flash"
                ? "intro-flash"
                : ""
        }`}
        style={{ imageRendering: "pixelated" }}
      />

      <div className="pixel absolute bottom-2 w-full text-center text-[6px] text-white/50">
        Pressione qualquer tecla para pular
      </div>
    </div>
  );
}
