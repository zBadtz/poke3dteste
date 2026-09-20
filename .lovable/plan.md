# Reconstrução isométrica do cenário 2.5D

## Objetivo

Substituir a montagem atual — mapa inteiro deitado com recortes retangulares levantados — por uma cena ortográfica isométrica formada por piso e objetos independentes, preservando movimentação, colisões, portas, escadas, diálogos e encontros.

## O que será alterado

1. **Câmera ortográfica fixa**
   - Trocar a câmera em perspectiva por uma câmera ortográfica oblíqua, sem distorção de distância.
   - Aplicar ângulo isométrico fixo, acompanhamento suave e enquadramento próprio para interiores e áreas externas.
   - Manter limites de mapa para não revelar bordas vazias.

2. **Camadas reais de cenário**
   - Separar cada mapa em piso, objetos baixos, objetos altos e primeiro plano.
   - O piso continuará horizontal; casas, árvores, cercas, placas e móveis serão sprites independentes ancorados pelo pé.
   - Remover o sistema que tenta apagar cores do chão e levantar retângulos da imagem pronta.

3. **Atlas próprio para Pallet Town e interiores**
   - Usar os tiles e objetos disponíveis nas referências anexadas para montar um atlas local do projeto.
   - Criar recortes transparentes próprios para árvores, casas e objetos internos.
   - Quando um elemento não existir separado, reconstruí-lo em pixel art coerente em vez de esticar um trecho do mapa.

4. **Dados de composição por mapa**
   - Descrever os elementos com posição, tamanho visual, âncora, camada e área ocupada.
   - Manter a grade atual como fonte da jogabilidade; a nova composição será apenas visual.
   - Começar por quarto, casa, Pallet Town, casa do rival, laboratório e Rota 1 já presentes.

5. **Profundidade e leitura visual**
   - Personagens e objetos usarão a mesma lógica de profundidade, com oclusão natural.
   - Sombras permanecerão no chão e acompanharão a base dos sprites.
   - Telhados, copas e paredes frontais poderão ocultar parcialmente o jogador sem blocos distorcidos.

6. **Validação jogável**
   - Conferir visualmente os mapas em desktop e celular.
   - Testar caminhada, portas por interação, escadas por pisada exata, colisões, NPCs e transições.
   - Comparar capturas antes/depois para confirmar a perspectiva isométrica e eliminar planos esticados e áreas vazias.

## Detalhes técnicos

- React Three Fiber continua sendo a base.
- A câmera será `OrthographicCamera`; o zoom controlará o enquadramento, não a distância/FOV.
- O formato de props passa de retângulos `{x,y,w,h}` para instâncias com `sprite`, `anchor`, `layer`, dimensões e posição no mundo.
- Texturas usarão nearest-neighbor, transparência com alpha test e base alinhada ao tile.
- Colisões e interações continuarão em coordenadas de tiles de 16 px, desacopladas da projeção visual.
