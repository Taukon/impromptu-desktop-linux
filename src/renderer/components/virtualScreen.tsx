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
        <div className="menu text-base font-medium w-full">
            <p>Virtual Display</p>
            <p>audio enable: <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={audio} onChange={() => setAudio(!audio)} /></p>
            <p>Input Method enable: <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={im} onChange={() => setIM(!im)} /></p>
            <p>Full Screen enable: <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={fullScreen} onChange={() => setFullScreen(!fullScreen)} /></p>
            <p>keyboard layout: <input className="input input-sm input-bordered input-primary w-24 max-w-xs text-base" ref={layoutRef} defaultValue={"jp"} /></p>
            <p>width: <input className="input input-sm input-bordered input-primary w-24 max-w-sm text-base" ref={widthRef} type="number" min={1} defaultValue={1200} /></p>
            <p>height: <input className="input input-sm input-bordered input-primary w-24 max-w-sm text-base" ref={heightRef} type="number" min={1} defaultValue={720} /></p>
            <p>
                <button className="btn btn-sm btn-outline text-base btn-accent" ref={
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
                <button className="btn btn-sm btn-outline text-base btn-warning" ref={
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
                <input className="input input-sm input-bordered input-primary w-full max-w-md text-xl"  ref={appRef} defaultValue={"xterm"} />
                <button className="btn btn-sm btn-outline text-base btn-primary" ref={
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
        </div>
    )
};