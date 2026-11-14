"""Cut figures out of a generated sheet with a flat magenta background.

The generated sheets are not exact grids, so figures are found as connected
shapes rather than by slicing cells. Returns full-resolution RGBA crops in
reading order (4 rows of 4).
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def key_mask(a):
    """True where the pixel is background."""
    a = a.astype(np.int32)
    H, W, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(axis=2))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    strict = d < 70
    # blended fringe: magenta-leaning pixels, only accepted where they touch background
    loose = (r > 140) & (b > 140) & (np.abs(r - b) < 90) & ((r + b) / 2 - g > 70) & (d < 190)
    m = strict.copy()
    for _ in range(3):
        m = m | (loose & ndi.binary_dilation(m, structure=np.ones((3, 3))))
    return m


def cut(path, expect=16, min_area=1500, rows=4, cols=4, trim=1):
    # figures that stand close together merge at a wide join, so narrow it until the count is right
    err = None
    for join in (6, 5, 4, 3, 2, 1):
        try:
            return _cut(path, expect, join, min_area, rows, cols, trim)
        except ValueError as e:
            err = e
    raise SystemExit(str(err))


def _cut(path, expect, join, min_area, rows, cols, trim):
    im = Image.open(path).convert('RGB')
    a = np.asarray(im)
    fg = ~key_mask(a)
    fg = ndi.binary_opening(fg, iterations=1)
    lab, n = ndi.label(ndi.binary_dilation(fg, iterations=join))
    sizes = ndi.sum(fg, lab, range(1, n + 1))
    objs = ndi.find_objects(lab)
    comps = []
    for i, s in enumerate(sizes):
        if s < 40:
            continue
        sl = objs[i]
        m = (lab[sl] == i + 1) & fg[sl]
        ys = np.where(m.any(axis=1))[0]
        xs = np.where(m.any(axis=0))[0]
        comps.append(dict(y0=sl[0].start + ys[0], y1=sl[0].start + ys[-1] + 1,
                          x0=sl[1].start + xs[0], x1=sl[1].start + xs[-1] + 1, ids=[i + 1], area=s))
    big = [c for c in comps if c['area'] >= min_area]
    small = [c for c in comps if c['area'] < min_area]
    # loose bits (sparks, halo stars) join the nearest figure
    for s in small:
        cy, cx = (s['y0'] + s['y1']) / 2, (s['x0'] + s['x1']) / 2
        def gap(c):
            dy = max(c['y0'] - cy, 0, cy - c['y1'])
            dx = max(c['x0'] - cx, 0, cx - c['x1'])
            return (dx * dx + dy * dy) ** .5
        t = min(big, key=gap)
        if gap(t) < 40:
            t['ids'] += s['ids']
            t['y0'] = min(t['y0'], s['y0']); t['y1'] = max(t['y1'], s['y1'])
            t['x0'] = min(t['x0'], s['x0']); t['x1'] = max(t['x1'], s['x1'])
    if len(big) != expect:
        raise ValueError('%s: found %d figures, expected %d: %s' % (path, len(big), expect, [(c['x0'], c['y0'], int(c['area'])) for c in big]))
    big.sort(key=lambda c: (c['y0'] + c['y1']) / 2)
    order = []
    for k in range(rows):
        order += sorted(big[k * cols:(k + 1) * cols], key=lambda c: (c['x0'] + c['x1']) / 2)
    out = []
    for c in order:
        sl = (slice(c['y0'], c['y1']), slice(c['x0'], c['x1']))
        m = np.isin(lab[sl], c['ids']) & fg[sl]
        m = ndi.binary_erosion(m, iterations=trim) if trim else m      # shave the blended rim
        out.append(Image.fromarray(np.dstack([a[sl], np.where(m, 255, 0)]).astype(np.uint8), 'RGBA'))
    return out


def shrink(c, w, h, colours=32):
    """Downscale an RGBA crop to w x h with hard edges and a small palette."""
    arr = np.asarray(c).astype(np.float64)
    pm = arr.copy()
    pm[..., :3] *= arr[..., 3:4] / 255          # premultiply so the background never bleeds in
    small = np.asarray(Image.fromarray(pm.astype(np.uint8), 'RGBA').resize((w, h), Image.BOX)).astype(np.float64)
    al = small[..., 3]
    rgb = np.where(al[..., None] > 0, small[..., :3] * 255 / np.maximum(al[..., None], 1), 0)
    solid = al >= 128
    q = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB')
    if colours:
        q = q.quantize(colors=colours, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    return Image.fromarray(np.dstack([np.asarray(q), np.where(solid, 255, 0).astype(np.uint8)]), 'RGBA')


def contact(cells, S, path, bg=(214, 235, 208), cols=4):
    rows = (len(cells) + cols - 1) // cols
    sheet = Image.new('RGB', (S * cols, S * rows), bg)
    for i, c in enumerate(cells):
        k = min((S - 8) / c.width, (S - 8) / c.height, 1)
        t = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.NEAREST)
        sheet.paste(t, ((i % cols) * S + (S - t.width) // 2, (i // cols) * S + S - 4 - t.height), t)
    sheet.save(path)
