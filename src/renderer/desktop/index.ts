import { Socket, io } from "socket.io-client";
import { listenAuth, reqAutoProxy } from "./signaling";
import { ShareHostApp } from "./shareApp/host";
import { ShareVirtualApp } from "./shareApp/virtual";
import { ShareFile } from "./shareFile";
import { signalingAddress } from "../config";

const setAuth = (desktopId: string, socket: Socket, password: string): void => {
  listenAuth(socket, desktopId, password);
};

const initShareHostApp = async (
  desktopId: string,
  socket: Socket,
  rtcConfiguration: RTCConfiguration,
  sourceId: string,
  isDesktop: boolean,
  useScreenChannel: boolean,
  onControlDisplay: boolean,
  audio: boolean,
): Promise<ShareHostApp | undefined> => {
  const stream: MediaStream =
    await // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator.mediaDevices as any).getUserMedia({
      audio: audio
        ? {
            mandatory: {
              chromeMediaSource: "desktop",
            },
          }
        : false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
        },
      },
    });
  const regex = /:(\d+):/; // 正規表現パターンを定義
  const match = sourceId.match(regex); // 正規表現にマッチする部分を抽出
  if (match && match[1]) {
    const windowId = parseInt(match[1], 10); // マッチした部分をnumber型に変換

    const shareHostApp = new ShareHostApp(
      windowId, //sourceId
      isDesktop,
      desktopId,
      socket,
      rtcConfiguration,
      stream,
      useScreenChannel,
      onControlDisplay,
    );

    return shareHostApp;
  }
  return undefined;
};

const initShareVirtualApp = async (
  displayNum: number,
  desktopId: string,
  socket: Socket,
  rtcConfiguration: RTCConfiguration,
  onControlDisplay: boolean,
  audio: boolean,
  isFullScreen: boolean,
  xkbLayout: string,
  im: boolean,
  width: number,
  height: number,
): Promise<ShareVirtualApp | undefined> => {
  const isStart = await window.shareApp.startXvfb(displayNum, width, height);

  if (isStart) {
    await window.shareApp.setXkbLayout(displayNum, xkbLayout);
    if (im) {
      await window.shareApp.setInputMethod(displayNum);
    }

    if (audio) {
      const screenInfo = await window.shareApp.getDisplayInfo(true);
      const sourceId = screenInfo[0].id;
      if (sourceId) {
        try {
          const audioStream: MediaStream =
            await // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (navigator.mediaDevices as any).getUserMedia({
              audio: {
                mandatory: {
                  chromeMediaSource: "desktop",
                },
              },
              video: false,
            });

          const shareVirtualApp = new ShareVirtualApp(
            displayNum,
            desktopId,
            socket,
            rtcConfiguration,
            onControlDisplay,
            isFullScreen,
            audioStream,
          );

          return shareVirtualApp;
        } catch (error) {
          const shareVirtualApp = new ShareVirtualApp(
            displayNum,
            desktopId,
            socket,
            rtcConfiguration,
            onControlDisplay,
            isFullScreen,
          );

          return shareVirtualApp;
        }
      }
    } else {
      const shareVirtualApp = new ShareVirtualApp(
        displayNum,
        desktopId,
        socket,
        rtcConfiguration,
        onControlDisplay,
        isFullScreen,
      );

      return shareVirtualApp;
    }
  }
  return undefined;
};

const initShareFile = (
  desktopId: string,
  socket: Socket,
  rtcConfiguration: RTCConfiguration,
): ShareFile => {
  return new ShareFile(desktopId, socket, rtcConfiguration);
};

export class Impromptu {
  public desktopId?: string;
  private socket: Socket;
  private rtcConfiguration?: RTCConfiguration;
  private shareHostApp?: ShareHostApp;
  private shareVirtualApp?: ShareVirtualApp;
  private shareCLIVirtualApp?: ShareHostApp;
  private displayNum?: number;
  private shareFile?: ShareFile;

  constructor() {
    this.socket = io(signalingAddress, {
      secure: true,
      rejectUnauthorized: false,
      autoConnect: false,
    });
  }

  public listenDesktopId(
    callBack: () => void,
    password: string,
    proxy?: { id: string; pwd: string },
  ) {
    this.socket.connect();
    this.socket.once(
      "desktopId",
      async (desktopId?: string, rtcConfiguration?: RTCConfiguration) => {
        if (typeof desktopId === "string" && rtcConfiguration) {
          setAuth(desktopId, this.socket, password);
          this.rtcConfiguration = rtcConfiguration;
          this.desktopId = desktopId;

          if (proxy) {
            reqAutoProxy(this.socket, proxy.id, proxy.pwd, desktopId, password);
          }

          callBack();
        }
      },
    );

    this.socket.emit("role", "desktop");
  }

  public async startHostDisplay(
    isGUI: boolean,
    sourceId: string,
    audio: boolean,
    onControlDisplay: boolean,
    isDisplay: boolean,
    parent?: HTMLDivElement,
  ): Promise<boolean> {
    if (
      this.socket.connected &&
      this.desktopId &&
      this.rtcConfiguration &&
      !this.shareHostApp
    )
      try {
        this.shareHostApp = await initShareHostApp(
          this.desktopId,
          this.socket,
          this.rtcConfiguration,
          sourceId,
          isDisplay,
          true,
          onControlDisplay,
          audio,
        );
        if (isGUI && parent && onControlDisplay && this.shareHostApp) {
          parent.appendChild(this.shareHostApp.screen);
        }
        return this.shareHostApp ? true : false;
      } catch (error) {
        if (audio) {
          if (isGUI) console.log(`maybe not support audio...`);
          try {
            const shareHostApp = await initShareHostApp(
              this.desktopId,
              this.socket,
              this.rtcConfiguration,
              sourceId,
              isDisplay,
              true,
              onControlDisplay,
              false,
            );
            if (isGUI && parent && onControlDisplay && shareHostApp) {
              parent.appendChild(shareHostApp.screen);
            }
            return shareHostApp ? true : false;
          } catch (error) {
            if (isGUI) console.log("error. orz");
            if (isGUI) console.log(error);
          }
        }
      }
    return false;
  }

  // run Xvfb
  public async startVirtualDisplay(
    displayNum: number,
    xkbLayout: string,
    im: boolean,
    isFullScreen: boolean,
    width: number,
    height: number,
    audio: boolean,
    parent: HTMLDivElement,
  ): Promise<boolean> {
    if (
      this.socket.connected &&
      this.desktopId &&
      this.rtcConfiguration &&
      !this.shareVirtualApp
    ) {
      this.shareVirtualApp = await initShareVirtualApp(
        displayNum,
        this.desktopId,
        this.socket,
        this.rtcConfiguration,
        true,
        audio,
        isFullScreen,
        xkbLayout,
        im,
        width,
        height,
      );

      if (this.shareVirtualApp) {
        this.displayNum = displayNum;
        parent.appendChild(this.shareVirtualApp.screen);
        return true;
      }
    }

    return false;
  }

  public stopVirtualDisplay() {
    if (this.shareVirtualApp) window.shareApp.killXvfb();
  }

  // run application in Xvfb
  public async startVirtualApp(appPath: string): Promise<boolean> {
    if (
      (this.shareVirtualApp || this.shareCLIVirtualApp) &&
      this.displayNum != undefined &&
      appPath != ""
    ) {
      return await window.shareApp.startX11App(this.displayNum, appPath);
    }
    return false;
  }

  public async startCLIVirtualDisplay(
    displayNum: number,
    audio: boolean,
    xkbLayout: string,
    im: boolean,
  ): Promise<boolean> {
    const displayName = await window.shareApp.getXDisplayEnv();

    if (
      displayName === `:${displayNum}` &&
      this.socket.connected &&
      this.desktopId &&
      this.rtcConfiguration &&
      !this.shareCLIVirtualApp
    ) {
      this.displayNum = displayNum;
      await window.shareApp.setXkbLayout(displayNum, xkbLayout);
      if (im) {
        await window.shareApp.setInputMethod(displayNum);
      }

      const screenInfo = await window.shareApp.getDisplayInfo(true);
      const sourceId = screenInfo[0].id;

      try {
        this.shareCLIVirtualApp = await initShareHostApp(
          this.desktopId,
          this.socket,
          this.rtcConfiguration,
          sourceId,
          true,
          true,
          false,
          audio,
        );

        return this.shareCLIVirtualApp ? true : false;
      } catch (error) {
        if (audio) {
          this.shareCLIVirtualApp = await initShareHostApp(
            this.desktopId,
            this.socket,
            this.rtcConfiguration,
            sourceId,
            true,
            true,
            false,
            false,
          );

          return this.shareCLIVirtualApp ? true : false;
        }
      }
    }
    return false;
  }

  public async startFileShare(
    dirPath: string,
    parent?: HTMLDivElement,
  ): Promise<boolean> {
    if (
      dirPath != "" &&
      this.socket.connected &&
      this.desktopId &&
      this.rtcConfiguration &&
      !this.shareFile
    ) {
      this.shareFile = initShareFile(
        this.desktopId,
        this.socket,
        this.rtcConfiguration,
      );

      if (this.shareFile) {
        return await this.shareFile.loadFile(dirPath, parent);
      }
    }
    return false;
  }
}
