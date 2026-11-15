// MapLibre does its heavy work in a background worker. Vite repackages libraries, so MapLibre cannot find
// its worker file by itself. We bundle the worker with the app and tell MapLibre where it is.
// (Without this the globe never loads. Everything stays local, so it works offline.)
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

setWorkerUrl(workerUrl);
