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
  `export const APP_ICON = ${JSON.stringify(icon)};
const TEXTURES = {
  "#3a4147": ${JSON.stringify(graphite)},
  "#23282e": ${JSON.stringify(gloss)},
  "#6e5a4a": ${JSON.stringify(vintage)},
};
export function textureFor(hex: string): string | undefined {
  return TEXTURES[String(hex).toLowerCase()];
}
`,
);
