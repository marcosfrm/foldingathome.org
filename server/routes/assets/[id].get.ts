// Glue route: /assets/<uuid> on the website → /asset/<uuid> on the API.
// The API returns metadata + base64-encoded bytes; we decode and stream as
// binary with the stored Content-Type so <img src="/assets/<uuid>"> works
// transparently in article bodies.

import type { Asset } from '~/types/api'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f0-9-]{36}$/i.test(id))
    throw createError({ statusCode: 400, statusMessage: 'Invalid asset id' })

  const r = await $fetch<Asset>(`${cfg.public.apiUrl}/asset/${id}`)
  if (!r?.data)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })

  setHeader(event, 'Content-Type', r.mime_type || 'application/octet-stream')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return Buffer.from(r.data, 'base64')
})
