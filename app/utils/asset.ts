// Asset URLs resolve to the API's scaled web rendition (max 1024x1024,
// falls back to the original for non-image types).  Auto-imported by Nuxt.

export const assetUrl = (id: string) =>
  `${useRuntimeConfig().public.apiUrl}/asset/${id}/web`
