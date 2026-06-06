// Tiny client for the F@h API.  Auto-imported by Nuxt.  Anonymous reads
// only — published articles/papers/assets are public, no token needed.

export const apiFetch = <T = unknown>(path: string, opts: Record<string, unknown> = {}) => {
  const cfg = useRuntimeConfig()
  const url = path.startsWith('/') ? path : '/' + path
  return $fetch<T>(`${cfg.public.apiUrl}${url}`, opts)
}
