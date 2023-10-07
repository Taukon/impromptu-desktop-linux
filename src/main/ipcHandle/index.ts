import { BrowserWindow, ipcMain } from "electron";
import { setShareFileIpcHandler } from "./shareFile";
import { setShareAppIpcHandler } from "./shareApp";
import { setInterfaceModeHandler } from "./interface";
import { setXvfbIpcHandler } from "./shareApp/xvfb";
import { CLIOption } from "../../util/type";

export const initIpcHandler = (
  mainWindow: BrowserWindow,
  cli: CLIOption | undefined,
  displayNum: number,
): void => {
  setInterfaceModeHandler(mainWindow, cli, displayNum);
  setXvfbIpcHandler();

  setShareAppIpcHandler();
  setShareFileIpcHandler(mainWindow);

  ipcMain.handle("getBasePath", () => {
    return `${__dirname}`;
  });
};
