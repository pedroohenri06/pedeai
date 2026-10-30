#!/usr/bin/env python3
"""Paleta da marca de cada loja, tirada do logotipo oficial (assets/stores/<id>-logo-tile.webp).

Grava em data/establishments.json o campo brand = {primary, deep, soft, ink, surface}:
- primary: a cor de marca mais presente e viva da logo (fundo neutro ignorado quando há cor);
- deep: primary escurecida até contraste >= 4.5 com branco (texto, botões e categoria ativa);
- soft: primary bem clara (fundos de selos e faixas);
- ink: cor do texto sobre primary (branco ou quase preto);
- surface: a cor de fundo da própria logo (selo da loja).
Logos só em preto/branco/cinza viram uma marca grafite. Uso: python3 scripts/menus/brand.py
"""
import colorsys
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
DB = ROOT / "data" / "establishments.json"


def lum(rgb):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hexc(rgb):
    return "#%02x%02x%02x" % tuple(int(round(x)) for x in rgb)


def shade(rgb, factor):
    return tuple(max(0, min(255, x * factor)) for x in rgb)


def mix(rgb, other, t):
    return tuple(a + (b - a) * t for a, b in zip(rgb, other))


def palette(path):
    img = Image.open(path).convert("RGB")
    img.thumbnail((120, 120))
    w, h = img.size
    border = [img.getpixel((x, y)) for x in range(w) for y in (0, h - 1)] + [img.getpixel((x, y)) for y in range(h) for x in (0, w - 1)]
    surface = tuple(sorted(c[i] for c in border)[len(border) // 2] for i in range(3))
    q = img.quantize(colors=16, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:48]
    counts = sorted(q.getcolors(), reverse=True)
    best, best_score = None, 0
    for n, idx in counts:
        rgb = tuple(pal[idx * 3: idx * 3 + 3])
        hh, ll, ss = colorsys.rgb_to_hls(*(c / 255 for c in rgb))
        if ss < 0.35 or ll < 0.12 or ll > 0.88:
            continue  # neutros (branco, preto, cinza) não definem a cor da marca
        if sum(abs(a - b) for a, b in zip(rgb, surface)) < 30 and ss < 0.45:
            continue
        score = n * (0.15 + ss * ss * 2)
        if score > best_score:
            best, best_score = rgb, score
    if best is None:  # logo monocromática: marca grafite
        best = (43, 35, 38)
    deep = best
    for _ in range(40):
        if contrast(deep, (255, 255, 255)) >= 4.5:
            break
        deep = shade(deep, 0.9)
    soft = mix(best, (255, 255, 255), 0.88)
    ink = "#ffffff" if contrast(best, (255, 255, 255)) >= 3 else "#1b1214"
    return {"primary": hexc(best), "deep": hexc(deep), "soft": hexc(soft), "ink": ink, "surface": hexc(surface)}


def main():
    db = json.loads(DB.read_text(encoding="utf-8"))
    n = 0
    for s in db["establishments"]:
        tile = ROOT / "assets" / "stores" / f"{s['id']}-logo-tile.webp"
        if s.get("logo") and tile.exists():
            s["brand"] = palette(tile)
            n += 1
        else:
            s.pop("brand", None)
    DB.write_text(json.dumps(db, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"paleta de marca em {n} lojas")


if __name__ == "__main__":
    main()
