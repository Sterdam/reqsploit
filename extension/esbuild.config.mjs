import { build, context } from 'esbuild';
import { cpSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');

// Build background service worker
const backgroundOptions = {
  entryPoints: ['src/background.ts'],
  bundle: true,
  outfile: 'dist/background.js',
  format: 'esm',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
};

// Build popup script
const popupOptions = {
  entryPoints: ['src/popup.ts'],
  bundle: true,
  outfile: 'dist/popup.js',
  format: 'iife',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
};

/**
 * Copy static assets to dist/
 */
function copyAssets() {
  const distDir = resolve(__dirname, 'dist');
  const iconsDir = resolve(distDir, 'icons');

  // Ensure directories exist
  if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
  if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

  // Copy manifest.json (root manifest is the CDP v2 one)
  cpSync(resolve(__dirname, 'manifest.json'), resolve(distDir, 'manifest.json'));

  // Copy popup HTML + CSS
  cpSync(resolve(__dirname, 'popup.html'), resolve(distDir, 'popup.html'));
  cpSync(resolve(__dirname, 'popup.css'), resolve(distDir, 'popup.css'));

  // Copy icons (PNG + SVG)
  const iconsSource = resolve(__dirname, 'icons');
  if (existsSync(iconsSource)) {
    cpSync(iconsSource, iconsDir, { recursive: true });
  }

  console.log('[esbuild] Assets copied to dist/');
}

if (isWatch) {
  copyAssets();
  const bgCtx = await context(backgroundOptions);
  const popupCtx = await context(popupOptions);
  await Promise.all([bgCtx.watch(), popupCtx.watch()]);
  console.log('[esbuild] Watching for changes...');
} else {
  copyAssets();
  await Promise.all([build(backgroundOptions), build(popupOptions)]);
  console.log('[esbuild] Build complete');
}
