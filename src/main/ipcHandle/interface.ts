import { BrowserWindow, desktopCapturer, ipcMain } from "electron";
import { CLICheck, CLIOption } from "../../util/type";
import { Xvfb } from "../ipcHandle/shareApp/xvfb/xvfb";

export const setInterfaceModeHandler = (
  mainWindow: BrowserWindow,
  option: CLIOption | undefined,
  xvfbForCLI?: Xvfb,
) => {
  if (option != undefined) {
    mainWindow.hide();
  }

  ipcMain.handle("Interface", async (): Promise<CLICheck | undefined> => {
    if (option?.virtual && xvfbForCLI?.isRun()) {
      return {
        virtual: {
          displayNum: xvfbForCLI.displayNum,
          width: option.virtual.width ?? 1200,
          height: option.virtual.height ?? 720,
          keyboard: option.virtual.keyboard ?? `jp`,
          im: option.virtual.im,
          audio: option.virtual.audio,
          app: option.virtual.app,
        },
        filePath: option.filePath,
        password: option.password,
      };
    } else if (option?.host) {
      const sources = await desktopCapturer.getSources({
        types: ["screen"],
      });
      const sourceId = sources[0].id;

      return {
        host: {
          audio: option.host.audio,
          sourceId: sourceId,
        },
        filePath: option.filePath,
        password: option.password,
      };
    } else if (option?.filePath) {
      return {
        filePath: option.filePath,
        password: option.password,
      };
    }

    return undefined;
  });

  ipcMain.handle(
    "message",
    async (
      event: Electron.IpcMainInvokeEvent,
      message: string,
    ): Promise<void> => {
      console.log(message);
    },
  );
};

export const checkCLI = (): CLIOption | undefined => {
  // password
  let password: string | undefined;
  const passwordIndex = process.argv.indexOf(`-password`);
  if (passwordIndex != -1 && passwordIndex + 1 <= process.argv.length) {
    password = process.argv[passwordIndex + 1];
  }

  // file share
  let filePath: string | undefined;
  const fileIndex = process.argv.indexOf(`-file`);
  if (fileIndex != -1 && fileIndex + 1 <= process.argv.length) {
    filePath = process.argv[fileIndex + 1];
  }

  if (process.argv.indexOf(`-virtual`) != -1) {
    // xvfb width
    let width: number | undefined;
    const widthIndex = process.argv.indexOf(`-width`);
    if (widthIndex != -1 && widthIndex + 1 <= process.argv.length) {
      width = parseInt(process.argv[widthIndex + 1], 10);
      if (Number.isNaN(width) || width == 0) {
        width = undefined;
      }
    }

    // xvfb height
    let height: number | undefined;
    const heightIndex = process.argv.indexOf(`-height`);
    if (heightIndex != -1 && heightIndex + 1 <= process.argv.length) {
      height = parseInt(process.argv[heightIndex + 1], 10);
      if (Number.isNaN(height) || height == 0) {
        height = undefined;
      }
    }

    // keyboard layout
    let keyboard: string | undefined;
    const keyboardIndex = process.argv.indexOf(`-keyboard`);
    if (keyboardIndex != -1 && keyboardIndex + 1 <= process.argv.length) {
      keyboard = process.argv[keyboardIndex + 1];
    }

    // im
    let im = false;
    const imIndex = process.argv.indexOf(`-im`);
    if (imIndex) {
      im = true;
    }

    // audio
    let audio = false;
    const audioIndex = process.argv.indexOf(`-audio`);
    if (audioIndex != -1) {
      audio = true;
    }

    // app
    let app: string | undefined;
    const appIndex = process.argv.indexOf(`-app`);
    if (appIndex != -1 && appIndex + 1 <= process.argv.length) {
      app = process.argv[appIndex + 1];
    }

    // password
    if (password) {
      const password = process.argv[passwordIndex + 1];
      const option: CLIOption = {
        virtual: {
          width,
          height,
          keyboard,
          im,
          audio,
          app,
        },
        filePath,
        password,
      };
      return option;
    } else {
      return undefined;
    }
  } else if (process.argv.indexOf(`-host`) != -1) {
    // audio
    let audio = false;
    const audioIndex = process.argv.indexOf(`-audio`);
    if (audioIndex != -1) {
      audio = true;
    }

    // password
    if (password) {
      const option: CLIOption = {
        host: {
          audio,
        },
        filePath,
        password,
      };
      return option;
    } else {
      return undefined;
    }
  }

  // password
  if (filePath && password) {
    const option: CLIOption = {
      filePath,
      password,
    };
    return option;
  }

  return undefined;
};

export const checkCLIVirtual = (
  option: CLIOption | undefined,
): Xvfb | undefined => {
  if (option?.virtual != undefined) {
    for (let displayNum = 1; ; displayNum++) {
      const xvfb = new Xvfb(displayNum, {
        width: option.virtual.width ?? 1200,
        height: option.virtual.height ?? 720,
        depth: 24,
      });

      if (xvfb.start()) {
        return xvfb;
      }
    }
  }

  return undefined;
};
