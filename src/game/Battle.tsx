import { useEffect, useMemo, useState } from "react";
import { MOVES, damage, spriteUrl, xpToNext, type Mon } from "./data";
import { useGame } from "./store";

type Menu = "main" | "fight" | "bag" | "party";

function HpBar({ mon }: { mon: Mon }) {
  const pct = Math.max(0, (mon.hp / mon.maxHp) * 100);
  const color = pct > 50 ? "#4cc850" : pct > 20 ? "#f0c020" : "#e04030";
  return (
    <div className="h-2 w-28 border-2 border-black bg-[#404040]">
      <div
        className="h-full transition-[width] duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function Info({ mon, foe }: { mon: Mon; foe?: boolean }) {
  return (
    <div className="gb-box px-3 py-2">
      <div className="pixel flex items-center gap-2 text-[8px] text-black">
        <span>{mon.species.name}</span>
        <span className="ml-auto">Nv{mon.level}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="pixel text-[7px] text-[#f0a020]">PS</span>
        <HpBar mon={mon} />
      </div>
      {!foe && (
        <div className="pixel mt-1 text-right text-[8px] text-black">
          {mon.hp}/{mon.maxHp}
        </div>
      )}
    </div>
  );
}

export function Battle() {
  const { playerName, rivalName, party, rivalParty, setPhase, say } = useGame();
  const [player, setPlayer] = useState<Mon>(() => structuredClone(party[0]));
  const [foe, setFoe] = useState<Mon>(() => structuredClone(rivalParty[0]));
  const [menu, setMenu] = useState<Menu>("main");
  const [text, setText] = useState(`${rivalName} enviou ${rivalParty[0].species.name}!`);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState<null | "win" | "lose">(null);
  const [shake, setShake] = useState<"none" | "player" | "foe">("none");
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 900);
    return () => clearTimeout(t);
  }, []);

  async function flash(who: "player" | "foe") {
    setShake(who);
    await wait(320);
    setShake("none");
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function useMove(attacker: Mon, defender: Mon, moveKey: string, whoAttacks: "player" | "foe") {
    const move = MOVES[moveKey];
    setText(`${attacker.species.name} usou ${move.name}!`);
    await wait(750);

    if (Math.random() * 100 > move.accuracy) {
      setText("Mas o ataque falhou!");
      await wait(750);
      return defender;
    }

    if (move.category === "status") {
      const next = structuredClone(defender);
      if (move.effect === "lower-attack") next.stages.atk = Math.max(-6, next.stages.atk - 1);
      if (move.effect === "lower-defense") next.stages.def = Math.max(-6, next.stages.def - 1);
      setText(`${defender.species.name} teve um atributo reduzido!`);
      await wait(750);
      return next;
    }

    const { dmg, eff, crit } = damage(attacker, defender, move);
    const next = structuredClone(defender);
    next.hp = Math.max(0, next.hp - dmg);
    await flash(whoAttacks === "player" ? "foe" : "player");
    if (whoAttacks === "player") setFoe(next);
    else setPlayer(next);
    if (crit) {
      setText("Um golpe crítico!");
      await wait(650);
    }
    if (eff > 1) {
      setText("É super efetivo!");
      await wait(650);
    } else if (eff < 1 && eff > 0) {
      setText("Não é muito efetivo...");
      await wait(650);
    } else if (eff === 0) {
      setText(`Não afeta ${defender.species.name}...`);
      await wait(650);
    }
    return next;
  }

  async function playerTurn(moveKey: string) {
    if (busy || over) return;
    setBusy(true);
    setMenu("main");

    const first = player.spe >= foe.spe;
    const foeMove = foe.moves[Math.floor(Math.random() * foe.moves.length)].key;

    let curPlayer = player;
    let curFoe = foe;

    if (first) {
      curFoe = await useMove(curPlayer, curFoe, moveKey, "player");
      if (curFoe.hp <= 0) return finish("win");
      curPlayer = await useMove(curFoe, curPlayer, foeMove, "foe");
      if (curPlayer.hp <= 0) return finish("lose");
    } else {
      curPlayer = await useMove(curFoe, curPlayer, foeMove, "foe");
      if (curPlayer.hp <= 0) return finish("lose");
      curFoe = await useMove(curPlayer, curFoe, moveKey, "player");
      if (curFoe.hp <= 0) return finish("win");
    }

    setText("O que ${player} vai fazer?".replace("${player}", curPlayer.species.name));
    setBusy(false);
  }

  async function finish(result: "win" | "lose") {
    setOver(result);
    if (result === "win") {
      setText(`${foe.species.name} inimigo desmaiou!`);
      await wait(900);
      const gained = Math.floor((foe.level * 60) / 7);
      setText(`${player.species.name} ganhou ${gained} pontos de EXP.!`);
    } else {
      setText(`${player.species.name} desmaiou!`);
      await wait(900);
      setText(`${playerName} não tem mais POKéMON em condições de lutar!`);
    }
    setBusy(false);
  }

  function leave() {
    useGame.getState().setFlag("beatRival", over === "win");
    setPhase("overworld");
    say(
      over === "win"
        ? [
            `${rivalName}: O quê? Como assim eu perdi?`,
            `${rivalName}: Eu vou treinar meu POKéMON e ser o maior treinador de KANTO!`,
            "PROF. CARVALHO: Vá em frente! Sua jornada começa agora.",
          ]
        : [
            `${rivalName}: Hahaha! Eu venci! Eu escolhi o POKéMON certo!`,
            "PROF. CARVALHO: Não desanime. Descanse seus POKéMON e tente de novo.",
          ],
    );
  }

  const xpPct = useMemo(() => (player.xp / xpToNext(player.level)) * 100, [player]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f8f8f8]">
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          intro ? "opacity-100" : "opacity-0"
        } pointer-events-none z-30`}
      />
      {/* cenário */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#8ed0f0_0%,#d8f0ff_55%,#f0e8c8_55%,#e0d0a0_100%)]" />

      {/* inimigo */}
      <div className="absolute left-4 top-6 z-10 sm:left-10 sm:top-10">
        <Info mon={foe} foe />
      </div>
      <div className="absolute right-6 top-16 z-10 flex flex-col items-center sm:right-24 sm:top-20">
        <div className="h-3 w-24 rounded-[50%] bg-[#7ac070]/60 blur-[1px]" />
        <img
          src={spriteUrl(foe.species.id)}
          alt={foe.species.name}
          className={`pixelated -mt-24 h-24 w-24 ${shake === "foe" ? "animate-[hit_0.3s]" : ""} ${
            foe.hp <= 0 ? "translate-y-10 opacity-0 transition-all duration-500" : ""
          }`}
        />
      </div>

      {/* jogador */}
      <div className="absolute bottom-44 left-6 z-10 flex flex-col items-center sm:bottom-48 sm:left-24">
        <img
          src={spriteUrl(player.species.id, true)}
          alt={player.species.name}
          className={`pixelated h-28 w-28 ${shake === "player" ? "animate-[hit_0.3s]" : ""} ${
            player.hp <= 0 ? "translate-y-10 opacity-0 transition-all duration-500" : ""
          }`}
        />
        <div className="-mt-2 h-3 w-28 rounded-[50%] bg-[#7ac070]/60 blur-[1px]" />
      </div>
      <div className="absolute bottom-40 right-4 z-10 sm:right-12">
        <Info mon={player} />
        <div className="mt-1 h-1.5 w-28 border border-black bg-[#404040]">
          <div className="h-full bg-[#40a0f0]" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* caixa de texto / menus */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex gap-2 p-2 sm:p-3">
        <div className="gb-box flex-1 p-3">
          <p className="pixel text-[9px] leading-relaxed text-black">{text}</p>
          {over && (
            <button
              onClick={leave}
              className="pixel mt-3 border-2 border-black bg-[#f04a3c] px-3 py-1 text-[8px] text-white"
            >
              CONTINUAR
            </button>
          )}
        </div>

        {!over && !busy && (
          <div className="gb-box w-52 p-2">
            {menu === "main" ? (
              <div className="grid grid-cols-2 gap-1">
                <MenuBtn label="LUTAR" onClick={() => setMenu("fight")} />
                <MenuBtn label="BOLSA" onClick={() => setText("Você não tem itens ainda!")} />
                <MenuBtn label="POKéMON" onClick={() => setText(`${player.species.name} está pronto para lutar!`)} />
                <MenuBtn label="FUGIR" onClick={() => setText("Não dá para fugir de uma batalha de treinadores!")} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {player.moves.map((m) => (
                  <MenuBtn
                    key={m.key}
                    label={MOVES[m.key].name}
                    sub={`PP ${m.pp}`}
                    onClick={() => {
                      if (m.pp <= 0) return setText("Não há PP restante para esse golpe!");
                      m.pp--;
                      playerTurn(m.key);
                    }}
                  />
                ))}
                <button
                  onClick={() => setMenu("main")}
                  className="pixel col-span-2 border-2 border-black py-1 text-[7px] text-black"
                >
                  VOLTAR
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MenuBtn({ label, sub, onClick }: { label: string; sub?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pixel border-2 border-black px-1 py-2 text-[7px] leading-tight text-black hover:bg-black hover:text-white"
    >
      {label}
      {sub && <span className="block text-[6px] opacity-70">{sub}</span>}
    </button>
  );
}
