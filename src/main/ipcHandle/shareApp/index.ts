import { BrowserWindow, desktopCapturer, ipcMain } from "electron";
import { ControlData, DisplayInfo, KeyJson } from "../../../util/type";
import { x11Simulator } from "./xvfb/x11lib";
import { keySymToX11Key } from "./xvfb/convertKey";

export const setShareAppIpcHandler = (mainWindow: BrowserWindow): void => {
  let screenTimer: NodeJS.Timeout | undefined = undefined;
  ipcMain.handle(
    "requestScreenFrame",
    async (event: Electron.IpcMainInvokeEvent, ms: number) => {
      if (screenTimer) {
        clearInterval(screenTimer);
      }

      screenTimer = setInterval(() => {
        try {
          if (mainWindow.isDestroyed()) {
            clearInterval(screenTimer);
            screenTimer = undefined;
          } else {
            mainWindow.webContents.send("sendScreenFrame");
          }
        } catch (error) {
          console.log(error);
          clearInterval(screenTimer);
          screenTimer = undefined;
        }
      }, ms);
    },
  );

  ipcMain.handle(
    "getDisplayInfo",
    async (event: Electron.IpcMainInvokeEvent, isDisplay: boolean) => {
      const sources = await desktopCapturer.getSources({
        types: isDisplay ? ["screen"] : ["window"],
      });
      const info: DisplayInfo[] = [];
      for (const source of sources) {
        info.push({ name: source.name, id: source.id });
      }
      return info;
    },
  );

  ipcMain.handle(
    "control",
    (
      event: Electron.IpcMainInvokeEvent,
      displayName: string,
      data: ControlData,
    ) => {
      if (
        data.move?.x != undefined &&
        data.move?.y != undefined &&
        data.move.cw != undefined &&
        data.move.ch != undefined
      ) {
        try {
          //console.log("try: "+data.move.x +" :"+ data.move.y);
          x11Simulator.motionEvent(
            displayName,
            data.move.x,
            data.move.y,
            data.move.cw,
            data.move.ch,
          );
        } catch (error) {
          console.error(error);
        }
      } else if (
        data.button?.buttonMask != undefined &&
        data.button.down != undefined
      ) {
        try {
          //console.log("try: " + data.button.buttonMask + " : " + data.button.down);
          x11Simulator.buttonEvent(
            displayName,
            data.button.buttonMask,
            data.button.down,
          );
        } catch (error) {
          console.error(error);
        }
      } else if (data.key?.down != undefined) {
        try {
          const key = keySymToX11Key(data as KeyJson);
          if (key) {
            x11Simulator.keyEvent(displayName, key, data.key.down);
          }
        } catch (error) {
          console.error(error);
        }
      }
    },
  );

  ipcMain.handle(
    "controlWID",
    (
      event: Electron.IpcMainInvokeEvent,
      displayName: string,
      windowId: number,
      data: ControlData,
    ) => {
      if (
        data.move?.x != undefined &&
        data.move?.y != undefined &&
        data.move.cw != undefined &&
        data.move.ch != undefined
      ) {
        try {
          // console.log(`try: x:${data.move.x} | y: ${data.move.y} | cw: ${data.move.cw} | ch: ${data.move.ch} | wid:${windowId}`);
          x11Simulator.motionEventXID(
            displayName,
            data.move.x,
            data.move.y,
            data.move.cw,
            data.move.ch,
            windowId,
          );
        } catch (error) {
          console.error(error);
        }
      } else if (
        data.button?.buttonMask != undefined &&
        data.button.down != undefined
      ) {
        try {
          //console.log("try: " + data.button.buttonMask + " : " + data.button.down);
          x11Simulator.buttonEvent(
            displayName,
            data.button.buttonMask,
            data.button.down,
          );
        } catch (error) {
          console.error(error);
        }
      } else if (data.key?.down != undefined) {
        try {
          const key = keySymToX11Key(data as KeyJson);
          if (key) {
            x11Simulator.keyEventXID(displayName, key, data.key.down, windowId);
          }
        } catch (error) {
          console.error(error);
        }
      }
    },
  );
};
