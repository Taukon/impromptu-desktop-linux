export type Signaling<T, U> = (params: T) => Promise<U>;

export type AuthInfo = {
  desktopId: string;
  password: string;
  browserId: string;
};

export type AppSDP = {
  type: string;
  sdp: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appData?: any;
};

export type FileSDP = {
  type: string;
  sdp: string;
  transferId?: string;
};
