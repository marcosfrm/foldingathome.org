# foldingathome.org

The Folding@home public website. Nuxt 4 app, hybrid rendered:

- **Pages** (`/about`, `/diseases/*`, `/faq/*`, `/guides/*`, …) live in
  `content/pages/<slug>/{index.html,meta.json}` and are statically
  prerendered at build time.
- **Articles, RSS, sitemap, asset binaries** are server-rendered on
  demand from the F@h API. CloudFlare caches the responses.

## Architecture

```
┌───────────────────────────────────────────────────────┐
│  Browser                                              │
└──────────────────────────────┬────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────┐
│  CloudFlare (caches everything by URL)                │
└──────────────────────────────┬────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────┐
│  nginx → Nuxt SSR (node)                              │
│                                                       │
│    static  - content/pages/**, public/**, _nuxt/**    │
│    SSR     - /news, /news/<slug>, /news/rss.xml,      │
│               /sitemap.xml, /assets/<uuid>            │
└──────────────────────────────┬────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────┐
│  api.foldingathome.org (jmpapi + MariaDB)             │
│                                                       │
│   /article, /article/<slug>, /paper, /asset/<uuid>, … │
│   Schema/procs live in the fah-cms repo               │
└───────────────────────────────────────────────────────┘
```

Page bodies still reference `/assets/<uuid>` URLs. The Nuxt server route
at `server/routes/assets/[id].get.ts` fetches the base64-encoded blob
from the API, decodes it, and streams binary with the stored Content-Type.

## Layout

```
content/pages/<slug>/index.html   page body (HTML)
content/pages/<slug>/meta.json    {title, created, updated}

app/pages/index.vue               landing page
app/pages/[...slug].vue           filesystem-backed page renderer
app/pages/news/index.vue          news list (API)
app/pages/news/[slug].vue         single article (API)
app/utils/api.ts                  apiFetch() helper
app/utils/nav.ts                  top-nav definition (single source)
app/utils/sections.ts             per-section sidebar overrides

server/routes/news/rss.xml.ts     RSS feed
server/routes/sitemap.xml.ts      sitemap
server/routes/assets/[id].get.ts  /assets/<uuid> → API binary glue
```

## Configuration

Public default — built into `nuxt.config.ts`:

```
apiUrl = https://api.foldingathome.org
```

Override per-environment with a (gitignored) `.env.local`:

```
NUXT_PUBLIC_API_URL=https://api3.foldingathome.org
```

Same override applies at runtime — set `NUXT_PUBLIC_API_URL` in the
systemd unit's `Environment=` on prod.

## Local development

```
pnpm install
pnpm dev            # http://localhost:3000
```

`pnpm dev` reads `.env.local` for API overrides.

## Build

```
pnpm build
```

Output:

```
.output/public/    prerendered HTML + hashed _nuxt/ assets
.output/server/    Nuxt SSR Node app (run with `node .output/server/index.mjs`)
```

## Deploy

Files live under `/var/www/foldingathome.org/` on prod. The Nuxt SSR app
runs as `www-data` under systemd, listening on `127.0.0.1:3000`; nginx
proxies, CloudFlare caches.

```
/var/www/foldingathome.org/public/   prerendered HTML + hashed _nuxt assets
/var/www/foldingathome.org/server/   Nuxt SSR Node app (index.mjs + chunks)
/etc/foldingathome.org/web.env       optional Environment= overrides
/etc/systemd/system/foldingathome-web.service
```

### First-time setup (once per host)

Prerequisite: Node ≥ 20 and rsync on the host. Push the deploy tree,
then run the installer as root:

```
rsync -az deploy/ <host>:/tmp/foldingathome-deploy/
ssh <host> sudo /tmp/foldingathome-deploy/install.sh
```

The installer creates `/var/www/foldingathome.org/{public,server}`,
installs and enables the systemd unit, and creates an empty
`/etc/foldingathome.org/web.env`. To override the default API URL
or port, edit that file:

```
NUXT_PUBLIC_API_URL=https://api.foldingathome.org
NITRO_PORT=3000
```

### Every deploy

```
deploy/deploy.sh <ssh-target>
```

Builds locally, rsyncs `.output/{public,server}/` to the host, restarts
`foldingathome-web.service`. Default ssh target is `foldingathome.org`.

### Operate

```
sudo systemctl restart foldingathome-web
sudo systemctl status foldingathome-web
journalctl -u foldingathome-web -f
```

## Editing content

- **Pages**: edit `content/pages/<slug>/index.html` directly, commit,
  redeploy. `meta.json` controls title + dates.
- **Articles, papers, assets**: edited via the CMS UI against the
  F@h API. No website rebuild needed — the SSR fetches fresh on each
  uncached request and CloudFlare's cache expires on its own schedule.
