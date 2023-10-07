// App Protocol
//   header: 9B
// ---------------
// | 4B: id
// ---------------
// | 1B: status
// ---------------
// | 4B: order
// ---------------

import { appHeader, appMax, appMaxId, appStatus, getRandomInt } from "./common";

// type AppHeader = {
//   id: number;
//   status: number;
//   order: number;
//   data: Buffer;
// };

// // appBuffer.byteLength <= max
// export const parseAppProtocol = (appBuffer: Buffer): AppHeader => {
//   // id: 4B
//   const id = appBuffer.readUintBE(0, 4);

//   // status: 1B
//   const status = appBuffer.readUintBE(4, 1);

//   // order: 4B
//   const order = appBuffer.readUintBE(5, 4);

//   const data = appBuffer.subarray(appHeader);

//   return { id, status, order, data };
// };

// data.byteLength <= max - header
const createAppProtocol = (
  data: Buffer,
  id: number,
  status: number,
  order: number,
): Uint8Array => {
  // header
  const dataHeader = Buffer.alloc(appHeader);

  // id: 4B
  dataHeader.writeUIntBE(id, 0, 4);

  // status: 1B
  dataHeader.writeUIntBE(status & 0xff, 4, 1);

  // order: 4B
  dataHeader.writeUIntBE(order & 0xffffffff, 5, 4);

  const appBuffer = appendBuffer(dataHeader, data);
  return appBuffer;
};

export const sendAppProtocol = async (
  data: Buffer,
  send: (buffer: ArrayBuffer) => Promise<void>,
): Promise<void> => {
  const chunkSize = appMax - appHeader;
  if (data.byteLength > chunkSize) {
    let order = 0;
    let sliceOffset = 0;
    const dataLength = data.byteLength;
    const id = getRandomInt(appMaxId);

    while (sliceOffset < dataLength) {
      const sliceData = data.subarray(sliceOffset, sliceOffset + chunkSize);

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
    const id = getRandomInt(appMaxId);
    const appBuffer = createAppProtocol(data, id, appStatus.once, 0);
    await send(appBuffer);
  }
};

const appendBuffer = (buffer1: Buffer, buffer2: Buffer) => {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp;
};
