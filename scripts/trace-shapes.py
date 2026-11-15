"""One-time tool: turns outline pictures of the cities into GeoJSON shapes for the 3D ground (src/studio/assets/shapes).
usage: python scripts/trace-shapes.py   (edit IMAGES below). Needs pillow, numpy, scipy.
The picture is turned into a filled mask, its outline is traced and simplified, and it is scaled so that the farthest
point from the middle is as far from the city as the placeholder disc was (so the weather still sits on it)."""
import json, math, pathlib
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

IMG = pathlib.Path("C:/Users/USER/AppData/Local/Temp/claude/5364a4faedd7dded/b69cf798-e73f-46d3-b6eb-3df0339c19e0/images")
OUT = pathlib.Path(__file__).resolve().parent.parent / "src" / "studio" / "assets" / "shapes"
RADIUS = {"karachi": 24, "lahore": 20, "islamabad": 18, "peshawar": 16, "quetta": 15}  # km, same as the placeholder discs
DATA = OUT.parent.parent.parent.parent / "data" / "cities"
CITIES = {}
for cid, radius in RADIUS.items():  # the city's own position comes from its data file, so the shape sits exactly on the pin
    d = json.load(open(DATA / f"{cid}.json", encoding="utf-8"))
    CITIES[cid] = (d["lat"], d["lon"], radius)
# file, how the picture draws the shape: "line" (thin outline), "blue" (blue fill), "gray" (grey fill with black outline)
IMAGES = {"peshawar": ("3.jpg", "line"), "lahore": ("4.png", "blue"), "islamabad": ("5.jpg", "line"), "quetta": ("6.png", "line"), "karachi": ("7.png", "gray")}

def mask_for(path, kind):
    im = np.asarray(Image.open(path).convert("RGB")).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    if kind == "blue":
        m = (b > 140) & (r < 140) & (b - r > 50)
    elif kind == "gray":
        m = (np.abs(r - g) < 12) & (r < 235)
        m = ndi.binary_opening(m, iterations=1)
    else:
        ink = (r + g + b) / 3 < 150
        fat = ndi.binary_dilation(ink, iterations=5)  # thicken the line so small gaps in it close up
        lab, _ = ndi.label(~fat)
        outside = np.isin(lab, np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))  # everything touching the picture edge
        m = ndi.binary_erosion(~outside, iterations=5)  # the inside, brought back to the line's real size
    m = ndi.binary_fill_holes(m)
    lab, n = ndi.label(m)
    if n == 0: raise SystemExit(f"nothing found in {path}")
    sizes = ndi.sum(m, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))

def trace(mask):
    """Moore-neighbour outline of the mask, as a list of (x, y)."""
    h, w = mask.shape
    ys, xs = np.nonzero(mask)
    start = (int(ys.min()), int(xs[ys == ys.min()].min()))
    dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    cur, back, pts = start, 6, []
    for _ in range(h * w * 4):
        pts.append((cur[1], cur[0]))
        for k in range(8):
            d = (back + 1 + k) % 8
            ny, nx = cur[0] + dirs[d][0], cur[1] + dirs[d][1]
            if 0 <= ny < h and 0 <= nx < w and mask[ny, nx]:
                back = (d + 4) % 8; cur = (ny, nx); break
        else:
            break
        if cur == start and len(pts) > 2: break
    return pts

def rdp(pts, eps):
    if len(pts) < 3: return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b - a; L = np.hypot(*ab) or 1e-9
    d = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / L for p in pts[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps: return rdp(pts[: i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]

for cid, (fname, kind) in IMAGES.items():
    lat0, lon0, radius = CITIES[cid]
    mask = mask_for(IMG / fname, kind)
    ring = rdp(trace(mask), 1.1)
    if ring[0] != ring[-1]: ring.append(ring[0])
    cy, cx = ndi.center_of_mass(mask)
    far = max(math.hypot(x - cx, y - cy) for x, y in ring)
    s = radius / far  # km per pixel
    coords = []
    for x, y in ring:
        east, north = (x - cx) * s, -(y - cy) * s
        coords.append([round(lon0 + east / (111.32 * math.cos(math.radians(lat0))), 5), round(lat0 + north / 110.574, 5)])
    gj = {"type": "Feature", "properties": {"id": cid, "note": f"Traced from a picture of the city outline ({fname}); scaled to the disc size, not to true km."}, "geometry": {"type": "Polygon", "coordinates": [coords]}}
    (OUT / f"{cid}.geojson").write_text(json.dumps(gj), encoding="utf-8")
    print(cid, "mask px", int(mask.sum()), "points", len(coords), "km/px", round(s, 3))
