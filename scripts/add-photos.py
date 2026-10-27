#!/usr/bin/env python3
"""Adiciona fotos autorizadas pelos estabelecimentos parceiros.

Uso: python3 scripts/add-photos.py <pasta-com-fotos>

Cada arquivo (.jpg, .jpeg, .png, .webp) deve ter como nome o id do estabelecimento
(ex.: dantes-barra-do-garcas.jpg) ou o nome do estabelecimento (ex.: Dantes.jpg);
se o nome existir em mais de uma cidade, use o id. A foto é recortada em 3:2,
reduzida para 1600x1067 quando a original é grande o bastante, senão 960x640, com
miniatura 480x320 para os cards (logotipos e artes quadradas são centralizados sem corte
sobre a cor da própria borda), salva em assets/stores/<id>.webp e ligada ao cadastro.
Se a pasta tiver manifest.json (gerado por scripts/collect-photos.js), a página de
origem de cada foto é registrada em image.sourceUrl.
Depois rode: node scripts/build-data.js && npm test
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "establishments.json"
OUT = ROOT / "assets" / "stores"
SIZE = (960, 640)
LARGE = (1600, 1067)
THUMB = (480, 320)
LICENSE = "Uso autorizado pelo estabelecimento parceiro"


def slug(value):
    value = unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def border_color(img):
    """Cor mediana da borda da imagem, usada para estender o fundo de logotipos."""
    w, h = img.size
    px = [img.getpixel((x, y)) for x in range(0, w, max(1, w // 40)) for y in (0, h - 1)]
    px += [img.getpixel((x, y)) for y in range(0, h, max(1, h // 40)) for x in (0, w - 1)]
    return tuple(sorted(c[i] for c in px)[len(px) // 2] for i in range(3))


def framed(img, size):
    """Logotipos e artes quadradas: centraliza sem cortar, sobre a cor da própria borda."""
    canvas = Image.new("RGB", size, border_color(img))
    inner = img.copy()
    inner.thumbnail((int(size[0] * 0.9), int(size[1] * 0.9)), Image.LANCZOS)
    canvas.paste(inner, ((size[0] - inner.width) // 2, (size[1] - inner.height) // 2))
    return canvas


def target_size(img):
    """Alta resolução (1600x1067) quando a original comporta; senão 960x640, sem ampliar demais."""
    return LARGE if img.width >= LARGE[0] * 0.9 else SIZE


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    db = json.loads(DB.read_text(encoding="utf-8"))
    stores = db["establishments"]
    by_id = {s["id"]: s for s in stores}
    by_name = {}
    for s in stores:
        by_name.setdefault(slug(s["name"]), []).append(s)
    manifest_file = src / "manifest.json"
    manifest = json.loads(manifest_file.read_text(encoding="utf-8")) if manifest_file.exists() else {}
    OUT.mkdir(parents=True, exist_ok=True)
    done, problems = 0, []
    for f in sorted(src.iterdir()):
        if f.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        key = slug(f.stem)
        store = by_id.get(key)
        if not store:
            matches = by_name.get(key, [])
            if len(matches) == 1:
                store = matches[0]
            elif len(matches) > 1:
                problems.append(f"{f.name}: nome em mais de uma cidade, use o id ({', '.join(m['id'] for m in matches)})")
                continue
            else:
                problems.append(f"{f.name}: estabelecimento não encontrado")
                continue
        img = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
        tipo = manifest.get(store["id"], {}).get("tipo")
        # Moldura sem corte só para logotipos; fotos (inclusive verticais, de celular) preenchem o quadro.
        logo = tipo == "logo" if tipo else img.width / img.height < 1.3
        size = target_size(img)
        img = framed(img, size) if logo else ImageOps.fit(img, size, Image.LANCZOS, centering=(0.5, 0.45))
        stem = f"{store['id']}-logo" if logo else store["id"]
        dest = OUT / f"{stem}.webp"
        img.save(dest, "WEBP", quality=82, method=6)
        thumb = OUT / f"{stem}-card.webp"
        img.resize(THUMB, Image.LANCZOS).save(thumb, "WEBP", quality=78, method=6)
        # Logotipo vai para o campo próprio (card e selo da página); foto vira a capa.
        field = "logo" if logo else "image"
        store[field] = {
            "src": f"assets/stores/{stem}.webp",
            "thumb": f"assets/stores/{stem}-card.webp",
            "width": img.width,
            "height": img.height,
            "alt": f"{store['kind']} — {store['name']}",
            "credit": store["name"],
            "license": LICENSE,
            "kind": "logo" if logo else "foto",
        }
        if store["id"] in manifest:
            store[field]["sourceUrl"] = manifest[store["id"]]["sourceUrl"]
            if manifest[store["id"]].get("tipo"):
                store[field]["kind"] = manifest[store["id"]]["tipo"]
            if manifest[store["id"]].get("credit"):
                store[field]["credit"] = manifest[store["id"]]["credit"]
        done += 1
        print(f"ok  {f.name} -> {dest.relative_to(ROOT)} ({dest.stat().st_size // 1024} KB)")
    DB.write_text(json.dumps(db, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n{done} foto(s) adicionada(s).")
    if problems:
        print("Não processadas:\n  " + "\n  ".join(problems))


if __name__ == "__main__":
    main()
