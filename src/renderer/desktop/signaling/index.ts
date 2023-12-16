import { Socket } from "socket.io-client";
import crypto from "crypto-js";
import { AppSDP, AuthInfo, FileSDP, ReqAuthProxyInfo } from "./type";

export const reqAutoProxy = (
  socket: Socket,
  proxyId: string,
  proxyPassword: string,
  desktopId: string,
  desktopPassword: string,
) => {
  const proxyInfo: ReqAuthProxyInfo = {
    proxyId: proxyId,
    proxyPassword: crypto.SHA256(proxyPassword).toString(),
    desktopId: desktopId,
    desktopPassword: desktopPassword,
  };
  socket.emit("reqAutoProxy", proxyInfo);
};

export const listenAuth = (
  socket: Socket,
  desktopId: string,
  password: string,
) => {
  socket.on("reqAuth", (info: AuthInfo) => {
    const hashedPassword = crypto.SHA256(password).toString();
    if (desktopId === info.desktopId && hashedPassword === info.password) {
      socket.emit("resAuth", { browserId: info.browserId, status: true });
    } else {
      socket.emit("resAuth", { browserId: info.browserId, status: false });
    }
  });
};

// ---------------- App

// B -offer-> D
export const listenAppOfferSDP = (
  socket: Socket,
  listener: (browserId: string, appSdp: AppSDP) => Promise<void>,
) => {
  socket.on("shareApp-offerSDP", async (browserId: string, appSdp: AppSDP) => {
    await listener(browserId, appSdp);
  });
};

// B <-answer- D
export const sendAppAnswerSDP = (
  socket: Socket,
  browserId: string,
  appSdp: AppSDP,
) => {
  socket.emit(`shareApp-answerSDP`, browserId, appSdp);
};

// ---------------- File

// B -offer-> D
export const listenFileOfferSDP = (
  socket: Socket,
  listener: (browserId: string, fileSdp: FileSDP) => Promise<void>,
) => {
  socket.on(
    "shareFile-offerSDP",
    async (browserId: string, fileSdp: FileSDP) => {
      await listener(browserId, fileSdp);
    },
  );
};

// B <-answer- D
export const sendFileAnswerSDP = (
  socket: Socket,
  browserId: string,
  fileSdp: FileSDP,
) => {
  socket.emit(`shareFile-answerSDP`, browserId, fileSdp);
};
