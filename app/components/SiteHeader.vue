<template lang="pug">
header.site-header(:class="{ 'menu-open': menuOpen }")
  .inner
    NuxtLink.brand(to="/" aria-label="Folding@home — home" @click="closeMenu")
      div FOLDING
      div #[span @]HOME

    button.hamburger(
      type="button"
      :aria-expanded="menuOpen ? 'true' : 'false'"
      aria-controls="site-nav"
      aria-label="Toggle navigation menu"
      @click="toggleMenu"
    )
      span
      span
      span

    nav#site-nav(:class="{ dismissed, open: menuOpen }")
      ul.main
        li.item(
          v-for="item in nav"
          :key="item.href"
          :class="{ 'has-children': item.children?.length, expanded: expanded === item.href }"
        )
          .row
            a(v-if="item.external" :href="item.href" target="_blank" rel="noopener" @click="onNavClick") {{ item.label }}
            NuxtLink(v-else :to="item.href" @click="onNavClick") {{ item.label }}
            button.expand(
              v-if="item.children?.length"
              type="button"
              :aria-expanded="expanded === item.href ? 'true' : 'false'"
              :aria-label="`Toggle ${item.label} submenu`"
              @click="toggleExpand(item.href)"
            )
          ul.dropdown(v-if="item.children?.length")
            li(v-for="c in item.children" :key="c.href")
              a(v-if="c.external" :href="c.href" target="_blank" rel="noopener" @click="onNavClick") {{ c.label }}
              NuxtLink(v-else :to="c.href" @click="onNavClick") {{ c.label }}
</template>

<script>
import { TOP_NAV } from '~/utils/nav'

export default {
  name: 'SiteHeader',
  data() {
    return {
      dismissed: false,
      menuOpen:  false,
      // href of the section currently expanded inline in the mobile drawer.
      // Only one section open at a time; collapses on close.
      expanded:  null,
      nav: TOP_NAV,
    }
  },

  watch: {
    menuOpen(open) {
      if (typeof document === 'undefined') return
      // Lock background scroll while the drawer is open so swipes inside
      // the drawer don't accidentally scroll the page behind it.
      document.body.style.overflow = open ? 'hidden' : ''
      if (!open) this.expanded = null
    },
    $route() {
      this.closeMenu()
    },
  },

  mounted() {
    window.addEventListener('keydown', this.onKey)
  },

  unmounted() {
    window.removeEventListener('keydown', this.onKey)
    if (typeof document !== 'undefined') document.body.style.overflow = ''
  },

  methods: {
    toggleMenu() {this.menuOpen = !this.menuOpen},
    closeMenu()  {this.menuOpen = false},

    toggleExpand(href) {
      this.expanded = this.expanded === href ? null : href
    },

    onNavClick() {
      this.dismiss()
      this.closeMenu()
    },

    onKey(e) {
      if (e.key === 'Escape' && this.menuOpen) this.closeMenu()
    },

    dismiss() {
      // Suppress hover/focus state long enough for the cursor to be
      // somewhere else by the time it un-suppresses. Desktop only — no-op
      // when the drawer is in use, since taps don't leave a stuck :hover.
      this.dismissed = true
      clearTimeout(this._dismissTimer)
      this._dismissTimer = setTimeout(() => { this.dismissed = false }, 600)
      if (typeof document !== 'undefined') {
        const el = document.activeElement
        if (el && typeof el.blur === 'function') el.blur()
      }
    },
  },
}
</script>

<style lang="stylus" scoped>
.site-header
  background dark-bg
  color text-light
  height navbar-h
  display flex
  align-items center
  position relative
  z-index 100

  .inner
    width 100%
    max-width container-max
    margin 0 auto
    padding 0 1.5rem
    display flex
    align-items center
    justify-content space-between
    gap 2rem

  // Brand mark — two stacked monospace rows with the top row scaled
  // narrower so the @-containing bottom row matches its width.
  brand-size = 27pt
  .brand
    display inline-block
    font-family monospace
    font-weight 700
    font-size brand-size
    line-height 0.8em
    color text-light
    text-decoration none

    > div
      display flex

    > div:nth-child(1)
      font-size 'calc(%s * 5/7)' % brand-size
      transform unquote('scaleY(calc(7/5))')

    > div > span
      margin-top -2px

  .brand:hover
    color primary

  // ---- HAMBURGER ----
  .hamburger
    display none
    width 32px
    height 26px
    background transparent
    border 0
    padding 0
    position relative
    cursor pointer
    flex-shrink 0

  .hamburger span
    position absolute
    left 0
    width 100%
    height 3px
    background text-light
    border-radius 1px
    transition transform 220ms ease, top 220ms ease, opacity 120ms ease

  .hamburger span:nth-child(1)
    top 2px
  .hamburger span:nth-child(2)
    top 50%
    transform translateY(-50%)
  .hamburger span:nth-child(3)
    top auto
    bottom 2px

  &.menu-open .hamburger span:nth-child(1)
    top 50%
    transform translateY(-50%) rotate(45deg)
  &.menu-open .hamburger span:nth-child(2)
    opacity 0
  &.menu-open .hamburger span:nth-child(3)
    top 50%
    bottom auto
    transform translateY(-50%) rotate(-45deg)

  // ---- DESKTOP NAV ----
  nav > ul.main
    list-style none
    margin 0
    padding 0
    display flex
    gap 0
    height navbar-h
    align-items stretch

  .item
    position relative
    display flex
    align-items center
    padding 0 1.5rem

  .item .row
    display contents

  .item > .row > a
    color text-light
    font-family font-headings
    font-size 0.95rem
    text-transform uppercase
    letter-spacing 0.05em
    text-decoration none
    display inline-flex
    align-items center
    gap 0.35em

  .item:hover > .row > a, .item:focus-within > .row > a
    color primary

  // chevron indicator on items that have a dropdown (desktop only — the
  // mobile drawer replaces it with the .expand button).
  .has-children > .row > a::after
    content ''
    display inline-block
    width 0
    height 0
    border-left 4px solid transparent
    border-right 4px solid transparent
    border-top 5px solid currentColor
    margin-left 0.35em
    transform translateY(1px)

  // The mobile-only inline +/− toggle. Hidden by default; the desktop
  // dropdowns are hover-driven and don't need it.
  .expand
    display none
    background transparent
    border 0
    color text-light
    cursor pointer
    width 44px
    height 44px
    position relative
    padding 0
    flex-shrink 0

  .expand::before, .expand::after
    content ''
    position absolute
    left 50%
    top 50%
    width 14px
    height 2px
    background currentColor
    transform translate(-50%, -50%)
    transition transform 200ms ease, opacity 200ms ease

  .expand::after
    transform translate(-50%, -50%) rotate(90deg)

  .item.expanded > .row > .expand::after
    opacity 0

  .dropdown
    list-style none
    margin 0
    padding 0.5rem 0
    position absolute
    top calc(50% + 1.1em)
    left 0.5rem
    min-width 220px
    background dark-bg
    border-top 2px solid primary
    box-shadow 0 8px 16px rgba(0,0,0,0.3)
    visibility hidden
    opacity 0
    transform translateY(-4px)
    transition opacity 120ms, transform 120ms, visibility 0s linear 120ms

  .has-children:hover > .dropdown,
  .has-children:focus-within > .dropdown
    visibility visible
    opacity 1
    transform translateY(0)
    transition opacity 120ms, transform 120ms

  nav.dismissed .dropdown
    visibility hidden !important
    opacity 0 !important
    transition opacity 120ms, transform 120ms, visibility 0s linear 120ms !important

  .dropdown li
    display block

  .dropdown li a
    display block
    padding 0.5rem 1rem
    color text-light
    font-family font-headings
    font-size 0.9rem
    letter-spacing 0.03em
    text-decoration none
    line-height 1.4
    white-space nowrap

  .dropdown li a:hover
    background primary
    color text-light

  .item > .row > a[target="_blank"]::after,
  .dropdown li a[target="_blank"]::after
    content '↗'
    margin-left 0.3em
    font-size 0.85em
    opacity 0.75

// ---- COMPRESSION (inline nav still visible) ----
@media (max-width: 1100px)
  .site-header .inner
    gap 1rem
    padding 0 1rem

  .site-header .item
    padding 0 0.55rem

  .site-header .item > .row > a
    font-size 0.85rem

// ---- HAMBURGER TAKES OVER ----
// 800px is roughly where the inline labels start to feel cramped even
// after compression. Below this we hide the inline nav, show the
// hamburger, and slide the full menu down as a drawer.
@media (max-width: 800px)
  .site-header
    height navbar-h-mobile

  .site-header .hamburger
    display block

  .site-header nav
    position absolute
    top navbar-h-mobile
    left 0
    right 0
    background dark-bg
    max-height "calc(100vh - %s)" % navbar-h-mobile
    overflow-y auto
    border-top 1px solid rgba(255, 255, 255, 0.08)
    box-shadow 0 12px 24px rgba(0, 0, 0, 0.35)
    transform translateY(-8px)
    visibility hidden
    opacity 0
    pointer-events none
    transition opacity 180ms ease, transform 220ms ease, visibility 0s linear 220ms

  .site-header nav.open
    transform translateY(0)
    visibility visible
    opacity 1
    pointer-events auto
    transition opacity 180ms ease, transform 220ms ease

  .site-header nav > ul.main
    flex-direction column
    height auto
    align-items stretch
    gap 0

  .site-header .item
    flex-direction column
    align-items stretch
    padding 0
    border-bottom 1px solid rgba(255, 255, 255, 0.06)

  .site-header .item .row
    display flex
    align-items stretch

  .site-header .item > .row > a
    flex 1
    padding 1rem 1.5rem
    font-size 1rem

  .site-header .has-children > .row > a::after
    display none

  .site-header .expand
    display flex

  // Inline expandable dropdown — replaces the desktop hover popup.
  .site-header .dropdown
    position static
    visibility visible
    opacity 1
    transform none
    background rgba(255, 255, 255, 0.04)
    border-top 0
    box-shadow none
    min-width 0
    padding 0
    max-height 0
    overflow hidden
    transition max-height 240ms ease, padding 240ms ease
    pointer-events none

  .site-header .item.expanded .dropdown
    max-height 60vh
    padding 0.25rem 0
    pointer-events auto

  .site-header .dropdown li a
    padding 0.75rem 2.5rem
    font-size 0.95rem
    white-space normal

  .site-header .dropdown li a:hover
    background rgba(255, 255, 255, 0.06)

  // Override the desktop dismissed rule: in the drawer, dropdowns are
  // tap-driven and shouldn't be hidden by the hover-dismiss machinery.
  .site-header nav.dismissed .item.expanded .dropdown
    visibility visible !important
    opacity 1 !important
</style>
