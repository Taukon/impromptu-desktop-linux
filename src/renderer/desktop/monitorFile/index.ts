import { FileWatchList, FileWatchMsg } from "./type";

export enum FileMsgType {
  list = `list`,
  add = `add`,
  unlink = `unlink`,
  writing = `writing`,
  saved = `saved`,
}

export const updateFiles = (
  fileList: FileWatchList,
  fileWatchMsg: FileWatchMsg,
) => {
  // console.log(fileWatchMsg);
  switch (fileWatchMsg.msgType) {
    case FileMsgType.list:
      while (fileList.firstChild) {
        fileList.removeChild(fileList.firstChild);
      }
      addFiles(fileList, fileWatchMsg.msgItems);
      break;
    case FileMsgType.add:
      addFiles(fileList, fileWatchMsg.msgItems);
      break;
    case FileMsgType.unlink:
      unlinkFiles(fileList, fileWatchMsg.msgItems);
      break;
    case FileMsgType.writing:
      unlinkFiles(fileList, fileWatchMsg.msgItems);
      writingFiles(fileList, fileWatchMsg.msgItems);
      break;
    case FileMsgType.saved:
      unlinkFiles(fileList, fileWatchMsg.msgItems);
      addFiles(fileList, fileWatchMsg.msgItems);
      break;
    default:
      break;
  }
};

const addFiles = (fileList: FileWatchList, msgItems: string[]) => {
  for (const item of msgItems) {
    const button = document.createElement("button");
    button.textContent = button.id = button.name = item;
    button.className = "join-item btn";

    fileList.appendChild(button);
  }
};

const writingFiles = (fileList: FileWatchList, msgItems: string[]) => {
  for (const item of msgItems) {
    const button = document.createElement("button");
    button.textContent = button.id = button.name = item;
    button.className = "join-item btn";
    button.disabled = true;

    fileList.appendChild(button);
  }
};

const unlinkFiles = (fileList: FileWatchList, msgItems: string[]) => {
  for (const item of msgItems) {
    const fileNodes = fileList.childNodes as NodeListOf<HTMLButtonElement>;
    fileNodes.forEach((value) => {
      if (value.id === item) {
        fileList.removeChild(value);
      }
    });
  }
};
