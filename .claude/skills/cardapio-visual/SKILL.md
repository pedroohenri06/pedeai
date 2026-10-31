---
name: cardapio-visual
description: Regra permanente para cardápios enviados como imagem, print, foto ou PDF visual (arte de Instagram, cardápio impresso). Use sempre que o dono do projeto mandar um cardápio que não seja um link de cardápio digital estruturado.
---

# Cardápio em imagem/PDF → cardápio nativo do PedeAi

**A imagem é fonte de DADOS, não de design.** Nunca exiba o print/PDF na plataforma, nunca copie o layout da arte. O restaurante fornece o conteúdo; o PedeAi fornece a experiência (a página da loja já aprovada em `js/store.js` + `css/store.css`, com a marca da loja via `brand`).

**Brand do PedeAi congelado.** Nada fora do módulo de cardápio muda por causa de um cardápio (home, header, footer, checkout, cores e componentes globais). Se algo parecer necessário fora do módulo, procure solução isolada no cardápio ou pergunte.

## Pipeline (mesma arquitetura dos cardápios digitais — `scripts/menus`)
1. **Ler todas** as imagens/páginas antes de começar.
2. **Transcrever** para o formato normalizado em `data/research/cardapios/<id>.json` (`platform: "visual"`, `source`: perfil/link de onde veio, `capturedAt`), um item por produto:
   - tamanhos (300/500/700 ml, P/M/G, 750 g/1,1 kg) → grupo obrigatório "Tamanho" (`L.sizesToItem`): preço base = menor, escolhas = diferença;
   - "Escolha até N adicionais" → grupo `min 0, max N` com preço 0; "adicionais pagos" → grupo opcional, cada um com seu preço;
   - "X ou Y" na descrição (ex.: mussarela ou cheddar) → grupo obrigatório de escolha única;
   - combos "escolha 1/2 itens" → um grupo obrigatório por escolha (permite repetir o mesmo item), preço base = menor combinação;
   - promoção explícita → `originalPriceCents`.
3. **Conferir**: produtos na fonte × produtos cadastrados (contagem por seção), preços, tamanhos, adicionais. Ilegível/ambíguo/cortado → **não inventar**, registrar em `notes` do arquivo.
4. **Imagens** (regra do dono do projeto, 31/10/2026 — substitui a de buscar referência externa): **sempre a foto do próprio cardápio da loja**, nunca foto de fora.
   - Recorte cada produto da arte (`data/research/cardapios/visual/<id>/recortes.json`: print + coordenadas por produto) e trate com `python3 scripts/menus/enhance.py <id> --modelo EDSR_x4.pb` (super-resolução 4x + nitidez leve; modelo em `github.com/Saafke/EDSR_Tensorflow/models`, fora do git).
   - Deixe a foto **inteira e limpa**: enquadre o produto todo, sem textos, preços ou títulos da arte; se a arte cortar o produto, pegue o máximo que existir.
   - Mesmo foto ruim/pequena entra, tratada para ficar o melhor possível. Sem selo de "imagem ilustrativa".
   - `imageUrl` = `file://` do recorte tratado, `imageSource` = link do perfil/arte de onde veio.
5. `python3 scripts/menus/images.py <id>` → `node scripts/menus/apply.js <id>` → `node scripts/build-data.js` → `node scripts/menus/report.js` → `npm test` → conferir em 390 px e 1280 px → PR → merge → conferir no site (Chrome e Safari).

WhatsApp que aparece na arte do próprio estabelecimento (com o ícone do WhatsApp) conta como canal verificado; `whatsappSource` = link do perfil de onde veio a arte.
