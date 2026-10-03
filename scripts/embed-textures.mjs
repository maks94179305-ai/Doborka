import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const icon = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2c3034"/><path d="M16 44 L32 18 L48 44" fill="none" stroke="#f3f1ec" stroke-width="4"/></svg>');
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
    .replaceAll('className="absolute bottom-3 right-3 z-10 shadow-float"', 'className="mt-3 w-full"');
  next = next.replace(
    'import { composeWindowShot, shareOrSave, type ShareCardMeta } from "@/lib/share-image";',
    'import { composeWindowShot, type ShareCardMeta } from "@/lib/share-image";\nimport { shareOrSave } from "@/lib/share-native";',
  );
  if (next !== text) writeFileSync(path, next);
}
