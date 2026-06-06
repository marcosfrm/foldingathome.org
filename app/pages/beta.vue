<script setup lang="ts">
import { SECTION_OVERRIDES, groupsFromOverride } from '~/utils/sections'

const sidebarGroups = groupsFromOverride(SECTION_OVERRIDES.beta!)
const latestGuide = { slug: 'guides/v8-5', label: 'v8.5 Client Users Guide' }

useHead({ title: 'Beta — Folding@home' })
</script>

<template lang="pug">
.layout.has-sidebar
  SectionSidebar(:groups="sidebarGroups" current-path="beta")
  article.page
    header.page-head
      h1.section-title Beta
    .body
      p
        | Here you will find the latest #[b beta] release of the Folding@home
        | client software.  This is testing software.  Only use it if you are
        | a Folding@home tester or were directed to do so by our support team.

      p
        | For help with this software see the
        | #[NuxtLink(:to="`/${latestGuide.slug}`") {{ latestGuide.label }}].
        | Choose the client most appropriate for your system. If you want
        | the latest non-beta release, visit #[NuxtLink(to="/download") Start folding].
      h3 Release packages
      ClientOnly
        DownloadPicker(release="beta" mode="release")
        template(#fallback)
          p.fah-fallback Loading downloads…
      h3 Debug packages
      ClientOnly
        DownloadPicker(release="beta" mode="debug")
        template(#fallback)
          p.fah-fallback Loading downloads…
      .previous-releases
        a(href="https://download.foldingathome.org/" target="_blank" rel="noopener") Browse all previous releases →
</template>

<style lang="stylus" scoped>
.layout
  max-width container-max
  margin 0 auto
  padding 3rem 1.5rem

.layout.has-sidebar
  display grid
  grid-template-columns 240px 1fr
  gap 3rem

.page
  min-width 0

.page-head
  margin 0 0 2rem

.section-title
  font-family font-headings
  font-weight 700
  text-transform uppercase
  font-size clamp(2rem, 4.5vw, 3.25rem)
  line-height 1.05
  margin 0 0 1rem

.body
  line-height 1.7

  h3
    margin-top 2.25rem

  .fah-fallback
    opacity 0.7
    font-style italic

  .previous-releases
    margin-top 2.5rem
    padding 1rem 1.25rem
    border-left 4px solid primary
    background #fff

  .previous-releases a
    font-family font-headings
    text-transform uppercase
    letter-spacing 0.04em
    font-size 0.95rem

@media (max-width: 720px)
  .layout.has-sidebar
    grid-template-columns 1fr
    gap 1.5rem
</style>
