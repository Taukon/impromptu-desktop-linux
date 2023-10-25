import { appStatus } from "../../../protocol/common";
import { AppHeader, createAppProtocol } from "../../../protocol/renderer";
import { timer } from "../../../util";

export const writeFileBuffer = async (
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

const loop = 5;
export const readFileBuffer = async (
  channel: RTCDataChannel,
  chunk: Uint8Array,
  fileSize: number,
  id: number,
  order: number,
  total: number,
): Promise<{ order: number; total: number }> => {
  const send = async (data: Uint8Array) => {
    // eslint-disable-next-line no-constant-condition
    while (1) {
      if (channel.bufferedAmount == 0) break;
      await timer(loop);
    }
    channel.send(data);
  };

  total += chunk.byteLength;
  if (order === 0) {
    console.log(
      `order: ${order} | chunk len: ${chunk.byteLength} | fileSize: ${fileSize} | total: ${total}`,
    );
    const appData = createAppProtocol(chunk, id, appStatus.start, order);
    send(appData);
  } else if (total < fileSize) {
    // console.log(`m order: ${order} | chunk len: ${chunk.byteLength} | fileSize: ${fileSize} | total: ${total}`);
    const appData = createAppProtocol(chunk, id, appStatus.middle, order);
    send(appData);
  } else if (total === fileSize) {
    // console.log(`e order: ${order} | chunk len: ${chunk.byteLength} | fileSize: ${fileSize} | total: ${total}`);
    const appData = createAppProtocol(chunk, id, appStatus.end, order);
    send(appData);
  } else {
    total -= chunk.byteLength;
    return { order, total };
  }

  order++;

  return { order, total };
};

export const getRandomStringId = (): string => {
  const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  return Array.from(crypto.getRandomValues(new Uint32Array(10)))
    .map((v) => S[v % S.length])
    .join("");
};
