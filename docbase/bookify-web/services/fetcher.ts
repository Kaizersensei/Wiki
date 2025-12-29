
export const fetchUrlContent = async (url: string): Promise<string> => {
  const isSameOrigin = (() => {
    try {
      const target = new URL(url, window.location.href);
      return target.origin === window.location.origin;
    } catch {
      return false;
    }
  })();

  // Prefer direct fetch for same-origin/local content to avoid proxy/CORS issues
  if (isSameOrigin) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch content from source");
    return await response.text();
  }

  // Remote: use proxy fallback
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error("Failed to fetch content via proxy");
  const data = await response.json();
  if (!data.contents) throw new Error("Proxy returned no content");
  return data.contents;
};
