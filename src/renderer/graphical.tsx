import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { FileShare } from "./components/fileShare";
import { HostScreen } from "./components/hostScreen";
import { VirtualScreen } from "./components/virtualScreen";
import { impromptu } from ".";
import "./index.css";

const RootDiv = () => {
  const proxyIdRef = useRef<HTMLInputElement>(null);
  const proxyPwdRef = useRef<HTMLInputElement>(null);
  const pwdRef = useRef<HTMLInputElement>(null);
  const [hostOnly, setHostOnly] = useState<boolean>(false);
  const [signalingInfo, setSignalingInfo] = useState<{
    pwd: string;
    proxy?: { id: string; pwd: string };
  }>();
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const once = useRef(true);
  useEffect(() => {
    if (signalingInfo?.pwd) {
      if (!once.current) return;
      once.current = false;

      // console.log(signalingInfo);
      impromptu.listenDesktopId(
        () => {
          setIsConnected(true);
        },
        signalingInfo.pwd,
        hostOnly,
        signalingInfo.proxy,
      );
    }
  }, [signalingInfo]);

  return (
    <>
      <div className="menu text-xl font-medium w-full" id="signalingInfo">
        <p>
          ProxyID:{" "}
          <input
            className="input input-bordered input-success input-sm w-full max-w-xs text-xl"
            ref={proxyIdRef}
          />
        </p>
        <p>
          Proxy Password:{" "}
          <input
            className="input input-bordered input-success input-sm w-full max-w-xs text-xl"
            ref={proxyPwdRef}
          />
        </p>
        <p>
          Password:{" "}
          <input
            className="input input-bordered input-success input-sm w-full max-w-xs text-xl"
            ref={pwdRef}
            defaultValue={"impromptu"}
          />
        </p>
        <p>
          use Only LAN:{" "}
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={hostOnly}
            onChange={() => setHostOnly(!hostOnly)}
          />
        </p>
      </div>
      <button
        className="btn btn-outline text-base btn-primary"
        ref={(c) => {
          if (c) {
            c.onclick = () => {
              if (pwdRef.current?.value) {
                c.disabled = true;
                setSignalingInfo({
                  pwd: pwdRef.current.value,
                  proxy:
                    proxyIdRef.current?.value && proxyPwdRef.current?.value
                      ? {
                          id: proxyIdRef.current.value,
                          pwd: proxyPwdRef.current.value,
                        }
                      : undefined,
                });
              }
            };
          }
        }}
      >
        connect
      </button>
      <div>{isConnected && <DesktopOption />}</div>
    </>
  );
};

const DesktopOption = () => {
  const [isHost, setIsHost] = useState<boolean>(true);
  const [lock, setLock] = useState<boolean>(false);

  return (
    <div className="text-base">
      <p>
        Desktop ID: {impromptu.desktopId}{" "}
        <button
          className="btn btn-xs btn-outline btn-info"
          onClick={() => {
            if (impromptu.desktopId) {
              navigator.clipboard.writeText(impromptu.desktopId);
            }
          }}
        >
          copy
        </button>
      </p>
      <div className="divider divider-primary"></div>
      <FileShare />
      <div className="divider divider-info"></div>
      <p>
        <button
          className="btn btn-sm btn-outline btn-info"
          disabled={lock}
          onClick={() => setIsHost(!isHost)}
        >
          Screen Mode
        </button>
      </p>
      {isHost ? (
        <HostScreen setLock={setLock} />
      ) : (
        <VirtualScreen setLock={setLock} />
      )}
    </div>
  );
};

export const startGUI = () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  createRoot(document.getElementById("root")!).render(<RootDiv />);
};
