#!/usr/bin/env python3
"""Aplica data/research/logos-instagram.json: logotipo oficial (foto de perfil do Instagram) de cada loja.

Uso: python3 scripts/apply-logos.py <pasta-com-os-arquivos>
Gera assets/stores/<id>-logo.webp (960x640, sem corte, sobre a cor da borda), -logo-card.webp (480x320)
e o selo quadrado -logo-tile.webp (240x240), e preenche store["logo"]. Substitui o logotipo anterior.
Depois rode: node scripts/build-data.js && npm test
"""
import importlib.util
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("choices", ROOT / "scripts" / "apply-image-choices.py")
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)

DB = ROOT / "data" / "establishments.json"
MAP = ROOT / "data" / "research" / "logos-instagram.json"


def main(folder):
    db = json.loads(DB.read_text(encoding="utf-8"))
    stores = {s["id"]: s for s in db["establishments"]}
    for sid, cfg in json.loads(MAP.read_text(encoding="utf-8"))["logos"].items():
        s = stores[sid]
        src = ImageOps.exif_transpose(Image.open(Path(folder) / cfg["file"])).convert("RGB")
        img = base.framed(src, base.SIZE)
        base.save(img, f"{sid}-logo")
        tile = base.square_tile(img)
        tile.save(base.OUT / f"{sid}-logo-tile.webp", "WEBP", quality=86, method=6)
        s["logo"] = {"src": f"assets/stores/{sid}-logo.webp", "thumb": f"assets/stores/{sid}-logo-card.webp",
                     "width": img.width, "height": img.height, "alt": f"Logotipo — {s['name']}",
                     "credit": s["name"], "license": base.LICENSE, "kind": "logo",
                     "sourceUrl": f"https://www.instagram.com/{cfg['instagram']}/",
                     "tile": f"assets/stores/{sid}-logo-tile.webp"}
        print(f"logo  {sid}")
    DB.write_text(json.dumps(db, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1])
