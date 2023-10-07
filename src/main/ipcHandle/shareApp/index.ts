import { desktopCapturer, ipcMain } from "electron";
import { ControlData, DisplayInfo, KeyJson } from "../../../util/type";
import { xtest } from "./xvfb/x11lib";
import { keySymToX11Key } from "./xvfb/convertKey";

export const setShareAppIpcHandler = (): void => {
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
      if (data.move?.x != undefined && data.move?.y != undefined) {
        try {
          //console.log("try: "+data.move.x +" :"+ data.move.y);
          xtest.motionEvent(displayName, data.move.x, data.move.y);
        } catch (error) {
          console.error(error);
        }
      } else if (
        data.button?.buttonMask != undefined &&
        data.button.down != undefined
      ) {
        try {
          //console.log("try: " + data.button.buttonMask + " : " + data.button.down);
          xtest.buttonEvent(
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
            xtest.keyEvent(displayName, key, data.key.down);
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
      if (data.move?.x != undefined && data.move?.y != undefined) {
        try {
          //console.log("try: "+data.move.x +" :"+ data.move.y);
          xtest.motionEventXID(displayName, data.move.x, data.move.y, windowId);
        } catch (error) {
          console.error(error);
        }
      } else if (
        data.button?.buttonMask != undefined &&
        data.button.down != undefined
      ) {
        try {
          //console.log("try: " + data.button.buttonMask + " : " + data.button.down);
          xtest.buttonEvent(
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
            xtest.keyEventXID(displayName, key, data.key.down, windowId);
          }
        } catch (error) {
          console.error(error);
        }
      }
    },
  );
};
