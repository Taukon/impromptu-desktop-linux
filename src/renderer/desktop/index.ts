import { Socket } from "socket.io-client";
import { listenAuth } from "./signaling";
import { ShareHostApp } from "./shareApp/host";
import { ShareVirtualApp } from "./shareApp/virtual";
import { ShareFile } from "./shareFile";

export const setAuth = (
  desktopId: string,
  socket: Socket,
  password: string,
): void => {
  listenAuth(socket, desktopId, password);
};

export const initShareHostApp = async (
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

export const initShareVirtualApp = async (
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
  useInterval: boolean,
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
            useInterval,
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
            useInterval,
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
        useInterval,
      );

      return shareVirtualApp;
    }
  }
  return undefined;
};

export const initShareFile = (
  desktopId: string,
  socket: Socket,
  rtcConfiguration: RTCConfiguration,
): ShareFile => {
  return new ShareFile(desktopId, socket, rtcConfiguration);
};

export const initCLIShareVirtualApp = async (
  displayNum: number,
  desktopId: string,
  socket: Socket,
  rtcConfiguration: RTCConfiguration,
  audio: boolean,
  xkbLayout: string,
  im: boolean,
): Promise<ShareHostApp | undefined> => {
  const displayName = await window.shareApp.getXDisplayEnv();

  if (displayName === `:${displayNum}`) {
    await window.shareApp.setXkbLayout(displayNum, xkbLayout);
    if (im) {
      await window.shareApp.setInputMethod(displayNum);
    }

    const screenInfo = await window.shareApp.getDisplayInfo(true);
    const sourceId = screenInfo[0].id;

    try {
      const shareApp = await initShareHostApp(
        desktopId,
        socket,
        rtcConfiguration,
        sourceId,
        true,
        false,
        false,
        audio,
      );

      return shareApp;
    } catch (error) {
      if (audio) {
        const shareApp = await initShareHostApp(
          desktopId,
          socket,
          rtcConfiguration,
          sourceId,
          true,
          false,
          false,
          false,
        );

        return shareApp;
      }
    }
  }
  return undefined;
};
