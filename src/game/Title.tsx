import { useEffect, useState } from "react";
import { SaveRepository, useGame } from "./store";
import { Attract } from "./Attract";

type Stage = "logo" | "press" | "menu";

export function Title({ onNewGame }: { onNewGame: () => void }) {
  const [attract, setAttract] = useState(true);
  const [stage, setStage] = useState<Stage>("logo");
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const continueGame = useGame((s) => s.continueGame);
  const hasSave = typeof window !== "undefined" && !!SaveRepository.load();
  const options = ["NOVO JOGO", hasSave ? "CONTINUAR" : "CONTINUAR (vazio)", "OPÇÕES"];

  useEffect(() => {
    const t = setTimeout(() => setStage("press"), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (attract) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (stage === "logo") {
        setStage("press");
        return;
      }
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
      className="relative h-full w-full overflow-hidden bg-black select-none"
      onClick={() => (stage === "menu" ? select(index) : setStage(stage === "logo" ? "press" : "menu"))}
    >
      {/* céu / parallax */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7c331_0%,#ef6d34_45%,#8c2f2f_100%)]" />
      <div className="title-clouds absolute inset-0 opacity-40" />
      <div className="title-flames absolute inset-x-0 bottom-0 h-1/2" />

      {/* logo */}
      <div className="relative flex h-full flex-col items-center justify-center gap-6 px-4">
        <div className="title-logo relative w-[78%] max-w-[560px] text-center">
          <img
            src={logo.url}
            alt="Pokémon FireRed"
            className="w-full drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)]"
          />
          <span className="title-shine pointer-events-none absolute inset-0" />
          <div className="mt-2 pixel text-[8px] tracking-[0.3em] text-white/85 drop-shadow-[0_2px_0_#000]">
            KANTO 2.5D ONLINE
          </div>
        </div>


        {stage === "press" && (
          <div className="pixel animate-[blink_1s_steps(1)_infinite] text-[10px] text-white drop-shadow-[0_2px_0_#000]">
            PRESSIONE START
          </div>
        )}

        {stage === "menu" && (
          <div className="gb-box w-56 p-3">
            {options.map((o, i) => (
              <button
                key={o}
                onMouseEnter={() => setIndex(i)}
                onClick={(e) => {
                  e.stopPropagation();
                  select(i);
                }}
                className="pixel flex w-full items-center gap-2 py-1 text-left text-[9px] text-black"
              >
                <span className={i === index ? "opacity-100" : "opacity-0"}>▶</span>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>

      <img
        src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/6.png"
        alt="Charizard"
        className="pointer-events-none absolute bottom-6 right-2 w-[38%] max-w-[300px] opacity-95 drop-shadow-[0_6px_10px_rgba(0,0,0,.5)]"
        style={{ imageRendering: "pixelated" }}
      />

      <div className="pixel absolute bottom-2 w-full text-center text-[6px] text-white/70">
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
