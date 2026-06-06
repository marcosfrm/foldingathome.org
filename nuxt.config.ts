import { fileURLToPath } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'

const tokens = readFileSync(
  fileURLToPath(new URL('./app/assets/styles/tokens.styl', import.meta.url)),
  'utf8',
)

// .env.local (gitignored) overrides values from .env / hardcoded defaults.
// Use it to point dev at api3.foldingathome.org or any other instance:
//   NUXT_PUBLIC_API_URL=https://api3.foldingathome.org
const envLocal = fileURLToPath(new URL('./.env.local', import.meta.url))
if (existsSync(envLocal))
  for (const line of readFileSync(envLocal, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m) process.env[m[1]] = m[2]
  }

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  ssr: true,

  modules: ['@nuxt/image'],

  runtimeConfig: {
    public: {
      apiUrl: 'https://api.foldingathome.org',
    },
  },

  // Hybrid rendering: filesystem-backed pages are prerendered at build
  // time; API-backed routes (news, RSS, sitemap, asset binaries) render
  // on demand. CloudFlare caches the dynamic responses downstream.
  routeRules: {
    '/news':           { prerender: false },
    '/news/**':        { prerender: false },
    '/news/rss.xml':   { prerender: false },
    '/sitemap.xml':    { prerender: false },
    '/assets/**':      { prerender: false },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: ['/'],
    },
  },

  css: ['~/assets/styles/global.styl'],

  image: { provider: 'ipx' },

  site: { url: 'https://foldingathome.org', name: 'Folding@home' },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Raleway:wght@400;700&display=swap',
        },
      ],
    },
  },


  vite: {
    css: {
      preprocessorOptions: {
        stylus: { additionalData: tokens + '\n' },
      },
    },
  },
})
