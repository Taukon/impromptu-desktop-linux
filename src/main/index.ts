import path from "path";
import { app, BrowserWindow, Menu } from "electron";
import { initIpcHandler } from "./ipcHandle";
import { checkCLI, checkCLIVirtual } from "./ipcHandle/interface";

const cli = checkCLI();
const displayNum = checkCLIVirtual(cli);

app.whenReady().then(async () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  initIpcHandler(mainWindow, cli, displayNum);

  Menu.setApplicationMenu(null);
  mainWindow.loadFile("dist/index.html");
});

app.once("window-all-closed", () => {
  app.quit();
  process.exit(0);
});

app.on(
  "certificate-error",
  (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  },
);
