import { contextBridge } from "electron";
import { util } from "./util";
import { shareFile } from "./shareFile";
import { shareApp } from "./shareApp";

contextBridge.exposeInMainWorld("shareApp", shareApp);
contextBridge.exposeInMainWorld("shareFile", shareFile);
contextBridge.exposeInMainWorld("util", util);
