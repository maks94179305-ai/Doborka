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

export async function shareOrSave(file: File, title: string, text?: string): Promise<"shared" | "saved" | "cancelled"> {
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, { writeFile: Function; getUri: Function; share: Function }> } }).Capacitor;
  const fs = cap?.Plugins?.Filesystem;
  const share = cap?.Plugins?.Share;
  if (fs && share) {
    try {
      const path = `doborka-one-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      await fs.writeFile({ path, data: await toBase64(file), directory: "CACHE" });
      const uri = await fs.getUri({ path, directory: "CACHE" });
      await share.share({ title, text, url: uri.uri, dialogTitle: "Поделиться" });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
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
  return "cancelled";
}

export async function shareFiles(files: File[], title: string): Promise<"shared" | "saved" | "cancelled"> {
  if (!files.length) return "cancelled";
  const unique = files.map((file, i) => new File([file], `doborka-${i + 1}-${Date.now()}.png`, { type: file.type || "image/png" }));
  const cap = (window as unknown as { Capacitor?: { Plugins?: Record<string, { writeFile: Function; getUri: Function; share: Function }> } }).Capacitor;
  const fs = cap?.Plugins?.Filesystem;
  const sharePlugin = cap?.Plugins?.Share;
  if (fs && sharePlugin) {
    try {
      const urls: string[] = [];
      for (let i = 0; i < unique.length; i += 1) {
        const path = `doborka-share-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        await fs.writeFile({ path, data: await toBase64(unique[i]!), directory: "CACHE" });
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
        for (let i = 0; i < urls.length; i += 1) {
          await sharePlugin.share({ title: `${title} (${i + 1}/${urls.length})`, url: urls[i], dialogTitle: "Поделиться" });
        }
        return "shared";
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
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
  return "cancelled";
}
