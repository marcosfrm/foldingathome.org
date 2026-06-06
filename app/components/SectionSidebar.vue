<script setup lang="ts">
import type { Group } from '~/utils/sections'

defineProps<{
  groups: Group[]
  // Current pathname (without leading or trailing slashes). Used to mark
  // active items. Pass undefined to skip active-state highlighting.
  currentPath?: string
}>()
</script>

<template lang="pug">
aside.sidebar(v-if="groups.some(g => g.items.length)")
  .group(v-for="g in groups" :key="g.title || 'group'")
    .group-title(v-if="g.title") {{ g.title }}
    ul
      SidebarItem(
        v-for="i in g.items"
        :key="i.to || i.href"
        :item="i"
        :current-path="currentPath"
        :depth="1"
      )
</template>

<style lang="stylus" scoped>
.sidebar
  align-self start
  position sticky
  top 1.5rem

  .group
    margin-bottom 1.5rem

  .group:last-child
    margin-bottom 0

  .group-title
    font-family font-headings
    font-weight 700
    font-size 1.05rem
    text-transform uppercase
    letter-spacing 0.05em
    padding 0.5rem 0
    color text-color
    border-bottom 2px solid primary
    margin-bottom 0.5rem

  ul
    list-style none
    padding 0
    margin 0

@media (max-width: 720px)
  .sidebar
    position static
</style>
