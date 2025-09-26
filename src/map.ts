const displayMap: Record<string, string> = {
  block: "display: block",
  "inline-block": "display: inline-block",
  inline: "display: inline",
  flex: "display: flex",
  "inline-flex": "display: inline-flex",
  grid: "display: grid",
  "inline-grid": "display: inline-grid",
  hidden: "display: none",
};

const flexMap: Record<string, string> = {
  "flex-row": "flex-direction: row",
  "flex-col": "flex-direction: column",
  "items-start": "align-items: flex-start",
  "items-center": "align-items: center",
  "items-end": "align-items: flex-end",
  "justify-start": "justify-content: flex-start",
  "justify-center": "justify-content: center",
  "justify-end": "justify-content: flex-end",
  "justify-between": "justify-content: space-between",
  "justify-around": "justify-content: space-around",
};

const textMap: Record<string, string> = {
  italic: "font-style: italic",
  "not-italic": "font-style: normal",
  underline: "text-decoration-line: underline",
  "line-through": "text-decoration-line: line-through",
  "no-underline": "text-decoration-line: none",
  uppercase: "text-transform: uppercase",
  lowercase: "text-transform: lowercase",
  capitalize: "text-transform: capitalize",
  "normal-case": "text-transform: none",
  truncate: "overflow: hidden; text-overflow: ellipsis; white-space: nowrap",
};

const visualMap: Record<string, string> = {
  rounded: "border-radius: 0.25rem",
  "rounded-full": "border-radius: 9999px",
  shadow: "box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05)",
  "shadow-md":
    "box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
  "overflow-hidden": "overflow: hidden",
  "overflow-auto": "overflow: auto",
};

const resolveMap: Record<string, string> = {
  ...displayMap,
  ...flexMap,
  ...textMap,
  ...visualMap,
};

// spacing: m-0, mt-2, px-3 등
const spacingRegex = /^(m|p)(t|r|b|l|x|y)?-(\d+)$/;

// width/height: w-1/2, h-4, w-full
const sizeRegex = /^(w|h|min-w|max-w|max-h|min-h)-(.+)$/;

// colors: bg-red-500, text-blue-300
const colorRegex = /^(bg|text|border)-([a-z]+)-(\d{1,3})$/;

// gap: gap-4, gap-x-2
const gapRegex = /^gap(-[xy])?-(\d+)$/;

export function convertClass(cls: string) {
  // 1. 고정 클래스 처리
  if (cls in resolveMap) return resolveMap[cls];

  // 2. spacing 처리
  const spacingMatch = cls.match(spacingRegex);
  // 3. width/height 처리
  const sizeMatch = cls.match(sizeRegex);
  // 4. colors 처리 (예: bg-red-500)
  const colorMatch = cls.match(colorRegex);
  // 5. gap 처리
  const gapMatch = cls.match(gapRegex);

  if (spacingMatch) {
    const [_, type, dir, value] = spacingMatch;
    const rem = Number(value) * 0.25; // Tailwind 1 = 0.25rem
    const baseType = type === "m" ? "margin" : "padding";

    let attr = "";

    if (!dir) attr = baseType;
    else {
      const map: Record<string, string> = {
        t: "-top",
        r: "-right",
        b: "-bottom",
        l: "-left",
        x: "-left; " + baseType + "-right",
        y: "-top; " + baseType + "-bottom",
      };
      attr = baseType + map[dir];
    }
    return `${attr}: ${rem}rem`;
  }

  if (sizeMatch) {
    const [_, type, value] = sizeMatch;
    let cssValue = value;
    if (/^\d+$/.test(value))
      cssValue = `${Number(value) * 0.25}rem`; // 숫자는 rem으로 변환
    else if (value === "full") cssValue = "100%";
    else if (value === "screen") cssValue = "100vh";
    return `${type}: ${cssValue}`;
  }

  if (colorMatch) {
    const [_, type, color, shade] = colorMatch;
    // 실제 Tailwind 색상 코드는 매핑 필요 (예시)
    const colorMap: Record<string, Record<string, string>> = {
      red: { "500": "#f56565" },
      blue: { "300": "#63b3ed" },
      gray: { "200": "#e2e8f0" },
    };
    const hex = colorMap[color]?.[shade] || "transparent";
    if (type === "bg") return `background-color: ${hex}`;
    if (type === "text") return `color: ${hex}`;
    if (type === "border") return `border-color: ${hex}`;
  }

  if (gapMatch) {
    const [_, axis, value] = gapMatch;
    const rem = Number(value) * 0.25;
    if (!axis) return `gap: ${rem}rem`;
    if (axis === "-x") return `column-gap: ${rem}rem`;
    if (axis === "-y") return `row-gap: ${rem}rem`;
  }

  return null; // 변환 불가
}

// test
console.log(convertClass("block")); // display: block
console.log(convertClass("mt-4")); // margin-top: 1rem
console.log(convertClass("px-2")); // padding-left: 0.5rem; padding-right
console.log(convertClass("w-1/2")); // width: 50%
console.log(convertClass("bg-red-500")); // background-color: #f56565
console.log(convertClass("gap-x-3")); // column-gap: 0.75rem
