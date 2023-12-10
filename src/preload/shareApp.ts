import { IpcRendererEvent, ipcRenderer } from "electron";
import { ControlData, DisplayInfo } from "../util/type";

export const shareApp = {
  requestScreenFrame: async (ms: number): Promise<void> => {
    await ipcRenderer.invoke("requestScreenFrame", ms);
  },
  sendScreenFrame: (listener: (keyFrame: boolean) => void) => {
    ipcRenderer.on(
      "sendScreenFrame",
      (event: IpcRendererEvent, keyFrame: boolean) => listener(keyFrame),
    );
  },
  getDisplayInfo: async (isDisplay: boolean): Promise<DisplayInfo[]> => {
    return await ipcRenderer.invoke("getDisplayInfo", isDisplay);
  },
  control: async (displayName: string, data: ControlData): Promise<void> => {
    await ipcRenderer.invoke("control", displayName, data);
  },
  controlWID: async (
    displayName: string,
    windowId: number,
    data: ControlData,
  ): Promise<void> => {
    await ipcRenderer.invoke("controlWID", displayName, windowId, data);
  },
  // Xvfb
  setXkbLayout: async (
    displayNum: number,
    layout: string,
  ): Promise<boolean> => {
    const result = await ipcRenderer.invoke("setXkbLayout", displayNum, layout);
    return result;
  },
  setInputMethod: async (displayNum: number): Promise<boolean> => {
    const result = await ipcRenderer.invoke("setInputMethod", displayNum);
    return result;
  },
  startXvfb: async (
    displayNum: number,
    width?: number,
    height?: number,
  ): Promise<boolean> => {
    const result = await ipcRenderer.invoke(
      "startXvfb",
      displayNum,
      width,
      height,
    );
    return result;
  },
  killXvfb: async (): Promise<boolean> => {
    const result = await ipcRenderer.invoke("killXvfb");
    return result;
  },
  getX11Screenshot: async (
    displayName: string,
  ): Promise<Buffer | undefined> => {
    const jpegImg: Buffer | undefined = await ipcRenderer.invoke(
      "getX11Screenshot",
      displayName,
    );
    return jpegImg;
  },
  getX11FullScreenshot: async (
    displayName: string,
  ): Promise<Buffer | undefined> => {
    const jpegImg: Buffer | undefined = await ipcRenderer.invoke(
      "getX11FullScreenshot",
      displayName,
    );
    return jpegImg;
  },
  startX11App: async (
    displayNum: number,
    appPath: string,
  ): Promise<boolean> => {
    const result = await ipcRenderer.invoke("startX11App", displayNum, appPath);
    return result;
  },
  getXDisplayEnv: async (): Promise<string> => {
    const path: string = await ipcRenderer.invoke("getXDisplayEnv");
    return path;
  },
};
