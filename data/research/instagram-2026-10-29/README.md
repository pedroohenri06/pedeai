# Pesquisa Instagram, 28 e 29/10/2026

Levantamento feito pelo Pedro com o Claude no Chrome, perfil por perfil, nas 10 cidades. Um JSON por cidade, com a
ação de cada loja:

- `novo`: cadastra (fonte = URL do perfil; `confidence` média se o perfil está ativo, baixa se só "provável aberto").
- `completar` e `trocar_logo`: preenchem só os campos vazios do cadastro existente; o que diverge vai em `notes`.
- `manter`: não mexe.

Cada loja foi conferida com o print do perfil. As correções estão em `correcoes.json`.

```bash
node scripts/import-instagram.js data/research/instagram-2026-10-29/<cidade>.json
node scripts/build-data.js && npm test
```

Prints, fotos de perfil originais e zips não são versionados. As logos novas entram depois com
`scripts/apply-logos.py`, registradas em `data/research/logos-instagram.json`.
