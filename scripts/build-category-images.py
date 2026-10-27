#!/usr/bin/env python3
"""Gera as imagens da faixa de categorias da home.

Uso: python3 scripts/build-category-images.py
Para cada categoria em data/research/categorias-imagens.json, pega o recorte da comida
(data/research/categorias-recortes/<arquivo>.webp, fundo transparente), centraliza sobre um
círculo no tom da categoria com luz suave no alto e sombra projetada, e salva
assets/categories/<arquivo>.webp em 240x240 (nítido no círculo de 68 a 92 px).
Recortes novos: foto de licença livre (Wikimedia Commons), fundo removido com
`rembg` (modelo isnet-general-use); registre autor, licença e fonte no JSON para os créditos.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "data" / "research" / "categorias-imagens.json"
CUTS = ROOT / "data" / "research" / "categorias-recortes"
OUT = ROOT / "assets" / "categories"
WORK, SIDE, FILL = 720, 240, 0.80


def rgb(hex_color):
    return tuple(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))


def clean(food):
    """Mantém só o objeto principal do recorte (descarta respingos soltos) e corta rente a ele."""
    alpha = np.array(food.split()[3])
    labels, n = ndimage.label(alpha > 96)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(alpha), labels, range(1, n + 1))
        keep = np.isin(labels, [i + 1 for i, v in enumerate(sizes) if v >= sizes.max() * 0.08])
        keep = ndimage.binary_dilation(keep, iterations=3)
        food.putalpha(Image.fromarray((alpha * keep).astype("uint8")))
    box = Image.fromarray(((np.array(food.split()[3]) > 96) * 255).astype("uint8")).getbbox()
    return food.crop(box)


def compose(food, tint):
    food = clean(food)
    food = ImageEnhance.Contrast(ImageEnhance.Color(food).enhance(1.08)).enhance(1.04)
    canvas = Image.new("RGBA", (WORK, WORK), rgb(tint) + (255,))
    light = Image.new("RGBA", (WORK, WORK), (0, 0, 0, 0))
    ImageDraw.Draw(light).ellipse((-WORK * .1, -WORK * .2, WORK * .75, WORK * .6), fill=(255, 255, 255, 120))
    canvas.alpha_composite(light.filter(ImageFilter.GaussianBlur(WORK * .12)))
    scale = WORK * FILL / max(food.size)
    food = food.resize((round(food.width * scale), round(food.height * scale)), Image.LANCZOS)
    x, y = (WORK - food.width) // 2, (WORK - food.height) // 2 + int(WORK * .02)
    shadow = Image.new("RGBA", food.size, (70, 20, 25, 255))
    shadow.putalpha(food.split()[3].point(lambda v: int(v * .45)))
    layer = Image.new("RGBA", (WORK, WORK), (0, 0, 0, 0))
    layer.paste(shadow, (x, y + int(WORK * .035)), shadow)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(WORK * .03)))
    canvas.alpha_composite(food, (x, y))
    return canvas.convert("RGB").resize((SIDE, SIDE), Image.LANCZOS)


def main():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))["categorias"]
    for name, c in cfg.items():
        img = compose(Image.open(CUTS / f"{c['arquivo']}.webp").convert("RGBA"), c["cor"])
        dest = OUT / f"{c['arquivo']}.webp"
        img.save(dest, "WEBP", quality=86, method=6)
        print(f"{name:11} -> {dest.relative_to(ROOT)} ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
