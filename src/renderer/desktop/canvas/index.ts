import { KeyJson } from "../../../util/type";

export const displayScreen = (image: HTMLImageElement, img: Buffer): void => {
  const imgBase64 = btoa(
    new Uint8Array(img).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      "",
    ),
  );
  image.src = "data:image/jpeg;base64," + imgBase64;
};

export const controlEventListener = (
  canvas: HTMLCanvasElement,
  displayName: string,
): void => {
  canvas.addEventListener(
    "mousedown",
    (event) => {
      const button = { button: { buttonMask: 0x1, down: true } };
      if (event.button === 1) {
        // middle click
        button.button.buttonMask = 0x2;
      } else if (event.button === 2) {
        // left click
        button.button.buttonMask = 0x4;
      }
      window.shareApp.control(displayName, button);
      //console.log("mousedown: " + JSON.stringify(event));
    },
    false,
  );
  canvas.addEventListener(
    "mouseup",
    (event) => {
      const button = { button: { buttonMask: 0x1, down: false } };
      if (event.button === 1) {
        // middle click
        button.button.buttonMask = 0x2;
      } else if (event.button === 2) {
        // left click
        button.button.buttonMask = 0x4;
      }
      window.shareApp.control(displayName, button);
      //console.log("mouseup: " + JSON.stringify(event));
    },
    false,
  );
  canvas.addEventListener(
    "mousemove",
    (event) => {
      const mouseX = event.clientX - canvas.getBoundingClientRect().left;
      const mouseY = event.clientY - canvas.getBoundingClientRect().top;
      const motion = {
        move: {
          x: Math.round(mouseX),
          y: Math.round(mouseY),
          cw: canvas.width,
          ch: canvas.height,
        },
      };
      window.shareApp.control(displayName, motion);
      //console.log("mousemove : x=" + mouseX + ", y=" + mouseY);
    },
    false,
  );

  canvas.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
      const buttonDown = { button: { buttonMask: 0x4, down: true } };
      const buttonUp = { button: { buttonMask: 0x4, down: false } };
      window.shareApp.control(displayName, buttonDown);
      window.shareApp.control(displayName, buttonUp);
      //console.log(JSON.stringify(event));
    },
    false,
  );

  canvas.addEventListener(
    "keydown",
    (event) => {
      event.preventDefault();
      const keyJson = createKeyJson(event, true);
      if (keyJson) {
        window.shareApp.control(displayName, keyJson);
        if (
          event.key === "Hankaku" ||
          event.key === "Zenkaku" ||
          event.key === "Hiragana"
        ) {
          keyJson.key.down = false;
          window.shareApp.control(displayName, keyJson);
        }
      }
      // console.log("keycode down: " + event.key + ' shift:' + event.shiftKey + ' ctrl:' + event.ctrlKey + ' ' + event.keyCode + ' ' + String.fromCharCode(event.keyCode));
    },
    false,
  );
  canvas.addEventListener(
    "keyup",
    (event) => {
      event.preventDefault();
      const keyJson = createKeyJson(event, false);
      if (keyJson) {
        window.shareApp.control(displayName, keyJson);
      }
      // console.log("keycode up: " + event.key + ' shift:' + event.shiftKey + ' ctrl:' + event.ctrlKey + ' ' + event.keyCode + ' ' + String.fromCharCode(event.keyCode));
    },
    false,
  );

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (event.deltaY / 100 > 0) {
        const button = { button: { buttonMask: 0x10, down: true } };
        window.shareApp.control(displayName, button);
      } else {
        const button = { button: { buttonMask: 0x8, down: true } };
        window.shareApp.control(displayName, button);
      }
      //console.log("scroll: "+JSON.stringify(data.wheel));
    },
    false,
  );
};

export const controlEventListenerWID = (
  canvas: HTMLCanvasElement,
  displayName: string,
  windowId: number,
): void => {
  canvas.addEventListener(
    "mousedown",
    (event) => {
      const button = { button: { buttonMask: 0x1, down: true } };
      if (event.button === 1) {
        // middle click
        button.button.buttonMask = 0x2;
      } else if (event.button === 2) {
        // left click
        button.button.buttonMask = 0x4;
      }
      window.shareApp.controlWID(displayName, windowId, button);
      //console.log("mousedown: " + JSON.stringify(event));
    },
    false,
  );
  canvas.addEventListener(
    "mouseup",
    (event) => {
      const button = { button: { buttonMask: 0x1, down: false } };
      if (event.button === 1) {
        // middle click
        button.button.buttonMask = 0x2;
      } else if (event.button === 2) {
        // left click
        button.button.buttonMask = 0x4;
      }
      window.shareApp.controlWID(displayName, windowId, button);
      //console.log("mouseup: " + JSON.stringify(event));
    },
    false,
  );
  canvas.addEventListener(
    "mousemove",
    (event) => {
      const mouseX = event.clientX - canvas.getBoundingClientRect().left;
      const mouseY = event.clientY - canvas.getBoundingClientRect().top;
      const motion = {
        move: {
          x: Math.round(mouseX),
          y: Math.round(mouseY),
          cw: canvas.width,
          ch: canvas.height,
        },
      };
      window.shareApp.controlWID(displayName, windowId, motion);
      //console.log("mousemove : x=" + mouseX + ", y=" + mouseY);
    },
    false,
  );

  canvas.addEventListener(
    "contextmenu",
    (event) => {
      event.preventDefault();
      const buttonDown = { button: { buttonMask: 0x4, down: true } };
      const buttonUp = { button: { buttonMask: 0x4, down: false } };
      window.shareApp.controlWID(displayName, windowId, buttonDown);
      window.shareApp.controlWID(displayName, windowId, buttonUp);
      //console.log(JSON.stringify(event));
    },
    false,
  );

  canvas.addEventListener(
    "keydown",
    (event) => {
      event.preventDefault();
      const keyJson = createKeyJson(event, true);
      if (keyJson) {
        window.shareApp.controlWID(displayName, windowId, keyJson);
        if (
          event.key === "Hankaku" ||
          event.key === "Zenkaku" ||
          event.key === "Hiragana"
        ) {
          keyJson.key.down = false;
          window.shareApp.controlWID(displayName, windowId, keyJson);
        }
      }
      // console.log("keycode down: " + event.key + ' shift:' + event.shiftKey + ' ctrl:' + event.ctrlKey + ' ' + event.keyCode + ' ' + String.fromCharCode(event.keyCode));
    },
    false,
  );
  canvas.addEventListener(
    "keyup",
    (event) => {
      event.preventDefault();
      const keyJson = createKeyJson(event, true);
      if (keyJson) {
        window.shareApp.controlWID(displayName, windowId, keyJson);
      }
      // console.log("keycode up: " + event.key + ' shift:' + event.shiftKey + ' ctrl:' + event.ctrlKey + ' ' + event.keyCode + ' ' + String.fromCharCode(event.keyCode));
    },
    false,
  );

  canvas.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      if (event.deltaY / 100 > 0) {
        const button = { button: { buttonMask: 0x10, down: true } };
        window.shareApp.controlWID(displayName, windowId, button);
      } else {
        const button = { button: { buttonMask: 0x8, down: true } };
        window.shareApp.controlWID(displayName, windowId, button);
      }
      //console.log("scroll: "+JSON.stringify(data.wheel));
    },
    false,
  );
};

// TODO not use keyCode
const createKeyJson = (
  msg: KeyboardEvent,
  down: boolean,
): KeyJson | undefined => {
  if (msg.key.length == 1 && msg.key.match(/[a-z]/i)) {
    // return { key: { keyCode: msg.key.charCodeAt(0), down: down } };
    return {
      key: {
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
    //console.log("key: "+ msg.key.toUpperCase());
  } else if (msg.key.length == 1 && msg.key.match(/[0-9]/)) {
    //0~9
    const num = msg.key.match(/[0-9]/);
    const code = num ? (num[0] ? num[0].charCodeAt(0) : undefined) : undefined;
    //console.log("Num: " + JSON.stringify(msg.key));be-e0
    return code ? { key: { keyCode: code, down: down } } : undefined;
  } else if (msg.key.match(/^F[1-9]*/)) {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "Control") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Alt") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Shift") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Escape") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Enter") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Backspace") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Tab") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Home") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "End") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "PageUp") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "PageDown") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "ArrowRight") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "ArrowLeft") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "ArrowUp") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "ArrowDown") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Insert") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Delete") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == " ") {
    return {
      key: { name: msg.key, keyCode: msg.key.charCodeAt(0), down: down },
    };
  } else if (msg.key == "Alphanumeric") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Hankaku") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Zenkaku") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "NonConvert") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Convert") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "Hiragana") {
    return { key: { name: msg.key, keyCode: msg.keyCode, down: down } };
  } else if (msg.key == "[" || msg.keyCode == 219) {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: 219,
        down: down,
      },
    };
  } else if (msg.key == "]" || msg.keyCode == 221) {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: 221,
        down: down,
      },
    };
  } else if (msg.key == "," || msg.keyCode == 188) {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: 188,
        down: down,
      },
    };
  } else if (msg.key == "-") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: 189,
        down: down,
      },
    };
  } else if (msg.key == "." || msg.keyCode == 190) {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: 190,
        down: down,
      },
    };
  }
  //
  else if (msg.key == "/" || msg.keyCode == 191) {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: 191,
        down: down,
      },
    };
  } else if (msg.key == "\\" || msg.keyCode == 220) {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: 220,
        down: down,
      },
    };
  } else if (msg.key == "+") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "_") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "=") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == ":") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == '"') {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "`") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "~") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  }
  // --- Shift + 0~9
  else if (msg.key == "!") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "@") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "#") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "$") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "%") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "^") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "&") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "*") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == "(") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key == ")") {
    return {
      key: {
        name: msg.key,
        charCode: msg.key.charCodeAt(0),
        keyCode: msg.keyCode,
        down: down,
      },
    };
  } else if (msg.key.length == 1) {
    const charCode = msg.key.charCodeAt(0);
    return !Number.isNaN(charCode)
      ? {
          key: {
            name: msg.key,
            charCode: charCode,
            keyCode: msg.keyCode,
            down: down,
          },
        }
      : undefined;
  }

  //console.log(JSON.stringify(keydata));
  return undefined;
};
