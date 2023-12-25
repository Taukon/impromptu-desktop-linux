import { startCLI } from "./command";
import { Impromptu } from "./desktop";
import { startGUI } from "./graphical";

export const impromptu = new Impromptu();

const start = async () => {
  const check = await window.util.checkInterface();
  if (check) {
    startCLI(check);
  } else {
    startGUI();
  }
};

start();
