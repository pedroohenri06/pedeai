# Importador de cardápios

Pipeline reutilizável para trazer cardápios publicados pelos próprios estabelecimentos (aiqfome, Brendi, Mais Delivery, Yooga, Saipos, Vende no Zap, BigD, Pedir Delivery, Zion PDV, Beefood, Expresso Delivery, CardápioWeb, foodsapp, MenuDino, GynFood) para o PedeAi. Padrão aprovado pelo dono do projeto: importar tudo (categorias, itens, fotos, tamanhos, adicionais, promoções) e apresentar melhor que a fonte.

1. `data/research/cardapios/fontes.json` — link do cardápio e plataforma de cada loja (`motivo`: não coletável; `pendente`: falta leitor).
2. `node scripts/menus/capture.js [id ...]` — abre cada link no Chromium e guarda HTML e respostas JSON em `data/research/cardapios/bruto/<id>/` (fora do git). Não contorna bloqueios anti-robô.
3. `node scripts/menus/normalize.js [id ...]` — leitor da plataforma (`adapters/<plataforma>.js`) → formato único em `data/research/cardapios/<id>.json`.
4. `python3 scripts/menus/images.py <id> ...` — fotos otimizadas em `assets/menu/<id>/` (960 px + miniatura 320 px).
5. `node scripts/menus/apply.js [id ...]` — grava o cardápio em `data/establishments.json`.
6. `python3 scripts/menus/brand.py` — paleta da marca a partir do logotipo.
7. `node scripts/build-data.js && node scripts/menus/report.js && npm test` — gera `data/menus/<id>.json`, o relatório (`data/research/cardapios/RELATORIO.md`) e valida.

Nova plataforma: um arquivo em `adapters/` que recebe `{ html, responses, meta }` e devolve `L.snapshot(meta, sections, extra)` (veja `lib.js`). Nunca invente preço, descrição, foto ou opção: o que não está na fonte fica vazio, e item sem preço fica de fora (contado em `skipped`).
