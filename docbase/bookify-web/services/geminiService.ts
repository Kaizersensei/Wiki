
import { BookPage } from "../types";

const chunkWords = (text: string, maxWords = 350): string[] => {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(' '));
  }
  return chunks;
};

const extractLinksTOC = (doc: Document, baseUrl: string): string => {
  const links = Array.from(doc.querySelectorAll('nav a, a'))
    .map(a => {
      const text = (a.textContent || '').trim();
      const href = a.getAttribute('href') || '';
      if (!text || !href) return null;
      try {
        const resolved = new URL(href, baseUrl).href;
        return `• ${text} — ${resolved}`;
      } catch {
        return `• ${text} — ${href}`;
      }
    })
    .filter(Boolean)
    .slice(0, 40) as string[];
  return links.join('\n');
};

export const processWebContent = async (html: string, url: string): Promise<{ title: string; author: string; pages: BookPage[] }> => {
  // Lightweight local parser; no external AI required.
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());

  const title = (doc.querySelector('title')?.textContent || '').trim() || 'Untitled';
  const author = (() => {
    try { return new URL(url).hostname; } catch { return 'Unknown'; }
  })();

  const toc = extractLinksTOC(doc, url);
  const bodyText = (doc.body?.innerText || '').replace(/\n{2,}/g, '\n').trim();

  const pages: BookPage[] = [];
  let pageNumber = 1;

  if (toc) {
    pages.push({
      title: 'Table of Contents',
      content: toc,
      pageNumber: pageNumber++
    });
  }

  const chunks = chunkWords(bodyText || title, 400);
  if (chunks.length === 0) {
    pages.push({ title: 'Page 1', content: 'No readable content found.', pageNumber });
  } else {
    chunks.forEach((chunk, idx) => {
      pages.push({
        title: `Chapter ${idx + 1}`,
        content: chunk,
        pageNumber: pageNumber++
      });
    });
  }

  return { title, author, pages };
};
