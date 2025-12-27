# Automated Sanitization Instructions (Site-Wide)

- **Keep reader-only UI**: Strip nav/edit overlays and control buttons before save. Preserve the panel layout, headings, and content only.
- **Allowed elements**: `p, br, strong/b, em/i, u, ul/ol/li, h2/h3/h4, blockquote, pre/code, a (safe href), hr/line, div (callout/inline-media-block), img, video, box (becomes callout)`. Remove/unwrap others; drop empty headings.
- **Pseudotags**: Parse and convert `<image>`, `<video[-loop][-nocontrols]>`, `<box>`, `<line>` (including entity-escaped forms) into their proper blocks. Wrap media in `.inline-media-block`; unwrap wrappers on save, add wrappers at runtime only.
- **Media handling**: Expect slug-named media folders; auto-discover `turnaround.*`, `portrait.*`, `image00-09.*`, optional `theme.ogg/mp3`. Hide UI slots if files are missing.
- **Styling**: Keep the stylesheet reference intact (`../../../assets/site.css`). Avoid injecting nav/editor JS into saved pages.
- **Tagging/meta**: Preserve tag data (base initial + category tags) in pages/indexes to support search/filter. Ensure link lists refresh when pages are added/removed.
- **Structure enforcement**: Maintain the panel/eyebrow/title/article pattern and section order from the generic directive. Headings follow h2/h3 hierarchy; avoid persisting inline styles unless necessary.
- **Sanitize pasted HTML**: Transform spans/styles into allowed tags; remove unsafe attributes (no `javascript:`). Keep placeholders `[*Placeholder: …]` intact; remove editor artifacts.
