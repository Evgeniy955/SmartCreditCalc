
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Завантажуємо змінні середовища з файлу .env
    // Третій параметр '' означає, що ми завантажуємо ВСІ змінні, а не тільки ті, що починаються з VITE_
    const env = loadEnv(mode, (process as any).cwd(), '');

    return {
        plugins: [react()],
        define: {
            // Замінюємо process.env.API_KEY у коді на значення з файлу .env
            'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
        }
    }
})
