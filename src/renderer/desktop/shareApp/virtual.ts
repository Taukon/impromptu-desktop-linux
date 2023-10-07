import { Socket } from "socket.io-client";
import { Buffer } from "buffer";
import { BrowserList } from "./manage";
import { listenAppOfferSDP, sendAppAnswerSDP } from "../signaling";
import { ControlData } from "../../../util/type";
import { setControl } from "./connect";
import { createPeerConnection, setRemoteOffer } from "../peerConnection";
import { peerConnectionConfig } from "../../config";
import { controlEventListener, displayScreen } from "../canvas";
import { AppSDP } from "../signaling/type";
import { sendAppProtocol } from "../../../protocol/renderer";
import { timer } from "../../../util";

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

  private useInterval: boolean;
  private interval = 30;

  public connectionList: BrowserList = {};
  private screenChannels: { [browserId: string]: RTCDataChannel } = {};

  constructor(
    displayNum: number,
    desktopId: string,
    socket: Socket,
    onControlDisplay: boolean,
    isFullScreen: boolean,
    useInterval: boolean,
    audioStream?: MediaStream,
  ) {
    this.displayName = `:${displayNum}`;

    this.desktopId = desktopId;
    this.socket = socket;

    this.useInterval = useInterval;

    this.canvas.setAttribute("tabindex", String(0));
    this.image.onload = () => {
      this.canvas.width = this.image.width;
      this.canvas.height = this.image.height;
      this.canvas.getContext("2d")?.drawImage(this.image, 0, 0);
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
        peerConnectionConfig,
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
          this.sendScreenImg(event.channel);
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
        peerConnectionConfig,
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
        peerConnectionConfig,
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
        setControl(event.channel, control);
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
    if (this.useInterval) {
      setInterval(async () => {
        try {
          const img = await this.screenShot(this.displayName);
          if (img) {
            if (Buffer.compare(img, this.preJpegBuffer) != 0) {
              displayScreen(this.image, img);
              this.preJpegBuffer = Buffer.from(img.buffer);
              Object.values(this.screenChannels).forEach((v) => {
                if (v.readyState === "open" && v.bufferedAmount == 0) {
                  this.sendScreenImg(v);
                }
              });
            }
          }
        } catch (err) {
          console.log(err);
        }
      }, this.interval);
    } else {
      const loop = async () => {
        try {
          const img = await this.screenShot(this.displayName);
          if (img) {
            if (Buffer.compare(img, this.preJpegBuffer) != 0) {
              displayScreen(this.image, img);
              this.preJpegBuffer = Buffer.from(img.buffer);
              Object.values(this.screenChannels).forEach((v) => {
                if (v.readyState === "open" && v.bufferedAmount == 0) {
                  this.sendScreenImg(v);
                }
              });
            }
          }
        } catch (err) {
          console.log(err);
        }

        await timer(this.interval);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  private async sendScreenImg(channel: RTCDataChannel): Promise<void> {
    const sendImg = async (buffer: ArrayBuffer): Promise<void> => {
      if (channel.readyState === "open") {
        channel.send(buffer);
      }
    };

    await sendAppProtocol(this.preJpegBuffer, sendImg);
  }
}
