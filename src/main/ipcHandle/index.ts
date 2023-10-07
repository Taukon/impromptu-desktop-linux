import { BrowserWindow, ipcMain } from "electron";
import { setShareFileIpcHandler } from "./shareFile";
import { setShareAppIpcHandler } from "./shareApp";
import { setInterfaceModeHandler } from "./interface";
import { setXvfbIpcHandler } from "./shareApp/xvfb";
import { CLIOption } from "../../util/type";
import { Xvfb } from "./shareApp/xvfb/xvfb";

export const initIpcHandler = (
  mainWindow: BrowserWindow,
  cli: CLIOption | undefined,
  xvfbForCLI?: Xvfb,
): void => {
  setInterfaceModeHandler(mainWindow, cli, xvfbForCLI);
  setXvfbIpcHandler(xvfbForCLI);

  setShareAppIpcHandler();
  setShareFileIpcHandler(mainWindow);

  ipcMain.handle("getBasePath", () => {
    return `${__dirname}`;
  });
};
