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
- **Lançamento da plataforma:** 25/11/2026 (`LANCAMENTO` em `planos/index.html`). Antes da data, o topo fala da estreia ("os restaurantes que assinarem agora estreiam junto com a plataforma"); a partir dela, troca sozinho para "o PedeAi já está no ar".
- **Preço garantido:** se o PedeAi reajustar as mensalidades, o parceiro paga o valor do plano dele até o fim do plano.
- **Garantia de 7 dias:** cancelamento em até 7 dias da contratação, com 100% devolvido (CDC, art. 49).

## Benefícios
| Benefício | Planos |
|---|---|
| Zero taxa de plataforma e zero comissão | todos |
| Campanhas de tráfego pago e influenciadores do PedeAi (para a plataforma) | todos |
| Cardápio montado pela equipe, no ar no mesmo dia | todos |
| Pedido pronto no WhatsApp | todos |
| QR Code e kit de divulgação (cartaz de mesa, story, post): `node scripts/kit-parceiro.js <id>` → `data/research/kits/<id>/` | todos |
| Atualizações de cardápio/preço | Essencial: 2 por mês · Destaque e Premium: ilimitadas |
| Entre as primeiras da cidade | Destaque e Premium |
| Selo "Parceiro verificado" no card | Destaque e Premium |
| Carrossel de destaques e promoções de/por no cardápio | Destaque e Premium |
| Banner na abertura da cidade · primeiras posições da categoria · oferta do dia | Premium (só 3 por cidade) |
| Atendimento prioritário | Premium |
| Bônus do anual: campanha própria com influenciador (esporádica) | anual |

**Plataforma principal (decisão do Pedro, 11/11/2026):** nada muda no site por enquanto. As lojas que já têm carrossel e
promoção de/por continuam com eles. O selo, o banner, a ordem por plano e a oferta do dia já foram codificados e testados
no commit `68d138d` (branch de desenvolvimento, não publicado); quando o primeiro parceiro assinar, retomar a partir dele.

## Programa Embaixador
O parceiro indica um restaurante. Quando o indicado assinar, o parceiro que indicou paga uma mensalidade e a próxima sai grátis.

## Checkouts Appmax (preencher em `PLANS[].checkout` e `PROMO.checkout` de `planos/index.html`)
Enquanto o link estiver vazio, o botão abre o WhatsApp comercial (+55 12 93629-0045) com o plano e o período escolhidos.

| Plano | Mensal | Semestral | Anual | Anual Black Friday |
|---|---|---|---|---|
| Essencial | [4d26628c0a](https://pay.finaliza.shop/pl/4d26628c0a) R$ 49,90 | [f9c43d8f9e](https://pay.finaliza.shop/pl/f9c43d8f9e) R$ 269,40 | [fb9a7d84b9](https://pay.finaliza.shop/pl/fb9a7d84b9) R$ 478,80 | mesmo do anual (R$ 478,80) |
| Destaque | [6cb9a0bf23](https://pay.finaliza.shop/pl/6cb9a0bf23) R$ 74,90 | [f1e5b36871](https://pay.finaliza.shop/pl/f1e5b36871) R$ 389,40 | [e207b309b9](https://pay.finaliza.shop/pl/e207b309b9) R$ 658,80 | [7e291424ba](https://pay.finaliza.shop/pl/7e291424ba) R$ 574,80 |
| Premium | [d4c56037ef](https://pay.finaliza.shop/pl/d4c56037ef) R$ 99,90 | [d76ea4e17f](https://pay.finaliza.shop/pl/d76ea4e17f) R$ 539,40 | [3619cd3240](https://pay.finaliza.shop/pl/3619cd3240) R$ 958,80 | [d891342cf4](https://pay.finaliza.shop/pl/d891342cf4) R$ 838,80 |

Configuração (Appmax, 13/11/2026): produto digital; Pix e cartão (links 1 e 2 também com boleto, porque a Appmax não edita link criado); mensal 1x, semestral até 6x e anual até 12x sem juros para o cliente (juros por conta do PedeAi). A Appmax não tem desconto para Pix em link de pagamento. Link criado não pode ser editado: para mudar, exclua e crie outro, e troque a URL aqui e na página.
