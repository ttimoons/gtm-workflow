import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { projectsApiPlugin } from './plugins/projectsApi'

export default defineConfig({
  plugins: [react(), tailwindcss(), projectsApiPlugin()],
})
