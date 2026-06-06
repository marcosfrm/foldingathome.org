<script>
import DownloadFile from './DownloadFile.vue'

export default {
  name: 'DownloadRelease',
  components: { DownloadFile },
  props: {
    release: { type: Object, required: true },
    iconBase: { type: String, required: true },
  },
  methods: {
    osImage(os) {
      const slug = os.toLowerCase().replaceAll(' ', '_')
      return `${this.iconBase}/${slug}.png`
    },
  },
}
</script>

<template lang="pug">
.fah-release
  .fah-release-header
    h3.fah-oses {{ release.oses.join(' / ') }}
    .fah-os-logos
      img(v-for="os in release.oses" :key="os" :src="osImage(os)" :alt="os")

  p.fah-notes(v-if="release.notes") {{ release.notes }}

  ul
    DownloadFile(v-for="file in release.files" :key="file" :file="file" :icon-base="iconBase")
</template>

<style lang="stylus" scoped>
.fah-release
  padding 0.75rem
  margin 0.5rem 0
  background #ddd
  min-height 64px
  border-radius 0.6rem

  .fah-release-header
    display flex
    align-items center
    gap 0.75rem

    .fah-oses
      margin 0
      font-size 1rem

    .fah-os-logos
      flex 1
      text-align right

      img
        height 28px
        width auto
        margin-left 0.35rem
        vertical-align middle

  .fah-notes
    margin 0.25rem 0 0.5rem

  ul
    margin 0
    padding 0
</style>
