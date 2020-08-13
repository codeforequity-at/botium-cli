import babel from 'rollup-plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

export default {
  input: 'src/index.js',
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
    babel({
      exclude: 'node_modules/**',
      runtimeHelpers: true
    }),
    json()
  ]
}
