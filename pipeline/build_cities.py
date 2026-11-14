"""Turn the raw NASA POWER files into data/cities/<city>.json (format: README Section 7).

Run:  python pipeline/build_cities.py
Only REAL downloaded numbers go in. Layers we do not have yet (drought, air, earthquakes,
projection) are left out on purpose; later pipeline steps add them.

Definitions (our own, stated in the JSON `source`/`unit` fields):
  temperature anomaly = month's T2M minus that calendar month's 1981-2010 average
  rainfall            = PRECTOTCORR (mm/day) x days in month, in mm/month
  normals             = 1981-2010 average rainfall for each calendar month
  baseline            = 1981-1990 average for each calendar month (used by "ghost weather")
  tension, interest   = OUR OWN indexes (0-1), see README 6.3 and 4/6B
"""
import calendar
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from cities import CITIES, START_YEAR, END_YEAR

ROOT = Path(__file__).parent.parent
RAW = Path(__file__).parent / "raw"
OUT = ROOT / "data" / "cities"
NORMAL_FROM, NORMAL_TO = 1981, 2010
BASE_FROM, BASE_TO = 1981, 1990
MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"]


def r2(x):
    return round(x, 2)


def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def mean(xs):
    return sum(xs) / len(xs)


def load_series(city_id):
    """Returns (temp[year][month0], rain_mm[year][month0]) from the raw POWER file."""
    p = json.loads((RAW / f"power_{city_id}.json").read_text())["properties"]["parameter"]
    temp, rain = {}, {}
    for y in range(START_YEAR, END_YEAR + 1):
        t_row, r_row = [], []
        for m in range(1, 13):
            key = f"{y}{m:02d}"
            t, r = p["T2M"][key], p["PRECTOTCORR"][key]
            if t < -900 or r < -900:
                raise SystemExit(f"{city_id}: missing value (-999) at {key}. Fix the download first.")
            t_row.append(t)
            r_row.append(r * calendar.monthrange(y, m)[1])  # mm/day -> mm/month
        temp[y], rain[y] = t_row, r_row
    return temp, rain


def monthly_mean(series, y0, y1):
    return [mean([series[y][m] for y in range(y0, y1 + 1)]) for m in range(12)]


def build(city_id, c):
    temp_abs, rain = load_series(city_id)
    t_norm = monthly_mean(temp_abs, NORMAL_FROM, NORMAL_TO)
    r_norm = monthly_mean(rain, NORMAL_FROM, NORMAL_TO)
    anomaly = {y: [r2(temp_abs[y][m] - t_norm[m]) for m in range(12)] for y in temp_abs}

    baseline = {
        "temperature": [r2(x) for x in monthly_mean(anomaly, BASE_FROM, BASE_TO)],
        "rainfall": [r2(x) for x in monthly_mean(rain, BASE_FROM, BASE_TO)],
    }

    tension, interest = {}, {}
    for y in anomaly:
        tension[y], interest[y] = [], []
        for m in range(12):
            a, mm = anomaly[y][m], rain[y][m]
            hot = clamp(a / 1.5)  # warmer than normal; cooler months count 0
            heavy = clamp((mm - max(2 * r_norm[m], 40)) / 200)  # flood-like rainfall
            # Weights from README 6.3. Drought, air and quake terms are 0 until those layers exist.
            tension[y].append(r2(0.35 * hot + 0.10 * heavy))
            interest[y].append(r2(max(clamp(abs(a) / 2),
                                      clamp(abs(mm - r_norm[m]) / (3 * r_norm[m] + 30)))))
        # NOTE: with only two layers the tension tops out at 0.45. It grows when drought/air/quakes arrive.

    yearly = {
        "temperature": {y: r2(mean(anomaly[y])) for y in anomaly},
        "rainfall": {y: r2(sum(rain[y])) for y in rain},
    }

    # Records, always "in our data"
    flat_t = sorted(((anomaly[y][m], y, m) for y in anomaly for m in range(12)), reverse=True)
    flat_r = sorted(((rain[y][m], y, m) for y in rain for m in range(12)), reverse=True)
    warm_year = max(yearly["temperature"], key=yearly["temperature"].get)
    wet_year = max(yearly["rainfall"], key=yearly["rainfall"].get)
    dry_year = min(yearly["rainfall"], key=yearly["rainfall"].get)
    records = [{"year": warm_year, "month": 6, "layer": "temperature", "text": "Warmest year in our data"},
               {"year": wet_year, "month": 6, "layer": "rainfall", "text": "Wettest year in our data"},
               {"year": dry_year, "month": 6, "layer": "rainfall", "text": "Driest year in our data"}]
    for _, y, m in flat_t[:3]:
        records.append({"year": y, "month": m + 1, "layer": "temperature",
                        "text": f"One of the hottest months vs normal in our data ({MONTH_NAMES[m]})"})
    for _, y, m in flat_r[:3]:
        records.append({"year": y, "month": m + 1, "layer": "rainfall",
                        "text": f"One of the wettest months in our data ({MONTH_NAMES[m]})"})
    # month for year-records: put them at the year's most extreme month
    records[0]["month"] = max(range(12), key=lambda m: anomaly[warm_year][m]) + 1
    records[1]["month"] = max(range(12), key=lambda m: rain[wet_year][m]) + 1
    records[2]["month"] = min(range(12), key=lambda m: rain[dry_year][m]) + 1

    return {
        "city": c["name"], "lat": c["lat"], "lon": c["lon"],
        "layers": {
            "temperature": {
                "source": "NASA POWER monthly T2M (https://power.larc.nasa.gov)",
                "unit": f"C anomaly vs {NORMAL_FROM}-{NORMAL_TO} monthly average",
                "startYear": START_YEAR,
                "monthly": {str(y): v for y, v in anomaly.items()},
            },
            "rainfall": {
                "source": "NASA POWER monthly PRECTOTCORR (https://power.larc.nasa.gov)",
                "unit": "mm/month",
                "startYear": START_YEAR,
                "normals": [r2(x) for x in r_norm],
                "monthly": {str(y): [r2(v) for v in row] for y, row in rain.items()},
            },
        },
        "tension": {str(y): v for y, v in tension.items()},
        "interest": {str(y): v for y, v in interest.items()},
        "baseline": baseline,
        "records": records,
        "yearly": {k: {str(y): v for y, v in d.items()} for k, d in yearly.items()},
    }


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for cid, c in CITIES.items():
        data = build(cid, c)
        (OUT / f"{cid}.json").write_text(json.dumps(data, separators=(",", ":")))
        wet = data["layers"]["rainfall"]["monthly"]["2022"]
        print(f"{cid}: wrote data/cities/{cid}.json | rain Jul-2022 = {wet[6]} mm "
              f"(normal {data['layers']['rainfall']['normals'][6]} mm)")
