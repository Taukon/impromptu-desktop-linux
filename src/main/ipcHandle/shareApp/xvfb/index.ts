import { ipcMain } from "electron";
import { setXkbLayout } from "./xkbmap";
import { Xvfb } from "./xvfb";
import { Uim } from "./im/uim";
import { Ibus } from "./im/ibus";
import { Scim } from "./im/scim";
import { Fcitx5 } from "./im/fcitx5";
import { AppProcess } from "./appProcess";
import { screenshot, converter } from "./x11lib";

export const setXvfbIpcHandler = (xvfbForCLI?: Xvfb): void => {
  // let im: Uim | Fcitx5 | Ibus | Scim | undefined;
  let imRun = false;
  let xvfb = xvfbForCLI;

  ipcMain.handle(
    "setXkbLayout",
    (
      event: Electron.IpcMainInvokeEvent,
      displayNum: number,
      layout: string,
    ) => {
      const process = setXkbLayout(displayNum, layout);
      if (process) {
        return true;
      }

      return false;
    },
  );

  ipcMain.handle(
    "setInputMethod",
    (event: Electron.IpcMainInvokeEvent, displayNum: number) => {
      if (imRun) {
        return false;
      }

      if (process.env.XMODIFIERS === `@im=uim`) {
        const im = new Uim(displayNum);
        imRun = im.isRun();
      } else if (process.env.XMODIFIERS === `@im=ibus`) {
        const im = new Ibus(displayNum);
        imRun = im.isRun();
      } else if (process.env.XMODIFIERS === `@im=SCIM`) {
        const im = new Scim(displayNum);
        imRun = im.isRun();
      } else if (process.env.XMODIFIERS === `@im=fcitx`) {
        const im = new Fcitx5(displayNum);
        imRun = im.isRun();
      }

      if (imRun) {
        return true;
      }

      return false;
    },
  );

  ipcMain.handle(
    "startXvfb",
    (
      event: Electron.IpcMainInvokeEvent,
      displayNum: number,
      x?: number,
      y?: number,
    ) => {
      if (xvfb === undefined) {
        xvfb = new Xvfb(displayNum, {
          width: x && x > 0 ? x : 1200,
          height: y && y > 0 ? y : 720,
          depth: 24,
        });
        if (xvfb.start()) {
          return true;
        }
      } else if (xvfb.isRun()) {
        return true;
      }

      xvfb = new Xvfb(displayNum, {
        width: x && x > 0 ? x : 1200,
        height: y && y > 0 ? y : 720,
        depth: 24,
      });
      if (xvfb.start()) {
        return true;
      }

      return false;
    },
  );

  ipcMain.handle("killXvfb", () => {
    if (xvfb?.isRun()) {
      xvfb.stop();

      return true;
    }
    return false;
  });

  ipcMain.handle(
    "startX11App",
    (
      event: Electron.IpcMainInvokeEvent,
      displayNum: number,
      appPath: string,
    ) => {
      if (xvfb?.isRun()) {
        const appProcess = new AppProcess(displayNum, appPath);

        process.on("exit", (e) => {
          console.log(`exit: ${e}`);
          appProcess.stop();
          xvfb?.stop();
        });

        process.on("SIGINT", (e) => {
          console.log(`SIGINT: ${e}`);
          // appProcess.stop();
          xvfb?.stop();
          process.exit(0);
        });
        process.on("uncaughtException", (e) => {
          console.log(`uncaughtException: ${e}`);
          appProcess.stop();
          xvfb?.stop();
        });

        return true;
      }
      return false;
    },
  );

  ipcMain.handle(
    "getX11Screenshot",
    (event: Electron.IpcMainInvokeEvent, displayName: string) => {
      try {
        const img = screenshot.screenshot(displayName);
        const [width, height, depth, fb_bpp] =
          screenshot.getScreenInfo(displayName);
        if (width && height && depth && fb_bpp) {
          const imgJpeg = converter.convert(img, width, height, depth, fb_bpp);
          return imgJpeg;
        }
      } catch (err) {
        console.log(err);
        return undefined;
      }
    },
  );

  ipcMain.handle(
    "getX11FullScreenshot",
    (event: Electron.IpcMainInvokeEvent, displayName: string) => {
      try {
        const img = screenshot.screenshotFull(displayName);
        const [width, height, depth, fb_bpp] =
          screenshot.getFullScreenInfo(displayName);
        if (width && height && depth && fb_bpp) {
          const imgJpeg = converter.convert(img, width, height, depth, fb_bpp);
          return imgJpeg;
        }
      } catch (err) {
        console.log(err);
        return undefined;
      }
    },
  );

  ipcMain.handle("getXDisplayEnv", () => {
    return `${process.env.DISPLAY}`;
  });
};
