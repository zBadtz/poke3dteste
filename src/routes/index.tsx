import { createFileRoute } from "@tanstack/react-router";
import { Game } from "../game/Game";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kanto 2.5D Online — Aventura em Pallet Town" },
      {
        name: "description",
        content:
          "Fan game 2.5D inspirado em Pokémon FireRed: tela-título animada, introdução do Prof. Carvalho, Pallet Town explorável e a primeira batalha contra o rival.",
      },
      { property: "og:title", content: "Kanto 2.5D Online — Aventura em Pallet Town" },
      {
        property: "og:description",
        content:
          "Explore Pallet Town, escolha seu POKéMON inicial no laboratório e enfrente seu rival na primeira batalha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
