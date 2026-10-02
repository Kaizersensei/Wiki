import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tools = ['infiniboard', 'inposter', 'lineart-studio', 'textract', 'unwrapp3d'];
const selected = process.argv.slice(2);
for (const slug of selected.length ? selected : tools) {
  if (!tools.includes(slug)) throw new Error(`Unknown tool: ${slug}`);
  const cwd = path.join(root, 'tools-src', slug);
  const output = path.join(root, 'pages', 'retraissance', 'software', 'tools', slug);
  const result = spawnSync(process.execPath, [path.join(cwd, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--base=./', '--outDir', output, '--emptyOutDir'], { cwd, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
