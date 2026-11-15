# PedeAi · Produção 2.0 (imagem para vídeo)

## Fase 1 · Auditoria

### Assets aprovados (`public/ref/`, cópias; os originais enviados ficam intactos)

| Arquivo | Resolução | Uso atual na abertura | Pode animar | Bloqueado |
|---|---|---|---|---|
| macro-bacon.jpg | 1000×1500 | montagem macro 1 | brilho, queijo escorrendo, câmera | lanche, cores |
| macro-molho-laranja.jpg | 780×1040 (recorte sem marca d'água) | montagem macro 2 | molho escorrendo | lanche, recorte |
| macro-bacon-molho.jpg | 960×1200 | montagem macro 3 | molho, câmera | lanche |
| triplo.jpg | 1200×1500 | montagem macro 4 | queijo derretendo (Take B) | carne, pão |
| queijo-esticando.jpg | 1086×1448 | queijo esticando | fios de queijo (Take A, piloto) | pão, carne, cebola, tomate |
| bacon-caindo.jpg | 1200×1500 | bacon caindo | bacon caindo, queijo (Take C) | lanche |
| molho-caindo.jpg | 1132×2048 | descida pelo molho | fio de molho caindo (Take C) | lanche, tábua |
| fundo-vermelho.jpg | 900×1201 | batida antes da revelação | vapor, brilho | fundo vermelho |
| heroi-luva.jpg | 1080×1920 | revelação + manchete | vapor, câmera lenta (Take D) | luva, luz vermelha, lanche |

As telas reais (`public/shots/`), o logotipo, a tipografia e os textos ficam fora da geração.

### Skills pesquisadas

| Skill | O que oferece | Situação aqui |
|---|---|---|
| ai-video (TimoteoAltobrando) | fluxo completo; `seedance.py` via OpenRouter, ElevenLabs para som | lida; usa chave OpenRouter |
| visual-skills/video (smixs) | método de prompt para Seedance, Kling e Veo (dramaturgia, regras universais) | lida; licença CC-BY-4.0 |
| quickdesign | CLI hospedada (Seedance R2V, Kling, upscale) | exige conta e CLI da QuickDesign; não instalada |
| media-production-skills | sound-design (mixagem por cues, loudness −14 LUFS) | lida; aplicável à mixagem final |
| video-shotcraft | regras de estética e transições em Remotion | lida; regras já aplicadas |
| remotion-dev/skills | boas práticas Remotion | já em uso (Remotion 4.0.539) |

### Modelos acessíveis pelo OpenRouter (imagem como primeiro quadro)

| Modelo | Resolução | Preço aproximado |
|---|---|---|
| bytedance/seedance-2.0 | até 1080p/4K | ~US$ 1,90 por 5 s em 1080p |
| bytedance/seedance-2.0-fast | 720p | ~US$ 0,46 por 5 s |
| kwaivgi/kling-v3.0-pro | 720p (1080p na tabela) | US$ 0,112/s → ~US$ 0,56 por 5 s |
| google/veo-3.1-fast | 1080p/4K | US$ 0,10/s sem áudio → ~US$ 0,50 por 6 s |

Bloqueio: nenhuma chave de geração de vídeo está configurada neste ambiente.

## Fase 2 · Storyboard

| # | Referência | Movimento gerado | Modelo (teste) | Entrada | Saída | Som | Duração no filme |
|---|---|---|---|---|---|---|---|
| A | queijo-esticando | metades se afastam, fios esticam e cedem, gotas | Seedance 2.0 × Kling 3.0 Pro × Veo 3.1 fast | corte seco na batida | match cut dos fios → fio de molho | estalo úmido + whoosh reverso | 1,5 s |
| B | triplo | queijo escorre pelas laterais, câmera percorre a superfície | o vencedor do piloto | push-in contínuo da montagem macro | zoom-through | queijo derretendo | 1,0 s |
| C | molho-caindo | fio de molho cai e se acumula, câmera desce | vencedor | match cut do fio de queijo | máscara pelo fio | gotejar + sub | 1,5 s |
| D | heroi-luva | câmera lenta, vapor leve, deslocamento lateral | vencedor | clarão vermelho + rastro de luz | chicote para o celular (cena 2) | impacto + riser | 2,0 s |

As outras fotos continuam com movimento de câmera (montagem macro), sem simular física.

## Orçamento proposto

- Piloto (Take A em 3 modelos, 5 s, 720p): ~US$ 2.
- Produção (B, C, D com até 2 tentativas cada + finais em 1080p no modelo escolhido): ~US$ 10–15.
- Teto total sugerido: US$ 20. Cada geração é registrada em `docs/gastos.md`.
