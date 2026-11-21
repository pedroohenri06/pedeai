#!/usr/bin/env bash
# Exportação do filme para o Instagram (Reels), com qualidade máxima depois da recompressão do Instagram.
#
# Por que assim:
# - O Instagram recomprime todo vídeo e exibe Reels em até 1080×1920. O que preserva a qualidade é entregar uma
#   fonte limpa: pouco ruído em movimento, bordas nítidas e taxa de bits alta, não um arquivo enorme.
# - Renderizamos a matriz em 4K (2160×3840, --scale=2) e reduzimos para 1080×1920 com Lanczos: o supersampling
#   deixa texto, ícones e bordas do celular mais nítidos do que um render direto em 1080.
# - A abertura usa a filmagem com super-resolução (Real-ESRGAN) gerada por scripts/super-resolucao.py.
# - Sem trilha e sem efeitos: a música entra na publicação. Uma faixa de áudio silenciosa mantém a compatibilidade.
#
# Uso: ./exportar-instagram.sh [ReelCliente|ReelLoja] [pasta_saida]
set -euo pipefail
COMP="${1:-ReelCliente}"
OUT="${2:-out}"
mkdir -p "$OUT"
FFMPEG="$(python3 -I -c 'import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())')"   # pip install imageio-ffmpeg

# 1 · matriz 4K, praticamente sem perdas
npx remotion render "$COMP" "$OUT/$COMP-matriz-4k.mp4" --scale=2 --muted --jpeg-quality=100 --crf=10 --x264-preset=slow --concurrency=4

# 2 · versão para o Instagram: 1080×1920, 30 qps, H.264 High 4.2, BT.709, faststart
"$FFMPEG" -y -hide_banner -loglevel error -i "$OUT/$COMP-matriz-4k.mp4" -f lavfi -i anullsrc=r=48000:cl=stereo \
  -vf "scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.2 -preset veryslow -tune film -crf 16 -maxrate 12M -bufsize 24M \
  -g 60 -keyint_min 30 -sc_threshold 0 -r 30 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -c:a aac -b:a 128k -shortest -movflags +faststart "$OUT/$COMP-instagram.mp4"

ls -lh "$OUT/$COMP-matriz-4k.mp4" "$OUT/$COMP-instagram.mp4"
