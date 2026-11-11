# Comercial PedeAi: planos, ofertas e checkouts

Fonte única das condições comerciais. A página pública é `planos/index.html` (https://www.pedeaionline.com.br/planos),
sem link a partir do site; o Pedro envia o endereço aos restaurantes. Ao mudar algo aqui, atualize os blocos
`PLANS` e `PROMO` dessa página (preço, benefício e checkout ficam lá).

## Preços (valor por mês)
| Plano | Mensal (sem fidelidade) | Semestral | Anual | Anual Black Friday |
|---|---|---|---|---|
| Essencial | R$ 49,90 | R$ 44,90 | R$ 39,90 | R$ 39,90 |
| Destaque (mais escolhido) | R$ 74,90 | R$ 64,90 | R$ 54,90 | R$ 47,90 |
| Premium (só 3 por cidade) | R$ 99,90 | R$ 89,90 | R$ 79,90 | R$ 69,90 |

- **Ancoragem:** no semestral e no anual, o preço do mensal aparece riscado como "preço normal".
- **Black Friday:** até 30/11/2026 às 23:59 (horário de Cuiabá). Depois disso, a faixa, a barra e o aviso de saída somem sozinhos e os preços voltam ao anual normal. Para encerrar antes: `PROMO.ativo = false`.
- **Preço garantido:** se o PedeAi reajustar as mensalidades, o parceiro paga o valor do plano dele até o fim do plano.
- **Garantia de 7 dias:** cancelamento em até 7 dias da contratação, com 100% devolvido (CDC, art. 49).

## Benefícios e onde estão na plataforma
| Benefício | Planos | Como funciona |
|---|---|---|
| Zero taxa de plataforma e zero comissão | todos | — |
| Campanhas de tráfego pago e influenciadores do PedeAi (para a plataforma) | todos | time de marketing |
| Cardápio montado pela equipe, no ar no mesmo dia | todos | pipeline `scripts/menus` |
| Pedido pronto no WhatsApp | todos | `core.buildOrderMessage` |
| QR Code e kit de divulgação (cartaz de mesa, story, post) | todos | `node scripts/kit-parceiro.js <id>` → `data/research/kits/<id>/` |
| Atualizações de cardápio/preço | Essencial: 2 por mês · Destaque e Premium: ilimitadas | operação |
| Entre as primeiras da cidade | Destaque e Premium | `plan` → `scripts/rank-stores.js` (Premium, depois Destaque) |
| Selo azul "Parceiro verificado" no card | Destaque e Premium | perk `verified` (`js/core.js`) |
| Carrossel de destaques no cardápio | Destaque e Premium | perk `carousel` |
| Promoções com preço de/por | Destaque e Premium | perk `promo` |
| Banner na abertura da cidade | Premium | perk `spotlight` (até 3 por cidade) |
| Primeiras posições da categoria | Premium | ordem da lista |
| Oferta do dia | Premium | `offer: { item: "<id do item>", until: "AAAA-MM-DD" }` |
| Atendimento prioritário | Premium | operação |
| Bônus do anual: campanha própria com influenciador (esporádica) | anual | marketing |

**Ativar um parceiro:**
1. Em `data/establishments.json`, coloque `"plan": "essencial" | "destaque" | "premium"` na loja.
2. Para o Premium, se quiser, a `"offer"`.
3. Rode `node scripts/rank-stores.js && node scripts/build-data.js && npm test`.

O `scripts/validate.js` barra plano inválido, oferta fora do Premium e mais de 3 Premium na mesma cidade. Loja sem plano é vitrine: cardápio e pedido funcionam, sem os benefícios pagos.

## Programa Embaixador
O parceiro indica um restaurante. Quando o indicado assinar, o parceiro que indicou paga uma mensalidade e a próxima sai grátis.

## Checkouts (preencher em `PLANS[].checkout` e `PROMO.checkout` de `planos/index.html`)
Enquanto o link estiver vazio, o botão abre o WhatsApp comercial (+55 12 93629-0045) com o plano e o período escolhidos.

| Plano | Mensal | Semestral | Anual | Anual Black Friday |
|---|---|---|---|---|
| Essencial | _aguardando_ | _aguardando_ | _aguardando_ | _aguardando_ |
| Destaque | _aguardando_ | _aguardando_ | _aguardando_ | _aguardando_ |
| Premium | _aguardando_ | _aguardando_ | _aguardando_ | _aguardando_ |
