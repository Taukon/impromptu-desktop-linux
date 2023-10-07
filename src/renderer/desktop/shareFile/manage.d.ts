export type BrowserConnection = {
  fileWatchConnection?: RTCPeerConnection;
  fileWatchChannel?: RTCDataChannel;
  createTime: string;
};

export type BrowserList = {
  [browserId: string]: BrowserConnection;
};

export type TransferList = {
  [id: string]: RTCPeerConnection;
};
