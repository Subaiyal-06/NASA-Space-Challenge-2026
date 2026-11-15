"""Adds the CMIP6 temperature projections (World Bank Climate Change Knowledge Portal) to each city file.
usage: python scripts/add-projections.py <province_temp_anomaly.json>
The portal gives change vs its recent-past baseline (believed 1995-2014). Our temperature layer is an anomaly vs
1981-2010, so each city's own measured 1995-2014 mean anomaly is added (this is the 'add a real baseline' step)."""
import json, sys, statistics, pathlib
src = json.load(open(sys.argv[1], encoding="utf-8"))
root = pathlib.Path(__file__).resolve().parent.parent / "data" / "cities"
MID = {"2020-2039": 2030, "2040-2059": 2050, "2060-2079": 2070, "2080-2099": 2090}
for city, region in src["city_to_region"].items():
    path = root / f"{city}.json"
    data = json.load(open(path, encoding="utf-8"))
    monthly = data["layers"]["temperature"]["monthly"]
    shift = statistics.mean(v for y in range(1995, 2015) for v in monthly[str(y)])
    temp, seasonal = {}, {}
    for scen, windows in src["regions"][region].items():
        pts, dev = {}, [[] for _ in range(12)]
        for win, months in windows.items():
            vals = [months[f"{win[:4]}-{m:02d}"] for m in range(1, 13)]
            mean = statistics.mean(vals)
            pts[str(MID[win])] = round(mean + shift, 2)
            for i, v in enumerate(vals): dev[i].append(v - mean)
        temp[scen] = pts
        seasonal[scen] = [round(statistics.mean(d), 2) for d in dev]
    data["projection"] = {
        "source": "World Bank Climate Change Knowledge Portal, CMIP6 (cmip6-x0.25), 50th percentile (median of models), "
                  f"region: {region.replace('_', ' ')}. Scenarios SSP2-4.5 and SSP5-8.5. Projections, not measurements.",
        "method": "Each 20-year window mean is placed at the middle of the window (2030, 2050, 2070, 2090). The portal's values are "
                  "change from its recent-past baseline (believed 1995-2014, not stated in the file); we add this city's measured "
                  f"1995-2014 mean anomaly ({shift:.2f} C) to express them against our 1981-2010 baseline. Monthly shape = average "
                  "month-minus-annual-mean over the four windows.",
        "baselineShiftC": round(shift, 3),
        "temperature": temp,
        "seasonal": seasonal,
    }
    open(path, "w", encoding="utf-8").write(json.dumps(data, ensure_ascii=False, separators=(",", ":")))  # same compact style as the files
    print(city, region, "shift", round(shift, 2), temp["ssp245"], temp["ssp585"])
