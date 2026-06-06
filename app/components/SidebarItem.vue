<script setup lang="ts">
import type { Item } from '~/utils/sections'

const props = withDefaults(defineProps<{
  item: Item
  currentPath?: string
  /** 1-based depth — used to scale font-size and decide auto-expand. */
  depth: number
  /**
   * Set by a parent whose own subtree contains the current page. Forces
   * this item (and its descendants) to expand even if the current path
   * isn't inside *this* specific subtree — handy for showing all sibling
   * groupings while the user browses one of them (e.g. all three disease
   * categories stay open while on any disease page).
   */
  forceExpand?: boolean
}>(), { forceExpand: false })

const trimSlashes = (s: string) => s.replace(/^\/+/, '').replace(/\/+$/, '')

const isAncestor = (to?: string, current?: string) => {
  if (!to || current === undefined) return false
  const t = trimSlashes(to)
  if (!t) return false
  return current === t || current.startsWith(t + '/')
}

const isActive = (i: Item, current?: string) =>
  current !== undefined && !!i.to && i.to === `/${current}`

// Whether this item is a "category" container — all its direct children
// have further children themselves. Categories always render their child
// list so the user can see the available sub-groups (the deeper leaf
// lists collapse on their own). Flat containers of leaves collapse as a
// whole unless the user is browsing inside.
const isCategory = computed(() =>
  !!props.item.items?.length && props.item.items.every(c => !!c.items?.length),
)

const showChildren = computed(() => {
  if (!props.item.items?.length) return false
  if (props.forceExpand) return true
  // Top-level categories expand their label list (each category then
  // manages its own grandchildren independently).
  if (props.depth < 2 && isCategory.value) return true
  return isAncestor(props.item.to, props.currentPath)
})

// Propagate force-expand to grandchildren once the current page enters this
// item's subtree (or we were already force-expanded from above).
const childForceExpand = computed(() =>
  props.forceExpand || isAncestor(props.item.to, props.currentPath),
)
</script>

<template lang="pug">
li(:class="{ active: isActive(item, currentPath), [`depth-${depth}`]: true }")
  a(v-if="item.external" :href="item.href" target="_blank" rel="noopener") {{ item.label }}
  NuxtLink(v-else :to="item.to") {{ item.label }}
  ul(v-if="showChildren")
    SidebarItem(
      v-for="child in item.items"
      :key="child.to || child.href"
      :item="child"
      :current-path="currentPath"
      :depth="depth + 1"
      :force-expand="childForceExpand"
    )
</template>

<style lang="stylus" scoped>
li
  border-bottom 1px solid box-bg

li > ul
  list-style none
  padding 0
  margin 0 0 0 1rem

  // Nested lists shouldn't double-up the bottom border on their last child;
  // the outer item already has one.
  > li:last-child
    border-bottom none

li.depth-1 > a
  display block
  padding 0.6rem 0
  color text-color
  text-decoration none
  font-size 0.95rem

li.depth-2 > a
  display block
  padding 0.4rem 0
  color text-color
  text-decoration none
  font-size 0.9rem
  font-weight 700

li.depth-3 > a
  display block
  padding 0.3rem 0
  color text-color
  text-decoration none
  font-size 0.85rem

li > a:hover
  color primary

li.active > a
  color primary
  font-weight 700

li > a[target="_blank"]::after
  content '↗'
  margin-left 0.3em
  font-size 0.85em
  opacity 0.7
</style>
