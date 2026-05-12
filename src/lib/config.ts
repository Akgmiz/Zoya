let cachedApiKey: string | null = null;
export async function getApiKey(): Promise<string> {
  if (cachedApiKey !== null) return cachedApiKey;

  try {
    // 1. Try injected key (Vite build)
    // @ts-ignore
    const injected = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;
    if (injected && String(injected) !== "undefined") {
      cachedApiKey = String(injected);
      return cachedApiKey;
    }
  } catch (e) {
    // Ignore ReferenceError if process is completely replaced by undefined
  }

  try {
    // 2. Try fetching from runtime express server
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Failed to fetch config");
    const data = await res.json();
    cachedApiKey = data.geminiApiKey || "";
    return cachedApiKey || "";
  } catch (error) {
    console.error("Error fetching API key:", error);
    return "";
  }
}
