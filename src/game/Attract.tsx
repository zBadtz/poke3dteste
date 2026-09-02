import { useEffect, useRef, useState } from "react";
import intro from "../assets/intro.mp4.asset.json";

/** Abertura original em vídeo. Qualquer tecla ou clique pula. */
export function Attract({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {
      // navegadores bloqueiam áudio sem interação: reinicia sem som
      v.muted = true;
      setMuted(true);
      v.play().catch(() => onDone());
    });
  }, [onDone]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none" onClick={onDone}>
      <video
        ref={ref}
        src={intro.url}
        className="h-full w-full object-contain"
        playsInline
        onEnded={onDone}
      />
      {muted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const v = ref.current;
            if (!v) return;
            v.muted = false;
            setMuted(false);
          }}
          className="pixel absolute right-3 top-3 border-2 border-white/60 bg-black/60 px-2 py-1 text-[7px] text-white"
        >
          ATIVAR SOM
        </button>
      )}
      <div className="pixel absolute bottom-2 w-full text-center text-[6px] text-white/50">
        Pressione qualquer tecla para pular
      </div>
    </div>
  );
}
