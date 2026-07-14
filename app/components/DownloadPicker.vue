<script>
// Port of the original ~/projects/fah-web/download Vue 3 app into a Nuxt
// component. Fetches platforms.json + per-project meta.json from
// download.foldingathome.org and renders one card per platform. The user's
// detected platform appears first; failures are reported inline so we don't
// pre-render stale data into static HTML (wrap with <ClientOnly>).

import DownloadPlatform from './DownloadPlatform.vue'

export default {
  name: 'DownloadPicker',
  components: { DownloadPlatform },
  props: {
    // Mirror the original `data-*` attrs from the WP markup.
    release:  { type: String, default: 'public' },
    mode:     { type: String, default: 'release' },
    subdir:   { type: String, default: '' },
    projects: { type: [Array, String], default: () => ['fah-client'] },
    base:     { type: String, default: 'https://download.foldingathome.org' },
    // Icons are served locally; data (platforms/meta.json) still comes from base.
    iconBase: { type: String, default: '/images/download' },
  },

  data() {
    return {
      platforms_raw: {},
      files: {},
      loading: true,
      error: null,
    }
  },

  computed: {
    projectList() {
      if (Array.isArray(this.projects)) return this.projects
      return String(this.projects).split(/\s+/).filter(Boolean)
    },

    modeList() {
      return String(this.mode).split(/\s+/).filter(Boolean)
    },

    releaseBase() {
      return this.base + '/releases' + (this.subdir ? '/' + this.subdir : '')
    },

    // Best-effort client platform detection. Matches the original logic.
    clientPlatform() {
      if (typeof navigator === 'undefined') return 'win'
      const p = (navigator.platform || '').toLowerCase()
      if (p.includes('linux')) return 'lin'
      if (p.includes('osx') || p.includes('mac') || p.includes('apple')) return 'osx'
      return 'win'
    },

    platforms() {
      const list = []
      const first = this.clientPlatform
      const order = ['win', 'osx', 'lin'].filter(n => n !== first)
      order.unshift(first)

      for (const name of order) {
        const raw = this.platforms_raw[name]
        if (!raw) continue
        const platform = { ...raw, platform: name }
        platform.groups = raw.groups.map(g => {
          const files = []
          for (const worker of g.workers) {
            const wFiles = this.files[worker] || []
            for (const ext of g.exts) {
              for (const f of wFiles) if (f.endsWith(`.${ext}`)) files.push(f)
            }
          }
          return { ...g, files }
        })
        list.push(platform)
      }
      return list
    },
  },

  async mounted() {
    try {
      await this.fetchPlatforms()
      for (const project of this.projectList) await this.fetchMeta(project)
    } catch (e) {
      this.error = e.message || String(e)
    } finally {
      this.loading = false
    }
  },

  methods: {
    async fetchPlatforms() {
      const r = await fetch(`${this.releaseBase}/platforms.json`)
      if (!r.ok) throw new Error(`platforms.json: ${r.status}`)
      this.platforms_raw = await r.json()
    },

    async fetchMeta(project) {
      const base = `${this.releaseBase}/${this.release}/${project}`
      const r = await fetch(`${base}/meta.json`)
      if (!r.ok) throw new Error(`${project}/meta.json: ${r.status}`)
      const files = await r.json()
      for (const f of files) {
        if (!this.modeList.includes(f.mode)) continue
        const l = this.files[f.worker] = this.files[f.worker] || []
        l.push(`${base}/${f.package}`)
      }
    },
  },
}
</script>

<template lang="pug">
.fah-download-picker
  p.fah-loading(v-if="loading") Loading downloads…
  p.fah-error(v-else-if="error") Could not load downloads: {{ error }}
  DownloadPlatform(
    v-for="platform in platforms"
    :key="platform.platform"
    :platform="platform"
    :icon-base="iconBase"
  )
</template>

<style lang="stylus" scoped>
.fah-download-picker
  max-width 600px

  .fah-loading
    opacity 0.7
    font-style italic

  .fah-error
    color #c00
</style>
