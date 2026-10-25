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
