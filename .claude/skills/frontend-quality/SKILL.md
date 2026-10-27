---
name: frontend-quality
description: Padrões visuais, de acessibilidade e de responsividade do PedeAi Delivery. Use ao criar ou revisar qualquer tela, componente ou CSS do site.
---

# Qualidade de frontend

## Identidade (não reinvente)
- Cores pelos tokens de `:root` em `index.html`: vermelho `--red` (ação principal), vinho `--wine` (preços e destaques), creme `--cream` (fundo), `--paper` (cartões), `--green` (WhatsApp e status positivo).
- Fontes: DM Sans (texto), Montserrat (categorias), Instrument Serif (títulos editoriais).
- Raios: cartões com 22px, botões com 13–17px, chips com 99px. Sombras suaves avermelhadas: `rgba(51,8,14,.06–.15)`.
- Artes aprovadas (banners, mapa regional, cartão de contato, modal de cidades) **não devem ser recriadas nem redimensionadas** sem pedido explícito.

## Responsividade
- Projete primeiro para 390px; o breakpoint principal é `min-width:760px`. Verifique 360px, 390px, 768px e 1280px.
- Nenhuma rolagem horizontal na página (o teste E2E confere isso).
- Respeite `env(safe-area-inset-bottom)` em barras fixas. A barra inferior some quando a página da loja está aberta (`body.store-open`).
- Campos de formulário com `font-size:16px` para o iOS não dar zoom.

## Acessibilidade
- Alvos de toque com pelo menos 40×40px.
- Diálogos (`#storePage`, `#cartDrawer`, `#cityMenu`, `#legalDialog`) com `role="dialog"`, `aria-modal`, `aria-labelledby`, fecham com Esc e devolvem o foco a quem os abriu.
- Botões com ícone têm `aria-label`; imagens ilustrativas têm `alt=""` e a etiqueta visível "Imagem ilustrativa".
- Respeite `prefers-reduced-motion` (sem transições).
- Todo texto vindo do cadastro passa por `core.escapeHtml` antes de ir para o `innerHTML`.

## Honestidade da interface
- Não exiba "Aberto agora", avaliações, tempo ou taxa de entrega sem dado real.
- Cadastros em verificação mostram selo e aviso; cardápio sem fonte mostra "Cardápio em preparação".
- Preços sempre acompanhados da fonte e da data de consulta.

## Checagem visual
```bash
npm run serve   # http://localhost:4173
```
Capture telas com Playwright (`chromium.launch()` já funciona no ambiente em nuvem) em 390×844 e 1280×800, nas páginas inicial, da loja e do carrinho.

## Página do estabelecimento: direção de arte
Referências: skill oficial `frontend-design` (github.com/anthropics/skills) e base de UX `ui-ux-pro-max-skill` (MIT), aplicadas dentro da identidade aprovada.
- **Elemento memorável: o cardápio impresso.** Nas lojas sem fotos de produto, cada item é "nome ........ preço" com pontilhado (`.sp-leader`); títulos de seção e o nome da loja em Instrument Serif. Não acrescente outro elemento chamativo: o resto fica contido.
- **Topo:** foto em largura total com o cartão subindo sobre ela (`.sp-head`, raio só no topo). Sem foto, o nome é o letreiro sobre `--wine` (`.sp-sign`). Nunca uma foto de categoria apresentada como do lugar.
- **Pedido como comanda:** papel `--paper`, borda serrilhada, linhas e totais com pontilhado.
- **Texto:** frase natural ("Pizzaria e lanchonete em Barra do Garças"). Evite rótulos em CAIXA ALTA acima de títulos, metadados unidos por "·" e "→" em botões. A mesma ação mantém o mesmo nome no fluxo inteiro ("Ver pedido", "Seu pedido", "Enviar pedido no WhatsApp").
- **Movimento:** um único momento de entrada (a foto assenta e o cartão sobe), mais as respostas a toques. Nada de animação de entrada em cada seção.

### Revisão v3 (feedback do dono: "amador, sem marca")
A versão "cardápio impresso" foi reprovada. O padrão atual segue as plataformas validadas (Rappi e Wolt, capturadas em 390px e 1366px; iFood, Uber Eats, DoorDash e Deliveroo bloqueiam navegador automatizado):
- **Cabeçalho oficial do PedeAi** (logo e marca iguais aos da home), voltar, cidade e compartilhar. **Rodapé da plataforma** com termos e privacidade.
- **Capa:** foto com degradê vinho, ou o degradê da marca com o símbolo do PedeAi em marca d'água. Nome em Montserrat 800, selo da loja (logo ou iniciais sobre o degradê) e chips de informação.
- **Cartão de informações** com sombra: endereço com "Ver no mapa", horário e contatos.
- **Categorias em pílulas** fixas, com a ativa preenchida. **Produtos em cartões** com sombra; duas colunas a partir de 760px.
- **Desktop (≥1024px):** coluna lateral fixa com informações e o resumo "Seu pedido"; a barra inferior some.
- **Listagem da home:** sem selo de WhatsApp nos cards; só o aviso "Em verificação".

### Revisão v4 (estudo denso)
O estudo completo e as decisões estão em `docs/design/pagina-do-estabelecimento.md`. Resumo: capa fotográfica com mais da metade da primeira tela; linha de indicadores (padrão aiqfome) no lugar de ícones em quadradinho; faixa vinho "Do cardápio ao WhatsApp" com o entregador 3D como elemento assinatura; cartões planos (sem sombra cinza); botões em cor sólida, com o degradê só na capa; rodapé clonado da home.
