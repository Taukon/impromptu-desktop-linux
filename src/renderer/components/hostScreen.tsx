import { useRef, useState } from "react";
import { DisplayInfo } from "../../util/type";
import { impromptu } from "..";

export const HostScreen: React.FC<{setLock: React.Dispatch<React.SetStateAction<boolean>>}> = ({setLock}) => {
    const [source, setSource] = useState<{id: string, isDisplay: boolean}>();
    const [audio, setAudio] = useState<boolean>(false);
    const [control, setControl] = useState<boolean>(false);
    const [webCodecs, setWebCodecs] = useState<boolean>(true);

    const [screenInfo, setScreenInfo] = useState<DisplayInfo[]>([]);
    window.shareApp.getDisplayInfo(true).then(v => setScreenInfo(v));

    const [windowInfo, setWindowInfo] = useState<DisplayInfo[]>([]);
    window.shareApp.getDisplayInfo(false).then(v => setWindowInfo(v));

    const screenRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <p>Host Display</p>
            <p>audio enable: <input type="checkbox" checked={audio} onChange={() => setAudio(!audio)} /></p>
            <p>webCodecs enable: <input type="checkbox" checked={webCodecs} onChange={() => setWebCodecs(!webCodecs)} /></p>
            <p>control from this window: <input type="checkbox" checked={control} onChange={() => setControl(!control)} /></p>
            <p>
                {!source && screenInfo.map((v, i) => {
                    return (
                        <button 
                        key={i} 
                        ref={
                            c => {
                                if(c && !source){
                                    const parent = screenRef.current;
                                    c.onclick = async () => {
                                        if(parent && !source){
                                            c.disabled = true;
                                            const result = await impromptu.startHostDisplay(true, v.id, audio, control, webCodecs, true, parent);
                                            if(!result){
                                                c.disabled = false;
                                                return;
                                            }
                                            setSource({id: v.id, isDisplay: true});
                                            setLock(true);
                                        }
                                    };
                                }else if(c){
                                    c.disabled = true;
                                }
                            }
                        }>{`${v.name} | ${v.id}`}</button>
                        )
                    })
                }
                {!source && windowInfo.map((v, i) => {
                    return (
                        <button 
                        key={i} 
                        ref={
                            c => {
                                if(c && !source){
                                    const parent = screenRef.current;
                                    c.onclick = async () => {
                                        if(parent && !source){
                                            c.disabled = true;
                                            const result = await impromptu.startHostDisplay(true, v.id, audio, control, webCodecs, false, parent);
                                            if(!result){
                                                c.disabled = false;
                                                return;
                                            }
                                            setSource({id: v.id, isDisplay: false});
                                            setLock(true);
                                        }
                                    };
                                }else if(c){
                                    c.disabled = true;
                                }
                            }
                        }>{`${v.name} | ${v.id}`}</button>
                        )
                    })
                }
            </p>
            <div ref={screenRef}></div>
        </>
    )
};