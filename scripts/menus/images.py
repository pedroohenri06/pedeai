#!/usr/bin/env python3
"""Baixa e otimiza as fotos dos produtos de um cardápio normalizado (data/research/cardapios/<id>.json).

Cada loja tem a própria pasta (assets/menu/<id>/), então uma foto nunca é associada a outra loja.
Para cada foto: <hash>.webp (até 960 px no maior lado, sem corte) e <hash>-sm.webp (quadrado 320 px, recorte central).
Fotos com menos de 480 px ficam só na versão pequena: não são ampliadas no painel do produto.
Gera data/research/cardapios/<id>.fotos.json: url de origem -> {src, thumb, width, height}.

Uso: python3 scripts/menus/images.py <id> [<id> ...]
"""
import hashlib
import io
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent.parent
DATA = ROOT / "data" / "research" / "cardapios"
OUT = ROOT / "assets" / "menu"
MAX, THUMB, MIN_LARGE = 960, 320, 480


def fetch(url):
    data = subprocess.run(["curl", "-sfL", "-m", "40", url], capture_output=True, check=True).stdout
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(data)))
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (255, 255, 255))  # produto em PNG transparente: fundo branco, como na fonte
        bg.paste(img, mask=img.split()[-1])
        return bg
    return img.convert("RGB")


def square(img, side):
    return ImageOps.fit(img, (side, side), Image.LANCZOS, centering=(0.5, 0.5))


def process(store_id):
    snap = json.loads((DATA / f"{store_id}.json").read_text(encoding="utf-8"))
    out_dir = OUT / store_id
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = DATA / f"{store_id}.fotos.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    urls = [it["imageUrl"] for sec in snap["sections"] for it in sec["items"] if it.get("imageUrl")]
    wanted, ok, failed = set(), 0, 0
    for url in urls:
        name = hashlib.sha1(url.encode()).hexdigest()[:12]
        wanted.update({f"{name}.webp", f"{name}-sm.webp"})
        if url in manifest and (ROOT / manifest[url]["thumb"]).exists():
            ok += 1
            continue
        try:
            img = fetch(url)
        except Exception as e:  # foto fora do ar: o item fica sem foto
            print(f"  falhou {url[:80]}: {str(e)[:60]}")
            failed += 1
            continue
        entry = {"width": img.width, "height": img.height}
        thumb = square(img, min(THUMB, img.width, img.height))
        thumb.save(out_dir / f"{name}-sm.webp", "WEBP", quality=80, method=6)
        entry["thumb"] = f"assets/menu/{store_id}/{name}-sm.webp"
        if min(img.width, img.height) >= MIN_LARGE:
            large = img.copy()
            large.thumbnail((MAX, MAX), Image.LANCZOS)
            large.save(out_dir / f"{name}.webp", "WEBP", quality=80, method=6)
            entry.update(src=f"assets/menu/{store_id}/{name}.webp", width=large.width, height=large.height)
        manifest[url] = entry
        ok += 1
    for f in out_dir.iterdir():  # fotos de itens que saíram do cardápio
        if f.name not in wanted:
            f.unlink()
    manifest = {u: v for u, v in manifest.items() if u in urls}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"fotos {store_id}: {ok} ok, {failed} falharam")


if __name__ == "__main__":
    for sid in sys.argv[1:]:
        process(sid)
