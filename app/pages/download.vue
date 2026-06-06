<script setup lang="ts">
import { SECTION_OVERRIDES, groupsFromOverride } from '~/utils/sections'

const sidebarGroups = groupsFromOverride(SECTION_OVERRIDES.download!)

// Latest user guide slug. Hardcoded for now — the guides collection is small
// and the catch-all /guides route already redirects to the newest entry.
const latestGuide = { slug: 'guides/v8-5', label: 'v8.5 Client Users Guide' }

useHead({ title: 'Download — Folding@home' })
</script>

<template lang="pug">
.layout.has-sidebar
  SectionSidebar(:groups="sidebarGroups" current-path="download")
  article.page
    header.page-head
      h1.section-title Start folding
      p.lede Become part of a global supercomputer fighting disease.
    .body
      p
        | While you are going about your everyday activities, your computer
        | will be working to help find cures for diseases like cancer, ALS,
        | Parkinson's, Huntington's, influenza and many others.
      h3 Choose your software
      p Here you will find the latest releases of the Folding@home client software.
      p
        | For help with the software see the #[NuxtLink(:to="`/${latestGuide.slug}`") {{ latestGuide.label }}].
        | Choose the client most appropriate for your system.
      ClientOnly
        DownloadPicker(release="public" mode="release")
        template(#fallback)
          p.fah-fallback Loading downloads…

      .previous-releases
        a(href="https://download.foldingathome.org/releases/public/fah-uninstaller/macos-12-universal/release/fah-uninstaller_0.1.7_all.pkg") macOS uninstaller →
      .previous-releases
        a(href="https://download.foldingathome.org/releases/" target="_blank" rel="noopener") Browse all previous releases →
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
  margin 0 0 2.5rem

.section-title
  font-family font-headings
  font-weight 700
  text-transform uppercase
  font-size clamp(2rem, 4.5vw, 3.25rem)
  line-height 1.05
  margin 0 0 1rem

.lede
  font-size 1.15rem
  line-height 1.5
  margin 0
  max-width 48rem

.body
  line-height 1.7

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
