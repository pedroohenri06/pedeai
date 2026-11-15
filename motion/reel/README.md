# Reel PedeAi (Remotion)

Vídeo vertical 1080×1920, 30 fps, ~21 s: gancho com os lanches → home → loja → 3 toques no + → checkout em 3 etapas →
pedido chegando no WhatsApp da loja → logo. Loja de exemplo: **Dantes** (autorizou o uso, 14/11/2026).

- `ReelCliente`: fecha com "Peça sem baixar aplicativo · Estreia 25/11 no Vale do Araguaia".
- `ReelLoja`: fecha com "Seu cardápio online · Pedido pronto no seu WhatsApp · Sem comissão".

## Gerar
```
npm install
npx remotion studio src/index.ts
npx remotion render src/index.ts ReelCliente out/pedeai-reel-cliente.mp4 --codec=h264 --crf=18
npx remotion render src/index.ts ReelLoja out/pedeai-reel-restaurante.mp4 --codec=h264 --crf=18
```
`remotion.config.ts` aponta para o Chromium do ambiente de nuvem; em outra máquina, apague essa linha.

## Telas
`public/shots` são capturas reais da plataforma (390×844 @3x). Para refazer depois de mudar o site, com o site servido
em localhost:4174: `node capturar-telas.cjs public/shots` e `node capturar-cardapio-longo.cjs public/shots`.
`pos.json` guarda as coordenadas dos botões usadas nos toques.

Música: escolher um áudio liberado para uso comercial na biblioteca do Instagram.

## Filme de lançamento (v2)

- Composição em `src/Film.tsx` (7 cenas, 735 quadros, 24,5 s, 1080×1920, 30 fps).
- Efeitos sonoros gerados por `python3 gerar-sons.py` em `public/sfx/`.
- Telas: capturas reais (`capturar-telas.cjs`); as posições dos cartões e botões ficam em `public/shots/pos.json`.

## Abertura gastronômica (v4)

- Fotos de referência enviadas e autorizadas pelo dono do projeto, em `public/ref/` (a `macro-molho-laranja.jpg` foi recortada para tirar marca d'água e ícones).
- Sons de comida (`chiado`, `labareda`) e trilha com a abertura de 7 s: `python3 gerar-sons.py public/sfx`.
