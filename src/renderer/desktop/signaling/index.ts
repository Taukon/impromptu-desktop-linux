import { Socket } from "socket.io-client";
import { AppSDP, AuthInfo, FileSDP, ReqAuthProxyInfo } from "./type";

export const reqAutoProxy = (
  socket: Socket,
  proxyId: string,
  proxyPassword: string,
  desktopId: string,
  desktopPassword: string,
) => {
  const proxyInfo: ReqAuthProxyInfo = {
    proxyId,
    proxyPassword,
    desktopId,
    desktopPassword,
  };
  socket.emit("reqAutoProxy", proxyInfo);
};

export const listenAuth = (
  socket: Socket,
  desktopId: string,
  password: string,
) => {
  socket.on("reqAuth", (info: AuthInfo) => {
    if (desktopId === info.desktopId && password === info.password) {
      socket.emit("resAuth", { browserId: info.browserId, status: true });
    } else {
      socket.emit("resAuth", { browserId: info.browserId, status: false });
    }
  });
};

// ---------------- App

// B <-offer- D
export const sendAppOfferSDP = (
  socket: Socket,
  browserId: string,
  appSdp: AppSDP,
) => {
  socket.emit(`shareApp-offerSDP`, browserId, appSdp);
};

// B -answer-> D
export const listenAppAnswerSDP = (
  socket: Socket,
  listener: (browserId: string, appSdp: AppSDP) => Promise<void>,
) => {
  socket.on("shareApp-answerSDP", async (browserId: string, appSdp: AppSDP) => {
    await listener(browserId, appSdp);
  });
};

// ----------------

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

// B <-offer- D
export const sendFileOfferSDP = (
  socket: Socket,
  browserId: string,
  fileSdp: FileSDP,
) => {
  socket.emit(`shareFile-offerSDP`, browserId, fileSdp);
};

// B -answer-> D
export const listenFileAnswerSDP = (
  socket: Socket,
  listener: (browserId: string, fileSdp: FileSDP) => Promise<void>,
) => {
  socket.on(
    "shareFile-answerSDP",
    async (browserId: string, fileSdp: FileSDP) => {
      await listener(browserId, fileSdp);
    },
  );
};

// ----------------

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
