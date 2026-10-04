const { app, BrowserWindow, protocol } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: "Доборка",
    autoHideMenuBar: true,
    backgroundColor: "#141816",
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadURL("app://doborka/index.html");
}

app.whenReady().then(() => {
  const root = path.join(__dirname, "app");
  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const file = path.normalize(path.join(root, rel || "index.html"));
    if (!file.startsWith(root)) return new Response("forbidden", { status: 403 });
    return fetch(pathToFileURL(file).href);
  });
  createWindow();
});

app.on("window-all-closed", () => app.quit());
