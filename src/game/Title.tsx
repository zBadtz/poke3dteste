import { useEffect, useState } from "react";
import { SaveRepository, useGame } from "./store";
import { Attract } from "./Attract";

type Stage = "press" | "menu";

const px = { imageRendering: "pixelated" as const };
const L = "absolute inset-0 h-full w-full object-fill";

export function Title({ onNewGame }: { onNewGame: () => void }) {
  const [attract, setAttract] = useState(true);
  const [stage, setStage] = useState<Stage>("press");
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const continueGame = useGame((s) => s.continueGame);
  const hasSave = typeof window !== "undefined" && !!SaveRepository.load();
  const options = ["NOVO JOGO", hasSave ? "CONTINUAR" : "CONTINUAR (vazio)", "OPÇÕES"];

  useEffect(() => {
    if (attract) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (stage === "press") {
        if (["Enter", " ", "z", "Z", "x", "X"].includes(k)) setStage("menu");
        return;
      }
      if (k === "ArrowDown") setIndex((i) => (i + 1) % options.length);
      if (k === "ArrowUp") setIndex((i) => (i - 1 + options.length) % options.length);
      if (["Enter", " ", "z", "Z"].includes(k)) select(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function select(i: number) {
    if (i === 0) {
      setFade(true);
      setTimeout(onNewGame, 700);
    } else if (i === 1) {
      if (continueGame()) return;
    }
  }

  if (attract) return <Attract onDone={() => setAttract(false)} />;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-black select-none"
      onClick={() => (stage === "menu" ? select(index) : setStage("menu"))}
    >
      <div
        className="relative"
        style={{ width: "min(100%, calc(100vh * 1.5))", aspectRatio: "240 / 160", ...px }}
      >
        {/* fundo em degradê de fogo, como na tela original */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#1a1030_0%,#3a1330_45%,#7a2410_80%,#c85416_100%)]" />
        <div className="title-flames absolute inset-x-0 bottom-0 h-1/2 opacity-70" />

        <img src="/game/fr/charizard.png" alt="Charizard" className={`${L} title-mon-in`} style={px} />
        <img
          src="/game/fr/title_logo.png"
          alt="Pokémon FireRed"
          className={`${L} title-logo-in`}
          style={px}
        />
        <span className="title-slash pointer-events-none absolute inset-y-0" />

        {stage === "press" && (
          <img
            src="/game/fr/press_start.png"
            alt="Press Start"
            className={`${L} animate-[blink_1s_steps(1)_infinite]`}
            style={px}
          />
        )}

        {stage === "menu" && (
          <div className="absolute inset-0 flex items-end justify-center pb-[6%]">
            <div className="w-[52%] rounded-md border-[3px] border-[#0b3a6b] bg-gradient-to-b from-[#f4fbff] to-[#cfe6ff] p-2 shadow-[0_6px_0_rgba(0,0,0,.45)]">
              {options.map((o, i) => (
                <button
                  key={o}
                  onMouseEnter={() => setIndex(i)}
                  onClick={(e) => {
                    e.stopPropagation();
                    select(i);
                  }}
                  className={`pixel flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[8px] text-[#12305a] ${
                    i === index ? "bg-[#9ec9ff]" : ""
                  }`}
                >
                  <span className={i === index ? "opacity-100" : "opacity-0"}>▶</span>
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pixel absolute bottom-1 w-full text-center text-[6px] text-white/60">
        Fan game sem fins lucrativos · Pokémon © Nintendo / Game Freak
      </div>

      <div
        className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-700 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
