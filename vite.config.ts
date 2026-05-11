import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { projectsApiPlugin } from './plugins/projectsApi'
import pkg from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const authPort = env.AUTH_PORT || ''

  // When an auth server is running, skip the local projects plugin
  // and let the Vite proxy forward /api/projects to the auth server (→ Drive).
  const plugins = [react(), tailwindcss()]
  if (!authPort) plugins.push(projectsApiPlugin())

  return {
    plugins,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: authPort ? {
      proxy: {
        '/api/auth': {
          target: `http://localhost:${authPort}`,
          changeOrigin: true,
        },
        '/api/projects': {
          target: `http://localhost:${authPort}`,
          changeOrigin: true,
        },
      },
    } : {},
  }
})
