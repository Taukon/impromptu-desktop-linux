import { ChildProcess, exec } from "child_process";
import { existsSync } from "fs";

export class AppProcess {
  private displayName: string;
  private oldDisplay: string | undefined;
  private process: ChildProcess | undefined;
  private silent: boolean =
    process.env.NODE_ENV === "development" ? false : true;
  private command: string;

  constructor(displayNum: number, command: string) {
    this.displayName = `:${displayNum}`;
    this.command = command;
    if (existsSync(`/tmp/.X${displayNum}-lock`) && !this.process) {
      this.setDisplayEnv();
      this.spawnProcess();
    }
  }

  public isRun(): boolean {
    return this.process ? true : false;
  }

  public stop() {
    this.killProcess();
    this.restoreDisplayEnv();
  }

  private spawnProcess() {
    this.process = exec(this.command);
    this.process.on("exit", () => {
      if (!this.silent) {
        console.log("App exit");
      }
      this.stop();
    });
    this.process.on("error", () => {
      if (!this.silent) {
        console.log("App error");
      }
      this.stop();
    });
  }

  private killProcess() {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
  }

  private setDisplayEnv() {
    this.oldDisplay = process.env.DISPLAY;
    process.env.DISPLAY = this.displayName;
  }

  private restoreDisplayEnv() {
    process.env.DISPLAY = this.oldDisplay;
  }
}
