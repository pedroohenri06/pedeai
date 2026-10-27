#!/usr/bin/env python3
"""Gera as imagens da faixa de categorias da home a partir de pratos reais dos parceiros.

Uso: python3 scripts/build-category-images.py
Lê data/research/categorias-imagens.json, baixa cada foto escolhida de
data/research/google-maps-fotos.jsonl em 2048 px, recorta em quadrado e harmoniza
(brilho, contraste e saturação na mesma faixa para as fotos parecerem uma família).
Saída: assets/categories/<slug>.webp em 240x240 (nítido no círculo de 68 a 92 px).
"""
import io
import json
import re
import subprocess
import unicodedata
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps, ImageStat

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "data" / "research" / "categorias-imagens.json"
MAPS = ROOT / "data" / "research" / "google-maps-fotos.jsonl"
OUT = ROOT / "assets" / "categories"
SIDE = 240
TARGET_LUMA = 128  # brilho médio alvo (0–255)


def slug(value):
    value = unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def fetch(url):
    url = re.sub(r"=[^/=]*$", "", url) + "=s2048"
    data = subprocess.run(["curl", "-sfL", "-m", "40", url], capture_output=True, check=True).stdout
    return ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")


def harmonize(img):
    luma = ImageStat.Stat(img.convert("L")).mean[0]
    img = ImageEnhance.Brightness(img).enhance(max(0.85, min(1.25, (TARGET_LUMA / luma) ** 0.6)))
    img = ImageEnhance.Contrast(img).enhance(1.06)
    return ImageEnhance.Color(img).enhance(1.12)


def main():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))["categorias"]
    maps = {}
    for line in MAPS.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("{"):
            r = json.loads(line)
            maps[r["id"]] = r
    for name, c in cfg.items():
        img = fetch(maps[c["id"]]["fotos"][c["foto"]]["url"])
        s = int(min(img.size) * c["zoom"])
        x = max(0, min(int(img.width * c["cx"] - s / 2), img.width - s))
        y = max(0, min(int(img.height * c["cy"] - s / 2), img.height - s))
        tile = harmonize(img.crop((x, y, x + s, y + s)).resize((SIDE, SIDE), Image.LANCZOS))
        dest = OUT / f"{slug(name)}.webp"
        tile.save(dest, "WEBP", quality=84, method=6)
        print(f"{name:11} {c['id']} -> {dest.relative_to(ROOT)} ({dest.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
