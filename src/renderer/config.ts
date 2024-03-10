class Config {
  private signalingServerAddress = `https://localhost:3000`;
  private socketOption = {
    secure: true,
    rejectUnauthorized: false,
    autoConnect: false, // necessary
  };

  public getServerAddress() {
    // console.log(`get: ${this.signalingServerAddress}`);
    return this.signalingServerAddress;
  }

  public setServerAddress(link: string) {
    // console.log(`set: ${this.signalingServerAddress}`);
    this.signalingServerAddress = link;
  }

  public getSocketOption() {
    return this.socketOption;
  }
}

export const config = new Config();
