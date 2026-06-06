<script>
export default {
  name: 'DownloadFile',
  props: {
    file: { type: String, required: true },
    iconBase: { type: String, required: true },
  },
}
</script>

<template lang="pug">
li.fah-file
  a(:href="file")
    img(:src="iconBase + '/download.png'" alt="")
    span {{ file.substring(file.lastIndexOf('/') + 1) }}
</template>

<style lang="stylus" scoped>
.fah-file
  list-style none
  margin-left 0
  padding 0.15rem 0

  a
    display inline-flex
    align-items center
    gap 0.4rem
    color primary
    text-decoration none
    word-break break-all

  a:hover
    text-decoration underline

  img
    width 20px
    height 20px
    flex-shrink 0
</style>
