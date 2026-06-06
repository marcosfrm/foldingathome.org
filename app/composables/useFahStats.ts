// Live stats from the public Folding@home API.
//   /user-count  -> lifetime contributor count (number)
//   /team/count  -> lifetime team count (number)
//   /credit-log?count=N -> last N hourly buckets, each with {credits, time}
//                          where `time` is CPU-seconds of work returned.
//
// We surface three numbers used by the landing page hero strip:
//   contributors  total lifetime contributors
//   teams         total lifetime teams
//   computeDays   sum of `time` from credit-log over the requested window,
//                 expressed as device-days of donated compute.
//
// Fetched only on the client (server: false) so the static export doesn't
// embed stale numbers, and refreshed periodically while the page is open
// so the device-days figure stays current.

const API = 'https://api.foldingathome.org'

export interface FahStats {
  contributors: number
  teams: number
  computeDays: number       // device-days of compute in the window
  windowHours: number       // number of hours summed
}

export const useFahStats = (windowHours = 24, refreshMs = 60_000) => {
  const result = useAsyncData<FahStats>('fah-stats', async () => {
    const safe = async <T>(p: Promise<T>, fallback: T): Promise<T> => {
      try { return await p } catch { return fallback }
    }

    const [contributors, teams, log] = await Promise.all([
      safe($fetch<number>(`${API}/user-count`), 0),
      safe($fetch<number>(`${API}/team/count`), 0),
      safe($fetch<Array<{ts: string; credits: number; time: number}>>(
        `${API}/credit-log?count=${windowHours}`), []),
    ])

    const seconds = log.reduce((s, row) => s + (row.time || 0), 0)
    const computeDays = seconds / 86400

    return { contributors, teams, computeDays, windowHours }
  }, {
    default: () => ({contributors: 0, teams: 0, computeDays: 0, windowHours}),
    server: false,
  })

  if (import.meta.client && refreshMs > 0) {
    let timer: ReturnType<typeof setInterval> | null = null
    onMounted(() => {
      timer = setInterval(() => result.refresh(), refreshMs)
    })
    onBeforeUnmount(() => {
      if (timer) clearInterval(timer)
    })
  }

  return result
}
