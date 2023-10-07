export type BrowserConnection = {
  screenChannelConnection?: RTCPeerConnection;
  screenTrackConnection?: RTCPeerConnection;
  controlConnection?: RTCPeerConnection;
  createTime: string;
};

export type BrowserList = {
  [browserId: string]: BrowserConnection;
};
