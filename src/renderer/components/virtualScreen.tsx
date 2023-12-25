import { useRef, useState } from "react";
import { impromptu } from "..";

export const VirtualScreen: React.FC<{setLock: React.Dispatch<React.SetStateAction<boolean>>}> = ({setLock}) => {
    const [audio, setAudio] = useState<boolean>(false);
    const [im, setIM] = useState<boolean>(false);
    const [fullScreen, setFullScreen] = useState<boolean>(false);
    const layoutRef = useRef<HTMLInputElement>(null);
    const widthRef = useRef<HTMLInputElement>(null);
    const heightRef = useRef<HTMLInputElement>(null);

    const appRef = useRef<HTMLInputElement>(null);
    const screenRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <p>Virtual Display</p>
            <p>audio enable: <input type="checkbox" checked={audio} onChange={() => setAudio(!audio)} /></p>
            <p>Input Method enable: <input type="checkbox" checked={im} onChange={() => setIM(!im)} /></p>
            <p>Full Screen enable: <input type="checkbox" checked={fullScreen} onChange={() => setFullScreen(!fullScreen)} /></p>
            <p>keyboard layout: <input ref={layoutRef} defaultValue={"jp"} /></p>
            <p>width: <input ref={widthRef} type="number" min={1} defaultValue={1200} /></p>
            <p>height: <input ref={heightRef} type="number" min={1} defaultValue={720} /></p>
            <p>
                <button ref={
                    c => {
                        if(c){
                            c.onclick = async () => {
                                const parent = screenRef.current;
                                const layout = layoutRef.current?.value;
                                const width = widthRef.current?.value;
                                const height = heightRef.current?.value;
                                if(
                                    parent && 
                                    layout && 
                                    width && 
                                    height
                                ){
                                    c.disabled = true;
                                    for (let displayNum = 1; ; displayNum++) {
                                        const result = await impromptu.startVirtualDisplay(
                                            displayNum,
                                            layout,
                                            im,
                                            fullScreen,
                                            parseInt(width),
                                            parseInt(height),
                                            audio,
                                            parent
                                        );
                                        if(result){
                                            return setLock(true);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }>Xvfb run</button>
            </p>
            <p>
                <button ref={
                    c => {
                        if(c){
                            c.onclick = () => {
                                impromptu.stopVirtualDisplay();
                            }
                        }
                    }
                }>Kill Xvfb</button>
            </p>
            <p>
                <input  ref={appRef} defaultValue={"xterm"} />
                <button ref={
                    c => {
                        if(c){
                            c.onclick = async () => {
                                const command = appRef.current?.value;
                                if(command && command != ""){
                                    await impromptu.startVirtualApp(command);
                                }
                            }
                        }
                    }
                }>app run</button>
            </p>
            <div ref={screenRef}></div>
        </>
    )
};