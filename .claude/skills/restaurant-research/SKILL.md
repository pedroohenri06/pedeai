---
name: restaurant-research
description: Pesquisa, verificação, deduplicação e importação de estabelecimentos reais das 10 cidades do PedeAi (Vale do Araguaia, MT). Use ao cadastrar, atualizar ou verificar restaurantes, telefones, WhatsApp, cardápios ou imagens.
---

# Pesquisa de estabelecimentos

Cidades: Vila Rica, São Félix do Araguaia, Querência, Ribeirão Cascalheira, Canarana, Água Boa, Novo São Joaquim, Campinápolis, Nova Xavantina e Barra do Garças, todas em MT, DDD 66. Meta: 20 por cidade. **Qualidade vale mais que quantidade: nunca complete a meta com dados inventados.**

## Hierarquia de fontes
1. **Canal próprio**: site, cardápio digital (anota.ai, goomer, cardapioweb, menudino, foodsapp, saipos), iFood, aiqfome, Instagram ou Facebook do próprio estabelecimento.
2. **Imprensa local**, prefeitura, sites de turismo.
3. **Diretórios** (solutudo, econodata, cnpj.biz, guiamais, tripadvisor): confirmam existência e endereço. Um telefone que só aparece aqui vai em `phone`, **nunca em `whatsapp`**.

## Armadilhas conhecidas
- Homônimos: Querência do Norte (PR), Canarana (BA), São Joaquim (SC), Água Boa (MG), "Ribeirão" de outros estados e Campinas (SP) aparecendo para Campinápolis. Confirme "MT" na fonte.
- Celulares antigos com 8 dígitos (sem o 9): registre em `phone` como publicado e anote em `notes`. Não acrescente o 9 por conta própria.
- CNPJ "inapta" ou "baixada", ou Tripadvisor marcando "fechado": não cadastre.
- Preço "a partir de" ou "cerca de": não é preço de item, então não entra no `menu`.
- Distritos distantes da sede (ex.: Espigão do Leste, em São Félix): cadastre na cidade do município e mencione o distrito no endereço.

## WhatsApp verificado
Só preencha `whatsapp` quando o número aparece **no canal do próprio estabelecimento** associado a pedidos ou WhatsApp. Coloque essa URL em `whatsappSource`. Sem isso, `whatsapp: null`. Na dúvida, prefira `null`: um número errado manda pedidos de clientes para um desconhecido.

## Formato de entrada (um arquivo JSON por cidade)
```json
[{"name":"","city":"","category":"Pizza","kind":"","address":"Rua X, 1 - Bairro",
  "whatsapp":null,"whatsappSource":null,"phone":null,"instagram":null,"website":null,
  "orderUrl":null,"hours":null,"menuSource":null,
  "menu":[{"section":"Pizzas","name":"Calabresa G","description":"","price":59.9}],
  "sources":["https://..."],"confidence":"alta|media|baixa","notes":""}]
```
Categorias permitidas: Hambúrguer, Pizza, Sushi, Açaí, Brasileira, Pastel, Churrasco, Doces, Saudável, Café. Lanchonete vai em Hambúrguer, restaurante ou marmita em Brasileira, padaria em Café, sorveteria em Doces.

## Fotos dos estabelecimentos
Os parceiros autorizam o uso das próprias fotos. Coloque os arquivos numa pasta, com o nome do estabelecimento ou o `id` como nome do arquivo, e rode:
```bash
python3 scripts/add-photos.py <pasta>   # recorta em 960x640, salva em assets/stores/<id>.webp e preenche `image`
node scripts/build-data.js && npm test
```
Não versione os originais, só os `.webp` gerados.

## Importar e conferir
```bash
node scripts/import-research.js caminho/da/pasta-ou-arquivo.json   # deduplica por nome+cidade
node scripts/build-data.js                                          # valida e regenera data/establishments.js e data/STATUS.md
npm test
```
Para **atualizar** um registro existente (por exemplo, confirmar um WhatsApp), edite `data/establishments.json` direto, acrescente a fonte em `sources` e atualize `verifiedAt`.

## Limitações do ambiente em nuvem
Já vimos o proxy bloquear o WebFetch para iFood, Instagram, Facebook e diretórios, e a cota de WebSearch é compartilhada entre os agentes da mesma rodada. Se isso acontecer, trabalhe com os trechos da busca, marque a confiança como `media` ou `baixa` e registre o que falta em `notes`. Peça ao dono do projeto que libere os domínios em Network access do ambiente.
