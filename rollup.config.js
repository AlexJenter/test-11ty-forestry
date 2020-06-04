import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'

const dev = process.env.NODE_ENV !== 'production'

export default {
	input: 'source/_scripts/_main.js',
	output: {
		sourcemap: false,
		format: 'iife',
		name: 'main',
		file: 'dist/assets/main.bundle.js',
	},
	plugins: [
		replace({
			DEV_MODE: dev,
		}),
		svelte({
			dev,
		}),
		resolve({
			browser: true,
			dedupe: (importee) =>
				importee === 'svelte' || importee.startsWith('svelte/'),
		}),
		commonjs(),
		!dev && terser(),
	],
	watch: {
		clearScreen: false,
	},
}
