import esbuild from 'esbuild';
import path from 'path';

esbuild.build({
  entryPoints: [path.resolve(path.dirname(new URL(import.meta.url).pathname), 'index.ts')],
  bundle: true,
  platform: 'node',
  target: ['node14'],
  outfile: path.resolve(path.dirname(new URL(import.meta.url).pathname), 'index.js'),
  external: [],
  sourcemap: true,
  minify: false,
}).catch(() => process.exit(1));
