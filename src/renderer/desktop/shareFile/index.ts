import { Socket } from "socket.io-client";
import { timer } from "../../../util";
import {
  AppHeader,
  createAppProtocol,
  createAppProtocolFromJson,
  decodeParseData,
  parseAppProtocol,
} from "../../../protocol/renderer";
import { appMaxId, appStatus, getRandomInt } from "../../../protocol/common";
import { BrowserList, TransferList } from "./manage";
import {
  listenFileAnswerSDP,
  listenFileOfferSDP,
  sendFileAnswerSDP,
  sendFileOfferSDP,
} from "../signaling";
import {
  createPeerConnection,
  setLocalOffer,
  setRemoteAnswer,
  setRemoteOffer,
} from "../peerConnection";
import { peerConnectionConfig } from "../../config";
import { FileWatchList, FileWatchMsg } from "../monitorFile/type";
import { updateFiles } from "../monitorFile";
import {
  AcceptReadFile,
  AcceptWriteFile,
  ReqReadFile,
  ReqWriteFile,
} from "./type";
import { FileSDP } from "../signaling/type";
import { getRandomStringId } from "./utils";

export class ShareFile {
  public desktopId: string;
  public socket: Socket;
  public dir?: string;

  public connectionList: BrowserList = {};
  public transferList: TransferList = {}; //for readTransfer

  constructor(desktopId: string, socket: Socket) {
    this.desktopId = desktopId;
    this.socket = socket;
  }

  public closeShareFile(): void {
    Object.keys(this.connectionList).forEach((key) => {
      this.closeConnection(key);
    });
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

    // if (Object.keys(this.connectionList).length == 0) {
    //   this.stopDesktop();
    // }
  }

  //-------------------------------------------------------------------------
  public async loadFile(
    dir: string,
    fileList?: FileWatchList,
  ): Promise<boolean> {
    const result = await window.shareFile.initFileWatch(dir);
    if (result) {
      this.listenOfferSDP();
      this.listenAnswerSDP();

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
      } else if (fileSdp.type === `writeTransfer` && fileSdp.transferId) {
        await this.resWriteTransfer(browserId, fileSdp.transferId, fileSdp.sdp);
      }
    };
    listenFileOfferSDP(this.socket, listener);
  }

  // listen Answer SDP
  private listenAnswerSDP() {
    const listener = async (browserId: unknown, fileSdp: FileSDP) => {
      if (fileSdp.transferId) {
        const answerSdp = fileSdp.sdp;
        const connection = this.transferList[fileSdp.transferId];
        if (connection) {
          await setRemoteAnswer(answerSdp, connection);
        }
      }
    };
    listenFileAnswerSDP(this.socket, listener);
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
        peerConnectionConfig,
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
            if (parse.status === appStatus.fileRequestRead) {
              const data: ReqReadFile = decodeParseData(parse.data);
              this.reqReadTransfer(this.socket, browserId, data);
            } else if (parse.status === appStatus.fileRequestList) {
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

  // send Offer SDP
  private async reqReadTransfer(
    socket: Socket,
    browserId: string,
    reqReadFile: ReqReadFile,
  ): Promise<void> {
    const type = `readTransfer`;
    const transferId = getRandomStringId();
    const offerSDP = (sdp: string) =>
      sendFileOfferSDP(socket, browserId, { type, sdp, transferId });

    const readConnection = createPeerConnection(offerSDP, peerConnectionConfig);
    const readChannel = readConnection.createDataChannel(type, {
      ordered: true,
    });

    readChannel.onclose = () => {
      delete this.transferList[transferId];
    };

    readChannel.onerror = () => {
      delete this.transferList[transferId];
    };

    readChannel.onopen = async () => {
      const info = await window.shareFile.getFileInfo(reqReadFile.fileName);
      if (info) {
        const acceptReadFile: AcceptReadFile = {
          fileName: info.fileName,
          fileSize: info.fileSize,
        };
        const jsonString = JSON.stringify(acceptReadFile);
        const data = createAppProtocolFromJson(
          jsonString,
          appStatus.fileAcceptRead,
        );
        readChannel.send(data);

        // readTransfer
        await this.readFile(
          info.fileName,
          info.fileSize,
          transferId,
          readChannel,
        );
      } else {
        const id = getRandomInt(appMaxId);
        const data = createAppProtocol(
          Buffer.alloc(0),
          id,
          appStatus.fileError,
          0,
        );
        readChannel.send(data);
      }
    };

    this.transferList[transferId] = readConnection;

    await setLocalOffer(readConnection);

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
      peerConnectionConfig,
    );

    writeConnection.ondatachannel = (event: RTCDataChannelEvent) => {
      event.channel.onmessage = async (ev) => {
        const parse = parseAppProtocol(new Uint8Array(ev.data as ArrayBuffer));
        if (acceptWriteFile) {
          stamp = parse.order;
          isClosed = await this.writeFile(parse, acceptWriteFile.fileName);
          if (isClosed) writeConnection.close();
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
          // console.log(`write channel ${acceptWriteFile.fileName}`);
          break;
        }
        if (stamp === checkStamp) {
          limit--;
          if (limit == 0) {
            console.log(`timeout recieve file: ${acceptWriteFile.fileName}`);
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

  private writeFile = async (
    parse: AppHeader,
    fileName: string,
  ): Promise<boolean> => {
    if (parse.status === appStatus.start) {
      await window.shareFile.recvFileBuffer(fileName, parse.data);
      return false;
    } else if (parse.status === appStatus.middle) {
      await window.shareFile.recvFileBuffer(fileName, parse.data);
      return false;
    } else if (parse.status === appStatus.end) {
      await window.shareFile.recvFileBuffer(fileName, parse.data);

      return true;
    }

    window.shareFile.destroyRecvFileBuffer(fileName);
    return true;
  };

  private readFile = async (
    fileName: string,
    fileSize: number,
    transferId: string,
    channel: RTCDataChannel,
  ): Promise<void> => {
    const id = getRandomInt(appMaxId);
    let order = 0;
    let total = 0;
    const loop = 5;

    let chunk = await window.shareFile.getFileChunk(fileName, transferId);

    if (chunk === null) {
      const appData = createAppProtocol(
        Buffer.alloc(0),
        id,
        appStatus.start,
        order,
      );
      channel.send(appData);
      return;
    }

    while (chunk !== null) {
      total += chunk.byteLength;
      if (order === 0) {
        console.log(
          `order: ${order} | chunkl: ${chunk.byteLength} | fileSize: ${fileSize} | total: ${total}`,
        );
        const appData = createAppProtocol(chunk, id, appStatus.start, order);
        channel.send(appData);
      } else if (total < fileSize) {
        // console.log(`m order: ${order} | chunkl: ${chunk.byteLength} | fileSize: ${fileSize} | total: ${total}`);
        const appData = createAppProtocol(chunk, id, appStatus.middle, order);
        channel.send(appData);
      } else if (total === fileSize) {
        console
          .log
          // `e order: ${order} | chunkl: ${chunk.byteLength} | fileSize: ${fileSize} | total: ${total}`,
          ();
        const appData = createAppProtocol(chunk, id, appStatus.end, order);
        channel.send(appData);
        break;
      } else {
        break;
      }

      order++;
      chunk = await window.shareFile.getFileChunk(fileName, transferId);
      await timer(loop); // usleep(1 * 1000);
    }
  };
}
