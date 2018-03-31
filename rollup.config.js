import buble from 'rollup-plugin-buble';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';

export default {
  input: 'bin/botium-cli.js',
  output: [
    {
      file: 'dist/botium-cli-es.js',
      format: 'es',
      sourcemap: true
    },
    {
      file: 'dist/botium-cli-cjs.js',
      format: 'cjs',
      sourcemap: true
    }
  ],
  plugins: [
    commonjs({
      exclude: 'node_modules/**'
    }),
    buble(),
    json()
  ]
};
