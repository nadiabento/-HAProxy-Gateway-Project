import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O frontend chama sempre /api (caminho relativo), tal como no esquema:
// browser → HAProxy → Frontend (NGINX) → /api → API.
// Em produção (Docker) quem encaminha o /api é o nginx.conf.
// Em desenvolvimento (npm run dev / npm run preview) é este proxy, para a API em localhost:3000.
const api = { '/api': { target: 'http://localhost:3000', changeOrigin: true } }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: api },
  preview: { proxy: api },
})