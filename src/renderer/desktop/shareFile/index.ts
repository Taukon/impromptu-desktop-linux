import { Socket } from "socket.io-client";
import { timer } from "../../../util";
import {
  createAppProtocol,
  createAppProtocolFromJson,
  decodeParseData,
  parseAppProtocol,
} from "../../../protocol/renderer";
import { appMaxId, appStatus, getRandomInt } from "../../../protocol/common";
import { BrowserList } from "./manage";
import { listenFileOfferSDP, sendFileAnswerSDP } from "../signaling";
import { createPeerConnection, setRemoteOffer } from "../peerConnection";
import { FileWatchList, FileWatchMsg } from "../monitorFile/type";
import { updateFiles } from "../monitorFile";
import {
  AcceptReadFile,
  AcceptWriteFile,
  ReqReadFile,
  ReqWriteFile,
} from "./type";
import { FileSDP } from "../signaling/type";
import { readFileBuffer, writeFileBuffer } from "./utils";

export class ShareFile {
  public desktopId: string;
  public socket: Socket;
  public dir?: string;

  public connectionList: BrowserList = {};
  private rtcConfiguration: RTCConfiguration;

  constructor(
    desktopId: string,
    socket: Socket,
    rtcConfiguration: RTCConfiguration,
  ) {
    this.desktopId = desktopId;
    this.socket = socket;
    this.rtcConfiguration = rtcConfiguration;
  }

  public closeShareFile(): void {
    Object.keys(this.connectionList).forEach((key) => {
      this.closeConnection(key);
    });
  }

  private initConnection(browserId: string): boolean {
    if (this.connectionList[browserId]?.createTime) {
      this.closeConnection(browserId);
    }

    this.connectionList[browserId] = { createTime: new Date().toISOString() };

    return this.connectionList[browserId].createTime ? true : false;
  }

  public closeConnection(browserId: string): void {
    if (this.connectionList[browserId]?.createTime) {
      const fileWatchConnection =
        this.connectionList[browserId].fileWatchConnection;
      if (fileWatchConnection) {
        fileWatchConnection.close();
      }

      const fileWatchChannel = this.connectionList[browserId].fileWatchChannel;
      if (fileWatchChannel) {
        fileWatchChannel.close();
      }

      delete this.connectionList[browserId];
    }
  }

  //-------------------------------------------------------------------------
  public async loadFile(
    dir: string,
    fileList?: FileWatchList,
  ): Promise<boolean> {
    const result = await window.shareFile.initFileWatch(dir);
    if (result) {
      this.listenOfferSDP();

      this.dir = dir;
      window.shareFile.streamFileWatchMsg((data: FileWatchMsg) => {
        // console.log(data);
        Object.keys(this.connectionList).forEach((key) => {
          const channel = this.connectionList[key].fileWatchChannel;
          if (channel?.readyState === `open`) {
            channel.send(
              createAppProtocolFromJson(
                JSON.stringify(data),
                appStatus.fileWatch,
              ),
            );
          }
        });
        if (fileList) updateFiles(fileList, data);
      });
      await window.shareFile.sendFileWatch(dir);

      return true;
    }

    return false;
  }

  // listen Offer SDP
  private listenOfferSDP() {
    const listener = async (
      browserId: string,
      fileSdp: FileSDP,
    ): Promise<void> => {
      if (fileSdp.type === `fileWatch`) {
        if (!this.connectionList[browserId]?.createTime) {
          this.initConnection(browserId);
        }
        await this.resFileWatchReq(browserId, fileSdp.sdp);
      } else if (fileSdp.type === `readTransfer` && fileSdp.transferId) {
        await this.resReadTransfer(browserId, fileSdp.transferId, fileSdp.sdp);
      } else if (fileSdp.type === `writeTransfer` && fileSdp.transferId) {
        await this.resWriteTransfer(browserId, fileSdp.transferId, fileSdp.sdp);
      }
    };
    listenFileOfferSDP(this.socket, listener);
  }

  //-------------------------------------------------------------------------

  // send Answer SDP
  private async resFileWatchReq(
    browserId: string,
    offerSdp: string,
  ): Promise<boolean> {
    if (this.connectionList[browserId]) {
      const answerSDP = (answerSDP: string) =>
        sendFileAnswerSDP(this.socket, browserId, {
          type: `fileWatch`,
          sdp: answerSDP,
        });

      const fileWatchConnection = createPeerConnection(
        answerSDP,
        this.rtcConfiguration,
      );

      fileWatchConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        if (this.connectionList[browserId]) {
          event.channel.onopen = async () => {
            this.connectionList[browserId].fileWatchChannel = event.channel;
          };

          event.channel.onerror = () => {
            this.closeConnection(browserId);
          };

          event.channel.onmessage = (ev) => {
            const parse = parseAppProtocol(
              new Uint8Array(ev.data as ArrayBuffer),
            );
            if (parse.status === appStatus.fileRequestList) {
              if (this.dir) window.shareFile.sendFileWatch(this.dir);
            }
          };
        }
      };

      fileWatchConnection.onconnectionstatechange = () => {
        switch (fileWatchConnection.connectionState) {
          case "connected":
            break;
          case "disconnected":
          case "failed":
          case "closed":
            this.closeConnection(browserId);
            break;
        }
      };

      await setRemoteOffer(offerSdp, fileWatchConnection);

      this.connectionList[browserId].fileWatchConnection = fileWatchConnection;
      return true;
    }
    return false;
  }

  // listen Offer SDP & send Answer SDP
  private async resReadTransfer(
    browserId: string,
    transferId: string,
    offerSdp: string,
  ): Promise<void> {
    const answerSDP = (answerSDP: string) =>
      sendFileAnswerSDP(this.socket, browserId, {
        type: `readTransfer`,
        sdp: answerSDP,
        transferId,
      });

    const readConnection = createPeerConnection(
      answerSDP,
      this.rtcConfiguration,
    );

    readConnection.ondatachannel = (event: RTCDataChannelEvent) => {
      const id = getRandomInt(appMaxId);
      let fileOrder = 0;
      let fileTotal = 0;
      let accept = true;
      let acceptReadFile: AcceptReadFile | undefined;

      event.channel.onmessage = async (ev) => {
        const parse = parseAppProtocol(new Uint8Array(ev.data as ArrayBuffer));
        if (parse.status === appStatus.fileRequestRead && acceptReadFile) {
          const chunk = await window.shareFile.getFileChunk(
            acceptReadFile.fileName,
            transferId,
          );
          if (chunk !== null) {
            const { order, total } = await readFileBuffer(
              event.channel,
              chunk,
              acceptReadFile.fileSize,
              id,
              fileOrder,
              fileTotal,
            );
            fileOrder = order;
            fileTotal = total;
          }
        } else if (parse.status === appStatus.fileRequestRead && accept) {
          const reqReadFile: ReqReadFile = decodeParseData(parse.data);
          acceptReadFile = await window.shareFile.getFileInfo(
            reqReadFile.fileName,
          );
          if (acceptReadFile) {
            accept = false;
            const jsonString = JSON.stringify(acceptReadFile);
            const data = createAppProtocolFromJson(
              jsonString,
              appStatus.fileAcceptRead,
            );
            event.channel.send(data);
          } else {
            const id = getRandomInt(appMaxId);
            const data = createAppProtocol(
              Buffer.alloc(0),
              id,
              appStatus.fileError,
              0,
            );
            event.channel.send(data);
          }
        }
      };
    };

    await setRemoteOffer(offerSdp, readConnection);

    return;
  }

  // listen Offer SDP & send Answer SDP
  private async resWriteTransfer(
    browserId: string,
    transferId: string,
    offerSdp: string,
  ): Promise<void> {
    const answerSDP = (answerSDP: string) =>
      sendFileAnswerSDP(this.socket, browserId, {
        type: `writeTransfer`,
        sdp: answerSDP,
        transferId,
      });

    let stamp = -1;
    let checkStamp = -1;
    let limit = 10;
    let isClosed = false;
    let acceptWriteFile: AcceptWriteFile | undefined;

    const writeConnection = createPeerConnection(
      answerSDP,
      this.rtcConfiguration,
    );

    writeConnection.ondatachannel = (event: RTCDataChannelEvent) => {
      event.channel.onmessage = async (ev) => {
        const parse = parseAppProtocol(new Uint8Array(ev.data as ArrayBuffer));
        if (acceptWriteFile) {
          stamp = parse.order;
          isClosed = await writeFileBuffer(parse, acceptWriteFile.fileName);
          if (isClosed) {
            writeConnection.close();
          } else {
            const id = getRandomInt(appMaxId);
            const data = createAppProtocol(
              Buffer.alloc(0),
              id,
              appStatus.fileAcceptWrite,
              0,
            );
            event.channel.send(data);
          }
        } else if (parse.status === appStatus.fileRequestWrite) {
          const reqWriteFile: ReqWriteFile = decodeParseData(parse.data);
          const isSet = await window.shareFile.setFileInfo(
            reqWriteFile.fileName,
            reqWriteFile.fileSize,
          );
          if (isSet) {
            acceptWriteFile = {
              fileName: reqWriteFile.fileName,
              fileSize: reqWriteFile.fileSize,
            };
            const jsonString = JSON.stringify(acceptWriteFile);
            const data = createAppProtocolFromJson(
              jsonString,
              appStatus.fileAcceptWrite,
            );
            event.channel.send(data);
          } else {
            const id = getRandomInt(appMaxId);
            const data = createAppProtocol(
              Buffer.alloc(0),
              id,
              appStatus.fileError,
              0,
            );
            event.channel.send(data);
          }
        }
      };
    };

    await setRemoteOffer(offerSdp, writeConnection);

    // timeout check
    // eslint-disable-next-line no-constant-condition
    while (1) {
      await timer(2 * 1000);
      if (acceptWriteFile) {
        if (isClosed) {
          break;
        }
        if (stamp === checkStamp) {
          limit--;
          if (limit == 0) {
            console.log(`timeout receive file: ${acceptWriteFile.fileName}`);
            window.shareFile.destroyRecvFileBuffer(acceptWriteFile.fileName);

            writeConnection.close();
            break;
          }
        } else {
          checkStamp = stamp;
        }
      }
    }
    return;
  }
}
