import { ControlData } from "../../../util/type";
import { decodeParseData, parseAppProtocol } from "../../../protocol/renderer";
import { appStatus } from "../../../protocol/common";

// ----- Control

export const setControl = (
  datachannel: RTCDataChannel,
  control: (data: ControlData) => Promise<void>,
): void => {
  datachannel.onmessage = async (event) => {
    const parse = parseAppProtocol(new Uint8Array(event.data as ArrayBuffer));

    if (parse.status === appStatus.control) {
      const data: ControlData = decodeParseData(parse.data);
      await control(data);
      // window.shareApp.controlWID(displayName, this.windowId, data);
    }
  };
};

// ----- Screen
// export const loopGetHostScreen = (
//   canvas: HTMLCanvasElement,
//   video: HTMLVideoElement,
//   interval: number,
//   sendImg: (buffer: ArrayBuffer) => Promise<void>,
// ): NodeJS.Timeout | undefined => {
//   // let preJpegBuffer = Buffer.alloc(0);
//   let preBase64Jpeg: string;

//   return setInterval(async () => {
//     try {
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       canvas.getContext("2d")?.drawImage(video, 0, 0);

//       const base64Jpeg = canvas
//         // .toDataURL("image/jpeg")
//         .toDataURL("image/jpeg", 0.7)
//         .replace(/^data:\w+\/\w+;base64,/, "");
//       // const jpegBuffer = Buffer.from(base64Jpeg, "base64");

//       // if (Buffer.compare(jpegBuffer, preJpegBuffer) != 0) {
//       if (base64Jpeg != preBase64Jpeg) {
//         const jpegBuffer = new Uint8Array(
//           atob(base64Jpeg)
//             .split("")
//             .map((char) => char.charCodeAt(0)),
//         );
//         await sendAppProtocol(jpegBuffer, sendImg);
//         // preJpegBuffer = jpegBuffer;
//         preBase64Jpeg = base64Jpeg;
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   }, interval);
// };

// export const loopGetVirtualScreen = (
//   image: HTMLImageElement,
//   displayName: string,
//   interval: number,
//   onDisplayScreen: boolean,
//   sendImg: (buffer: ArrayBuffer) => Promise<void>,
//   screenShot: (displayName: string) => Promise<Buffer | undefined>,
// ): NodeJS.Timeout | undefined => {
//   let preImg = Buffer.alloc(0);

//   return setInterval(async () => {
//     try {
//       const img = await screenShot(displayName);
//       if (img) {
//         if (Buffer.compare(img, preImg) != 0) {
//           if (onDisplayScreen) {
//             displayScreen(image, img);
//           }
//           await sendAppProtocol(img, sendImg);
//           preImg = Buffer.from(img.buffer);
//         }
//       }
//     } catch (err) {
//       console.log(err);
//     }
//   }, interval);
// };

// ----- Audio
