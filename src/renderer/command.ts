import { CLICheck } from "../util/type";
import { impromptu } from ".";

export const startCLI = async (check: CLICheck) => {
  const initDesktop = () => {
    window.util.sendMessage(`desktopId: ${impromptu.desktopId}`);

    if (check.host) {
      impromptu.startHostDisplay(
        false,
        check.host.sourceId,
        check.host.audio,
        false,
        true,
      );
    } else if (check.virtual) {
      impromptu
        .startCLIVirtualDisplay(
          check.virtual.displayNum,
          check.virtual.audio,
          check.virtual.keyboard,
          check.virtual.im,
        )
        .then((v) => {
          if (v && check.virtual?.app) {
            impromptu.startVirtualApp(check.virtual.app);
          }
        });
    }

    if (check.filePath) {
      impromptu.startFileShare(check.filePath);
    }
  };

  if (check.password) {
    const proxy =
      check.proxyId && check.proxyPassword
        ? { id: check.proxyId, pwd: check.proxyPassword }
        : undefined;
    const hostOnly = check.hostOnly ?? false;
    impromptu.listenDesktopId(initDesktop, check.password, hostOnly, proxy);
  }
};
