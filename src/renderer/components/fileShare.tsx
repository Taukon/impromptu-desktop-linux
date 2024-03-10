import { useEffect, useRef } from "react";
import { impromptu } from "..";

export const FileShare: React.FC = () => {
  const dirPathRef = useRef<HTMLInputElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (dirPathRef.current) {
        const dirPath = dirPathRef.current;
        window.util.getBasePath().then((path) => {
          dirPath.value = `${path}`;
        });
      }
    })();
  }, []);

  return (
    <>
      <div>
        <div>
          <input
            className="input input-sm input-bordered input-primary w-full max-w-md text-base"
            ref={dirPathRef}
          />
          <button
            className="btn btn-sm btn-outline text-base btn-primary"
            ref={(c) => {
              if (c) {
                c.onclick = async () => {
                  const dirPath = dirPathRef.current;
                  const fileList = fileListRef.current;
                  if (fileList && dirPath && dirPath.value != "") {
                    fileList.className = "join-vertical";
                    const result = await impromptu.startFileShare(
                      dirPath.value,
                      fileList,
                    );
                    if (result) {
                      c.disabled = true;
                    }
                  }
                };
              }
            }}
          >
            fileShare
          </button>
        </div>
        <div ref={fileListRef}></div>
      </div>
    </>
  );
};
