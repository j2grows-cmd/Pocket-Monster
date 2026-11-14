"""Build backdrops, title, character and icon art for the game.
usage: python3 build_extra.py <source dir> <repo assets dir>"""
import sys
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
import numpy as np
from PIL import Image
from cut import cut, shrink
src, out = sys.argv[1], sys.argv[2]

# --- full-screen scenes: 480x320, small palette, no dithering ---
for n in ('bg-meadow', 'bg-mountain', 'bg-volcano', 'bg-darkwood', 'bg-snow', 'bg-coast', 'bg-hall', 'title'):
    im = Image.open('%s/%s.png' % (src, n)).convert('RGB').resize((480, 320), Image.BOX)
    im.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save('%s/%s.png' % (out, n), optimize=True)

def strip(cells, S_w, S_h, fit_h, colours, path, valign='bottom'):
    sheet = Image.new('RGBA', (S_w * len(cells), S_h), (0, 0, 0, 0))
    for i, c in enumerate(cells):
        k = min(fit_h / c.height, (S_w - 2) / c.width)
        w, h = max(1, round(c.width * k)), max(1, round(c.height * k))
        sp = shrink(c, w, h, colours)
        y = S_h - 1 - h if valign == 'bottom' else (S_h - h) // 2
        sheet.paste(sp, (i * S_w + (S_w - w) // 2, y))
    sheet.save(path, optimize=True)

# --- characters: full figures for the battlefield, heads for the dialogue box ---
people = cut('%s/characters.png' % src)
strip(people, 112, 128, 124, 40, '%s/people.png' % out)
faces = []
for c in people:
    a = np.asarray(c)[..., 3] > 0
    H = c.height
    side = round(H * 0.47)
    cols = np.where(a[:round(H * 0.28)].any(axis=0))[0]
    cx = (cols[0] + cols[-1]) / 2
    x0 = int(round(min(max(cx - side / 2, 0), max(c.width - side, 0))))
    box = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    box.paste(c.crop((x0, 0, min(x0 + side, c.width), side)), (0, 0))
    faces.append(box)
for S in (48, 32):
    sheet = Image.new('RGBA', (S * 16, S), (0, 0, 0, 0))
    for i, f in enumerate(faces):
        sheet.paste(shrink(f, S, S, 32), (i * S, 0))
    sheet.save('%s/faces-%d.png' % (out, S), optimize=True)

# --- sigils and items ---
icons = cut('%s/icons.png' % src)
strip(icons[:8], 64, 64, 62, 24, '%s/sigils-64.png' % out, 'mid')
strip(icons[:8], 16, 16, 16, 16, '%s/sigils-16.png' % out, 'mid')
strip(icons[8:], 32, 32, 31, 24, '%s/items-32.png' % out, 'mid')
strip(icons[8:], 16, 16, 16, 16, '%s/items-16.png' % out, 'mid')
