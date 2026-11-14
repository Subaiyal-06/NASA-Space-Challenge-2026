"""
Extracts real climate data from NASA POWER and earthquake data from USGS ComCat
for the 5 Pakistan target cities, producing verified JSON files for Earth Jukebox.

Sources:
- Temperature & Rainfall: NASA POWER API (1981 - 2024, monthly)
- Earthquakes: USGS Earthquake Catalog API (1980 - 2024, M >= 5.5 in/around Pakistan)
"""

import json
import math
import os
import urllib.request
import urllib.parse
from datetime import datetime

CITIES = {
    "karachi": {"name": "Karachi", "lat": 24.8607, "lon": 67.0011},
    "lahore": {"name": "Lahore", "lat": 31.5497, "lon": 74.3436},
    "islamabad": {"name": "Islamabad", "lat": 33.6844, "lon": 73.0479},
    "peshawar": {"name": "Peshawar", "lat": 34.0151, "lon": 71.5249},
    "quetta": {"name": "Quetta", "lat": 30.1798, "lon": 66.9750},
}

START_YEAR = 1981
END_YEAR = 2024

def clamp(x, a, b):
    return max(a, min(b, x))

def r2(x):
    return round(float(x), 2)

def fetch_nasa_power(lat, lon):
    url = (
        f"https://power.larc.nasa.gov/api/temporal/monthly/point?"
        f"parameters=T2M,PRECTOTCORR&community=RE&longitude={lon}&latitude={lat}&start={START_YEAR}&end={END_YEAR}&format=JSON"
    )
    print(f"  Fetching NASA POWER for ({lat}, {lon})...")
    req = urllib.request.Request(url, headers={'User-Agent': 'NASA-SpaceApps-EarthJukebox/1.0'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode('utf-8'))

def fetch_usgs_earthquakes():
    url = (
        "https://earthquake.usgs.gov/fdsnws/event/1/query?"
        "format=geojson&starttime=1980-01-01&endtime=2024-12-31"
        "&minmagnitude=5.5&minlatitude=23.5&maxlatitude=37.1&minlongitude=60.8&maxlongitude=77.8"
    )
    print("  Fetching USGS Earthquakes for Pakistan region...")
    req = urllib.request.Request(url, headers={'User-Agent': 'NASA-SpaceApps-EarthJukebox/1.0'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode('utf-8'))

    events = []
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [0, 0, 0])
        time_ms = props.get("time")
        if not time_ms:
            continue
        dt = datetime.utcfromtimestamp(time_ms / 1000.0)
        mag = props.get("mag")
        if mag is None or mag < 5.5:
            continue
        events.append({
            "year": dt.year,
            "month": dt.month,
            "mag": r2(mag),
            "depth": r2(coords[2]) if len(coords) > 2 else 10.0,
            "lat": r2(coords[1]),
            "lon": r2(coords[0]),
            "place": props.get("place", "")
        })
    # Sort chronologically
    events.sort(key=lambda e: (e["year"], e["month"]))
    print(f"  Found {len(events)} real USGS earthquakes (M5.5+).")
    return events

def compute_spi(monthly_rain_mm):
    """
    Standardized Precipitation Index (SPI) approximation.
    For each month (1..12), compute mean and standard deviation across all years.
    SPI = (rain - mean) / std_dev, clamped to [-3, +3].
    """
    by_month = {m: [] for m in range(1, 13)}
    for y in range(START_YEAR, END_YEAR + 1):
        for m in range(1, 13):
            by_month[m].append(monthly_rain_mm[y][m - 1])

    stats = {}
    for m in range(1, 13):
        vals = by_month[m]
        mean = sum(vals) / len(vals)
        variance = sum((x - mean) ** 2 for x in vals) / max(1, len(vals) - 1)
        std = math.sqrt(variance)
        stats[m] = (mean, std if std > 0.1 else 1.0)

    spi_dict = {}
    for y in range(START_YEAR, END_YEAR + 1):
        spi_dict[y] = []
        for m in range(1, 13):
            val = monthly_rain_mm[y][m - 1]
            mean, std = stats[m]
            z = (val - mean) / std
            spi_dict[y].append(r2(clamp(z, -3.0, 3.0)))
    return spi_dict

def process_city(city_id, meta, all_quakes, output_dir):
    print(f"\nProcessing {meta['name']}...")
    power_data = fetch_nasa_power(meta["lat"], meta["lon"])
    param = power_data["properties"]["parameter"]
    raw_t2m = param["T2M"]
    raw_prec = param["PRECTOTCORR"]

    # In NASA POWER, PRECTOTCORR is mm/day. Multiply by days in month to get mm/month.
    days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    monthly_temp_raw = {}
    monthly_rain = {}

    for y in range(START_YEAR, END_YEAR + 1):
        monthly_temp_raw[y] = []
        monthly_rain[y] = []
        for m in range(1, 13):
            key = f"{y}{m:02d}"
            t_val = raw_t2m.get(key, 0.0)
            p_val = raw_prec.get(key, 0.0)
            monthly_temp_raw[y].append(t_val)
            monthly_rain[y].append(r2(max(0.0, p_val * days_in_month[m - 1])))

    # Compute 1981-2010 climate normals (30-year climatology baseline)
    normals_temp = []
    normals_rain = []
    for m in range(1, 13):
        t_slice = [monthly_temp_raw[y][m - 1] for y in range(1981, 2011)]
        r_slice = [monthly_rain[y][m - 1] for y in range(1981, 2011)]
        normals_temp.append(sum(t_slice) / len(t_slice))
        normals_rain.append(r2(sum(r_slice) / len(r_slice)))

    # Temperature anomalies vs 1981-2010 normal
    temp_anomalies = {}
    yearly_temp = {}
    yearly_rain = {}
    for y in range(START_YEAR, END_YEAR + 1):
        temp_anomalies[y] = [
            r2(monthly_temp_raw[y][m - 1] - normals_temp[m - 1])
            for m in range(1, 13)
        ]
        yearly_temp[str(y)] = r2(sum(temp_anomalies[y]) / 12.0)
        yearly_rain[str(y)] = r2(sum(monthly_rain[y]))

    # Compute SPI (Drought Index)
    spi = compute_spi(monthly_rain)

    # Filter nearby earthquakes for this city (within ~600km: ~5.5 degrees)
    city_quakes = []
    for q in all_quakes:
        dlat = q["lat"] - meta["lat"]
        dlon = q["lon"] - meta["lon"]
        deg_dist = math.sqrt(dlat * dlat + dlon * dlon)
        if deg_dist <= 6.0:  # ~660 km radius
            city_quakes.append({
                "year": q["year"],
                "month": q["month"],
                "mag": q["mag"],
                "depth": q["depth"],
                "lat": q["lat"],
                "lon": q["lon"]
            })

    # 1981-1990 Baseline for Ghost Weather
    baseline = {
        "temperature": [
            r2(sum(temp_anomalies[y][m - 1] for y in range(1981, 1991)) / 10.0)
            for m in range(1, 13)
        ],
        "rainfall": [
            r2(sum(monthly_rain[y][m - 1] for y in range(1981, 1991)) / 10.0)
            for m in range(1, 13)
        ]
    }

    # Tension and Interest Scores (README formulas)
    tension = {}
    interest = {}
    for y in range(START_YEAR, END_YEAR + 1):
        tension[str(y)] = []
        interest[str(y)] = []
        for m in range(1, 13):
            t_anom = temp_anomalies[y][m - 1]
            t_norm = clamp(t_anom / 2.0, 0.0, 1.0) if t_anom > 0 else 0.0

            d_spi = spi[y][m - 1]
            d_norm = clamp(-d_spi / 2.5, 0.0, 1.0) if d_spi < 0 else 0.0

            rain_val = monthly_rain[y][m - 1]
            rain_norm_base = normals_rain[m - 1]
            r_norm = clamp((rain_val - (rain_norm_base * 2.0)) / 150.0, 0.0, 1.0)

            # Quake effect fading over 6 months
            q_norm = 0.0
            for eq in city_quakes:
                if eq["year"] <= y:
                    months_ago = (y - eq["year"]) * 12 + (m - eq["month"])
                    if 0 <= months_ago < 6:
                        decay = 1.0 - (months_ago / 6.0)
                        strength = clamp((eq["mag"] - 5.5) / 2.5, 0.0, 1.0)
                        q_norm = max(q_norm, decay * strength)

            # Tension: weights = 0.40 temp + 0.30 drought + 0.15 rain + 0.15 quakes
            t_val = 0.40 * t_norm + 0.30 * d_norm + 0.15 * r_norm + 0.15 * q_norm
            tension[str(y)].append(r2(clamp(t_val, 0.0, 1.0)))

            # Interest: max of deviations
            i_temp = clamp(abs(t_anom - baseline["temperature"][m - 1]) / 2.0, 0.0, 1.0)
            i_rain = clamp(abs(rain_val - normals_rain[m - 1]) / (normals_rain[m - 1] * 2.5 + 20.0), 0.0, 1.0)
            i_val = max(i_temp, i_rain, d_norm, q_norm)
            interest[str(y)].append(r2(clamp(i_val, 0.0, 1.0)))

    # Find standout historical records
    records = []
    # Max rain month
    max_rain_val = 0
    max_rain_ym = (0, 0)
    for y in range(START_YEAR, END_YEAR + 1):
        for m in range(1, 13):
            if monthly_rain[y][m - 1] > max_rain_val:
                max_rain_val = monthly_rain[y][m - 1]
                max_rain_ym = (y, m)
    if max_rain_val > 50:
        records.append({
            "year": max_rain_ym[0],
            "month": max_rain_ym[1],
            "layer": "rainfall",
            "text": f"Historic record rainfall ({max_rain_val} mm in NASA POWER data)"
        })

    # Max temp anomaly month
    max_temp_val = -99
    max_temp_ym = (0, 0)
    for y in range(START_YEAR, END_YEAR + 1):
        for m in range(1, 13):
            if temp_anomalies[y][m - 1] > max_temp_val:
                max_temp_val = temp_anomalies[y][m - 1]
                max_temp_ym = (y, m)
    records.append({
        "year": max_temp_ym[0],
        "month": max_temp_ym[1],
        "layer": "temperature",
        "text": f"Hottest month anomaly (+{max_temp_val}°C above normal)"
    })

    # Strongest quake
    if city_quakes:
        max_q = max(city_quakes, key=lambda x: x["mag"])
        records.append({
            "year": max_q["year"],
            "month": max_q["month"],
            "layer": "earthquakes",
            "text": f"Strongest quake felt (M{max_q['mag']})"
        })

    # Final City JSON format matching Section 7 and tests/validate.js
    city_data = {
        "city": meta["name"],
        "lat": meta["lat"],
        "lon": meta["lon"],
        "layers": {
            "temperature": {
                "source": "NASA POWER Monthly T2M (https://power.larc.nasa.gov)",
                "unit": "°C anomaly vs 1981-2010 climatology",
                "startYear": START_YEAR,
                "monthly": {str(y): temp_anomalies[y] for y in range(START_YEAR, END_YEAR + 1)}
            },
            "rainfall": {
                "source": "NASA POWER Monthly PRECTOTCORR",
                "unit": "mm/month",
                "startYear": START_YEAR,
                "normals": normals_rain,
                "monthly": {str(y): monthly_rain[y] for y in range(START_YEAR, END_YEAR + 1)}
            },
            "drought": {
                "source": "Standardized Precipitation Index (SPI) from NASA POWER rainfall",
                "unit": "SPI (-3 dry to +3 wet)",
                "startYear": START_YEAR,
                "monthly": {str(y): spi[y] for y in range(START_YEAR, END_YEAR + 1)}
            },
            "earthquakes": {
                "source": "USGS ComCat Earthquake Catalog",
                "events": city_quakes
            }
        },
        "tension": tension,
        "interest": interest,
        "baseline": baseline,
        "records": records,
        "yearly": {
            "temperature": yearly_temp,
            "rainfall": yearly_rain
        },
        "projection": {
            "scenarios": ["ssp245", "ssp585"],
            "temperature": {
                "ssp245": {"2050": 1.8, "2100": 2.4},
                "ssp585": {"2050": 2.5, "2100": 4.6}
            }
        }
    }

    out_file = os.path.join(output_dir, f"{city_id}.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(city_data, f, indent=2)
    print(f"  Saved {out_file} ({os.path.getsize(out_file)} bytes)")

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(root, "data", "cities")
    os.makedirs(output_dir, exist_ok=True)

    quakes = fetch_usgs_earthquakes()

    index_entries = []
    for city_id, meta in CITIES.items():
        process_city(city_id, meta, quakes, output_dir)
        index_entries.append({
            "id": city_id,
            "name": meta["name"],
            "lat": meta["lat"],
            "lon": meta["lon"],
            "file": f"cities/{city_id}.json"
        })

    index_path = os.path.join(root, "data", "index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_entries, f, indent=2)
    print(f"\nUpdated {index_path} with {len(index_entries)} cities.")

if __name__ == "__main__":
    main()
