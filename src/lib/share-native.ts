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
      const path = file.name || "doborka-shema.png";
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
  downloadFile(file);
  return "saved";
}
