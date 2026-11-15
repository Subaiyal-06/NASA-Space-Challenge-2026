const { app, BrowserWindow } = require("electron");
const path = require("path");

// Let audio start without a click (we still use a Start button for the web build).
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#05070f",
    title: "Earth Jukebox: Pakistan",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
    },
  });

  const hash = process.env.STUDIO ? "/studio" : ""; // STUDIO=1 opens our own UI
  if (process.env.ELECTRON_DEV) {
    win.loadURL("http://localhost:5173/#" + hash);
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"), hash ? { hash } : undefined);
  }
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
