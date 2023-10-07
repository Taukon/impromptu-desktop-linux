export const timer = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

// export const usleep = (microsec: number) => {
//   const stop = Date.now() + microsec / 1000;
//   while (Date.now() <= stop);
// };

export enum FileMsgType {
  list = `list`,
  add = `add`,
  unlink = `unlink`,
  writing = `writing`,
  saved = `saved`,
}
