import { useState } from "react";
import { Title } from "./Title";
import { Intro } from "./Intro";
import { Overworld } from "./Overworld";
import { Battle } from "./Battle";
import { useGame } from "./store";
import { useTypewriter } from "./Typewriter";

function DialogueBox() {
  const dialogue = useGame((s) => s.dialogue);
  const advance = useGame((s) => s.advanceDialogue);
  const line = dialogue?.[0] ?? "";
  const { shown, done, skip } = useTypewriter(line, 22);
  if (!dialogue) return null;
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-2 sm:p-4">
      <button
        className="gb-box w-full p-4 text-left"
        onClick={() => (done ? advance() : skip())}
      >
        <p className="pixel text-[10px] leading-relaxed text-black">{shown}</p>
        {done && <span className="pixel float-right animate-pulse text-[10px] text-black">▼</span>}
      </button>
    </div>
  );
}

export function Game() {
  const phase = useGame((s) => s.phase);
  const setPhase = useGame((s) => s.setPhase);
  const [introMode, setIntroMode] = useState(false);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-black">
      <div className="relative h-full w-full">
        {phase === "title" && !introMode && <Title onNewGame={() => setIntroMode(true)} />}
        {phase === "title" && introMode && <Intro />}
        {phase === "overworld" && (
          <>
            <Overworld />
            <DialogueBox />
          </>
        )}
        {phase === "battle" && <Battle />}
        {phase === "overworld" && (
          <button
            onClick={() => setPhase("title")}
            className="pixel absolute right-2 top-2 z-40 border-2 border-black bg-white/80 px-2 py-1 text-[7px] text-black"
          >
            MENU
          </button>
        )}
      </div>
    </main>
  );
}
