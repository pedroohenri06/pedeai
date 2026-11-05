# Prompt para o Claude in Chrome — restaurantes de Barra do Garças no iFood

Abra o iFood no Chrome (site ifood.com.br, logado numa conta de cliente comum), abra a extensão do Claude e cole
a **Fase 1**. Quando terminar, mande o resultado para o Claude Code. Depois use a **Fase 2** em lotes de 5 lojas por
conversa, com a lista que o Claude Code devolver.

---

## FASE 1 — lista de restaurantes

Você vai me ajudar a mapear os restaurantes de **Barra do Garças - MT** no iFood para a plataforma PedeAi. Estou
logado no iFood neste navegador. Só leia o que aparece na tela: não faça pedidos, não adicione nada ao carrinho, não
avalie, não favorite, não mande mensagens.

1. Defina o endereço de entrega como **Av. Ministro João Alberto, Centro, Barra do Garças - MT** (se pedir número,
   use 100). Confirme que o endereço ativo no topo da página é de Barra do Garças.
2. Abra a lista de **Restaurantes** e role até o fim, até não carregarem mais lojas. Inclua lojas **fechadas no
   momento** (elas costumam aparecer no fim, em "Lojas fechadas").
3. Para cada loja, anote: nome exato, categoria que o iFood mostra (ex.: Lanches, Pizza, Açaí, Japonesa), nota,
   tempo de entrega, taxa de entrega e o **link da loja** (abra a loja ou copie o endereço do card; o link tem o
   formato `https://www.ifood.com.br/delivery/barra-do-garcas-mt/<nome>/<código>`).
4. Abra cada loja só o suficiente para anotar o **endereço/bairro** (em "Ver mais" / "Sobre") e confirmar que é de
   **Barra do Garças, Pontal do Araguaia ou Aragarças**. Anote a cidade que aparecer.
5. Ignore mercados, farmácias, pet shops e lojas de conveniência sem comida pronta.

Responda com **uma linha JSON por loja**, dentro de um bloco de código, exatamente neste formato:

```
{"nome":"...","link":"https://www.ifood.com.br/delivery/...","categoria":"...","cidade":"Barra do Garças","endereco":"...","bairro":"...","nota":"4,7","tempoEntrega":"40-50 min","taxaEntrega":"R$ 5,99","aberta":true}
```

No fim, diga quantas lojas encontrou no total e quantas são de Pontal do Araguaia ou Aragarças.

---

## FASE 2 — cardápio completo (5 lojas por conversa)

Agora vou te passar 5 lojas do iFood de Barra do Garças (nome e link). Para **cada loja**, abra a página e transcreva
o **cardápio completo**, sem pular nada e sem inventar nada. Só leia: não adicione ao carrinho, não faça pedido.

Para cada loja:
1. Anote endereço, horário de funcionamento (em "Ver mais"/"Sobre", todos os dias da semana), pedido mínimo, taxa de
   entrega e o CNPJ/razão social se aparecer.
2. Percorra **todas as categorias** do cardápio, na ordem do iFood.
3. Para **cada item**: nome exato, descrição completa, preço atual e, se houver promoção, o preço riscado (original).
   Copie também o endereço da **foto** do item (clique com o botão direito na imagem → copiar endereço da imagem; o
   link começa com `https://static.ifood-static.com.br/`). Se não tiver foto, deixe `null`.
4. **Abra cada item** para ver as opções. Para cada grupo de opções anote: nome do grupo, se é obrigatório, quantidade
   mínima e máxima ("Escolha até 3", "Escolha 1") e cada opção com o **preço adicional** (`+ R$ 4,00`; sem preço = 0).
   Pizza de mais de um sabor: anote o texto exato da regra de preço (ex.: "cobra o maior valor" / "média").
5. Itens **indisponíveis/esgotados**: inclua com `"indisponivel": true`.

Responda com **uma linha JSON por loja** (pode ser longa), dentro de um bloco de código, neste formato:

```
{"nome":"...","link":"...","endereco":"...","horario":"Seg a Sex 18h–23h; Sáb e Dom 18h–00h","pedidoMinimo":"R$ 20,00","taxaEntrega":"R$ 5,99","secoes":[{"nome":"Lanches","itens":[{"nome":"X-Tudo","descricao":"...","preco":"R$ 32,90","precoOriginal":null,"foto":"https://static.ifood-static.com.br/...","indisponivel":false,"opcoes":[{"grupo":"Adicionais","obrigatorio":false,"min":0,"max":5,"escolhas":[{"nome":"Bacon","preco":"R$ 4,00"}]}]}]}]}
```

Se o cardápio for grande demais para uma resposta, divida: mande as primeiras categorias, escreva **"CONTINUA"** e
siga com o resto na próxima resposta, até terminar a loja. No fim de cada loja, diga quantos itens transcreveu por
categoria, para eu conferir.

### Lojas que o PedeAi já tem com cardápio (pule se aparecerem)
062 Burguer; Açaí Royal Delivery; Água Verde Espetaria e Tereré Delivery; Bolos do Sítio Empório; Buffalos Pizzaria;
Casarão Beer / Churrascaria; Cheff do Espeto; Dad Burger; Dantes; Doces da Ana; Frutos de Goiás Sorveteria; Le Monde
Burguer Hamburgueria; Madrugordão Lanches; Maria Filó; Mistrô Massas Marmitas & Pizzaria; Panificadora São Paulo;
Pizzaria Coqueiros; Ponto Burguer (Ponto do Hambúrguer); Restaurante Buteco do Bicudo; Texas Grill - Burger & Churrasco.

### Lojas que o PedeAi tem sem cardápio (prioridade na Fase 2, se estiverem no iFood)
Churrascaria O Panelão; Marmitaria da Barra; Sushi Loko Barra do Garças; Zhu Marmitas - Shopping Barra do Garças;
Empório Pizzaria Barra; Pizzaria Sabor Carioca; José Lanches; Léo Pastéis & Saltenhas; Ponto do Açaí; Ana Doçura
Confeitaria.
