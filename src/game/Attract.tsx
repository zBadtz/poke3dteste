import { useEffect, useState } from "react";

/** Palco de 240x160 (resolução do GBA) escalado para a tela. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <div
        className="relative"
        style={{
          width: "min(100%, calc(100vh * 1.5))",
          aspectRatio: "240 / 160",
          imageRendering: "pixelated",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const L = "absolute inset-0 h-full w-full object-fill";
const px = { imageRendering: "pixelated" as const };

/** cada cena dura X ms */
const TIMELINE = [2400, 3200, 1600, 2600, 2600];

export function Attract({ onDone }: { onDone: () => void }) {
  const [scene, setScene] = useState(0);

  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  useEffect(() => {
    const ms = TIMELINE[scene] ?? 1500;
    const t = setTimeout(() => {
      if (scene + 1 >= TIMELINE.length) onDone();
      else setScene(scene + 1);
    }, ms);
    return () => clearTimeout(t);
  }, [scene, onDone]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black select-none" onClick={onDone}>
      {/* pré-carrega */}
      <div className="hidden">
        {[
          "copyright",
          "gf_bg",
          "gf_name",
          "gf_presents",
          "gf_star",
          "s1_bg",
          "s1_grass",
          "s2_bg",
          "s2_plants",
          "gengar",
          "nidorino",
          "s3_bg",
          "s3_nidorino",
        ].map((n) => (
          <img key={n} src={`/game/fr/${n}.png`} alt="" />
        ))}
      </div>

      <Stage>
        {scene === 0 && (
          <img src="/game/fr/copyright.png" alt="" className={`${L} intro-shot`} style={px} />
        )}

        {scene === 1 && (
          <>
            <img src="/game/fr/gf_bg.png" alt="" className={L} style={px} />
            <img
              src="/game/fr/gf_star.png"
              alt=""
              className="absolute intro-star"
              style={{ ...px, width: "6.6%", top: "34%" }}
            />
            <img
              src="/game/fr/gf_name.png"
              alt=""
              className="absolute intro-fade"
              style={{ ...px, width: "60%", left: "20%", top: "42%" }}
            />
            <img
              src="/game/fr/gf_presents.png"
              alt=""
              className="absolute intro-fade-late"
              style={{ ...px, width: "27%", left: "36.5%", top: "60%" }}
            />
          </>
        )}

        {scene === 2 && (
          <>
            <img src="/game/fr/s1_bg.png" alt="" className={L} style={px} />
            <img src="/game/fr/s1_grass.png" alt="" className={`${L} intro-pan`} style={px} />
          </>
        )}

        {scene === 3 && (
          <>
            <img src="/game/fr/s2_bg.png" alt="" className={L} style={px} />
            <img
              src="/game/fr/gengar.png"
              alt=""
              className="absolute intro-slide-l"
              style={{ ...px, width: "22%", left: "6%", top: "30%" }}
            />
            <img
              src="/game/fr/nidorino.png"
              alt=""
              className="absolute intro-slide-r"
              style={{ ...px, width: "22%", right: "6%", top: "34%" }}
            />
            <img src="/game/fr/s2_plants.png" alt="" className={L} style={px} />
          </>
        )}

        {scene === 4 && (
          <>
            <img src="/game/fr/s3_bg.png" alt="" className={L} style={px} />
            <img
              src="/game/fr/gengar.png"
              alt=""
              className="absolute intro-shake"
              style={{ ...px, width: "26%", left: "8%", top: "26%" }}
            />
            <img
              src="/game/fr/nidorino.png"
              alt=""
              className="absolute intro-shake"
              style={{ ...px, width: "26%", right: "8%", top: "30%" }}
            />
            <div className="absolute inset-0 intro-clash bg-white" />
          </>
        )}
      </Stage>

      <div className="pixel absolute bottom-2 w-full text-center text-[6px] text-white/50">
        Pressione qualquer tecla para pular
      </div>
    </div>
  );
}
