#!/usr/bin/env python3
"""Fotos de produto recortadas da arte do próprio cardápio (cardápio em imagem/PDF), tratadas para o PedeAi.

Lê data/research/cardapios/visual/<id>/recortes.json:
  {"base": 923, "imagens": {"<arquivo>": "<caminho do print>"}, "recortes": {"<nome>": ["<arquivo>", x0, y0, x1, y1]}}
(coordenadas na escala "base", a largura em que o print foi medido). Para cada recorte: amplia 4x com super-resolução
EDSR (OpenCV dnn_superres; modelo EDSR_x4.pb em --modelo ou $EDSR_MODEL) — sem o modelo, Lanczos —, reduz para no
máximo 960 px, aplica nitidez leve e grava <nome>.png na mesma pasta. A foto é sempre a do próprio estabelecimento.
Uso: python3 scripts/menus/enhance.py <id> [--modelo caminho/EDSR_x4.pb]
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent.parent


def upscale(img, model):
    if model:
        import cv2
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(model)
        sr.setModel("edsr", 4)
        out = sr.upsample(cv2.cvtColor(np.asarray(img), cv2.COLOR_RGB2BGR))
        return Image.fromarray(cv2.cvtColor(out, cv2.COLOR_BGR2RGB))
    return img.resize((img.width * 4, img.height * 4), Image.LANCZOS)


def main():
    args = sys.argv[1:]
    model = os.environ.get("EDSR_MODEL")
    if "--modelo" in args:
        i = args.index("--modelo"); model = args[i + 1]; del args[i:i + 2]
    sid = args[0]
    folder = ROOT / "data" / "research" / "cardapios" / "visual" / sid
    cfg = json.loads((folder / "recortes.json").read_text(encoding="utf-8"))
    for name, (key, x0, y0, x1, y1) in cfg["recortes"].items():
        src = Image.open(cfg["imagens"][key]).convert("RGB")
        k = src.width / cfg["base"]
        crop = src.crop(tuple(round(v * k) for v in (x0, y0, x1, y1)))
        big = upscale(crop, model)
        big.thumbnail((960, 960), Image.LANCZOS)
        big = big.filter(ImageFilter.UnsharpMask(radius=1.4, percent=60, threshold=2))
        big = ImageEnhance.Contrast(big).enhance(1.03)
        big.save(folder / f"{name}.png", optimize=True)
        print(f"{name}: {crop.size} -> {big.size}")


if __name__ == "__main__":
    main()
