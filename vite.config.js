import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Link previews (LinkedIn, WhatsApp, Slack) need an absolute og:image URL.
// Set VITE_SITE_URL=https://your-domain.com at build time (or in a .env file) once the site has an address.
function siteUrl(site) {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => ({
      html: html.replaceAll('%SITE%', site),
      tags: site
        ? [
            { tag: 'link', attrs: { rel: 'canonical', href: `${site}/` }, injectTo: 'head' },
            { tag: 'meta', attrs: { property: 'og:url', content: `${site}/` }, injectTo: 'head' },
          ]
        : [],
    }),
  }
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env }
  const site = (env.VITE_SITE_URL || '').replace(/\/+$/, '')
  return { plugins: [react(), siteUrl(site)] }
})
