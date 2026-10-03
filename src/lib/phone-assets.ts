const svg = (body: string) => `data:image/svg+xml,${encodeURIComponent(body)}`;
export const APP_ICON = svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2c3034"/><path d="M16 44 L32 18 L48 44" fill="none" stroke="#f3f1ec" stroke-width="4"/></svg>');
const TEXTURES: Record<string, string> = {
  "#3a4147": svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3a4147"/></svg>'),
  "#23282e": svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#23282e"/></svg>'),
  "#6e5a4a": svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#6e5a4a"/></svg>'),
};
export function textureFor(hex: string): string | undefined {
  return TEXTURES[String(hex).toLowerCase()];
}
