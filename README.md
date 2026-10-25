# PedeAi Delivery

Site estático publicado na Vercel. Mostra restaurantes das 10 cidades do Vale do Araguaia (MT), com página própria para cada estabelecimento, carrinho e envio do pedido pelo WhatsApp.

## Estrutura
| Caminho | Papel |
|---|---|
| `index.html` | Layout aprovado, faixa de categorias, seletor de cidades e textos legais |
| `css/app.css` | Página do estabelecimento, carrinho e selos |
| `js/core.js` | Regras de negócio puras: filtros, centavos, carrinho, mensagem do WhatsApp e rotas |
| `js/app.js` | Interface: listagem, página `#/loja/<id>`, carrinho e envio |
| `data/establishments.json` | **Cadastro (fonte da verdade)** |
| `data/establishments.js`, `data/STATUS.md` | Gerados por `npm run data` (não edite à mão) |
| `data/research/` | Pesquisa bruta por cidade, com fontes e observações |
| `scripts/` | Validação, importação da pesquisa e servidor local |
| `tests/` | Testes unitários, de dados e E2E (Playwright) |
| `.claude/skills/` | Skills do projeto para sessões do Claude Code |

## Comandos
```bash
npm run serve      # http://localhost:4173
npm run data       # valida o cadastro e regenera os arquivos de dados
npm test           # validação + testes unitários, de dados e E2E
node scripts/import-research.js data/research   # importa pesquisa nova (com deduplicação)
```

## Regras de dados
- Nenhum dado comercial é inventado. Campo sem fonte fica vazio, e a pendência aparece em `data/STATUS.md`.
- O pedido online só é liberado com WhatsApp publicado pelo próprio estabelecimento (com URL da fonte) e cardápio com preços de fonte identificada.
- Sem foto licenciada, o estabelecimento aparece com a foto da categoria e a etiqueta "Imagem ilustrativa".

O andamento por cidade está em [`data/STATUS.md`](data/STATUS.md).
