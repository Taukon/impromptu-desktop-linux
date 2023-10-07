import { appHeader, appMax, appMaxId, appStatus, getRandomInt } from "./common";

// App Protocol
//   header: 9B
// ---------------
// | 4B: id
// ---------------
// | 1B: status
// ---------------
// | 4B: order
// ---------------

export type AppHeader = {
  id: number;
  status: number;
  order: number;
  data: Uint8Array;
};

// appBuffer.byteLength <= max
export const parseAppProtocol = (appBuffer: Uint8Array): AppHeader => {
  const header = new DataView(appBuffer.slice(0, appHeader).buffer);

  // id: 4B
  const id = header.getUint32(0);

  // status: 1B
  const status = header.getUint8(4);

  // order: 4B
  const order = header.getUint32(5);

  const data = appBuffer.slice(appHeader);

  return { id, status, order, data };
};

// data.byteLength <= max - header
export const createAppProtocol = (
  data: Uint8Array,
  id: number,
  status: number,
  order: number,
): Uint8Array => {
  // header
  const header = new Uint8Array(appHeader);
  const dataHeader = new DataView(header.buffer);

  // id: 4B
  dataHeader.setUint32(0, id, false);

  // status: 1B
  dataHeader.setUint8(4, status & 0xff);

  // order: 4B
  dataHeader.setUint32(5, order & 0xffffffff, false);

  const appBuffer = appendBuffer(header, data);
  return appBuffer;
};

export const sendAppProtocol = async (
  data: Uint8Array,
  send: (buffer: ArrayBuffer) => Promise<void>,
): Promise<void> => {
  const chunkSize = appMax - appHeader;
  if (data.byteLength > chunkSize) {
    let order = 0;
    let sliceOffset = 0;
    const dataLength = data.byteLength;
    const id = getRandomInt(appMaxId);

    while (sliceOffset < dataLength) {
      const sliceData = data.slice(sliceOffset, sliceOffset + chunkSize);

      if (sliceOffset === 0) {
        const appBuffer = createAppProtocol(
          sliceData,
          id,
          appStatus.start,
          order,
        );
        await send(appBuffer);
      } else if (sliceOffset + sliceData.byteLength < dataLength) {
        const appBuffer = createAppProtocol(
          sliceData,
          id,
          appStatus.middle,
          order,
        );
        await send(appBuffer);
      } else {
        const appBuffer = createAppProtocol(
          sliceData,
          id,
          appStatus.end,
          order,
        );
        await send(appBuffer);
      }

      sliceOffset += sliceData.byteLength;
      order++;
    }
  } else {
    //
    const id = getRandomInt(appMaxId);
    const appBuffer = createAppProtocol(data, id, appStatus.once, 0);
    await send(appBuffer);
  }
};

export const createAppProtocolFromJson = (
  jsonString: string,
  status: number,
): Uint8Array => {
  // 文字列をUTF-8エンコードされたUint8Arrayに変換
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(jsonString);
  const id = getRandomInt(appMaxId);
  const data = createAppProtocol(uint8Array, id, status, 0);
  return data;
};

export const decodeParseData = <T>(parseData: Uint8Array): T => {
  // UTF-8エンコードされたUint8Arrayを文字列にデコード
  const decoder = new TextDecoder("utf-8");
  const jsonString = decoder.decode(parseData);
  const data: T = JSON.parse(jsonString);
  return data;
};

export const appendBuffer = (buffer1: Uint8Array, buffer2: Uint8Array) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp;
};
