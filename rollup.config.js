import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import postcss from 'rollup-plugin-postcss';

const isProd = process.env.BUILD === 'production';

export default {
  input: 'main.ts',
  output: {
    dir: '.',
    sourcemap: 'inline',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian'],
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      emitCss: true
    }),
    postcss({
      extract: 'styles.css',
      minimize: isProd
    }),
    typescript(),
    nodeResolve({ browser: true }),
    commonjs()
  ]
};
