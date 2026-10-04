const { app, BrowserWindow } = require("electron");
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-gpu");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "app");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const name = decodeURIComponent((req.url || "/").split("?")[0]);
      const file = path.normalize(path.join(root, name === "/" ? "index.html" : name));
      if (!file.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(file, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end("not found");
          return;
        }
        res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.listen(0, "127.0.0.1", () => resolve(server.address().port));
  });
}

async function createWindow() {
  const port = await startServer();
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: "Доборка",
    autoHideMenuBar: true,
    backgroundColor: "#141816",
    webPreferences: { contextIsolation: true, sandbox: false },
  });
  win.setIgnoreMouseEvents(false);
  win.webContents.on("did-finish-load", () => {
    win.focus();
    win.webContents.focus();
    win.webContents.insertCSS("html,body,button,input,a,div{ -webkit-app-region: no-drag; pointer-events: auto; }");
  });
  await win.loadURL(`http://127.0.0.1:${port}/index.html`);
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
