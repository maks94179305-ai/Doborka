import base64
from pathlib import Path
from PIL import Image
import io
raw = base64.b64decode(Path("scripts/logo.txt").read_text().strip())
Path("public").mkdir(exist_ok=True)
im = Image.open(io.BytesIO(raw)).convert("RGB")
im.save("public/icon-192.png")
im.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-512.png")
im.resize((180, 180), Image.Resampling.LANCZOS).save("public/icon-180.png")
sizes = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
root = Path("android/app/src/main/res")
if root.exists():
    for density, size in sizes.items():
        folder = root / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        icon = im.resize((size, size), Image.Resampling.LANCZOS)
        for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
            icon.save(folder / name)
    color = root / "values" / "ic_launcher_background.xml"
    color.parent.mkdir(parents=True, exist_ok=True)
    color.write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1B2128</color>\n</resources>\n')
