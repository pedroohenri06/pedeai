"""text2path(font, text, size, x, y, anchor='middle', tracking=0) -> (svg path d, width). Converte texto em curvas para o SVG não depender de fonte instalada."""
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
_cache = {}
def _font(p):
    if p not in _cache: _cache[p] = TTFont(p)
    return _cache[p]
def text2path(fontpath, text, size, x, y, anchor="middle", tracking=0, sx=1.0):
    f = _font(fontpath); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f["head"].unitsPerEm
    s = size / upm; hmtx = f["hmtx"]
    names = [cmap[ord(c)] for c in text]
    adv = [hmtx[n][0] * s * sx + tracking for n in names]
    width = sum(adv) - tracking
    x0 = x - (width / 2 if anchor == "middle" else width if anchor == "end" else 0)
    pen = SVGPathPen(gs); cx = x0
    for n, a in zip(names, adv):
        gs[n].draw(TransformPen(pen, (s * sx, 0, 0, -s, cx, y))); cx += a
    return pen.getCommands(), width
