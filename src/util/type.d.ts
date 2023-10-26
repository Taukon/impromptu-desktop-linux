import { FileMsgType } from "./index";
import { WriteStream } from "fs";

export type CLIOption = {
  virtual?: {
    width?: number;
    height?: number;
    keyboard?: string;
    im: boolean;
    audio: boolean;
    app?: string;
  };
  host?: {
    audio: boolean;
  };
  filePath?: string;
  password: string;
  proxyId?: string;
  proxyPassword?: string;
};

export type CLICheck = {
  virtual?: {
    displayNum: number;
    width: number;
    height: number;
    keyboard: string;
    im: boolean;
    audio: boolean;
    app?: string;
  };
  host?: {
    sourceId: string;
    audio: boolean;
  };
  filePath?: string;
  password?: string;
  proxyId?: string;
  proxyPassword?: string;
};

export type DisplayInfo = { name: string; id: string };

export type KeyJson = {
  key: { name?: string; charCode?: number; keyCode: number; down: boolean };
};
export type ButtonJson = { button: { buttonMask: number; down: boolean } };
export type MotionJson = {
  move: { x: number; y: number; cw: number; ch: number };
};

export type ControlData = {
  move?: {
    x: number | undefined;
    y: number | undefined;
    cw: number | undefined;
    ch: number | undefined;
  };
  button?: {
    buttonMask: number | undefined;
    down: boolean | undefined;
  };
  key?: { name?: string; charCode?: number; keyCode: number; down: boolean };
};

/**
 * SRTP parameters by mediasoup
 */
type SrtpParameters = {
  /**
   * Encryption and authentication transforms to be used.
   */
  cryptoSuite: SrtpCryptoSuite;
  /**
   * SRTP keying material (master key and salt) in Base64.
   */
  keyBase64: string;
};
/**
 * SRTP crypto suite.
 */
type SrtpCryptoSuite =
  | "AEAD_AES_256_GCM"
  | "AEAD_AES_128_GCM"
  | "AES_CM_128_HMAC_SHA1_80"
  | "AES_CM_128_HMAC_SHA1_32";
//# sourceMappingURL=SrtpParameters.d.ts.map

export type FileWatchMsg = {
  msgType: FileMsgType;
  msgItems: string[];
};

export type WriteFileInfo = {
  stream: WriteStream;
  size: number;
  receivedSize: number;
};

export type ReadFileInfo = {
  totalBytesRead: number;
  order: number;
};
