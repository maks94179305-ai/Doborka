import base64
from pathlib import Path
from PIL import Image
import io

raw = base64.b64decode(Path("scripts/logo-hq.txt").read_text().strip())
im = Image.open(io.BytesIO(raw)).convert("RGB")
Path("public").mkdir(exist_ok=True)
im.resize((192, 192), Image.Resampling.LANCZOS).save("public/icon-192.png")
im.resize((512, 512), Image.Resampling.LANCZOS).save("public/icon-512.png")
im.resize((180, 180), Image.Resampling.LANCZOS).save("public/icon-180.png")
launcher = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
foreground = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
root = Path("android/app/src/main/res")
if root.exists():
    for density, size in launcher.items():
        folder = root / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        icon = im.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(folder / "ic_launcher.png")
        icon.save(folder / "ic_launcher_round.png")
    for density, size in foreground.items():
        folder = root / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        im.resize((size, size), Image.Resampling.LANCZOS).save(folder / "ic_launcher_foreground.png")
    drawable = root / "drawable"
    drawable.mkdir(parents=True, exist_ok=True)
    im.resize((432, 432), Image.Resampling.LANCZOS).save(drawable / "splash_logo.png")
    color = root / "values" / "ic_launcher_background.xml"
    color.parent.mkdir(parents=True, exist_ok=True)
    color.write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1B2128</color>\n</resources>\n')
