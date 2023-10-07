import { existsSync } from "fs";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

// sudo apt install uim uim-mozc uim-xim

type UimEnv = {
  DISPLAY: string | undefined;
  GTK_IM_MODULE: string | undefined;
  QT_IM_MODULE: string | undefined;
  XMODIFIERS: string | undefined;
  UIM_CANDWIN_PROG: string | undefined;
};

export class Uim {
  private oldEnv: UimEnv;
  private silent: boolean =
    process.env.NODE_ENV === "development" ? false : true;
  private process: ChildProcessWithoutNullStreams | undefined;

  constructor(displayNum: number, onSet?: boolean) {
    this.oldEnv = {
      DISPLAY: process.env.DISPLAY,
      GTK_IM_MODULE: process.env.GTK_IM_MODULE,
      QT_IM_MODULE: process.env.QT_IM_MODULE,
      XMODIFIERS: process.env.XMODIFIERS,
      UIM_CANDWIN_PROG: process.env.UIM_CANDWIN_PROG,
    };
    if (existsSync(`/tmp/.X${displayNum}-lock`)) {
      if (existsSync(`/usr/bin/uim-xim`)) {
        process.env.DISPLAY = `:${displayNum}`;
        if (onSet) this.setEnv();
        this.process = spawn("uim-xim");
        process.env.DISPLAY = this.oldEnv.DISPLAY;

        this.process.on("exit", (code) => {
          if (!this.silent) {
            console.log("CODE", code);
          }
          this.restoreEnv();
        });
        this.process.on("error", (code) => {
          if (!this.silent) {
            console.log("CODE", code);
          }
          this.restoreEnv();
          this.process?.kill();
        });
      }
    }
  }

  public isRun(): boolean {
    return this.process ? true : false;
  }

  private setEnv() {
    process.env.GTK_IM_MODULE = `uim`;
    process.env.QT_IM_MODULE = `uim`;
    process.env.XMODIFIERS = `@im=uim`;
    process.env.UIM_CANDWIN_PROG = `uim-candwin-gtk`;
  }

  public restoreEnv() {
    process.env.GTK_IM_MODULE = this.oldEnv.GTK_IM_MODULE;
    process.env.QT_IM_MODULE = this.oldEnv.QT_IM_MODULE;
    process.env.XMODIFIERS = this.oldEnv.XMODIFIERS;
    process.env.UIM_CANDWIN_PROG = this.oldEnv.UIM_CANDWIN_PROG;
  }
}
