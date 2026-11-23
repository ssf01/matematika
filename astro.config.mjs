import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * After the build, inject the list of emitted files (and a content hash used as
 * the cache version) into dist/sw.js so the service worker can precache the
 * whole app for offline use.
 */
function precacheManifest() {
  const SKIP = [/^sw\.js$/, /\.map$/, /^_headers$/, /^_redirects$/, /(^|\/)\.DS_Store$/];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])),
    );
    return files.flat();
  }

  return {
    name: 'precache-manifest',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = (await walk(root))
          .map((f) => relative(root, f).split(sep).join('/'))
          .filter((f) => !SKIP.some((re) => re.test(f)))
          .sort();

        const hash = createHash('sha256');
        for (const f of files) {
          hash.update(f);
          hash.update(await readFile(join(root, f)));
        }
        const version = hash.digest('hex').slice(0, 12);
        const urls = files.map((f) =>
          f === 'index.html' ? '/' : f.endsWith('/index.html') ? `/${f.slice(0, -10)}` : `/${f}`,
        );

        const swPath = join(root, 'sw.js');
        const sw = await readFile(swPath, 'utf8');
        const header =
          `self.__PRECACHE_MANIFEST__ = ${JSON.stringify(urls)};\n` +
          `self.__PRECACHE_VERSION__ = ${JSON.stringify(version)};\n`;
        await writeFile(swPath, header + sw);
        logger.info(`sw.js: precaching ${urls.length} files (version ${version})`);
      },
    },
  };
}

export default defineConfig({
  integrations: [react(), precacheManifest()],
  vite: {
    plugins: [tailwindcss()],
  },
});
