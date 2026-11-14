"""Build the monster atlases from the nine generated sheets.
usage: python3 build_mons.py <dir with sheet-1..9.png> <repo assets dir>"""
import sys
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from PIL import Image
from cut import cut, shrink
src, out = sys.argv[1], sys.argv[2]
COLS = 12
for S, colours in ((32, 16), (64, 24), (128, 32), (160, 36)):
    atlas = Image.new('RGBA', (S * COLS, S * COLS), (0, 0, 0, 0))
    for n in range(9):
        cells = cut('%s/sheet-%d.png' % (src, n + 1))
        big = max(max(c.size) for c in cells)
        for i, c in enumerate(cells):
            # babies stay smaller than their evolutions, but not so small they vanish in menus
            own = max(c.size)
            k = (S - (4 if S > 64 else 2)) * (own / big) ** .5 / own
            w, h = max(1, round(c.width * k)), max(1, round(c.height * k))
            sp = shrink(c, w, h, colours)
            idx = n * 16 + i
            atlas.paste(sp, ((idx % COLS) * S + (S - w) // 2, (idx // COLS) * S + S - (2 if S > 64 else 1) - h))
    atlas.save('%s/mon-%d.png' % (out, S), optimize=True)
    print(S, atlas.size)
