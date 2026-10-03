const KEY = "doborka-pair-pin";
const SEEN_KEY = "doborka-pair-seen";

export function readPairPin(): string | null {
  try {
    const pin = localStorage.getItem(KEY)?.replace(/\D/g, "") ?? "";
    return /^\d{4}$/.test(pin) ? pin : null;
  } catch {
    return null;
  }
}

export function formatPin(pin: string) {
  const digits = pin.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} ${digits.slice(2)}` : digits;
}

export function generatePin() {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return String(n[0] % 10_000).padStart(4, "0");
}

export function pairPromptPending() {
  if (readPairPin()) return false;
  try {
    return localStorage.getItem(SEEN_KEY) !== "1";
  } catch {
    return true;
  }
}

export function markPairSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function setPairPin(pin: string | null) {
  try {
    if (pin && /^\d{4}$/.test(pin)) {
      localStorage.setItem(KEY, pin);
      localStorage.setItem(SEEN_KEY, "1");
    } else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("doborka-pair"));
}
