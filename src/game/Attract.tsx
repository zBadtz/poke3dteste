import { useEffect, useMemo, useState } from "react";

const GENGAR =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/94.png";
const NIDORINO =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/33.png";
const CHARIZARD =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/6.png";

/** Cenas da abertura original: GAME FREAK -> Gengar x Nidorino -> Charizard */
type Scene = "sparkles" | "gamefreak" | "battle" | "charizard";

const TIMELINE: [Scene, number][] = [
  ["sparkles", 2600],
  ["gamefreak", 2200],
  ["battle", 6200],
  ["charizard", 2600],
];

export function Attract({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const scene = TIMELINE[i]?.[0] ?? "charizard";
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const entry = TIMELINE[i];
    if (!entry) {
      onDone();
      return;
    }
    const t = setTimeout(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 260);
      setI((v) => v + 1);
    }, entry[1]);
    return () => clearTimeout(t);
  }, [i, onDone]);

  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  const sparks = useMemo(
    () =>
      Array.from({ length: 46 }, (_, n) => ({
        left: 4 + Math.random() * 92,
        top: 28 + Math.random() * 44,
        delay: (n % 20) * 0.06,
        size: 2 + Math.round(Math.random() * 3),
      })),
    [],
  );

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black select-none"
      onClick={onDone}
    >
      <style>{`
        @keyframes atk-spark { 0%{opacity:0;transform:translate(-40px,10px) scale(.4)} 40%{opacity:1} 100%{opacity:0;transform:translate(40px,-14px) scale(1.2)} }
        @keyframes atk-in { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
        @keyframes atk-scroll { from{background-position:0 0} to{background-position:-320px 0} }
        @keyframes atk-lungeL { 0%,100%{transform:translateX(0) scaleX(-1)} 45%{transform:translateX(34px) scaleX(-1)} }
        @keyframes atk-lungeR { 0%,100%{transform:translateX(0)} 45%{transform:translateX(-34px)} }
        @keyframes atk-rise { from{opacity:0;transform:translateY(28px) scale(1.15)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      {scene === "sparkles" && (
        <div className="absolute inset-0 bg-[#1a2140]">
          {sparks.map((s, n) => (
            <span
              key={n}
              className="absolute bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                animation: `atk-spark 1.6s ${s.delay}s ease-in-out infinite`,
              }}
            />
          ))}
          <div
            className="pixel absolute inset-0 flex items-center justify-center text-[18px] tracking-[0.35em] text-white/85 sm:text-[26px]"
            style={{ animation: "atk-in 1.6s 1s both" }}
          >
            GAME FREAK
          </div>
        </div>
      )}

      {scene === "gamefreak" && (
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-[#1a2140]">
          <span className="pixel text-[18px] tracking-[0.3em] text-white sm:text-[26px]">GAME</span>
          <span
            className="inline-block h-8 w-4 rounded-full bg-[#ffd34e] sm:h-11 sm:w-5"
            style={{ boxShadow: "0 0 14px #ffd34e" }}
          />
          <span className="pixel text-[18px] tracking-[0.3em] text-white sm:text-[26px]">FREAK</span>
        </div>
      )}

      {scene === "battle" && (
        <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#12203a_0%,#12203a_45%,#4aa02c_46%,#2f7a20_100%)]">
          <div
            className="absolute inset-x-0 top-[18%] h-[32%] opacity-80"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#5b3a1e 0 14px,#3d2513 14px 34px,#12203a 34px 64px)",
              animation: "atk-scroll 2.4s linear infinite",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[54%] opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#57b336 0 18px,#3f9128 18px 40px)",
              animation: "atk-scroll 1.1s linear infinite",
            }}
          />
          <img
            src={GENGAR}
            alt="Gengar"
            className="absolute bottom-[22%] left-[16%] w-[26%] max-w-[220px]"
            style={{ imageRendering: "pixelated", animation: "atk-lungeL 1.6s ease-in-out infinite" }}
          />
          <img
            src={NIDORINO}
            alt="Nidorino"
            className="absolute bottom-[20%] right-[16%] w-[22%] max-w-[190px]"
            style={{ imageRendering: "pixelated", animation: "atk-lungeR 1.6s .2s ease-in-out infinite" }}
          />
        </div>
      )}

      {scene === "charizard" && (
        <div className="absolute inset-0 flex items-end justify-center bg-[linear-gradient(180deg,#000_0%,#0d3b3b_70%,#2ec4b6_100%)]">
          <img
            src={CHARIZARD}
            alt="Charizard"
            className="mb-[10%] w-[44%] max-w-[380px]"
            style={{ imageRendering: "pixelated", animation: "atk-rise 1.8s ease-out both" }}
          />
        </div>
      )}

      <div
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="pixel absolute bottom-2 w-full text-center text-[6px] text-white/50">
        Pressione qualquer tecla para pular
      </div>
    </div>
  );
}
