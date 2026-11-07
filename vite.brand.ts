import type { Plugin } from 'vite'
import path from 'path'
import fs from 'fs'

function normalizeBase(input?: string): string {
  const raw = (input || '/football/').trim() || '/football/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

export function brandConfig() {
  const basePath = normalizeBase(process.env.BASE_PATH)
  const isTest = process.env.APP_ENV === 'test'
  const appName = isTest ? '体坛速递 测试' : '体坛速递'
  const shortName = isTest ? '体坛速递测' : '体坛速递'
  const description = '中文体育新闻聚合 · 足球 篮球 热点'
  return { basePath, isTest, appName, shortName, description, themeColor: '#F6F4EF', backgroundColor: '#F6F4EF' }
}

function buildManifest(cfg: ReturnType<typeof brandConfig>) {
  return {
    name: cfg.appName,
    short_name: cfg.shortName,
    description: cfg.description,
    id: cfg.basePath,
    start_url: cfg.basePath,
    scope: cfg.basePath,
    display: 'standalone',
    background_color: cfg.backgroundColor,
    theme_color: cfg.themeColor,
    orientation: 'portrait-primary',
    prefer_related_applications: false,
    icons: [
      { src: `${cfg.basePath}icon-192-v3.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${cfg.basePath}icon-512-v3.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: `${cfg.basePath}maskable-512-v3.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

function buildServiceWorker(_cfg?: ReturnType<typeof brandConfig>) {
  return `// Service Worker — 让 PWA 可安装 + 离线缓存
const CACHE_NAME = 'tiyu-sudi-v4'
const BASE = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        BASE,
        new URL('manifest.json', BASE).href,
        new URL('apple-touch-icon-v3.png', BASE).href,
        new URL('icon-192-v3.png', BASE).href,
        new URL('icon-512-v3.png', BASE).href,
        new URL('maskable-512-v3.png', BASE).href,
      ])
    ).then(() => self.skipWaiting())
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})
`
}

export function brandPlugin(): Plugin {
  const cfg = brandConfig()
  return {
    name: 'tiyu-brand',
    config() {
      return {
        base: cfg.basePath,
        define: {
          'import.meta.env.VITE_APP_ENV': JSON.stringify(process.env.APP_ENV || 'production'),
          'import.meta.env.VITE_APP_NAME': JSON.stringify(cfg.appName),
        },
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''
        if (url === `${cfg.basePath}manifest.json` || url === '/manifest.json') {
          res.setHeader('Content-Type', 'application/manifest+json')
          res.end(JSON.stringify(buildManifest(cfg), null, 2))
          return
        }
        if (url === `${cfg.basePath}sw.js` || url === '/sw.js') {
          res.setHeader('Content-Type', 'application/javascript')
          res.end(buildServiceWorker(cfg))
          return
        }
        next()
      })
      // local API under base path
      server.config.server.proxy = {
        ...server.config.server.proxy,
        [`${cfg.basePath}api`]: {
          target: 'http://localhost:3001',
          rewrite: (p) => p.replace(new RegExp(`^${cfg.basePath}api`), '/api'),
        },
        [`${cfg.basePath}share`]: {
          target: 'http://localhost:3001',
          rewrite: (p) => p.replace(new RegExp(`^${cfg.basePath}share`), '/share'),
        },
      }
    },
    transformIndexHtml(html) {
      return html
        .replaceAll('__APP_NAME__', cfg.appName)
        .replaceAll('__APP_DESCRIPTION__', cfg.description)
        .replaceAll('__THEME_COLOR__', cfg.themeColor)
        .replaceAll('__BASE_PATH__', cfg.basePath)
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(buildManifest(cfg), null, 2),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: buildServiceWorker(cfg),
      })
    },
    closeBundle() {
      // Ensure public copies used by express.static also get rewritten for preview tools
      const dist = path.resolve(process.cwd(), 'dist')
      try {
        fs.writeFileSync(path.join(dist, 'manifest.json'), JSON.stringify(buildManifest(cfg), null, 2))
        fs.writeFileSync(path.join(dist, 'sw.js'), buildServiceWorker(cfg))
      } catch {
        // dist may not exist in some vite phases
      }
    },
  }
}
