import { IpcRendererEvent, ipcRenderer } from "electron";
import { FileWatchMsg } from "../util/type";

export const shareFile = {
  getFileInfo: async (
    fileName: string,
  ): Promise<
    | {
        fileName: string;
        fileSize: number;
      }
    | undefined
  > => {
    const result = await ipcRenderer.invoke("getFileInfo", fileName);
    return result;
  },
  setFileInfo: async (fileName: string, fileSize: number): Promise<boolean> => {
    const result: boolean = await ipcRenderer.invoke(
      "setFileInfo",
      fileName,
      fileSize,
    );
    return result;
  },
  getFileChunk: async (
    fileName: string,
    fileTransferId: string,
  ): Promise<Uint8Array | null> => {
    const result: Uint8Array | null = await ipcRenderer.invoke(
      "getFileChunk",
      fileName,
      fileTransferId,
    );

    return result;
  },
  recvFileBuffer: async (
    fileName: string,
    buffer: Uint8Array,
  ): Promise<number> => {
    const result: number = await ipcRenderer.invoke(
      "recvFileBuffer",
      fileName,
      buffer,
    );
    return result;
  },
  destroyRecvFileBuffer: async (fileName: string): Promise<boolean> => {
    const result: boolean = await ipcRenderer.invoke(
      "destroyRecvFileBuffer",
      fileName,
    );
    return result;
  },
  initFileWatch: async (dir: string): Promise<boolean> => {
    const result: boolean = await ipcRenderer.invoke("initFileWatch", dir);
    return result;
  },
  sendFileWatch: async (dir: string): Promise<boolean> => {
    const result: boolean = await ipcRenderer.invoke("sendFileWatch", dir);
    return result;
  },
  // main -> renderer
  streamFileWatchMsg: (listener: (data: FileWatchMsg) => void) => {
    ipcRenderer.on(
      "streamFileWatchMessage",
      (event: IpcRendererEvent, data: FileWatchMsg) => listener(data),
    );
  },
};
