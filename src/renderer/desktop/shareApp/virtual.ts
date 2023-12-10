import { Socket } from "socket.io-client";
import { Buffer } from "buffer";
import { BrowserList } from "./manage";
import { listenAppOfferSDP, sendAppAnswerSDP } from "../signaling";
import { ControlData } from "../../../util/type";
import { createPeerConnection, setRemoteOffer } from "../peerConnection";
import { controlEventListener, displayScreen } from "../canvas";
import { AppSDP } from "../signaling/type";
import {
  createEncodedFrame,
  decodeParseData,
  parseAppProtocol,
  sendAppProtocol,
} from "../../../protocol/renderer";
import { appStatus } from "../../../protocol/common";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.Buffer = Buffer;

export class ShareVirtualApp {
  public desktopId: string;
  public socket: Socket;

  private displayName: string;

  private preJpegBuffer = Buffer.alloc(0);
  private screenShot: (displayName: string) => Promise<Buffer | undefined>;

  private canvas = document.createElement("canvas");
  private image = new Image();
  private audioStream?: MediaStream;
  public screen: HTMLCanvasElement | HTMLVideoElement;

  private interval = 30;

  private keyFrame = false;
  private videoEncoder = new VideoEncoder({
    output: (chunk) => {
      const videoBuffer = new Uint8Array(chunk.byteLength);
      chunk.copyTo(videoBuffer);
      const videoChunk = createEncodedFrame(
        videoBuffer,
        chunk.type === "key" ? true : false,
      );

      Object.values(this.screenChannels).forEach((v) => {
        if (v.readyState === "open" && v.bufferedAmount == 0) {
          sendAppProtocol(
            videoChunk,
            async (buffer: ArrayBuffer): Promise<void> => {
              v.send(buffer);
            },
          );
        }
      });
    },
    error: (error) => {
      console.log(error);
    },
  });

  public connectionList: BrowserList = {};
  private screenChannels: { [browserId: string]: RTCDataChannel } = {};
  private rtcConfiguration: RTCConfiguration;

  constructor(
    displayNum: number,
    desktopId: string,
    socket: Socket,
    rtcConfiguration: RTCConfiguration,
    onControlDisplay: boolean,
    isFullScreen: boolean,
    audioStream?: MediaStream,
  ) {
    this.displayName = `:${displayNum}`;
    this.rtcConfiguration = rtcConfiguration;

    this.desktopId = desktopId;
    this.socket = socket;

    this.canvas.setAttribute("tabindex", String(0));
    this.image.onload = () => {
      if (
        !(
          this.canvas.width === this.image.width &&
          this.canvas.height === this.image.height
        )
      ) {
        this.canvas.width = this.image.width;
        this.canvas.height = this.image.height;

        this.videoEncoder.configure({
          codec: "vp8",
          width: this.image.width,
          height: this.image.height,
          framerate: 30,
        });
      }
      this.canvas.getContext("2d")?.drawImage(this.image, 0, 0);

      const videoFrame = new VideoFrame(this.image, { timestamp: 0 });

      if (this.keyFrame) {
        this.videoEncoder.encode(videoFrame, { keyFrame: true });
      } else {
        this.videoEncoder.encode(videoFrame);
      }
      videoFrame.close();
    };

    this.screenShot = isFullScreen
      ? window.shareApp.getX11FullScreenshot
      : window.shareApp.getX11Screenshot;
    this.audioStream = audioStream;

    if (onControlDisplay) {
      window.shareApp.getXDisplayEnv().then((displayName) => {
        controlEventListener(this.canvas, displayName);
      });
    }
    this.screen = this.canvas;

    this.startScreen();
    this.listenOfferSDP();
  }

  private initConnection(browserId: string) {
    if (this.connectionList[browserId]?.createTime) {
      this.closeConnection(browserId);
    }

    this.connectionList[browserId] = { createTime: new Date().toISOString() };
  }

  public closeConnection(browserId: string) {
    if (this.connectionList[browserId]?.createTime) {
      const screenChannelConnection =
        this.connectionList[browserId].screenChannelConnection;
      if (screenChannelConnection) {
        screenChannelConnection.close();
      }

      const screenTrackConnection =
        this.connectionList[browserId].screenTrackConnection;
      if (screenTrackConnection) {
        screenTrackConnection.close();
      }

      const controlConnection =
        this.connectionList[browserId].controlConnection;
      if (controlConnection) {
        controlConnection.close();
      }

      delete this.connectionList[browserId];
    }
  }

  public listenOfferSDP() {
    const listener = async (
      browserId: string,
      appSdp: AppSDP,
    ): Promise<void> => {
      if (!this.connectionList[browserId]?.createTime) {
        this.initConnection(browserId);
      }

      if (appSdp.type === `screen` && appSdp.appData === `channel`) {
        await this.resScreenChannelReq(browserId, appSdp.sdp);
      } else if (appSdp.type === `screen` && appSdp.appData === `track`) {
        await this.resScreenTrackReq(browserId, appSdp.sdp);
      } else if (appSdp.type === `control`) {
        await this.resControlReq(browserId, appSdp.sdp);
      }
    };
    listenAppOfferSDP(this.socket, listener);
  }

  private async resScreenChannelReq(browserId: string, sdp: string) {
    if (this.connectionList[browserId]) {
      const answerSDPr = (answerSDP: string) =>
        sendAppAnswerSDP(this.socket, browserId, {
          type: `screen`,
          sdp: answerSDP,
          appData: `channel`,
        });

      const screenConnection = createPeerConnection(
        answerSDPr,
        this.rtcConfiguration,
      );
      screenConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        event.channel.onopen = () => {
          this.screenChannels[browserId] = event.channel;
        };

        event.channel.onclose = () => {
          this.closeConnection(browserId);
          delete this.screenChannels[browserId];
        };

        event.channel.onerror = () => {
          this.closeConnection(browserId);
          delete this.screenChannels[browserId];
        };

        event.channel.onmessage = () => {
          // displayScreen(this.image, this.preJpegBuffer);
          this.preJpegBuffer = Buffer.alloc(0);
        };
      };

      screenConnection.onconnectionstatechange = () => {
        switch (screenConnection.connectionState) {
          case "connected":
            break;
          case "disconnected":
          case "failed":
          case "closed":
            this.closeConnection(browserId);
            break;
        }
      };

      await setRemoteOffer(sdp, screenConnection);

      this.connectionList[browserId].screenChannelConnection = screenConnection;
      return true;
    }
    return false;
  }

  private async resScreenTrackReq(browserId: string, sdp: string) {
    if (this.connectionList[browserId] && this.audioStream) {
      const answerSDP = (answerSDP: string) =>
        sendAppAnswerSDP(this.socket, browserId, {
          type: `screen`,
          sdp: answerSDP,
          appData: `track`,
        });

      const screenConnection = createPeerConnection(
        answerSDP,
        this.rtcConfiguration,
      );

      const audioTracks = this.audioStream.getAudioTracks();
      if (audioTracks.length > 0) {
        screenConnection.addTrack(audioTracks[0], this.audioStream);
      }

      screenConnection.onconnectionstatechange = () => {
        switch (screenConnection.connectionState) {
          case "connected":
            break;
          case "disconnected":
          case "failed":
          case "closed":
            this.closeConnection(browserId);
            break;
        }
      };

      await setRemoteOffer(sdp, screenConnection);

      this.connectionList[browserId].screenTrackConnection = screenConnection;
      return true;
    }
    return false;
  }

  private async resControlReq(browserId: string, sdp: string) {
    if (this.connectionList[browserId]) {
      const answerSDP = (answerSDP: string) =>
        sendAppAnswerSDP(this.socket, browserId, {
          type: `control`,
          sdp: answerSDP,
        });

      const controlConnection = createPeerConnection(
        answerSDP,
        this.rtcConfiguration,
      );

      controlConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        event.channel.onclose = () => {
          this.closeConnection(browserId);
        };
        event.channel.onerror = () => {
          this.closeConnection(browserId);
        };

        const control = (data: ControlData) =>
          window.shareApp.control(this.displayName, data);
        // setControl(event.channel, control);

        event.channel.onmessage = async (message) => {
          const parse = parseAppProtocol(
            new Uint8Array(message.data as ArrayBuffer),
          );

          if (parse.status === appStatus.control) {
            const data: ControlData = decodeParseData(parse.data);
            await control(data);
            // window.shareApp.controlWID(displayName, this.windowId, data);
          }
        };
      };

      controlConnection.onconnectionstatechange = () => {
        switch (controlConnection.connectionState) {
          case "connected":
            break;
          case "disconnected":
          case "failed":
          case "closed":
            this.closeConnection(browserId);
            break;
        }
      };

      await setRemoteOffer(sdp, controlConnection);

      this.connectionList[browserId].controlConnection = controlConnection;
      return true;
    }
    return false;
  }

  private startScreen(): void {
    window.shareApp.sendScreenFrame(async (keyFrame: boolean) => {
      this.keyFrame = keyFrame;
      try {
        const img = await this.screenShot(this.displayName);
        if (img) {
          if (Buffer.compare(img, this.preJpegBuffer) != 0) {
            displayScreen(this.image, img);
            this.preJpegBuffer = Buffer.from(img.buffer);
          }
          // displayScreen(this.image, img);
        }
      } catch (err) {
        console.log(err);
      }
    });
    window.shareApp.requestScreenFrame(this.interval);

    // if (this.useInterval) {
    //   setInterval(async () => {
    //     try {
    //       const img = await this.screenShot(this.displayName);
    //       if (img) {
    //         // if (Buffer.compare(img, this.preJpegBuffer) != 0) {
    //         //   displayScreen(this.image, img);
    //         //   this.preJpegBuffer = Buffer.from(img.buffer);
    //         // }
    //         displayScreen(this.image, img);
    //       }
    //     } catch (err) {
    //       console.log(err);
    //     }
    //   }, this.interval);
    // } else {
    //   const loop = async () => {
    //     try {
    //       const img = await this.screenShot(this.displayName);
    //       if (img) {
    //         // if (Buffer.compare(img, this.preJpegBuffer) != 0) {
    //         //   displayScreen(this.image, img);
    //         //   this.preJpegBuffer = Buffer.from(img.buffer);
    //         // }
    //         displayScreen(this.image, img);
    //       }
    //     } catch (err) {
    //       console.log(err);
    //     }

    //     await timer(this.interval);
    //     requestAnimationFrame(loop);
    //   };
    //   requestAnimationFrame(loop);
    // }
  }
}
