# Importador de cardápios

Pipeline reutilizável para trazer cardápios publicados pelos próprios estabelecimentos (aiqfome, Brendi, Mais Delivery, Yooga, Saipos, Vende no Zap, BigD, Pedir Delivery, Zion PDV, Beefood, Expresso Delivery, CardápioWeb, foodsapp, MenuDino, GynFood) para o PedeAi. Padrão aprovado pelo dono do projeto: importar tudo (categorias, itens, fotos, tamanhos, adicionais, promoções) e apresentar melhor que a fonte.

0. `node scripts/menus/discover.js [id ...]` — auditoria: segue o link da bio do Instagram de cada loja sem cardápio (link do cadastro + linktr.ee/bio.site com o mesmo @) até o botão de cardápio/delivery e grava os achados em `data/research/cardapios/descoberta.json`. O Instagram não abre perfis sem login, por isso o caminho é o link da bio. **Confira a cidade antes de cadastrar**: lojas homônimas de outros estados aparecem (Rei Burguer/Recife, Saboritos/RJ, Mistrô/Jaru, D+ Açaí/Cáceres foram descartadas).
   Também vale varrer as listagens por cidade: aiqfome (`aiqfome.com/restaurantes/<cidade>-MT`), Mais Delivery (`maisdeliveryapp.com.br/pwa/selected/state/city/mt/<cidade>-mt`) e busca na web por `ola.click`/goomer/menudino com o nome da cidade.
1. `data/research/cardapios/fontes.json` — link do cardápio e plataforma de cada loja (`motivo`: não coletável; `pendente`: falta leitor).
2. `node scripts/menus/capture.js [id ...]` — abre cada link no Chromium e guarda HTML e respostas JSON em `data/research/cardapios/bruto/<id>/` (fora do git). Não contorna bloqueios anti-robô.
3. `node scripts/menus/normalize.js [id ...]` — leitor da plataforma (`adapters/<plataforma>.js`) → formato único em `data/research/cardapios/<id>.json`.
4. `python3 scripts/menus/images.py <id> ...` — fotos otimizadas em `assets/menu/<id>/` (960 px + miniatura 320 px).
5. `node scripts/menus/apply.js [id ...]` — grava o cardápio em `data/establishments.json`.
6. `python3 scripts/menus/brand.py` — paleta da marca a partir do logotipo.
7. `node scripts/build-data.js && node scripts/menus/report.js && npm test` — gera `data/menus/<id>.json`, o relatório (`data/research/cardapios/RELATORIO.md`) e valida.

Nova plataforma: um arquivo em `adapters/` que recebe `{ html, responses, meta }` e devolve `L.snapshot(meta, sections, extra)` (veja `lib.js`). Nunca invente preço, descrição, foto ou opção: o que não está na fonte fica vazio, e item sem preço fica de fora (contado em `skipped`).

## Agente de Cardápios (Claude in Chrome + Instagram)
Para as lojas cujo cardápio só aparece no Instagram (link da bio, Linktree, destaques):
- **Fila:** `fila-cardapios.html` (no ar em https://www.pedeaionline.com.br/fila-cardapios.html, `noindex`). Gerada pelo `build-data.js` (`data/fila-cardapios.js`): lojas sem cardápio, com foto/logo real, sem `motivo` de bloqueio em `fontes.json`. Imagem ilustrativa = loja não mapeada, fica de fora.
- **Prompt do agente:** `data/research/cardapios/AGENTE-CARDAPIOS.md` (botão "Copiar prompt do agente" da fila; o texto vai embutido no `fila-cardapios.js`). Editou o prompt → rode `build-data.js`.
- O agente registra uma linha JSON por loja no card (salva no localStorage do Chrome). No fim da cidade, "Copiar resultados da cidade" → salvar em `data/research/cardapios/agente/<cidade>-<data>.jsonl`.
- **Importar:** `node scripts/menus/import-fila.js <arquivo.jsonl>` (prévia) e depois `--apply`. Link de plataforma com leitor → `fontes.json` (seguir capture → normalize → images → apply); Drive/Canva/PDF → `pendente` para transcrição (skill cardapio-visual); WhatsApp só com fonte (perfil/link da bio); Instagram só com cidade conferida; itens de destaque → rascunho `visual` sem foto, **conferido antes do apply**. Divergências só aparecem no relatório.
