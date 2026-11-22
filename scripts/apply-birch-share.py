#!/usr/bin/env python3
"""White birch look (white + gray curve); share only schemes; archive only on share (already)."""
from pathlib import Path
import re

p = Path("src/lib/types.ts")
s = p.read_text()
old = '{ id: "white-birch", name: "Белая берёза", hex: "#f0e4cc", finish: "matte", texture: "/textures/vintage-matte.jpg" },'
new = '{ id: "white-birch", name: "Белая берёза", hex: "#f4f2ec", finish: "gloss" },'
if old in s:
    s = s.replace(old, new, 1)
    print("birch color updated")
elif 'id: "white-birch"' in s and "#f4f2ec" in s:
    print("birch color already")
else:
    s2, n = re.subn(
        r'\{ id: "white-birch"[^}]+\}',
        '{ id: "white-birch", name: "Белая берёза", hex: "#f4f2ec", finish: "gloss" }',
        s,
        count=1,
    )
    if n:
        s = s2
        print("birch color regex ok")
    else:
        raise SystemExit("white-birch entry missing")

if 'if (profileId(hex) === "white-birch") return "#f4f2ec";' not in s:
    s = s.replace(
        """export function profileSwatchBg(hex: string): string {
  const texture = profileTexture(hex);
  if (texture) return `center / cover url("${texture}")`;
  if (profileFinish(hex) === "matte") return mixHex(hex, "#6e6c68", 0.3);
  return hex;
}""",
        """export function profileSwatchBg(hex: string): string {
  if (profileId(hex) === "white-birch") return "#f4f2ec";
  const texture = profileTexture(hex);
  if (texture) return `center / cover url("${texture}")`;
  if (profileFinish(hex) === "matte") return mixHex(hex, "#6e6c68", 0.3);
  return hex;
}""",
        1,
    )
    print("swatch bg ok")
p.write_text(s)

p = Path("src/components/plan-view.tsx")
s = p.read_text()
if 'profileId(hex) === "white-birch"' not in s:
    marker = """        {matte ? <rect width="32" height="32" rx="4" fill="#000" opacity={texture ? 0.06 : 0.18} /> : null}
      </svg>"""
    insert = """        {matte ? <rect width="32" height="32" rx="4" fill="#000" opacity={texture ? 0.06 : 0.18} /> : null}
        {profileId(hex) === "white-birch" ? (
          <>
            <path d="M0 20 Q16 8 32 22 L32 28 Q16 14 0 26 Z" fill="#9b9b9b" opacity="0.55" />
            <path d="M2 22 Q16 11 30 23" fill="none" stroke="#7a7a7a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          </>
        ) : null}
      </svg>"""
    if marker not in s:
        raise SystemExit("ColorChip marker missing")
    s = s.replace(marker, insert, 1)
    print("ColorChip stripe ok")
else:
    print("ColorChip already")

m = re.search(
    r"const projectId = uid\(\"hp\"\);\s*const files: File\[\] = \[\];.*?await shareFiles\(files, projectName\);",
    s,
    re.S,
)
if not m:
    raise SystemExit("confirmShare loop missing")
block = m.group(0)
if "shareOnly" in block:
    print("share filter already")
else:
    new_block = """const projectId = uid("hp");
      const files: File[] = [];
      const shareOnly: File[] = [];
      for (let i = 0; i < pendingSent.length; i += 1) {
        const item = pendingSent[i]!;
        const named = new File([item.file], `doborka-${i + 1}-${projectName.replace(/[^\\wа-яА-ЯёЁ-]+/g, "_").slice(0, 24) || "pos"}.png`, { type: "image/png" });
        const photoId = uid("ph");
        await savePhoto(photoId, named);
        addArchiveEntry({ photoId, title: item.title, projectId, projectName, kind: item.kind, bars: item.bars, colorName: item.colorName });
        if (item.kind === "scheme") {
          files.push(named);
          shareOnly.push(named);
        }
      }
      if (shareOnly.length) await shareFiles(shareOnly, projectName);"""
    new_block = new_block.replace("\\\\w", "\\w")
    s = s[:m.start()] + new_block + s[m.end():]
    print("share schemes only ok")
p.write_text(s)

p = Path("src/lib/share-image.ts")
s = p.read_text()
if 'profileId(hex) === "white-birch"' not in s:
    old = """  if (matte) {
    ctx.fillStyle = texImg ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.18)";
    ctx.fillRect(x, y, size, size);
  }
  if (gloss) {"""
    new = """  if (matte) {
    ctx.fillStyle = texImg ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.18)";
    ctx.fillRect(x, y, size, size);
  }
  if (profileId(hex) === "white-birch") {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.62);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.25, x + size, y + size * 0.68);
    ctx.lineTo(x + size, y + size * 0.88);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.45, x, y + size * 0.82);
    ctx.closePath();
    ctx.fillStyle = "rgba(155,155,155,0.55)";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.06, y + size * 0.68);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.35, x + size * 0.94, y + size * 0.72);
    ctx.strokeStyle = "rgba(122,122,122,0.75)";
    ctx.lineWidth = Math.max(1, size * 0.04);
    ctx.lineCap = "round";
    ctx.stroke();
  }
  if (gloss) {"""
    if old not in s:
        raise SystemExit("drawColorChip matte/gloss marker missing")
    s = s.replace(old, new, 1)
    p.write_text(s)
    print("share-image birch ok")
else:
    print("share-image already")

print("ALL DONE")
