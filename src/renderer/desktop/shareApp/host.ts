import { Socket } from "socket.io-client";
import { Buffer } from "buffer";
import { BrowserList } from "./manage";
import { listenAppOfferSDP, sendAppAnswerSDP } from "../signaling";
import { ControlData } from "../../../util/type";
import { setControl } from "./connect";
import { controlEventListener, controlEventListenerWID } from "../canvas";
import { createPeerConnection, setRemoteOffer } from "../peerConnection";
import { AppSDP } from "../signaling/type";
import { sendAppProtocol } from "../../../protocol/renderer";
import { timer } from "../../../util";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.Buffer = Buffer;

export class ShareHostApp {
  public desktopId: string;
  public socket: Socket;

  private windowId: number;
  private preJpegBuffer = Buffer.alloc(0);

  private canvas = document.createElement("canvas");
  private video = document.createElement("video");
  public screen: HTMLCanvasElement | HTMLVideoElement;
  private screenStream: MediaStream;
  private useScreenChannel: boolean;
  private isDisplay: boolean;
  private interval = 30;

  public connectionList: BrowserList = {};
  private screenChannels: { [browserId: string]: RTCDataChannel } = {};
  private rtcConfiguration: RTCConfiguration;

  constructor(
    windowId: number,
    isDisplay: boolean,
    desktopId: string,
    socket: Socket,
    rtcConfiguration: RTCConfiguration,
    videoStream: MediaStream,
    useScreenChannel: boolean,
    onControlDisplay: boolean,
  ) {
    this.desktopId = desktopId;
    this.socket = socket;
    this.rtcConfiguration = rtcConfiguration;

    this.canvas.setAttribute("tabindex", String(0));
    this.video.srcObject = videoStream;
    this.video.onloadedmetadata = () => this.video.play();
    this.screenStream = videoStream;
    this.useScreenChannel = useScreenChannel;
    this.windowId = windowId;
    this.isDisplay = isDisplay;

    if (onControlDisplay) {
      window.shareApp.getXDisplayEnv().then((displayName) => {
        this.isDisplay
          ? controlEventListener(this.canvas, displayName)
          : controlEventListenerWID(this.canvas, displayName, this.windowId);
      });
      this.screen = this.canvas;
    } else {
      this.screen = this.video;
    }
    if (useScreenChannel) {
      this.startChannelScreen();
    } else if (!useScreenChannel && onControlDisplay) {
      this.startTrackScreen();
    }

    this.listenOfferSDP();
  }

  private initConnection(browserId: string): boolean {
    // if (Object.keys(this.connectionList).length == 0) {
    //   this.startScreen();
    // }

    if (this.connectionList[browserId]?.createTime) {
      this.closeConnection(browserId);
    }

    this.connectionList[browserId] = { createTime: new Date().toISOString() };

    return this.connectionList[browserId].createTime ? true : false;
  }

  public closeConnection(browserId: string): void {
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

    // if (Object.keys(this.connectionList).length == 0) {
    //   this.stopDesktop();
    // }
  }

  public listenOfferSDP() {
    const listener = async (
      browserId: string,
      appSdp: AppSDP,
    ): Promise<void> => {
      if (!this.connectionList[browserId]?.createTime) {
        this.initConnection(browserId);
      }
      console.log(`offer sdp ${appSdp.type} : ${appSdp.appData}`);
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
      const answerSDP = (answerSDP: string) =>
        sendAppAnswerSDP(this.socket, browserId, {
          type: `screen`,
          sdp: answerSDP,
          appData: `channel`,
        });

      const screenConnection = createPeerConnection(
        answerSDP,
        this.rtcConfiguration,
      );

      screenConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        // event.channel.bufferedAmountLowThreshold = 0;

        // event.channel.onopen = () => {
        //   // event.channel.bufferedAmountLowThreshold = 1;
        // };
        // event.channel.onclose = () => {
        //   this.closeConnection(browserId);
        // };
        // event.channel.onerror = () => {
        //   this.closeConnection(browserId);
        // };

        // event.channel.onmessage = () => {
        //   // const parse = parseAppProtocol(new Uint8Array(ev.data as ArrayBuffer));
        //   // console.log(`req screen ${parse.status}`);
        //   this.sendScreenImg(event.channel);
        //   console.log(`amount ${event.channel.bufferedAmount} ${event.channel.bufferedAmountLowThreshold}`);
        // };

        // let id = this.jpegId;
        // event.channel.onbufferedamountlow = () => {
        //   console.log(`amountlow ${event.channel.bufferedAmount} ${event.channel.bufferedAmountLowThreshold}`);
        //   if(id != this.jpegId){
        //     // this.sendScreenImg(event.channel);
        //     sendAppProtocol(this.preJpegBuffer, async (buffer: ArrayBuffer): Promise<void> => {
        //       if (event.channel.readyState === "open") {
        //         event.channel.send(buffer);
        //       }
        //     });
        //     id = this.jpegId;
        //   }
        // };

        event.channel.onopen = () => {
          if (this.useScreenChannel) {
            this.screenChannels[browserId] = event.channel;
          } else {
            event.channel.close();
          }
        };

        event.channel.onclose = () => {
          event.channel.close();
          if (this.useScreenChannel) {
            this.closeConnection(browserId);
            delete this.screenChannels[browserId];
          }
        };

        event.channel.onerror = () => {
          event.channel.close();
          if (this.useScreenChannel) {
            this.closeConnection(browserId);
            delete this.screenChannels[browserId];
          }
        };

        event.channel.onmessage = () => {
          if (this.useScreenChannel) {
            this.sendScreenImg(event.channel);
          } else {
            event.channel.close();
          }
        };
      };

      screenConnection.onconnectionstatechange = () => {
        switch (screenConnection.connectionState) {
          case "connected":
            break;
          case "disconnected":
          case "failed":
          case "closed":
            if (this.useScreenChannel) this.closeConnection(browserId);
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
    if (this.connectionList[browserId]) {
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

      const videoTracks = this.screenStream.getVideoTracks();
      if (videoTracks.length > 0 && !this.useScreenChannel) {
        screenConnection.addTrack(videoTracks[0], this.screenStream);
      }

      const audioTracks = this.screenStream.getAudioTracks();
      if (audioTracks.length > 0) {
        screenConnection.addTrack(audioTracks[0], this.screenStream);
      }

      screenConnection.onconnectionstatechange = () => {
        switch (screenConnection.connectionState) {
          case "connected":
            if (!this.useScreenChannel && videoTracks.length == 0) {
              this.closeConnection(browserId);
            }
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

      controlConnection.ondatachannel = async (event: RTCDataChannelEvent) => {
        event.channel.onclose = () => {
          this.closeConnection(browserId);
        };
        event.channel.onerror = () => {
          this.closeConnection(browserId);
        };

        const displayName = await window.shareApp.getXDisplayEnv();
        const control = (data: ControlData) => {
          if (this.isDisplay) {
            if (data.move?.x && data.move.y && data.move.cw && data.move.ch) {
              data.move.x =
                (data.move.x * this.video.videoWidth) / data.move.cw;
              data.move.y =
                (data.move.y * this.video.videoHeight) / data.move.ch;
            }
            return window.shareApp.control(displayName, data);
          } else {
            return window.shareApp.controlWID(displayName, this.windowId, data);
          }
        };

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

  private startTrackScreen(): void {
    const loop = () => {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.canvas.getContext("2d")?.drawImage(this.video, 0, 0);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private startChannelScreen(): void {
    const loop = async () => {
      try {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.canvas.getContext("2d")?.drawImage(this.video, 0, 0);

        const base64Jpeg = this.canvas
          // .toDataURL("image/jpeg")
          .toDataURL("image/jpeg", 0.7)
          .replace(/^data:\w+\/\w+;base64,/, "");
        const jpegBuffer = Buffer.from(base64Jpeg, "base64");
        // const jpegBuffer = new Uint8Array(
        //   atob(base64Jpeg)
        //     .split("")
        //     .map((char) => char.charCodeAt(0)),
        // );

        if (Buffer.compare(jpegBuffer, this.preJpegBuffer) != 0) {
          // if (base64Jpeg != this.preBase64Jpeg) {
          this.preJpegBuffer = jpegBuffer;
          Object.values(this.screenChannels).forEach((v) => {
            if (v.readyState === "open" && v.bufferedAmount == 0) {
              this.sendScreenImg(v);
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
      await timer(this.interval);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // first send Screen
  private async sendScreenImg(channel: RTCDataChannel): Promise<void> {
    const sendImg = async (buffer: ArrayBuffer): Promise<void> => {
      if (channel.readyState === "open") {
        channel.send(buffer);
      }
    };

    await sendAppProtocol(this.preJpegBuffer, sendImg);
  }
}
