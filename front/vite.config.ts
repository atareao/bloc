import path from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                {
                    src: 'src/assets/logo.svg',
                    dest: 'images'
                }
            ]
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, 'src/'),
        }
    }
})

