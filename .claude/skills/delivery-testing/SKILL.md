---
name: delivery-testing
description: Como testar filtros, cardápios, carrinho, cálculo de valores e envio pelo WhatsApp no PedeAi. Use ao mudar lógica, dados ou UI, ou ao investigar um bug de pedido.
---

# Testes do PedeAi

## Comandos
```bash
npm test             # valida se os arquivos gerados estão em dia, depois roda os testes unitários, de dados e E2E
npm run validate     # só valida o cadastro e os arquivos gerados
node --test tests/core.test.js    # só a lógica
node --test tests/e2e.test.js     # só o navegador (Playwright)
```
Não há dependências npm. O E2E usa o Playwright instalado globalmente no ambiente (`require('playwright')` ou `npm root -g`). Sem Playwright, o teste E2E é **pulado com aviso**: informe isso, não diga que passou.

## O que cada suíte cobre
- `tests/core.test.js`: centavos (`0.1+0.2`), formatação BRL, carrinho imutável, limites de quantidade, reconciliação de carrinho salvo, mensagem do WhatsApp (entrega, retirada, troco), validação de número, filtros sem acento e rotas.
- `tests/data.test.js`: cadastro real válido, cidades e meta, WhatsApp com fonte, validador e importador.
- `tests/e2e.test.js`: usa um **cadastro de teste** (intercepta `data/establishments.js`) para exercitar a listagem por cidade, categorias, busca, estado vazio, página por URL, carrinho persistente, validação do formulário, URL `wa.me` com o número da loja, bloqueio sem WhatsApp verificado e ausência de rolagem horizontal.

## Regras
- Bug de valor ou de pedido: escreva primeiro o teste em `core.test.js` que reproduz o bug, depois corrija.
- Nunca use dados reais de estabelecimentos para testar o envio. Os dados de teste ficam no fixture do E2E, marcados como "dados de teste".
- Para testar o envio, sobrescreva `window.open` no teste; não abra o WhatsApp de verdade.
- Nunca pule, desative ou afrouxe um teste para ficar verde.

## Checklist manual antes do deploy
1. Trocar de cidade atualiza a lista; a cidade escolhida persiste após recarregar.
2. Somar 3 itens no carrinho, recarregar e conferir se o total se mantém.
3. Abrir `/#/loja/<id>` direto pela URL.
4. Na Vercel, conferir no preview se `js/`, `css/` e `data/` respondem 200.
