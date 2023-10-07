import { existsSync } from "fs";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";

type Display = {
  width: number;
  height: number;
  depth: number;
};

export class Xvfb {
  public displayName: string;
  public displayNum: number;
  private display: Display = {
    width: 1200,
    height: 720,
    depth: 24,
  };

  private xvfb_args: string[];
  private process: ChildProcessWithoutNullStreams | undefined;
  private silent: boolean =
    process.env.NODE_ENV === "development" ? false : true;
  private oldDisplay: string | undefined;
  private timeout: number = 1000;

  constructor(displayNum: number, display: Display) {
    this.displayNum = displayNum;
    this.displayName = `:${displayNum}`;
    this.display = display;
    this.xvfb_args = [
      "-screen",
      "0",
      `${this.display.width}x${this.display.height}x${this.display.depth}`,
    ];
  }

  public start(): boolean {
    if (!this.process) {
      this.setDisplayEnv();
      try {
        if (this.checkLockFile()) {
          throw new Error(
            "Display " +
              this.display +
              ' is already in use and the "reuse" option is false.',
          );
        } else {
          this.spawnProcess();

          let totalTime = 0;
          while (!this.checkLockFile()) {
            if (totalTime > this.timeout) {
              throw new Error("Could not start Xvfb.");
            }
            this.usleep(10000);
            totalTime += 10;
          }
          return true;
        }
      } catch (error) {
        console.log(error);
        return false;
      }
    }
    return false;
  }

  public isRun(): boolean {
    return this.process ? true : false;
  }

  public stop(): boolean {
    this.killProcess();
    this.restoreDisplayEnv();

    let totalTime = 0;
    try {
      while (this.checkLockFile()) {
        if (totalTime > this.timeout) {
          throw new Error("Could not stop Xvfb.");
        }
        this.usleep(10000);
        totalTime += 10;
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  private spawnProcess() {
    this.process = spawn("Xvfb", [this.displayName].concat(this.xvfb_args));

    this.process.stderr.on("data", (data) => {
      if (!this.silent) {
        process.stderr.write(data);
      }
    });
    this.process.on("exit", (code) => {
      if (!this.silent) {
        console.log("Xvfb CODE", code);
      }
      this.stop();
    });
    this.process.on("error", (code) => {
      if (!this.silent) {
        console.log("Xvfb CODE", code);
      }
      this.stop();
    });
  }

  private setDisplayEnv() {
    this.oldDisplay = process.env.DISPLAY;
    process.env.DISPLAY = this.displayName;
  }

  private restoreDisplayEnv() {
    process.env.DISPLAY = this.oldDisplay;
  }

  private killProcess() {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
  }

  private checkLockFile() {
    const lockFilePath = `/tmp/.X${this.displayNum}-lock`;
    return existsSync(lockFilePath);
  }

  private usleep(microsec: number) {
    const stop = Date.now() + microsec / 1000;
    while (Date.now() <= stop);
  }
}
