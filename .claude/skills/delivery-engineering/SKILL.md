---
name: delivery-engineering
description: Arquitetura e regras de negócio do PedeAi Delivery (site estático na Vercel, cadastro de estabelecimentos, carrinho e pedido pelo WhatsApp). Use antes de alterar index.html, js/, css/, data/ ou scripts/ deste repositório.
---

# PedeAi Delivery — engenharia

## Arquitetura (site estático, sem build)
- `index.html`: layout, CSS principal inline, faixa de categorias, seletor de cidades (script inline) e textos legais. O design visual foi aprovado peça a peça pelo dono do projeto: **não altere artes, banners, mapa ou modal de cidades sem pedido explícito**.
- `css/app.css`: só os ajustes dos cards da listagem e dos selos.
- `css/store.css` e `js/store.js`: **toda** a experiência após o clique num estabelecimento (rota `#/loja/<id>`): apresentação, cardápio, painel do produto com opções, sacola e envio. Classes com prefixo `sp-`. Expõe só `window.PedeAiStore` (`open`, `close`, `isOpen`, `handleEscape`, `onBack`). Alterações nessa página não devem tocar `index.html` nem `app.js` além dessa interface. Reutilize os tokens de `:root` (`--red`, `--wine`, `--cream`, `--paper`, `--ink`, `--muted`, `--line`, `--green`).
- `js/core.js`: lógica pura (UMD, roda no navegador e no Node): normalização, filtros, centavos, carrinho, mensagem e URL do WhatsApp, rotas. **Toda regra de negócio nova entra aqui, com teste em `tests/core.test.js`.**
- `js/app.js`: home, listagem, filtros e rotas. Escuta o evento `pedeai:city`, disparado pelo seletor de cidades em `index.html`.
- `data/establishments.json`: **fonte da verdade** do cadastro. `data/establishments.js` e `data/STATUS.md` são gerados por `node scripts/build-data.js`; nunca edite os gerados à mão.
- `scripts/import-research.js`: importa JSON de pesquisa (ver skill `restaurant-research`) e deduplica por nome+cidade.
- Vercel serve a raiz como estática; não há `build` no `package.json`. Não crie pasta `public/`, porque a Vercel passaria a servir só ela.

## Regras de negócio
1. **10 cidades fixas** (`core.CITIES`) e **10 categorias fixas** (`core.CATEGORIES`). Não renomeie: o seletor, os filtros e o `localStorage` (`pedeai-city`) dependem delas.
2. **Nunca invente** estabelecimento, telefone, endereço, preço, horário, taxa ou avaliação. Campo sem fonte fica `null` ou `[]`, com a pendência em `notes`.
3. **Dinheiro sempre em centavos inteiros** (`priceCents`, `deliveryFeeCents`). Para formatar, use só `core.formatBRL`.
4. **Taxa de entrega desconhecida** (`deliveryFeeCents: null`) aparece como "A confirmar"; o total é rotulado "Total sem entrega".
5. **Pedido online** (`core.canOrder`) só com `whatsapp` de celular válido (`55DD9XXXXXXXX`), `whatsappSource` (URL do canal próprio do estabelecimento) e cardápio com preços. Fora disso, o carrinho funciona, mas o envio fica desabilitado com explicação.
6. **Um carrinho por estabelecimento**, salvo em `localStorage` (`pedeai-cart:<id>`) e reconciliado com os preços atuais ao abrir (`core.reconcileCart`). Cada linha é identificada por `key` = item + opções + observação; para item simples, `key` é o próprio id.
6b. **Opções de produto** (opcional no cadastro): `options: [{id, name, min, max, choices: [{id, name, priceCents}]}]`. Com `min > 0` o grupo é obrigatório e o botão "+" abre o painel do produto em vez de adicionar direto. Valide com `core.validateSelection`; o preço é calculado por `core.unitPrice`. Foto de produto: `image: {src, alt, credit, license}`.
6c. **Sem foto**: a capa do estabelecimento vira um monograma sobre `--wine` (nunca uma foto de categoria apresentada como real). Se nenhum produto da loja tem foto, o cardápio usa linhas compactas; se algum tem, todos reservam a área de imagem com placeholder neutro.
7. **Imagens**: sem foto licenciada, use a foto ilustrativa da categoria (`CATEGORY_PHOTOS` em `app.js`) com a etiqueta "Imagem ilustrativa". Foto própria exige `image: {src, alt, credit, license, sourceUrl}` e autorização do estabelecimento ou licença livre. Não copie fotos de iFood, Instagram ou Google.
8. **Cadastro com `confidence: "baixa"`** mostra o selo "Em verificação" e um aviso na página.
9. **Rotas**: `#/loja/<id>` abre a página do estabelecimento (link compartilhável). O `id` é `slug(nome)-slug(cidade)`.

## Fluxo de mudança
1. Leia `data/STATUS.md` e o código afetado.
2. Altere `core.js` com teste, depois a UI.
3. `node scripts/build-data.js` se o cadastro mudou.
4. `npm test` (unitários, dados e E2E com Playwright) precisa passar.
5. Teste visualmente em 390px e 1280px (`npm run serve`).
