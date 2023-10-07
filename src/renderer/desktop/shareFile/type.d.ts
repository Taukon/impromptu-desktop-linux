export type ReqWriteFile = {
  fileName: string;
  fileSize: number;
};

export type ReqReadFile = {
  fileName: string;
};

export type AcceptWriteFile = {
  fileName: string;
  fileSize: number;
};

export type AcceptReadFile = {
  fileName: string;
  fileSize: number;
};
