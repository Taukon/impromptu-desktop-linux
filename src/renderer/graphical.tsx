import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileShare } from './components/fileShare';
import { HostScreen } from './components/hostScreen';
import { VirtualScreen } from './components/virtualScreen';
import { impromptu } from '.';

const RootDiv = () => {
    const proxyIdRef = useRef<HTMLInputElement>(null);
    const proxyPwdRef = useRef<HTMLInputElement>(null);
    const pwdRef = useRef<HTMLInputElement>(null);
    const [signalingInfo, setSignalingInfo] = useState<{pwd: string, proxy?: {id: string, pwd: string}}>();
    const [isConnected, setIsConnected] = useState<boolean>(false);

    const once = useRef(true);
    useEffect(() => {
        if(signalingInfo?.pwd){
            if (!once.current) return;
            once.current = false;

            console.log(signalingInfo);
            impromptu.listenDesktopId(() => {setIsConnected(true)}, signalingInfo.pwd, signalingInfo.proxy)
        }
    }, [signalingInfo]);

    return (
        <>
            <div id="signalingInfo">
                <p>ProxyID: <input ref={proxyIdRef} /></p>
                <p>Proxy Password: <input ref={proxyPwdRef} /></p>
                <p>Password: <input ref={pwdRef} defaultValue={"impromptu"} /></p>
                <button ref={ c => {
                    if(c){
                        c.onclick = () => {
                            if(pwdRef.current?.value){
                                c.disabled = true;
                                setSignalingInfo({
                                    pwd: pwdRef.current.value,
                                    proxy: proxyIdRef.current?.value && proxyPwdRef.current?.value ?
                                        {id: proxyIdRef.current.value, pwd: proxyPwdRef.current.value} :
                                        undefined
                                });
                            }
                        }
                    }
                }}>connect</button>
            </div>
            <div>
                {isConnected && <DesktopOption />}
            </div>
        </>
    )
};

const DesktopOption = () => {
    const [isHost, setIsHost] = useState<boolean>(true);
    const [lock, setLock] = useState<boolean>(false);

    return (
        <>
            <p>Desktop ID: {impromptu.desktopId}</p>
            <FileShare />
            <p>
                <button disabled={lock} onClick={() => setIsHost(!isHost)}>Screen Mode</button>
            </p>
            {isHost ? <HostScreen setLock={setLock} /> : <VirtualScreen setLock={setLock} />}
        </>
    )
}


export const startGUI = () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    createRoot(document.getElementById("root")!).render(<RootDiv />);
};
