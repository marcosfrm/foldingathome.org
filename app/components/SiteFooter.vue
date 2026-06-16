<template lang="pug">
footer.site-footer
  .sponsor-band(v-if="sponsors.length")
    ul.sponsors
      li(v-for="s in sponsors" :key="s.id")
        a(v-if="s.url" :href="s.url" target="_blank" rel="noopener" :title="s.name")
          img(:src="assetUrl(s.id)" :alt="s.name")
        img(v-else :src="assetUrl(s.id)" :alt="s.name")
  .copyright
    p © {{ year }} Folding@home.
</template>

<script>
export default {
  name: 'SiteFooter',
  data() {
    return {
      year: new Date().getFullYear(),
      sponsors: [
        { id: 'ed7cc68b-ddcb-45e4-82c3-843e9529f17b', name: 'Nvidia',      url: null },
        { id: 'cc118411-20a5-441c-8033-e2121c586fa8', name: 'Avast',       url: null },
        { id: 'e8948dd7-1ba5-4f99-9ce1-ad0f1438ac91', name: 'Arm',         url: null },
        { id: 'c6c127b5-7f62-48c8-980f-31a285d2cd7a', name: 'AMD',         url: null },
        { id: '0457493a-e91f-49e9-9109-14bcb03895a9', name: 'Microsoft',   url: null },
        { id: '15a41225-1f8f-4817-a151-ec578818a3ca', name: 'Pure Storage', url: null },
        { id: '9643ae22-e552-405f-b8f8-a9661fd82123', name: 'VMware',      url: null },
        { id: 'b3890cdb-73c6-4224-b55f-b235e05b8288', name: 'Oracle',      url: null },
        { id: '8e824fb1-d7fb-46ec-bb49-178871d1993c', name: 'Neocortix',   url: null },
        { id: 'b4eb8c34-df4b-4ca5-87f8-e5042a122630', name: 'AWS',         url: null },
        { id: 'd90d7f7a-95b2-443f-930e-3ccb8131264e', name: 'Intel',       url: null },
      ],
    }
  },
  methods: { assetUrl },
}
</script>

<style lang="stylus" scoped>
.site-footer
  margin-top 3rem
  background dark-bg
  color text-light

  // Full-bleed light strip behind the sponsor logos.
  .sponsor-band
    background #eee
    padding 1rem 1.5rem

  .sponsors
    list-style none
    padding 0
    margin 0 auto
    max-width container-max
    display flex
    flex-wrap wrap
    align-items center
    justify-content center
    gap 1rem 2rem

  .sponsors li
    display inline-flex
    align-items center

  .sponsors img
    display block
    height 24px
    width auto

  .copyright
    padding 2rem 1.5rem
    text-align center

  .copyright p
    margin 0
    font-size 0.9rem
</style>
