# Kanto 2.5D Online — Entrega 1: Abertura Jogável

Primeira fatia: da tela-título animada até a primeira batalha contra o rival, já sobre a engine 2.5D definitiva (sprites 2D em cena 3D ortográfica).

## O que o jogador vai ver

1. **Tela-título animada** — logo pulsante sobre fundo com parallax, Pokémon em destaque entrando em cena, brilho passando pela logo, "PRESS START" piscando e demo em loop que volta ao título após alguns segundos. Menu: NEW GAME / CONTINUE / OPTIONS, com cursor, som de seleção e transição em fade branco.
2. **Intro do Professor Carvalho** — fundo escuro, retrato do professor com animação de entrada, caixa de texto com efeito de digitação e avanço por tecla/clique, apresentação do mundo, tela de nome do jogador e apresentação do rival com escolha de nome.
3. **Quarto do jogador → Pallet Town** — descida da escada, saída de casa e caminhada até o laboratório com o mundo 2.5D completo: camadas, Y-sort, oclusão (passar atrás de árvore/telhado), sombras, grama que balança, parallax e câmera com follow suave.
4. **Laboratório e escolha do inicial** — três Poké Bolas na mesa, foco de câmera em cada uma, retrato e dados do Pokémon, confirmação e animação de recebimento.
5. **Primeira batalha com o rival** — batalha por turnos completa em cena própria: entrada dos sprites, barras de HP animadas, menu LUTAR/BOLSA/POKÉMON/FUGIR, 4 golpes com tipos e efetividade, dano, mensagens, animações simples de ataque, vitória/derrota, ganho de XP e volta ao mapa.

## Direção visual

Pixel art nítida (nearest-neighbor, sem suavização), paleta e escala inspiradas em FireRed, UI com molduras arredondadas azuis e fonte pixel. Nada de 3D "de verdade" visível: toda arte é sprite.

## Assets

- Sprites dos 151 Pokémon (frente, costas, ícone, shiny) de fontes públicas — baixados uma vez e hospedados no CDN do projeto, não referenciados de terceiros em runtime.
- Tiles, casas, árvores, NPCs, personagem e retratos: montados a partir das referências do ZIP enviado, recortados em atlas próprios do projeto.
- Logo do título e efeitos: recriação em alta fidelidade ao original.
- Música e efeitos: trilhas curtas em estilo chiptune próprio (título, Pallet Town, batalha, vitória) — podem ser substituídas depois.

## Estrutura técnica

- **Engine**: React Three Fiber + Three.js + TypeScript, `<Canvas>` em rota client-only, câmera ortográfica com inclinação oblíqua fixa, pixel ratio travado e sprites em planos com `NearestFilter`.
- **Profundidade**: sorting layers (fundo / mundo / jogador / primeiro plano), Y-sort automático por posição no eixo do mundo, oclusão com transparência suave em telhados e copas, sombra elíptica sob cada entidade, parallax discreto no fundo.
- **Efeitos**: luz 2D ambiente com tinta por hora do dia, shader de água ondulante, partículas (folhas, poeira, grama ao andar), shader de transição de batalha.
- **Loop e estados**: máquina de estados global (title → intro → overworld → dialogue → battle), tudo com delta-time, input unificado teclado + toque (D-pad virtual no mobile).
- **Dados**: tabelas próprias em TypeScript para espécies, tipos, golpes, efetividade, XP e evolução — modeladas segundo a lógica do jogo clássico, com os 151 já cadastrados nas espécies.
- **Mundo**: mapas em JSON (camadas de tiles, colisão, gatilhos, spawns), começando por Quarto, Casa do Jogador, Pallet Town e Laboratório.
- **Save / online**: estado do jogo serializado em um único objeto de save, salvo por enquanto no navegador, atrás de uma camada de repositório (`SaveRepository`) que depois troca para contas e save na nuvem sem mexer no jogo. Multiplayer não entra nesta entrega.
- **HUD e menus**: React/DOM sobre o canvas (caixas de diálogo, menus, Pokédex futura), mantendo o canvas só para o mundo.

## Fora desta entrega (próximas fases)

Rota 1 e demais cidades, captura em grama alta, PC/Bolsa completos, ginásios, Equipe Rocket, Elite dos Quatro, Pokédex completa, contas e multiplayer em tempo real.
