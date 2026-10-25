#!/usr/bin/env python3
"""Adiciona fotos autorizadas pelos estabelecimentos parceiros.

Uso: python3 scripts/add-photos.py <pasta-com-fotos>

Cada arquivo (.jpg, .jpeg, .png, .webp) deve ter como nome o id do estabelecimento
(ex.: dantes-barra-do-garcas.jpg) ou o nome do estabelecimento (ex.: Dantes.jpg);
se o nome existir em mais de uma cidade, use o id. A foto é recortada em 3:2,
reduzida para 960x640, salva em assets/stores/<id>.webp e ligada ao cadastro.
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
LICENSE = "Uso autorizado pelo estabelecimento parceiro"


def slug(value):
    value = unicodedata.normalize("NFD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


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
        img = ImageOps.fit(img, SIZE, Image.LANCZOS)
        dest = OUT / f"{store['id']}.webp"
        img.save(dest, "WEBP", quality=80, method=6)
        store["image"] = {
            "src": f"assets/stores/{store['id']}.webp",
            "alt": f"{store['kind']} — {store['name']}",
            "credit": store["name"],
            "license": LICENSE,
        }
        done += 1
        print(f"ok  {f.name} -> {dest.relative_to(ROOT)} ({dest.stat().st_size // 1024} KB)")
    DB.write_text(json.dumps(db, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n{done} foto(s) adicionada(s).")
    if problems:
        print("Não processadas:\n  " + "\n  ".join(problems))


if __name__ == "__main__":
    main()
