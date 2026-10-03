import { readFileSync, writeFileSync } from "node:fs";

function dataUrl(path) {
  const bytes = readFileSync(path);
  const ext = path.endsWith(".png") ? "png" : "jpeg";
  return `data:image/${ext};base64,${bytes.toString("base64")}`;
}

const graphite = dataUrl("public/textures/graphite-matte.jpg");
const gloss = dataUrl("public/textures/graphite-gloss.jpg");
const vintage = dataUrl("public/textures/vintage-matte.jpg");
const icon = dataUrl("public/icon-192.png");

writeFileSync(
  "src/lib/phone-assets.ts",
  `export const APP_ICON = ${JSON.stringify(icon)};\nconst TEXTURES: Record<string, string> = {\n  "#3a4147": ${JSON.stringify(graphite)},\n  "#23282e": ${JSON.stringify(gloss)},\n  "#6e5a4a": ${JSON.stringify(vintage)},\n};\nexport function textureFor(hex: string): string | undefined {\n  return TEXTURES[String(hex).toLowerCase()];\n}\n`,
);

const viewPath = "src/components/plan-view.tsx";
let view = readFileSync(viewPath, "utf8");
if (!view.includes("textureFor")) {
  view = view.replace(
    'import { PROFILE_COLORS, profileCanonicalHex, profileChipSide, profileColorName, profileFinish, profileId, profileSwatchBg, profileTexture, type Drawing } from "@/lib/types";',
    'import { PROFILE_COLORS, profileCanonicalHex, profileChipSide, profileColorName, profileFinish, profileId, profileSwatchBg, profileTexture, type Drawing } from "@/lib/types";\nimport { textureFor } from "@/lib/phone-assets";',
  );
  view = view.replace(
    "const texture = profileTexture(hex);",
    "const texture = textureFor(hex) ?? profileTexture(hex);",
  );
  writeFileSync(viewPath, view);
}
