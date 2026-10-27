# Página do estabelecimento: estudo e decisões

Este documento registra a pesquisa e as decisões da página aberta ao clicar num estabelecimento (`#/loja/<id>`). Ele serve de base para as próximas evoluções. A regra do dono do produto é **só evolução, sem regressão**: qualquer mudança parte do que está aqui.

## 1. Referências estudadas

### Plataformas de delivery
Capturas feitas em 390 px (celular) e 1366 px (desktop).

| Plataforma | Acesso | O que tiramos dela |
|---|---|---|
| **Rappi** (Bullguer, Lellis Trattoria) | aberta | Capa com foto e selo da loja sobreposto; informações logo abaixo da capa; categorias em faixa horizontal; produtos em cartões com foto quadrada à direita; no desktop, coluna lateral com dados da loja e categorias. |
| **Wolt** (KFC, Coconut Tree) | aberta no desktop; no celular coberta por cookies e login | Capa em largura total com degradê escuro e nome sobre a foto; categorias em pílulas, com a ativa preenchida; busca dentro da loja ao lado das pílulas. |
| **aiqfome** (Lugano, Querência-MT) | aberta | Público do interior, como o nosso. Capa fotográfica grande; logo da loja sobreposto; **linha de indicadores** (entrega, tempo, mínimo, pagamento) com valor sobre rótulo; carrossel de destaques; categorias em pílulas de contorno. |
| iFood, Uber Eats, DoorDash, Deliveroo, Just Eat | tela anti-robô | Não capturadas. Não contornamos essa proteção. |
| **Home do PedeAi** | aprovada | Fonte de identidade: Montserrat 800, vermelho #e51b2b, vinho #671019, creme, rodapé com cartão de atendimento comercial e a marca PEDEAI, entregador 3D, arte de hambúrguer e pizza. |

### Skills e diretrizes (lidas na íntegra antes de usar)
| Fonte | Licença | Regras aplicadas |
|---|---|---|
| `anthropics/skills` → `frontend-design` | Anthropic | Ousadia num único lugar; evitar sinais de página gerada (rótulo em caixa alta acima de títulos, metadados com "·", cartões idênticos); escrever do ponto de vista do usuário. |
| `Leonxlnx/taste-skill` (estudo de 247 sites premiados) | MIT | Mídia real cobrindo ao menos metade da primeira tela; páginas fortes **mostram** (mediana de 37 imagens) e as fracas **contam**; proibidos: sombra cinza suave em todo cartão, ícone em quadradinho colorido, botão com degradê brilhante, rótulo em caixa alta acima de títulos; "um elemento que só este produto tem". |
| `vercel-labs/web-interface-guidelines` | MIT | Alvos ≥ 44 px no celular; `touch-action: manipulation`; foco visível e devolvido; `scroll-margin-top` nas seções; números tabulares; imagens com dimensões e a principal priorizada; estados vazios sem beco sem saída; sombras em camadas (ambiente + direta); raios concêntricos; `…` em placeholders. |
| `nextlevelbuilder/ui-ux-pro-max-skill` | MIT | Para delivery: fotografia apetitosa, categorias em rolagem horizontal, sacola em painel inferior, alvos de toque grandes. |
| `anthropics/skills` → `brand-guidelines`, `theme-factory` | Anthropic | Não se aplicam: a primeira é a marca da própria Anthropic, a segunda é para slides. |

## 2. Decisões

| Decisão | Motivo |
|---|---|
| **Cabeçalho da plataforma** com a marca centralizada e o slogan "A plataforma de delivery do interior" em peso 400, 50% de opacidade. | Pedido do dono; a loja vive dentro da plataforma (Rappi, Wolt). |
| **Capa fotográfica com ~58% da altura da tela no celular**; degradê vinho só no terço inferior, onde fica o nome. | taste-skill: mídia ≥ metade da primeira tela; legibilidade do nome sobre a foto. |
| **Capa sem foto**: degradê da marca com o símbolo do PedeAi em marca d'água. Logotipo cadastrado vira o selo, não a capa. | Nunca apresentar foto de categoria como se fosse do lugar; o degradê foi aprovado pelo dono. |
| **Linha de indicadores** (pedido, cardápio, horário, bairro) no cartão de informações. | aiqfome/Rappi; substitui os "ícones em quadradinho", que a taste-skill proíbe. |
| **"Como chegar"** abre o Google Maps com nome, endereço e cidade. | Informação útil no interior, onde endereço é impreciso. |
| **Faixa "Do cardápio ao WhatsApp, sem baixar nada"** com o entregador 3D da marca: a única faixa invertida (vinho) da página. | "Um elemento que só este produto tem": a passagem do pedido para o WhatsApp do restaurante. Com cardápio, ela vem **depois** do cardápio, porque quem chega quer pedir; sem cardápio, vem antes, porque o WhatsApp é a ação. |
| **Cartões de produto planos** (borda fina, sem sombra); item no pedido ganha borda e filete vermelhos. | taste-skill: sombra em todo cartão é sinal de template; a separação vem do tom e da linha. |
| **Botões em cor sólida** (vermelho para ação, tinta para WhatsApp); o degradê fica só na capa. | taste-skill proíbe botão com degradê; preferência do dono pelo degradê preservada onde tem mais impacto. |
| **Rodapé = clone do rodapé aprovado da home.** | Identidade idêntica; o rodapé próprio foi considerado "cru". |
| **Desktop ≥ 1024 px**: coluna lateral fixa com informações e o resumo "Seu pedido". | Rappi/iFood; o pedido fica sempre visível. |

## 3. Arquitetura

```
index.html
├─ js/core.js         regras de negócio puras (preço em centavos, carrinho, opções, mensagem, rotas)  → tests/core.test.js
├─ js/store-view.js   templates puros da página (dados → HTML escapado, JSON-LD)                  → tests/store-view.test.js
├─ js/store.js        controlador: estado, eventos, foco, sacola, painel do produto, metadados
├─ js/app.js          home, listagem e rotas (abre a loja por window.PedeAiStore)
└─ css/store.css      estilos exclusivos do fluxo (prefixo sp-), sobre os tokens globais
```

- **Separação view/controlador:** os templates são funções puras, testadas no Node sem navegador (escape de HTML, estados sem foto, sem cardápio e sem WhatsApp, ordem das seções, JSON-LD que não fecha a tag `<script>`).
- **Imagens:** `add-photos.py` gera 1600 px, 960 px (`-md`) e 480 px (`-card`). A capa usa `srcset`/`sizes`, e a miniatura (já em cache quando se vem da listagem) é o fundo enquanto a versão grande chega. Não há fade, porque ele atrasaria o LCP.
- **SEO:** a loja aberta injeta `schema.org/Restaurant` em JSON-LD e atualiza `<title>` e `meta description`; ao fechar, restaura.
- **Cardápios longos** (≥ 12 itens): busca e `content-visibility: auto` nas seções.
- **Acessibilidade:** diálogos com foco preso e devolvido; Esc fecha só a camada de cima (painel, sacola, documento legal, página); `scroll-margin-top` nas seções; `aria-live` para "adicionado ao pedido".

## 4. Medições (local, CPU 4× mais lenta, 390 px @2x)

- **Tempo até a foto da capa chegar**, mesma foto nas duas versões: no ar ~950–1090 ms; nova ~1000–1270 ms. São equivalentes dentro do ruído.
- **LCP:** a nova capa passou a ser o maior elemento da tela, como deve ser. Antes, o LCP medido era o banner da home, que fica por baixo da página da loja.
- **CLS:** 0,006 nas duas versões.

## 5. Próximos passos de maior impacto
1. **Fotos de produto e cardápios completos.** É o que mais falta (taste-skill: páginas fortes mostram). O aiqfome tem páginas públicas de lojas das nossas cidades, por exemplo `aiqfome.com/MT/querencia/lugano-querencia`.
2. **Fotos para as 74 lojas sem imagem**, numa nova rodada do Claude in Chrome.
3. **Dados operacionais reais**, quando os parceiros informarem: taxa de entrega, tempo, pedido mínimo e formas de pagamento. Só então eles entram na linha de indicadores.
