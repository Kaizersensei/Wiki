# Software tools

Source projects imported from the five user-supplied ZIP archives are kept here.
The browser builds are tracked under `pages/retraissance/software/tools/` for static GitHub Pages hosting.

For each source directory, install locked dependencies with `npm ci --ignore-scripts`.
Then, from the repository root, run `node scripts/build-tools.mjs` (or pass one or more tool slugs).
The build uses relative asset URLs so it works both locally and under the GitHub Pages repository prefix.
The T-Ex Express development server is not needed for its browser features; the shared build command runs Vite only.

All five apps run locally in the browser. Gemini integrations, AI controls, and AI SDK dependencies have been removed. InPoster previews the text you write without rewriting it.

Preview from the repository root with `node scripts/dev-save-server.js` and visit
`http://localhost:3000/pages/retraissance/software/index.html`.
