#!/usr/bin/env python3
"""Recorta uma ilustração 3D gerada sobre fundo off-white liso (categorias da home) e grava o PNG/WebP com
transparência em data/research/categorias-recortes/<arquivo>.webp.

Uso: python3 scripts/cut-offwhite.py <imagem> <arquivo> [--checar <png>]
Fundo e sombra = região parecida com a cor do fundo (pouco saturada) ligada às bordas da imagem; o miolo do objeto
nunca é mexido (preenchimento de buracos); na faixa de baixo, a sombra acinzentada colada na base é removida só
perto do contorno. Depois: marque "estilo": "3d" em data/research/categorias-imagens.json e rode
python3 scripts/build-category-images.py.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent


def cut(path):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(2))
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)
    near = (d < 70) & (sat < 0.16)
    lab, _ = ndimage.label(near)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    fg = ndimage.binary_fill_holes(~np.isin(lab, list(edge)))
    lab2, n2 = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab2, range(1, n2 + 1))
    fg = lab2 == (np.argmax(sizes) + 1)
    fg = ndimage.binary_opening(fg, iterations=2)
    inner = ndimage.binary_erosion(fg, iterations=22)
    ys = np.nonzero(fg)[0]
    band = np.zeros_like(fg)
    band[int(ys.min() + (ys.max() - ys.min()) * 0.85):] = True
    fg = ndimage.binary_opening(fg & ~(~inner & band & (sat < 0.30)), iterations=1)
    alpha = Image.fromarray((fg * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


if __name__ == "__main__":
    src, name = sys.argv[1], sys.argv[2]
    out = cut(src)
    dest = ROOT / "data" / "research" / "categorias-recortes" / f"{name}.webp"
    out.save(dest, "WEBP", quality=92, method=6)
    print(f"{dest.relative_to(ROOT)} {out.size}")
    if "--checar" in sys.argv:
        chk = Image.new("RGB", out.size, (30, 30, 30))
        chk.paste(out, (0, 0), out)
        chk.thumbnail((700, 700))
        chk.save(sys.argv[sys.argv.index("--checar") + 1])
