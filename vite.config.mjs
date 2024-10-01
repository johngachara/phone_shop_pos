import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
    base: './',
    plugins: [
        react(),
        VitePWA({
            strategies: 'injectManifest',
            srcDir: 'public',
            filename: 'serviceWorker.js',
            injectRegister: 'auto',
            workbox: {
                swSrc: 'public/serviceWorker.js',
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                runtimeCaching: [],
            },
            manifest: {
                name: 'SHOP 2',
                short_name: 'ALLTECH',
                description: 'POS',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'public/logo192.png',
                        sizes: [96, 128, 192, 256, 384, 512],
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],
    server: {
        open: false,
        port: 3000,
        historyApiFallback: true,
    },
    resolve: {
        alias: {
            screens: path.resolve(__dirname, './src/screens'),
            components: path.resolve(__dirname, './src/components'),
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    build: {
        outDir: 'build',
        rollupOptions: {
            input: {
                main: 'index.html',
                'service-worker': 'public/serviceWorker.js',
            }
        }
    },
});