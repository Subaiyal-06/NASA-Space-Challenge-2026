"""Downloads the satellite imagery tiles that make the globe look like the real Earth, so it works OFFLINE.

Run once from the project folder:   python scripts/fetch-imagery.py
Output: public/tiles/<layer>/<z>/<x>/<y>.jpg   (the app serves them from disk; about 10 MB in total)

Sources (NASA GIBS, public domain, no login):
  bluemarble  Blue Marble: shaded relief + ocean depth. Whole globe at low detail, the region and Pakistan in more detail.
  landsat     Landsat GeoCover 1990, 30 m true colour. Sharp close-ups around the five cities only.
              (The 2000 version has stripe artifacts near Karachi, so 1990 is used.)
Imagery credit shown in the app: "NASA GIBS: Blue Marble, Landsat".
Only tiles that exist are saved. Re-running skips tiles already downloaded.
"""
import json
import math
import os
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "tiles")
GIBS = "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best"
BLUEMARBLE = GIBS + "/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg"
LANDSAT = GIBS + "/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual/default/1990-12-01/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpeg"

REGION = (42.0, 6.0, 100.0, 48.0)  # west, south, east, north: Pakistan and a wide margin (z4-6)
CORE = (58.0, 18.0, 82.0, 39.0)  # Pakistan itself (z7)
CITY_BOX_DEG = 1.1  # +/- around each city centre for the sharp Landsat close-ups (about 120 km)
BLUEMARBLE_GLOBAL_Z = range(0, 4)  # z0-3 for the whole world
BLUEMARBLE_REGION_Z = range(4, 7)  # z4-6 for the wide region
BLUEMARBLE_CORE_Z = range(7, 8)  # z7 for Pakistan
LANDSAT_Z = range(8, 11)  # z8-10 around the cities (the city view needs no finer than this)


def tile_xy(lon, lat, z):
    n = 2 ** z
    x = int((lon + 180) / 360 * n)
    y = int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n)
    return max(0, min(n - 1, x)), max(0, min(n - 1, y))


def tiles_in_box(west, south, east, north, z):
    x0, y1 = tile_xy(west, south, z)
    x1, y0 = tile_xy(east, north, z)
    return [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]


def wanted():
    jobs = {}  # (layer, z, x, y) -> template
    for z in BLUEMARBLE_GLOBAL_Z:
        n = 2 ** z
        for x in range(n):
            for y in range(n):
                jobs[("bluemarble", z, x, y)] = BLUEMARBLE
    for z in BLUEMARBLE_REGION_Z:
        for (zz, x, y) in tiles_in_box(*REGION, z):
            jobs[("bluemarble", zz, x, y)] = BLUEMARBLE
    for z in BLUEMARBLE_CORE_Z:
        for (zz, x, y) in tiles_in_box(*CORE, z):
            jobs[("bluemarble", zz, x, y)] = BLUEMARBLE
    cities = json.load(open(os.path.join(ROOT, "data", "index.json"), encoding="utf-8"))
    for c in cities:
        for z in LANDSAT_Z:
            for (zz, x, y) in tiles_in_box(c["lon"] - CITY_BOX_DEG, c["lat"] - CITY_BOX_DEG, c["lon"] + CITY_BOX_DEG, c["lat"] + CITY_BOX_DEG, z):
                jobs[("landsat", zz, x, y)] = LANDSAT
    return jobs


def fetch(item):
    (layer, z, x, y), template = item
    path = os.path.join(OUT, layer, str(z), str(x), f"{y}.jpg")
    if os.path.exists(path):
        return "have", layer, 0
    url = template.format(z=z, x=x, y=y)
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "earth-jukebox-assets"})
            data = urllib.request.urlopen(req, timeout=60).read()
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(data)
            return "new", layer, len(data)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return "missing", layer, 0
        except Exception:
            pass
    return "failed", layer, 0


if __name__ == "__main__":
    jobs = wanted()
    print(f"{len(jobs)} tiles wanted")
    stats = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        for status, layer, size in pool.map(fetch, jobs.items()):
            s = stats.setdefault(layer, {"new": 0, "have": 0, "missing": 0, "failed": 0, "bytes": 0})
            s[status] += 1
            s["bytes"] += size
    for layer, s in stats.items():
        print(f"{layer:10} new={s['new']} already={s['have']} missing={s['missing']} failed={s['failed']}  {s['bytes'] / 1048576:.1f} MB downloaded")
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs) / 1048576
    print(f"tiles on disk: {total:.1f} MB in {OUT}")
