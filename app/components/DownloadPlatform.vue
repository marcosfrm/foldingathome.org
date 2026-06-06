<script>
import DownloadRelease from './DownloadRelease.vue'

export default {
  name: 'DownloadPlatform',
  components: { DownloadRelease },
  props: {
    platform: { type: Object, required: true },
    iconBase: { type: String, required: true },
  },
}
</script>

<template lang="pug">
.fah-platform
  .fah-platform-header
    .fah-title {{ platform.title }}
    .fah-targets ({{ platform.targets }})
    a.fah-help(v-if="platform.guide" :href="platform.guide" target="_blank" rel="noopener")
      img(:src="iconBase + '/guide.png'" alt="Install Guide")

  .fah-notes(v-if="platform.notes") {{ platform.notes }}

  DownloadRelease(v-for="release in platform.groups" :key="release.oses.join('-')" :release="release" :icon-base="iconBase")
</template>

<style lang="stylus" scoped>
.fah-platform
  padding 0.75rem
  margin 1rem 0
  background #eee
  border-radius 0.6rem

  .fah-platform-header
    display flex
    align-items baseline
    gap 0.5rem
    flex-wrap wrap

    .fah-title
      font-weight 700
      font-size 1.5rem
      font-family font-headings

    .fah-targets
      opacity 0.7
      font-size 0.85rem

    .fah-help
      flex 1
      text-align right

      img
        height 24px
        width auto

  .fah-notes
    margin 0.5rem 0
    font-style italic
    opacity 0.85
</style>
