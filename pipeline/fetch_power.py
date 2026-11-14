"""Download monthly NASA POWER data for each city and save the raw answer in pipeline/raw/.

Run:  python pipeline/fetch_power.py
No login needed. Source: NASA POWER (https://power.larc.nasa.gov), monthly point API.
  T2M          = air temperature at 2 m (degrees C)
  PRECTOTCORR  = bias-corrected precipitation (mm per day, monthly average)
"""
import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from cities import CITIES, START_YEAR, END_YEAR

RAW = Path(__file__).parent / "raw"
API = "https://power.larc.nasa.gov/api/temporal/monthly/point"


def fetch(city_id, c):
    params = {
        "parameters": "T2M,PRECTOTCORR",
        "community": "AG",
        "longitude": c["lon"],
        "latitude": c["lat"],
        "start": START_YEAR,
        "end": END_YEAR,
        "format": "JSON",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    print(f"{city_id}: downloading ...")
    with urllib.request.urlopen(url, timeout=120) as r:
        data = json.load(r)
    RAW.mkdir(exist_ok=True)
    out = RAW / f"power_{city_id}.json"
    out.write_text(json.dumps(data))
    print(f"{city_id}: saved {out}")


if __name__ == "__main__":
    for cid, c in CITIES.items():
        fetch(cid, c)
