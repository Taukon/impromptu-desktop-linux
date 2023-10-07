import { existsSync } from "fs";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

// sudo apt install scim-mozc

type ScimEnv = {
  DISPLAY: string | undefined;
  GTK_IM_MODULE: string | undefined;
  QT_IM_MODULE: string | undefined;
  XMODIFIERS: string | undefined;
};

export class Scim {
  private oldEnv: ScimEnv;
  private silent: boolean =
    process.env.NODE_ENV === "development" ? false : true;
  private process: ChildProcessWithoutNullStreams | undefined;

  constructor(displayNum: number, onSet?: boolean) {
    this.oldEnv = {
      DISPLAY: process.env.DISPLAY,
      GTK_IM_MODULE: process.env.GTK_IM_MODULE,
      QT_IM_MODULE: process.env.QT_IM_MODULE,
      XMODIFIERS: process.env.XMODIFIERS,
    };
    if (existsSync(`/tmp/.X${displayNum}-lock`)) {
      // TODO
      if (existsSync(`/usr/bin/scim`)) {
        process.env.DISPLAY = `:${displayNum}`;
        if (onSet) this.setEnv();
        this.process = spawn("scim");
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
    process.env.GTK_IM_MODULE = `scim`;
    process.env.QT_IM_MODULE = `scim`;
    process.env.XMODIFIERS = `@im=SCIM`;
  }

  public restoreEnv() {
    process.env.GTK_IM_MODULE = this.oldEnv.GTK_IM_MODULE;
    process.env.QT_IM_MODULE = this.oldEnv.QT_IM_MODULE;
    process.env.XMODIFIERS = this.oldEnv.XMODIFIERS;
  }
}
