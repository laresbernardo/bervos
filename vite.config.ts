import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync, existsSync, writeFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

/**
 * Local dev middleware allowing full CRUD & redirect testing of short links
 * on localhost:2000 even before deploying Cloud Functions to production.
 */
function localLinksDevPlugin() {
  const localFile = './links-dev.json'
  const loadLinks = () => {
    try {
      if (existsSync(localFile)) {
        return JSON.parse(readFileSync(localFile, 'utf-8'))
      }
    } catch {
      // Fallback
    }
    return [
      {
        id: 'portfolio',
        slug: 'portfolio',
        destinationUrl: 'https://bervos.org',
        title: 'Main BERVOS Website',
        clickCount: 14,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        firstClickedAt: new Date(Date.now() - 86400000).toISOString(),
        lastClickedAt: new Date().toISOString(),
        isActive: true,
        createdBy: 'laresbernardo@gmail.com',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'github',
        slug: 'github',
        destinationUrl: 'https://github.com/laresbernardo',
        title: 'Bernardo Lares GitHub Profile',
        clickCount: 32,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        firstClickedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        lastClickedAt: new Date(Date.now() - 3600000).toISOString(),
        isActive: true,
        createdBy: 'laresbernardo@gmail.com',
        updatedAt: new Date().toISOString()
      }
    ]
  }

  const saveLinks = (links: any[]) => {
    try {
      writeFileSync(localFile, JSON.stringify(links, null, 2))
    } catch {}
  }

  return {
    name: 'local-links-dev-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost:2000'}`)
        const pathname = url.pathname

        if (pathname === '/api/links' || pathname.startsWith('/api/links/')) {
          res.setHeader('Content-Type', 'application/json')

          if (req.method === 'GET') {
            const links = loadLinks()
            res.end(JSON.stringify({ links }))
            return
          }

          if (req.method === 'POST') {
            if (pathname === '/api/links/reset-all') {
              const links = loadLinks()
              const now = new Date().toISOString()
              links.forEach((l: any) => {
                l.clickCount = 0
                l.firstClickedAt = null
                l.lastClickedAt = null
                l.lastResetAt = now
                l.updatedAt = now
              })
              saveLinks(links)
              res.end(JSON.stringify({ success: true, count: links.length, resetAt: now }))
              return
            }

            let body = ''
            req.on('data', (chunk: any) => (body += chunk))
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}')
                const links = loadLinks()
                let cleanSlug = (parsed.slug || '').trim().toLowerCase()
                if (!cleanSlug) {
                  cleanSlug = Math.random().toString(36).substring(2, 7)
                }

                let dest = (parsed.destinationUrl || '').trim()
                if (!/^https?:\/\//i.test(dest)) dest = 'https://' + dest

                const now = new Date().toISOString()
                const newLink = {
                  id: cleanSlug,
                  slug: cleanSlug,
                  destinationUrl: dest,
                  title: (parsed.title || '').trim(),
                  clickCount: 0,
                  createdAt: now,
                  firstClickedAt: null,
                  lastClickedAt: null,
                  isActive: true,
                  createdBy: 'laresbernardo@gmail.com',
                  updatedAt: now,
                  lastResetAt: null
                }

                links.unshift(newLink)
                saveLinks(links)
                res.statusCode = 201
                res.end(JSON.stringify({ link: newLink }))
              } catch (e: any) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: e.message }))
              }
            })
            return
          }

          if (req.method === 'PUT') {
            const id = pathname.replace('/api/links/', '').trim().toLowerCase()
            let body = ''
            req.on('data', (chunk: any) => (body += chunk))
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}')
                const links = loadLinks()
                const idx = links.findIndex((l: any) => l.id === id)
                if (idx === -1) {
                  res.statusCode = 404
                  res.end(JSON.stringify({ error: 'Not found' }))
                  return
                }

                if (parsed.resetCounters === true) {
                  links[idx].clickCount = 0
                  links[idx].firstClickedAt = null
                  links[idx].lastClickedAt = null
                  links[idx].lastResetAt = new Date().toISOString()
                }

                if (parsed.destinationUrl) {
                  let dest = parsed.destinationUrl.trim()
                  if (!/^https?:\/\//i.test(dest)) dest = 'https://' + dest
                  links[idx].destinationUrl = dest
                }
                if (typeof parsed.title === 'string') links[idx].title = parsed.title.trim()
                if (typeof parsed.isActive === 'boolean') links[idx].isActive = parsed.isActive
                links[idx].updatedAt = new Date().toISOString()

                saveLinks(links)
                res.end(JSON.stringify({ link: links[idx] }))
              } catch (e: any) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: e.message }))
              }
            })
            return
          }

          if (req.method === 'DELETE') {
            const id = pathname.replace('/api/links/', '').trim().toLowerCase()
            const links = loadLinks()
            const filtered = links.filter((l: any) => l.id !== id)
            saveLinks(filtered)
            res.end(JSON.stringify({ success: true, id }))
            return
          }
        }

        // Local redirection test for short link slugs (e.g. localhost:2000/portfolio)
        const slugMatch = pathname.match(/^\/([a-z0-9-_]{2,60})\/?$/i)
        if (slugMatch) {
          const candidateSlug = slugMatch[1].toLowerCase()
          const reserved = new Set(['api', 'hub', 'social', 'links', 'assets', 'public', 'dist', '@vite', '@fs', '@id'])
          if (!reserved.has(candidateSlug)) {
            const links = loadLinks()
            const found = links.find((l: any) => l.slug === candidateSlug)
            if (found && found.destinationUrl) {
              if (found.isActive === false) {
                res.statusCode = 403
                res.setHeader('Content-Type', 'text/html')
                res.end('<!doctype html><html><head><meta charset="utf-8"><title>Link Inactive | BERVOS</title><style>body{margin:0;background:#080b12;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}a{color:#818cf8;text-decoration:none;margin-top:20px;display:inline-block;padding:8px 16px;border:1px solid rgba(255,255,255,0.1);border-radius:8px}</style></head><body><div><h1>Link Inactive</h1><p>This short link is currently paused.</p><a href="/">Visit BERVOS</a></div></body></html>')
                return
              }
              const isPrefetch = req.headers['purpose'] === 'prefetch' || req.headers['sec-purpose'] === 'prefetch' || req.headers['x-moz'] === 'prefetch';
              if (!isPrefetch) {
                found.clickCount = (found.clickCount || 0) + 1
                const now = new Date().toISOString()
                if (!found.firstClickedAt) found.firstClickedAt = now
                found.lastClickedAt = now
                saveLinks(links)
              }
              res.statusCode = 302
              res.setHeader('Location', found.destinationUrl)
              res.end()
              return
            }
          }
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    localLinksDevPlugin(),
  ],
  server: {
    port: 2000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_USE_EMULATOR === 'true'
          ? 'http://127.0.0.1:5001/bervos-official/us-central1/hubApi'
          : 'https://us-central1-bervos-official.cloudfunctions.net/hubApi',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
