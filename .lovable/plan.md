# Kanto 2.5D — reconstrução do visual e correções

O problema central: hoje o jogo é 2D puro (a imagem do mapa aparece de frente, câmera de cima). Para chegar no visual do vídeo é preciso trocar a forma de montar a cena, não só ajustar a câmera. Por isso a entrega é dividida em fases; começo pela fase 1 (o visual) e sigo nas seguintes.

Observação: nenhum arquivo de vídeo chegou junto (só imagens). Vou reproduzir a intro a partir das imagens enviadas (Gengar x Nidorino) e do jeito do FireRed original. Se você anexar o vídeo, eu sincronizo os tempos exatamente com ele.

## Fase 1 — O visual 2.5D (o principal)

Como o vídeo faz e como vou fazer:

- Câmera em perspectiva inclinada (~50-60° de tombo), não mais ortográfica de frente. FOV baixo para manter o ar de pixel art.
- O chão vira um plano deitado no eixo XZ com a textura do mapa (grama, caminhos, água).
- Tudo que é "alto" deixa de fazer parte do chão e vira geometria em pé: casas e laboratório como caixas com telhado, árvores/cercas/placas como billboards em pé recortados da própria imagem original.
- Personagens viram billboards em pé (não deitados), com sombra projetada no chão.
- Ordenação por profundidade real (depth buffer), então oclusão atrás de casas e árvores passa a funcionar sozinha.
- Nada de barra preta: a câmera enquadra o mapa inteiro no viewport, com o fundo do céu no tom do jogo em vez de preto.

Para isso, cada mapa ganha uma camada de "objetos altos" (posição em tiles, altura, recorte da imagem original). Começo por Pallet Town e pelos interiores.

## Fase 2 — Menu e intro

- Tela-título nova usando a logo oficial anexada (Pokémon FireRed Version), com fundo animado, brilho passando pela logo, "PRESS START" pulsando e o painel de menu no estilo GBA.
- Intro: sequência igual à do original — faíscas / GAME FREAK, a cena Gengar x Nidorino usando a arte enviada (fundo de floresta, os dois se encarando e avançando), e então a logo. Sem o Charizard solto do jeito atual.

## Fase 3 — Correções do mundo

- Varredura tile a tile da colisão dos 4 mapas para eliminar paredes invisíveis.
- Todas as casas/prédios acessíveis: cada porta vira interação com Z/Enter/Espaço, e a casa do rival ganha interior.
- Prof. Carvalho sólido (não dá mais para andar por cima) e interativo, com o diálogo de entrega do inicial.
- Rival presente no laboratório com o sprite correto, e nas cenas em que aparece.
- Placas, TV, cama, PC, estantes e cercas com texto ao interagir.

## Fase 4 — Expansão do mapa

- Rota 1 ao norte de Pallet e Viridian City no topo, com transição de mapa nas bordas.
- Grama alta na Rota 1 com encontros aleatórios de Pokémon selvagens (Pidgey, Rattata) e nível por área.

## Fase 5 — Batalha

- Animação de entrada igual ao original: flash, transição em faixas/círculo, os sprites deslizando para a arena, caixa de texto subindo.
- Layout no estilo da imagem: caixas de HP arredondadas, barra com cor, nome + nível + gênero, sprite de costas do jogador e de frente do oponente sobre plataformas ovais.
- Correção da lógica de turnos, PP, troca de menu e fim de batalha.

## Notas técnicas

- Render continua em React Three Fiber; a mudança é de câmera ortográfica frontal para perspectiva inclinada com `depthTest` ligado e Y-sort substituído por profundidade real.
- A logo anexada entra como asset CDN (`lovable-assets`) e é importada na tela-título.
- Objetos altos ficam descritos em `maps.ts` (`props: [{x, y, w, h, src:[sx,sy,sw,sh], height}]`), recortados da mesma folha de mapa que já está em `public/game/`.
- Encontros selvagens e novos mapas entram em `maps.ts` / `data.ts`; o save em `store.ts` ganha o mapa e a posição atual (já suportado).
