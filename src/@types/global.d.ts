import { shareApp } from "../preload/shareApp";
import { shareFile } from "../preload/shareFile";
import { util } from "../preload/util";

declare global {
  interface Window {
    shareApp: typeof shareApp;
    shareFile: typeof shareFile;
    util: typeof util;
  }
}
