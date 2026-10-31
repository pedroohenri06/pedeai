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
4. **Imagens**: recorte a foto do próprio produto na arte quando estiver completa e nítida (`data/research/cardapios/visual/<id>/`, `imageUrl` = `file://` do recorte, `imageSource` = link da arte). Foto pequena/cortada/misturada ao layout não entra. Referência visual genérica só com **licença livre** (Unsplash, Pexels, Wikimedia) e sem logo/embalagem de terceiros — representa o produto, não muda os dados. Sem boa foto, o cardápio usa as linhas compactas (já previsto).
5. `python3 scripts/menus/images.py <id>` → `node scripts/menus/apply.js <id>` → `node scripts/build-data.js` → `node scripts/menus/report.js` → `npm test` → conferir em 390 px e 1280 px → PR → merge → conferir no site (Chrome e Safari).

WhatsApp que aparece na arte do próprio estabelecimento (com o ícone do WhatsApp) conta como canal verificado; `whatsappSource` = link do perfil de onde veio a arte.
