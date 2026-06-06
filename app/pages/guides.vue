<script setup lang="ts">
// Pages (and the guides hierarchy) will move to the filesystem; this
// auto-forwards to the current latest. Bump when a new v8-* guide ships.
const LATEST = '/guides/v8-5'

await navigateTo(LATEST, { replace: true })
</script>

<template lang="pug">
.redirecting Redirecting to the latest guide…
</template>

<style lang="stylus" scoped>
.redirecting
  max-width container-max
  margin 0 auto
  padding 3rem 1.5rem
  opacity 0.7
</style>
