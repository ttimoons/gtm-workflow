import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { projectsApiPlugin } from './plugins/projectsApi'
import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [react(), tailwindcss(), projectsApiPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
