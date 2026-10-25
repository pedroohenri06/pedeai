---
name: delivery-engineering
description: Arquitetura e regras de negócio do PedeAi Delivery (site estático na Vercel, cadastro de estabelecimentos, carrinho e pedido pelo WhatsApp). Use antes de alterar index.html, js/, css/, data/ ou scripts/ deste repositório.
---

# PedeAi Delivery — engenharia

## Arquitetura (site estático, sem build)
- `index.html`: layout, CSS principal inline, faixa de categorias, seletor de cidades (script inline) e textos legais. O design visual foi aprovado peça a peça pelo dono do projeto: **não altere artes, banners, mapa ou modal de cidades sem pedido explícito**.
- `css/app.css`: estilos da página do estabelecimento, carrinho e selos. Reutilize os tokens de `:root` (`--red`, `--wine`, `--cream`, `--paper`, `--ink`, `--muted`, `--line`, `--green`).
- `js/core.js`: lógica pura (UMD, roda no navegador e no Node): normalização, filtros, centavos, carrinho, mensagem e URL do WhatsApp, rotas. **Toda regra de negócio nova entra aqui, com teste em `tests/core.test.js`.**
- `js/app.js`: DOM e eventos. Escuta o evento `pedeai:city`, disparado pelo seletor de cidades em `index.html`.
- `data/establishments.json`: **fonte da verdade** do cadastro. `data/establishments.js` e `data/STATUS.md` são gerados por `node scripts/build-data.js`; nunca edite os gerados à mão.
- `scripts/import-research.js`: importa JSON de pesquisa (ver skill `restaurant-research`) e deduplica por nome+cidade.
- Vercel serve a raiz como estática; não há `build` no `package.json`. Não crie pasta `public/`, porque a Vercel passaria a servir só ela.

## Regras de negócio
1. **10 cidades fixas** (`core.CITIES`) e **10 categorias fixas** (`core.CATEGORIES`). Não renomeie: o seletor, os filtros e o `localStorage` (`pedeai-city`) dependem delas.
2. **Nunca invente** estabelecimento, telefone, endereço, preço, horário, taxa ou avaliação. Campo sem fonte fica `null` ou `[]`, com a pendência em `notes`.
3. **Dinheiro sempre em centavos inteiros** (`priceCents`, `deliveryFeeCents`). Para formatar, use só `core.formatBRL`.
4. **Taxa de entrega desconhecida** (`deliveryFeeCents: null`) aparece como "A confirmar"; o total é rotulado "Total sem entrega".
5. **Pedido online** (`core.canOrder`) só com `whatsapp` de celular válido (`55DD9XXXXXXXX`), `whatsappSource` (URL do canal próprio do estabelecimento) e cardápio com preços. Fora disso, o carrinho funciona, mas o envio fica desabilitado com explicação.
6. **Um carrinho por estabelecimento**, salvo em `localStorage` (`pedeai-cart:<id>`) e reconciliado com os preços atuais ao abrir (`core.reconcileCart`).
7. **Imagens**: sem foto licenciada, use a foto ilustrativa da categoria (`CATEGORY_PHOTOS` em `app.js`) com a etiqueta "Imagem ilustrativa". Foto própria exige `image: {src, alt, credit, license, sourceUrl}` e autorização do estabelecimento ou licença livre. Não copie fotos de iFood, Instagram ou Google.
8. **Cadastro com `confidence: "baixa"`** mostra o selo "Em verificação" e um aviso na página.
9. **Rotas**: `#/loja/<id>` abre a página do estabelecimento (link compartilhável). O `id` é `slug(nome)-slug(cidade)`.

## Fluxo de mudança
1. Leia `data/STATUS.md` e o código afetado.
2. Altere `core.js` com teste, depois a UI.
3. `node scripts/build-data.js` se o cadastro mudou.
4. `npm test` (unitários, dados e E2E com Playwright) precisa passar.
5. Teste visualmente em 390px e 1280px (`npm run serve`).
