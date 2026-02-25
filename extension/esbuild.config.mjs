import { build, context } from 'esbuild';

const isWatch = process.argv.includes('--watch');

const options = {
  entryPoints: ['src/background.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  target: 'chrome120',
  sourcemap: true,
  minify: !isWatch,
  logLevel: 'info',
};

if (isWatch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log('[esbuild] Watching for changes...');
} else {
  await build(options);
  console.log('[esbuild] Build complete');
}
