import { ipcRenderer } from "electron";
import { CLICheck } from "../util/type";

export const util = {
  getBasePath: async (): Promise<string> => {
    const path: string = await ipcRenderer.invoke("getBasePath");
    return path;
  },
  checkInterface: async (): Promise<CLICheck | undefined> => {
    const result: CLICheck | undefined = await ipcRenderer.invoke("Interface");
    return result;
  },
  sendMessage: async (message: string): Promise<void> => {
    await ipcRenderer.invoke("message", message);
  },
};
