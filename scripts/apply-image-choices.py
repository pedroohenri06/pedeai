#!/usr/bin/env python3
"""Aplica data/research/escolhas-de-imagem.json: logotipo oficial e foto de capa de cada loja.

Uso: python3 scripts/apply-image-choices.py
- Logotipos vão para assets/stores/<id>-logo.webp (960x640, sem corte, sobre a cor da borda)
  assets/stores/<id>-logo-card.webp (480x320) e o selo quadrado <id>-logo-tile.webp (240x240);
  ficam em store["logo"]. Rode de novo depois de scripts/add-photos.py para gerar o selo de logotipos novos.
- Fotos escolhidas viram a capa (assets/stores/<id>.webp e -card.webp) em store["image"].
- Cadastros antigos com image.kind == "logo" passam para store["logo"] (sem capa).
'oficial' recupera o logotipo coletado no canal oficial (commit b492135); números apontam
para a foto de mesmo índice em data/research/google-maps-fotos.jsonl, baixada em 2048 px.
Depois rode: node scripts/build-data.js && npm test
"""
import io
import json
import re
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "establishments.json"
OUT = ROOT / "assets" / "stores"
CHOICES = ROOT / "data" / "research" / "escolhas-de-imagem.json"
MAPS = ROOT / "data" / "research" / "google-maps-fotos.jsonl"
OFFICIAL_COMMIT = "b492135"
SIZE, LARGE, THUMB = (960, 640), (1600, 1067), (480, 320)
LICENSE = "Uso autorizado pelo estabelecimento parceiro"


def border_color(img):
    w, h = img.size
    px = [img.getpixel((x, y)) for x in range(0, w, max(1, w // 40)) for y in (0, h - 1)]
    px += [img.getpixel((x, y)) for y in range(0, h, max(1, h // 40)) for x in (0, w - 1)]
    return tuple(sorted(c[i] for c in px)[len(px) // 2] for i in range(3))


def framed(img, size):
    canvas = Image.new("RGB", size, border_color(img))
    inner = img.copy()
    inner.thumbnail((int(size[0] * 0.86), int(size[1] * 0.86)), Image.LANCZOS)
    canvas.paste(inner, ((size[0] - inner.width) // 2, (size[1] - inner.height) // 2))
    return canvas


def square_tile(img, side=240, fill=0.8):
    """Selo quadrado da página: recorta a borda lisa em volta do logotipo e centraliza sem cortar."""
    bg = Image.new("RGB", img.size, border_color(img))
    box = ImageChops.difference(img, bg).convert("L").point(lambda v: 255 if v > 28 else 0).getbbox()
    logo = img.crop(box) if box else img
    canvas = Image.new("RGB", (side, side), border_color(img))
    logo.thumbnail((int(side * fill), int(side * fill)), Image.LANCZOS)
    canvas.paste(logo, ((side - logo.width) // 2, (side - logo.height) // 2))
    return canvas


def maps_records():
    recs = {}
    for line in MAPS.read_text(encoding="utf-8").splitlines():
        if line.strip().startswith("{"):
            r = json.loads(line)
            recs[r["id"]] = r
    return recs


def fetch(url):
    if re.search(r"googleusercontent\.com|ggpht\.com", url):
        url = re.sub(r"=[^/=]*$", "", url) + "=s2048"
    data = subprocess.run(["curl", "-sfL", "-m", "40", url], capture_output=True, check=True).stdout
    return ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert("RGB")


def save(img, stem):
    img.save(OUT / f"{stem}.webp", "WEBP", quality=82, method=6)
    img.resize(THUMB, Image.LANCZOS).save(OUT / f"{stem}-card.webp", "WEBP", quality=80, method=6)


def main():
    db = json.loads(DB.read_text(encoding="utf-8"))
    stores = {s["id"]: s for s in db["establishments"]}
    choices = json.loads(CHOICES.read_text(encoding="utf-8"))
    maps = maps_records()

    # Logotipos antigos guardados como capa passam para o campo próprio.
    for s in stores.values():
        img = s.get("image")
        if img and img.get("kind") == "logo" and s["id"] not in choices["logos"]:
            s["logo"] = {**img, "kind": "logo"}
            s["image"] = None

    for sid, src in choices["logos"].items():
        s = stores[sid]
        if src == "oficial":
            blob = subprocess.run(["git", "show", f"{OFFICIAL_COMMIT}:assets/stores/{sid}.webp"], cwd=ROOT, capture_output=True, check=True).stdout
            img = Image.open(io.BytesIO(blob)).convert("RGB")  # já emoldurado em 960x640 na coleta original
            origin = subprocess.run(["git", "show", f"{OFFICIAL_COMMIT}:data/establishments.json"], cwd=ROOT, capture_output=True, check=True).stdout
            source = next(x for x in json.loads(origin)["establishments"] if x["id"] == sid)["image"].get("sourceUrl")
        else:
            photo = maps[sid]["fotos"][src]
            img = framed(fetch(photo["url"]), SIZE)
            source = maps[sid].get("maps_url")
        save(img, f"{sid}-logo")
        s["logo"] = {"src": f"assets/stores/{sid}-logo.webp", "thumb": f"assets/stores/{sid}-logo-card.webp",
                     "width": img.width, "height": img.height, "alt": f"Logotipo — {s['name']}",
                     "credit": s["name"], "license": LICENSE, "kind": "logo"}
        if source:
            s["logo"]["sourceUrl"] = source
        # Se a capa atual for o próprio logotipo e não houver foto escolhida, a página usa o degradê da marca.
        if (s.get("image") or {}).get("kind") == "logo" and sid not in choices["fotos"]:
            s["image"] = None
        print(f"logo  {sid}")

    for sid, idx in choices["fotos"].items():
        s = stores[sid]
        photo = maps[sid]["fotos"][idx]
        raw = fetch(photo["url"])
        size = LARGE if raw.width >= LARGE[0] * 0.9 else SIZE
        img = ImageOps.fit(raw, size, Image.LANCZOS, centering=(0.5, 0.45))
        save(img, sid)
        s["image"] = {"src": f"assets/stores/{sid}.webp", "thumb": f"assets/stores/{sid}-card.webp",
                      "width": img.width, "height": img.height, "alt": f"{s['kind']} — {s['name']}",
                      "credit": s["name"], "license": LICENSE, "kind": photo.get("tipo") or "foto",
                      "sourceUrl": maps[sid].get("maps_url")}
        print(f"foto  {sid} ({raw.width}x{raw.height} -> {img.width}x{img.height})")

    # Selo quadrado para todos os logotipos (inclusive os migrados).
    for s in stores.values():
        if s.get("logo"):
            tile = square_tile(Image.open(ROOT / s["logo"]["src"]).convert("RGB"))
            tile.save(OUT / f"{s['id']}-logo-tile.webp", "WEBP", quality=86, method=6)
            s["logo"]["tile"] = f"assets/stores/{s['id']}-logo-tile.webp"

    DB.write_text(json.dumps(db, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
