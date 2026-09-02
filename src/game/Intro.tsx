import { useEffect, useState } from "react";
import { useTypewriter } from "./Typewriter";
import { useGame } from "./store";

const NAME_MAX = 10;

export function Intro() {
  const startNewGame = useGame((s) => s.startNewGame);
  const [step, setStep] = useState(0);
  const [playerName, setPlayerName] = useState("VERMELHO");
  const [rivalName, setRivalName] = useState("AZUL");

  const lines = [
    "Olá! Seja bem-vindo ao mundo POKéMON!",
    "Meu nome é CARVALHO. As pessoas me chamam de PROFESSOR POKéMON.",
    "Este mundo é habitado por criaturas chamadas POKéMON!",
    "Para algumas pessoas, POKéMON são bichos de estimação. Outras os usam em batalhas.",
    "Quanto a mim... eu estudo POKéMON como profissão.",
    "Primeiro, me diga... qual é o seu nome?",
  ];

  const isNaming = step >= lines.length;
  const namingRival = step === lines.length + 1;
  const text = isNaming ? "" : lines[step];
  const { shown, done, skip } = useTypewriter(text, 24);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isNaming) return;
      if (["Enter", " ", "z", "Z"].includes(e.key)) {
        if (!done) skip();
        else setStep((s) => s + 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done, isNaming, skip]);

  function submitName() {
    if (namingRival) {
      startNewGame(playerName.toUpperCase(), rivalName.toUpperCase());
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#101018] select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#2b3a55_0%,#0b0d16_70%)]" />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-4 pb-40">
        <img
          src="/game/oak_big.png"
          alt="Professor Carvalho"
          className="pixelated h-[45vh] max-h-[380px] drop-shadow-[0_0_24px_rgba(140,180,255,0.35)] animate-[fade-in_0.8s_ease-out]"
        />
        {namingRival && (
          <img
            src="/game/rival_front.png"
            alt="Rival"
            className="pixelated absolute top-[12%] right-[10%] h-32 animate-[fade-in_0.5s_ease-out]"
          />
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-6">
        {!isNaming ? (
          <button
            className="gb-box w-full p-4 text-left"
            onClick={() => (done ? setStep((s) => s + 1) : skip())}
          >
            <p className="pixel text-[10px] leading-relaxed text-black">{shown}</p>
            {done && <span className="pixel float-right text-[10px] text-black">▼</span>}
          </button>
        ) : (
          <div className="gb-box w-full p-4">
            <p className="pixel mb-3 text-[10px] text-black">
              {namingRival
                ? "Este é meu neto, seu rival desde bebê. Qual é o nome dele?"
                : `Qual é o seu nome, jovem treinador?`}
            </p>
            <input
              autoFocus
              maxLength={NAME_MAX}
              value={namingRival ? rivalName : playerName}
              onChange={(e) =>
                namingRival
                  ? setRivalName(e.target.value.toUpperCase())
                  : setPlayerName(e.target.value.toUpperCase())
              }
              onKeyDown={(e) => e.key === "Enter" && submitName()}
              className="pixel w-full border-2 border-black bg-white px-2 py-2 text-[10px] uppercase text-black outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {(namingRival ? ["AZUL", "GARY", "JOÃO"] : ["VERMELHO", "RED", "ASH"]).map((n) => (
                <button
                  key={n}
                  onClick={() => (namingRival ? setRivalName(n) : setPlayerName(n))}
                  className="pixel border-2 border-black px-2 py-1 text-[8px] text-black hover:bg-black hover:text-white"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={submitName}
                className="pixel ml-auto border-2 border-black bg-[#f04a3c] px-3 py-1 text-[9px] text-white"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
