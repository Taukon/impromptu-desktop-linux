import { KeyJson } from "../../../../util/type";

export const keySymToX11Key = (keyJson: KeyJson): number | undefined => {
  const name = keyJson.key.name;

  // F1~
  if (name?.match(/^F[1-9]*/)) {
    const x11key = Object.entries(x11KeyList).find((v) => v[0] === name);
    return x11key ? x11key[1] : undefined;
  }
  // 1~9
  else if (keyJson.key.keyCode >= 0x30 && keyJson.key.keyCode <= 0x39) {
    return keyJson.key.keyCode;
  } else if (name == "Control") {
    return x11KeyList.Control_L;
  } else if (name == "Alt") {
    return x11KeyList.Alt_L;
  } else if (name == "Shift") {
    return x11KeyList.Shift_L;
  } else if (name == "Escape") {
    return x11KeyList.Escape;
  } else if (name == "Enter") {
    return x11KeyList.Return;
  } else if (name == "Backspace") {
    return x11KeyList.BackSpace;
  } else if (name == "Tab") {
    return x11KeyList.Tab;
  } else if (name == "Home") {
    return x11KeyList.Home;
  } else if (name == "End") {
    return x11KeyList.End;
  } else if (name == "PageUp") {
    return x11KeyList.Page_Up;
  } else if (name == "PageDown") {
    return x11KeyList.Page_Down;
  } else if (name == "ArrowRight") {
    return x11KeyList.Right;
  } else if (name == "ArrowLeft") {
    return x11KeyList.Left;
  } else if (name == "ArrowUp") {
    return x11KeyList.Up;
  } else if (name == "ArrowDown") {
    return x11KeyList.Down;
  } else if (name == "Insert") {
    return x11KeyList.Insert;
  } else if (name == "Delete") {
    return x11KeyList.Delete;
  } else if (name == "Alphanumeric") {
    return x11KeyList.Caps_Lock;
  } else if (name == "Hankaku") {
    return x11KeyList.Hankaku;
  } else if (name == "Zenkaku") {
    return x11KeyList.Zenkaku;
  } else if (name == "NonConvert") {
    return x11KeyList.Muhenkan;
  } else if (name == "Convert") {
    return x11KeyList.Henkan;
  } else if (name == "Hiragana") {
    return x11KeyList.Hiragana_Katakana;
  } else if (name == "[") {
    return keyJson.key.charCode;
  } else if (name == "]") {
    return keyJson.key.charCode;
  } else if (name == ",") {
    return keyJson.key.charCode;
  } else if (name == "-") {
    return keyJson.key.charCode;
  } else if (name == ".") {
    return keyJson.key.charCode;
  }
  //
  else if (name == "/") {
    return keyJson.key.charCode;
  } else if (name == "\\") {
    return keyJson.key.charCode;
  } else if (name == "+") {
    return keyJson.key.charCode;
  } else if (name == "_") {
    return keyJson.key.charCode;
  } else if (name == "=") {
    return keyJson.key.charCode;
  } else if (name == ":") {
    return keyJson.key.charCode;
  } else if (name == '"') {
    return keyJson.key.charCode;
  } else if (name == "`") {
    return keyJson.key.charCode;
  } else if (name == "~") {
    return keyJson.key.charCode;
  }
  // --- Shift + 0~9
  else if (name == "!") {
    return keyJson.key.charCode;
  } else if (name == "@") {
    return keyJson.key.charCode;
  } else if (name == "#") {
    return keyJson.key.charCode;
  } else if (name == "$") {
    return keyJson.key.charCode;
  } else if (name == "%") {
    return keyJson.key.charCode;
  } else if (name == "^") {
    return keyJson.key.charCode;
  } else if (name == "&") {
    return keyJson.key.charCode;
  } else if (name == "*") {
    return keyJson.key.charCode;
  } else if (name == "(") {
    return keyJson.key.charCode;
  } else if (name == ")") {
    return keyJson.key.charCode;
  }

  return keyJson.key.charCode;
};

const x11KeyList = {
  F1: 0xffbe,
  F2: 0xffbf,
  F3: 0xffc0,
  F4: 0xffc1,
  F5: 0xffc2,
  F6: 0xffc3,
  F7: 0xffc4,
  F8: 0xffc5,
  F9: 0xffc6,
  F10: 0xffc7,
  F11: 0xffc8,
  L1: 0xffc8,
  F12: 0xffc9,
  L2: 0xffc9,
  F13: 0xffca,
  L3: 0xffca,
  F14: 0xffcb,
  L4: 0xffcb,
  F15: 0xffcc,
  L5: 0xffcc,
  F16: 0xffcd,
  L6: 0xffcd,
  F17: 0xffce,
  L7: 0xffce,
  F18: 0xffcf,
  L8: 0xffcf,
  F19: 0xffd0,
  L9: 0xffd0,
  F20: 0xffd1,
  L10: 0xffd1,
  F21: 0xffd2,
  R1: 0xffd2,
  F22: 0xffd3,
  R2: 0xffd3,
  F23: 0xffd4,
  R3: 0xffd4,
  F24: 0xffd5,
  R4: 0xffd5,
  F25: 0xffd6,
  R5: 0xffd6,
  F26: 0xffd7,
  R6: 0xffd7,
  F27: 0xffd8,
  R7: 0xffd8,
  F28: 0xffd9,
  R8: 0xffd9,
  F29: 0xffda,
  R9: 0xffda,
  F30: 0xffdb,
  R10: 0xffdb,
  F31: 0xffdc,
  R11: 0xffdc,
  F32: 0xffdd,
  R12: 0xffdd,
  F33: 0xffde,
  R13: 0xffde,
  F34: 0xffdf,
  R14: 0xffdf,
  F35: 0xffe0,
  R15: 0xffe0,

  BackSpace: 0xff08 /* back space, back char */,
  Tab: 0xff09,
  Linefeed: 0xff0a /* Linefeed, LF */,
  Clear: 0xff0b,
  Return: 0xff0d /* Return, enter */,
  Pause: 0xff13 /* Pause, hold */,
  Scroll_Lock: 0xff14,
  Sys_Req: 0xff15,
  Escape: 0xff1b,
  Delete: 0xffff /* Delete, rubout */,

  // Modifiers

  Shift_L: 0xffe1 /* Left shift */,
  Shift_R: 0xffe2 /* Right shift */,
  Control_L: 0xffe3 /* Left control */,
  Control_R: 0xffe4 /* Right control */,
  Caps_Lock: 0xffe5 /* Caps lock */,
  Shift_Lock: 0xffe6 /* Shift lock */,

  Meta_L: 0xffe7 /* Left meta */,
  Meta_R: 0xffe8 /* Right meta */,
  Alt_L: 0xffe9 /* Left alt */,
  Alt_R: 0xffea /* Right alt */,
  Super_L: 0xffeb /* Left super */,
  Super_R: 0xffec /* Right super */,
  Hyper_L: 0xffed /* Left hyper */,
  Hyper_R: 0xffee /* Right hyper */,

  //Cursor control & motion

  Home: 0xff50,
  Left: 0xff51 /* Move left, left arrow */,
  Up: 0xff52 /* Move up, up arrow */,
  Right: 0xff53 /* Move right, right arrow */,
  Down: 0xff54 /* Move down, down arrow */,
  Prior: 0xff55 /* Prior, previous */,
  Page_Up: 0xff55,
  Next: 0xff56 /* Next */,
  Page_Down: 0xff56,
  End: 0xff57 /* EOL */,
  Begin: 0xff58 /* BOL */,

  //Misc Functions

  Select: 0xff60 /* Select, mark */,
  Print: 0xff61,
  Execute: 0xff62 /* Execute, run, do */,
  Insert: 0xff63 /* Insert, insert here */,
  Undo: 0xff65 /* Undo, oops */,
  Redo: 0xff66 /* redo, again */,
  Menu: 0xff67,
  Find: 0xff68 /* Find, search */,
  Cancel: 0xff69 /* Cancel, stop, abort, exit */,
  Help: 0xff6a /* Help */,
  Break: 0xff6b,
  Mode_switch: 0xff7e /* Character set switch */,
  script_switch: 0xff7e /* Alias for mode_switch */,
  Num_Lock: 0xff7f,

  //
  Muhenkan: 0xff22,
  Henkan: 0xff23,
  Zenkaku: 0xff2a, //0xff28,
  Hankaku: 0xff2a, //0xff29,
  Zenkaku_Hankaku: 0xff2a,
  Eisu_toggle: 0xff30,
  Hiragana_Katakana: 0xff27,
};
