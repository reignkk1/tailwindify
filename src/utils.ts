import { twi } from "tw-to-css";

export function toCssRule(tag: string, attr: string) {
  return `${tag} {\n  ${twi(attr)
    .split(";")
    .filter((m) => m)
    .join(";\n  ")};\n}`;
}
