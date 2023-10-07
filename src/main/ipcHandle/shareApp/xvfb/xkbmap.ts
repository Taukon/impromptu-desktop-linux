import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { existsSync } from "fs";

export const setXkbLayout = (
  displayNum: number,
  layout: string,
): ChildProcessWithoutNullStreams | undefined => {
  if (existsSync(`/tmp/.X${displayNum}-lock`)) {
    const args = [`-display`, `:${displayNum}`, `-layout`];
    const xkbLayout = layoutList.find((v) => v === layout);
    if (xkbLayout) {
      args.push(xkbLayout);
      return spawn("setxkbmap", args);
    }
  }
  return undefined;
};

const layoutList: string[] = [
  "us", //"English (US)"
  "af", // "Afghani"
  "ara", // " Arabic"
  "al", // "Albanian"
  "am", // "Armenian"
  "at", // "German (Austria)"
  "au", // "English (Australian)"
  "az", // "Azerbaijani"
  "by", // "Belarusian"
  "be", // "Belgian"
  "bd", // "Bangla"
  "in", // "Indian"
  "ba", // "Bosnian"
  "br", // "Portuguese (Brazil)"
  "bg", // "Bulgarian"
  "dz", // "Berber (Algeria, Latin)"
  "ma", // "Arabic (Morocco)"
  "cm", // "English (Cameroon)"
  "mm", // "Burmese"
  "ca", // "French (Canada)"
  "cd", // "French (Democratic Republic of the Congo)"
  "cn", // "Chinese"
  "hr", // "Croatian"
  "cz", // "Czech"
  "dk", // "Danish"
  "nl", // "Dutch"
  "bt", // "Dzongkha"
  "ee", // "Estonian"
  "ir", // "Persian"
  "iq", // "Iraqi"
  "fo", // "Faroese"
  "fi", // "Finnish"
  "fr", // "French"
  "gh", // "English (Ghana)"
  "gn", // "N'Ko (AZERTY)"
  "ge", // "Georgian"
  "de", // "German"
  "gr", // "Greek"
  "hu", // "Hungarian"
  "is", // "Icelandic"
  "il", // "Hebrew"
  "it", // "Italian"
  "jp", // "Japanese"
  "kg", // "Kyrgyz"
  "kh", // "Khmer (Cambodia)"
  "kz", // "Kazakh"
  "la", // "Lao"
  "latam", // "Spanish (Latin American)"
  "lt", // "Lithuanian"
  "lv", // "Latvian
  "mao", // " Maori
  "me", // "Montenegrin
  "mk", // "Macedonian
  "mt", // "Maltese
  "mn", // "Mongolian
  "no", // "Norwegian
  "pl", // "Polish
  "pt", // "Portuguese
  "ro", // "Romanian
  "ru", // "Russian
  "rs", // "Serbian
  "si", // "Slovenian
  "sk", // "Slovak
  "es", // "Spanish
  "se", // "Swedish
  "ch", // "German (Switzerland)
  "sy", // "Arabic (Syria)
  "tj", // "Tajik
  "lk", // "Sinhala (phonetic)
  "th", // "Thai
  "tr", // "Turkish
  "tw", // "Taiwanese
  "ua", // "Ukrainian
  "gb", // "English (UK)
  "uz", // "Uzbek
  "vn", // "Vietnamese
  "kr", // "Korean
  "ie", // "Irish
  "pk", // "Urdu (Pakistan)
  "mv", // "Dhivehi
  "za", // "English (South Africa)
  "epo", // "Esperanto"
  "np", // "Nepali"
  "ng", // "English (Nigeria)""
  "et", // "Amharic"
  "sn", // "Wolof"
  "brai", // "Braille"
  "tm", // "Turkmen"
  "ml", // "Bambara"
  "tz", // "Swahili (Tanzania)"
  "tg", // "French (Togo)"
  "ke", // "Swahili (Kenya)"
  "bw", // "Tswana"
  "ph", // "Filipino"
  "md", // "Moldavian"
  "id", // "Indonesian (Latin)"
  "jv", // "Indonesian (Javanese)"
  "my", //", // "Malay (Jawi, Arabic Keyboard)"
];
