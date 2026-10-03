import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const icon = "data:image/jpeg;base64," + readFileSync("scripts/logo-hq.txt", "utf8").trim();
const graphite = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3a4147"/></svg>');
const gloss = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#23282e"/></svg>');
const vintage = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#6e5a4a"/></svg>');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (path.endsWith(".tsx") || path.endsWith(".ts")) out.push(path);
  }
  return out;
}

for (const path of walk("src")) {
  let text = readFileSync(path, "utf8");
  let next = text
    .replaceAll("/icon-192.png?v=pc", icon)
    .replaceAll("/icon-512.png?v=pc", icon)
    .replaceAll("/textures/graphite-matte.jpg", graphite)
    .replaceAll("/textures/graphite-gloss.jpg", gloss)
    .replaceAll("/textures/vintage-matte.jpg", vintage)
    .replaceAll('className="absolute bottom-3 right-3 z-10 shadow-float"', 'className="mt-3 w-full"')
    .replaceAll('ring-1 ring-white/15', 'bg-[#1b2128]')
    .replaceAll('className="size-9 object-cover"', 'className="size-9 rounded-[12px] object-cover"')
    .replaceAll("<Label>Минимальный полезный остаток, мм</Label>", "<Label>Минимальный полезный остаток, мм (от 0 до 9999)</Label>")
    .replaceAll(
      "patchSettings({ minRemainder: Number(e.target.value) || 0 })",
      "patchSettings({ minRemainder: Math.min(9999, Math.max(0, Number(e.target.value.replace(/\\D/g, '')) || 0)) })",
    )
    .replaceAll("if (settings.minRemainder === 200) settings.minRemainder = 800;", "");
  next = next.replace(/<section className="panel p-5">[\s\S]*?Приложение на телефоне[\s\S]*?<\/section>\s*/, "");
  next = next.replace(
    'import { composeWindowShot, shareOrSave, type ShareCardMeta } from "@/lib/share-image";',
    'import { composeWindowShot, type ShareCardMeta } from "@/lib/share-image";\nimport { shareOrSave } from "@/lib/share-native";',
  );
  next = next.replace(/export const APP_ICON = svg\('<svg[^']*<\\/svg>'\);/, 'export const APP_ICON = ' + JSON.stringify(icon) + ';');
  if (next !== text) writeFileSync(path, next);
}
