// Sitemap. Pulls published article slugs from the API; pages are static
// (and TODO: should be enumerated from the filesystem once they live in
// content/pages/).

import type { ArticleListItem } from '~/types/api'

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;')
   .replace(/</g, '&lt;')
   .replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;')
   .replace(/'/g, '&apos;')

const isoOrNow = (d?: string | null) =>
  d ? new Date(d).toISOString() : new Date().toISOString()

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const site = 'https://foldingathome.org'

  const articles = await $fetch<ArticleListItem[]>(
    `${cfg.public.apiUrl}/article?status=published&limit=10000`,
  )

  const urls: { loc: string; lastmod: string }[] = [
    { loc: '/',     lastmod: new Date().toISOString() },
    { loc: '/news', lastmod: new Date().toISOString() },
  ]
  for (const a of articles)
    urls.push({ loc: `/news/${a.slug}`, lastmod: isoOrNow(a.updated || a.published || a.created) })

  const body = urls.map(u =>
    `  <url><loc>${xmlEscape(site + u.loc)}</loc><lastmod>${u.lastmod}</lastmod></url>`,
  ).join('\n')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
})
