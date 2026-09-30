import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Local dev: forward /api to a running PHP API, e.g.
//   API_PROXY=https://trendevents.uk npm run dev
const apiProxy = process.env.API_PROXY

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: apiProxy
    ? { proxy: { '/api': { target: apiProxy, changeOrigin: true, secure: true, cookieDomainRewrite: '' } } }
    : undefined,
})
