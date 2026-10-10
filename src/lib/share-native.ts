function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function toBase64(file: File) {
  const data = await file.arrayBuffer();
  const bytes = new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function shareOrSave(file: File, title: string, text?: string): Promise<"shared" | "saved" | "cancelled"> {
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, { writeFile: Function; getUri: Function; share: Function }> } }).Capacitor;
  const fs = cap?.Plugins?.Filesystem;
  const share = cap?.Plugins?.Share;
  if (fs && share) {
    try {
      const safe = (file.name || "doborka.png").replace(/[^\w.\-а-яА-ЯёЁ]+/g, "_").slice(0, 48) || "doborka.png";
      const path = `share-one-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
      await fs.writeFile({ path, data: await toBase64(file), directory: "CACHE" });
      const uri = await fs.getUri({ path, directory: "CACHE" });
      await share.share({ title, text, url: uri.uri, dialogTitle: "Поделиться" });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError" || String((e as Error).message || "").toLowerCase().includes("cancel")) return "cancelled";
    }
  }
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text });
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "cancelled";
  }
  downloadFile(file);
  return "saved";
}

export async function shareFiles(files: File[], title: string): Promise<"shared" | "saved" | "cancelled"> {
  if (!files.length) return "cancelled";
  const stamp = Date.now();
  const unique = files.map((file, i) => {
    const base = (file.name || `doborka-${i + 1}.png`).replace(/[^\w.\-а-яА-ЯёЁ]+/g, "_");
    const name = base.includes(".") ? base : `${base}.png`;
    return new File([file], `${i + 1}-${stamp}-${name}`, { type: file.type || "image/png" });
  });
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, { writeFile: Function; getUri: Function; share: Function }> } }).Capacitor;
  const fs = cap?.Plugins?.Filesystem;
  const sharePlugin = cap?.Plugins?.Share;
  if (fs && sharePlugin) {
    try {
      const urls: string[] = [];
      for (let i = 0; i < unique.length; i += 1) {
        const f = unique[i]!;
        const path = `share-${stamp}-${i + 1}-${f.name}`;
        await fs.writeFile({ path, data: await toBase64(f), directory: "CACHE" });
        const uri = await fs.getUri({ path, directory: "CACHE" });
        urls.push(uri.uri);
      }
      if (urls.length === 1) {
        await sharePlugin.share({ title, url: urls[0], dialogTitle: "Поделиться" });
        return "shared";
      }
      try {
        await sharePlugin.share({ title, files: urls, dialogTitle: "Поделиться" });
        return "shared";
      } catch {
        /* fall through */
      }
      let any = false;
      for (let i = 0; i < urls.length; i += 1) {
        try {
          await sharePlugin.share({
            title: `${title} (${i + 1}/${urls.length})`,
            url: urls[i],
            dialogTitle: `Поделиться ${i + 1} из ${urls.length}`,
          });
          any = true;
          if (i < urls.length - 1) await sleep(350);
        } catch (e) {
          if ((e as Error).name === "AbortError" || String((e as Error).message || "").toLowerCase().includes("cancel")) {
            if (any) return "shared";
            return "cancelled";
          }
        }
      }
      if (any) return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError" || String((e as Error).message || "").toLowerCase().includes("cancel")) return "cancelled";
    }
  }
  try {
    if (navigator.canShare?.({ files: unique })) {
      await navigator.share({ files: unique, title });
      return "shared";
    }
  } catch (e) {
    if ((e as Error).name === "AbortError") return "cancelled";
  }
  for (const f of unique) downloadFile(f);
  return "saved";
}
