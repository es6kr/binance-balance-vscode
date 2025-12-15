import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    // VSCode extension specific configuration
    build: {
        // Target Node.js environment for VSCode extension
        target: 'node18',

        // Library mode for extension
        lib: {
            entry: resolve(__dirname, 'src/extension.ts'),
            name: 'extension',
            fileName: 'extension',
            formats: ['cjs'],
        },

        // Output configuration
        outDir: 'out',

        // Rollup options for VSCode extension
        rollupOptions: {
            // External dependencies that should not be bundled
            external: ['vscode', 'crypto', 'fs', 'path', 'url', 'http', 'https', 'os', 'util'],

            output: {
                // CommonJS format for VSCode
                format: 'cjs',
                entryFileNames: 'extension.js',
            },
        },

        // Generate source maps for debugging
        sourcemap: true,

        // Minify in production mode
        minify: process.env.NODE_ENV === 'production',
    },

    // Configure for Node.js environment
    ssr: {
        target: 'node',
        noExternal: [],
    },

    // Resolve configuration
    resolve: {
        extensions: ['.ts', '.js'],
    },

    // Define environment variables
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
});
