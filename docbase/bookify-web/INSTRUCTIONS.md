# Wiki-to-Book Implementation Guide

This document provides instructions for completing the integration of the Bookify Web engine into your specific project structure.

## 1. Configure the Landing URL
Locate the `DEFAULT_URL` constant in `App.tsx`. 
- Replace `'https://example.com/placeholder-wiki'` with the full URL of your wiki's main landing page or index.
- This ensures that when a user visits the root app without a `?url=` parameter, they are immediately presented with your project's content.

## 2. Refining Functional Links
The current `ReaderPage.tsx` renders content as plain text blocks. To make links "functional" as requested:
- Update the AI prompt in `geminiService.ts` to return content with standard HTML `<a>` tags or Markdown links.
- Modify `ReaderPage.tsx` to use a library like `react-markdown` or a simple regex-to-component parser to render these links.
- **Tip:** Ensure links target the Bookify app itself by prepending `window.location.origin + '?url='` to the href.

## 3. Wiki Hierarchy Processing
The AI is already instructed to preserve the "Densetsu Landing" style tree structure. 
- If the tree structure is complex, increase the `maxOutputTokens` and `thinkingBudget` in `geminiService.ts` to allow for more detailed page mapping.
- Ensure the AI understands that the first 2 pages should act as a "clickable" index.

## 4. Custom Styling
- Adjust the colors in `BookCover.tsx` and `ReaderPage.tsx` (CSS variables or Tailwind classes) to match your project's specific lore branding.
- The `custom-scrollbar` in `ReaderPage.tsx` can be further styled to look like an old parchment edge or a bookmark.
