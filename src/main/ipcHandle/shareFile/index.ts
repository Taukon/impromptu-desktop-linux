import { BrowserWindow, ipcMain } from "electron";
import { HandleFile } from "./handleFile";

export const setShareFileIpcHandler = (mainWindow: BrowserWindow): void => {
  const handleFile = new HandleFile();

  ipcMain.handle(
    "getFileInfo",
    async (event: Electron.IpcMainInvokeEvent, fileName: string) => {
      return handleFile.getFileInfo(fileName);
    },
  );

  ipcMain.handle(
    "getFileChunk",
    async (
      event: Electron.IpcMainInvokeEvent,
      fileName: string,
      fileTransferId: string,
    ) => {
      const result = await handleFile.getReadStreamChunk(
        fileName,
        fileTransferId,
      );
      if (result !== null) {
        return Uint8Array.from(result);
      }
      return result;
    },
  );

  ipcMain.handle(
    "setFileInfo",
    async (
      event: Electron.IpcMainInvokeEvent,
      fileName: string,
      fileSize: number,
    ) => {
      return handleFile.setFileInfo(fileName, fileSize);
    },
  );

  ipcMain.handle(
    "recvFileBuffer",
    async (
      event: Electron.IpcMainInvokeEvent,
      fileName: string,
      buffer: Uint8Array,
    ) => {
      return handleFile.recvStreamFile(fileName, buffer, mainWindow);
    },
  );

  ipcMain.handle(
    "destroyRecvFileBuffer",
    async (event: Electron.IpcMainInvokeEvent, fileName: string) => {
      return handleFile.destroyRecvStreamFile(fileName);
    },
  );

  ipcMain.handle(
    "initFileWatch",
    (event: Electron.IpcMainInvokeEvent, dirPath: string) => {
      if (handleFile.initFileWatch(dirPath)) {
        return handleFile.setReadyWatch(mainWindow);
      }
      return false;
    },
  );

  ipcMain.handle(
    "sendFileWatch",
    (event: Electron.IpcMainInvokeEvent, dirPath: string) => {
      return handleFile.sendFilelist(mainWindow, dirPath);
    },
  );
};
