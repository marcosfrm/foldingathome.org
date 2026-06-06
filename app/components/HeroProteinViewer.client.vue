<script>
// Ported from fah-web-client-bastet/src/Visualization.vue. Reuses the same
// atom/bond drawing, Phong materials, Preetham sky and infinite grid as the
// in-client visualizer so the landing page hero matches what users see in
// the F@H app.
//
// Differences from the source:
//   - No `mach`/socket dependency: topology is fetched from a static URL.
//   - Single static frame; no wiggle / frame stepping.
//   - Auto-rotate by default; interactivity is opt-in via the `interactive`
//     prop. The hero is meant to be ambient, not a toy.
//   - No fullscreen body class; the canvas fills its parent.
import * as THREE from 'three'
import InfiniteGridHelper from './viewer/InfiniteGridHelper.js'
import Sky from './viewer/Sky.js'

const HYDROGEN = 1
const CARBON   = 6
const NITROGEN = 7
const OXYGEN   = 8
const SULFUR   = 16
const HEAVY    = 999

function toRadians(angle) {return angle * (Math.PI / 180)}

export default {
  props: {
    topologyUrl: {type: String, default: '/p18265.json'},
    // 1=spacefill, 2=ball-and-stick, 3=sticks. Spacefill is the default
    // because it interferes least with overlaid text.
    drawType:    {type: Number,  default: 1},
    interactive: {type: Boolean, default: true},
    wheelZoom:   {type: Boolean, default: false},   // hijacks page scroll, off by default
    showSky:     {type: Boolean, default: true},
    showGrid:    {type: Boolean, default: true}
  },

  data() {
    return {
      message:    'Loading…',
      topology:   null,
      positions:  null,
      pause:      false,
      dragging:   false,
      mode:       this.drawType
    }
  },

  computed: {
    target() {return this.$refs.canvas}
  },

  async mounted() {
    // Wait one tick so $refs.canvas is bound even when mounted under
    // <ClientOnly> or other deferred-render parents.
    await this.$nextTick()
    if (!this.graphics()) return
    try {
      const data = await (await fetch(this.topologyUrl)).json()
      // Accept both the bastet shape ({topology, frames}) and the older
      // fah-web shape ({atoms, bonds, trajectory}).
      this.topology  = data.topology ?? {atoms: data.atoms, bonds: data.bonds}
      this.positions = data.frames   ?? data.trajectory
      if (!this.topology?.atoms?.length || !this.positions?.length)
        throw new Error('Invalid topology JSON')

      this.draw()
      this.update_view()
      this.render()
      if (this.showSky) this.move_sun()
      this.message = ''
    } catch (e) {
      console.warn('[HeroProteinViewer] failed to load topology:', e)
      this.message = ''
    }
  },

  unmounted() {
    window.removeEventListener('resize', this.update_view)
    if (this.animate) window.cancelAnimationFrame(this.animate)
    if (this.renderer) this.renderer.dispose()
  },

  methods: {
    graphics() {
      if (!this.target) {
        console.error('[HeroProteinViewer] canvas ref not attached')
        return false
      }
      try {
        this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
        this.renderer.setPixelRatio(window.devicePixelRatio)
        this.target.appendChild(this.renderer.domElement)
      } catch (e) {
        console.error('[HeroProteinViewer] WebGL init failed:', e)
        return false
      }

      this.scene = new THREE.Scene
      if (this.showGrid) this.scene.add(new InfiniteGridHelper)
      this.protein = new THREE.Group
      this.scene.add(this.protein)

      if (this.showSky) {
        this.sky = new Sky
        this.scene.add(this.sky)
      }

      this.camera = new THREE.PerspectiveCamera(45, 4 / 3, 0.1, 10000)

      this.scene.add(new THREE.AmbientLight(0xffffff, 0.5))
      let keyLight  = new THREE.DirectionalLight(0xffeda5, 0.75)
      let fillLight = new THREE.DirectionalLight(0x8080ff, 0.25)
      let backLight = new THREE.DirectionalLight(0xffffff, 0.5)
      keyLight.position.set(-1, 0, 1)
      fillLight.position.set(1, 0, 1)
      backLight.position.set(1, 0, -1).normalize()
      this.scene.add(keyLight, fillLight, backLight)

      const shine = [10, 5, 6, 7, 7, 25]
      const specular = [0x727280, 0x333333, 0x333333, 0x333333, 0x333333, 0x3f803f]
      const color    = [0x333333, 0x999999, 0x2020cc, 0xcc2626, 0x999926, 0x800099]
      this.atom_materials = specular.map((s, i) =>
        new THREE.MeshPhongMaterial({shininess: shine[i], specular: s, color: color[i]}))
      this.bond_material = new THREE.MeshPhongMaterial({
        shininess: 25, specular: 0x727280, color: 0xffffff,
        opacity: 0.6, transparent: true
      })

      this.clock = new THREE.Clock()
      this.clock.start()

      window.addEventListener('resize', this.update_view, false)
      if (this.interactive) {
        const el = this.renderer.domElement
        el.style.cursor = 'grab'
        // Pointer events + setPointerCapture so a drag that leaves the
        // canvas (or releases over another window) still reaches us.
        // Touch is intentionally ignored — we want page scroll to keep
        // working on mobile.
        el.addEventListener('pointerdown',   this.on_pointer_down)
        el.addEventListener('pointermove',   this.on_pointer_move)
        el.addEventListener('pointerup',     this.on_pointer_up)
        el.addEventListener('pointercancel', this.on_pointer_up)
        // Wheel hijacks page scroll, so only attach when explicitly opted in.
        if (this.wheelZoom)
          el.addEventListener('wheel', this.on_mouse_wheel, false)
      }
      return true
    },

    move_sun() {
      if (!this.sky) return
      const r = 600
      const t = Date.now() / 200000
      this.sky.material.uniforms.sunPosition.value =
        new THREE.Vector3(r * Math.cos(t), 32 * Math.cos(t + 1.5) + 20, r * Math.sin(t))
      this._sunTimer = setTimeout(this.move_sun, 100)
    },

    render() {
      this.animate = window.requestAnimationFrame(this.render)
      if (!this.scene) return
      if (!this.dragging && !this.pause)
        this.rotate(-this.clock.getDelta() / 5, 0)
      this.renderer.render(this.scene, this.camera)
    },

    get_dims() {
      return {width: this.target.clientWidth, height: this.target.clientHeight}
    },

    update_view() {
      const d = this.get_dims()
      this.camera.aspect = d.width / d.height
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(d.width, d.height)
    },

    atom_type_from_number(n) {
      switch (n) {
      case CARBON:   return 0
      case HYDROGEN: case 3:  return 1
      case NITROGEN: case 10: return 2
      case OXYGEN:   return 3
      case SULFUR:   return 4
      default:       return 5
      }
    },

    radius_from_type(t) {return 0.1 * [1.7, 1.09, 1.55, 1.52, 1.8, 2][t]},

    number_from_name(name) {
      if (!name.length) return HEAVY
      switch (name[0].toUpperCase()) {
      case 'H': return HYDROGEN
      case 'C': return CARBON
      case 'N': return NITROGEN
      case 'O': return OXYGEN
      case 'S': return SULFUR
      default:  return name.length > 1 ? this.number_from_name(name.substr(1)) : HEAVY
      }
    },

    get_atom_type(atom) {
      const n = atom[4] ? atom[4] : this.number_from_name(atom[0])
      return this.atom_type_from_number(n)
    },

    get_atom_geometry(atom_type, draw_type) {
      let radius = this.radius_from_type(atom_type)
      if (draw_type == 2) radius /= 3
      if (draw_type == 3) radius = 0.025
      let segs = (draw_type == 1 ? 2 : 1) * 8
      if (this.topology.atoms.length < 10000) segs *= 2
      if (this.topology.atoms.length < 1000)  segs *= 2
      return new THREE.SphereGeometry(radius, segs, segs)
    },

    draw_atoms(index, draw_type) {
      const group = new THREE.Group()
      const atoms = this.topology.atoms
      const counts = [0, 0, 0, 0, 0, 0]
      for (const a of atoms) counts[this.get_atom_type(a)]++

      const meshes = []
      counts.forEach((n, type) => {
        if (!n) return
        meshes[type] = new THREE.InstancedMesh(
          this.get_atom_geometry(type, draw_type), this.atom_materials[type], n)
        group.add(meshes[type])
      })

      const pos = this.positions[index]
      const m = new THREE.Matrix4()
      const idx = [0, 0, 0, 0, 0, 0]
      atoms.forEach((a, i) => {
        const type = this.get_atom_type(a)
        if (!meshes[type]) return
        m.makeTranslation(pos[i][0], pos[i][1], pos[i][2])
        meshes[type].setMatrixAt(idx[type]++, m)
      })

      return group
    },

    get_bond_transform(a, b) {
      const vA = new THREE.Vector3(a[0], a[1], a[2])
      const vB = new THREE.Vector3(b[0], b[1], b[2])
      const length = vA.distanceTo(vB)

      const m = new THREE.Matrix4()
      m.makeTranslation(0, 0.5, 0)
      m.premultiply(new THREE.Matrix4().makeScale(1, length, 1))

      const vec = vB.clone().sub(vA).normalize()
      const q = new THREE.Quaternion()
        .setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec)
      m.premultiply(new THREE.Matrix4().makeRotationFromQuaternion(q))
      m.premultiply(new THREE.Matrix4().makeTranslation(vA.x, vA.y, vA.z))
      return m
    },

    draw_bonds(index) {
      const pos = this.positions[index]
      const bonds = this.topology.bonds
      let segs = 4
      if (this.topology.atoms.length < 10000) segs *= 2
      if (this.topology.atoms.length < 1000)  segs *= 2
      const geo = new THREE.CylinderGeometry(0.01, 0.01, 1, segs, 1, true)
      const mesh = new THREE.InstancedMesh(geo, this.bond_material, bonds.length)
      bonds.forEach(([i, j], k) => {
        const a = pos[i], b = pos[j]
        if (a && b) mesh.setMatrixAt(k, this.get_bond_transform(a, b))
      })
      return mesh
    },

    draw_protein(index, draw_type) {
      const group = new THREE.Group()
      group.add(this.draw_atoms(index, draw_type))
      if (draw_type == 2 || draw_type == 3) group.add(this.draw_bonds(index))

      // Center on origin so rotation feels balanced.
      const pos = this.positions[index]
      const c = new THREE.Vector3()
      for (const p of pos) c.add(new THREE.Vector3(p[0], p[1], p[2]))
      c.divideScalar(pos.length)
      group.position.set(-c.x, -c.y, -c.z)
      return group
    },

    compute_bounds(index) {
      const bbox = new THREE.Box3(new THREE.Vector3, new THREE.Vector3)
      for (let i = 0; i < this.topology.atoms.length; i++) {
        const p = this.positions[index][i]
        bbox.expandByPoint(new THREE.Vector3(p[0], p[1], p[2]))
      }
      return bbox
    },

    draw() {
      this.protein.clear()
      this.protein.add(this.draw_protein(0, this.mode))

      if (!this.camera.position.z) {
        const bbox     = this.compute_bounds(0)
        const dims     = bbox.getSize(new THREE.Vector3())
        const maxDim   = Math.max(dims.x, dims.y, dims.z)
        let initialZ   = maxDim / Math.tan(Math.PI * this.camera.fov / 360)
        const wDims    = this.get_dims()
        initialZ *= wDims.height / wDims.width / 1.5
        // The bastet default sits the camera close, since it's a dedicated
        // viewer. The hero is background scenery, so back it off.
        initialZ *= 1.2
        this.zoom_min  = maxDim / 2
        this.zoom_max  = initialZ * 16
        this.camera.position.z = initialZ
      }
    },

    rotate(x, y) {
      const q = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(y, x, 0, 'XYZ'))
      this.protein.quaternion.multiplyQuaternions(q, this.protein.quaternion)
    },

    zoom(scale) {
      const z = this.camera.position.z * scale
      this.camera.position.z = Math.min(Math.max(z, this.zoom_min), this.zoom_max)
    },

    on_pointer_down(e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      const el = this.renderer.domElement
      this.dragging = true
      this.previous = {x: e.offsetX, y: e.offsetY}
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    },
    on_pointer_move(e) {
      if (!this.dragging) return
      if (this.previous)
        this.rotate(toRadians(e.offsetX - this.previous.x),
                    toRadians(e.offsetY - this.previous.y))
      this.previous = {x: e.offsetX, y: e.offsetY}
    },
    on_pointer_up(e) {
      if (!this.dragging) return
      this.dragging = false
      this.previous = null
      this.clock.start()
      this.renderer.domElement.style.cursor = 'grab'
    },
    on_mouse_wheel(e) {
      e.preventDefault()
      this.zoom(e.deltaY < 0 ? 0.95 : 1 / 0.95)
    }
  }
}
</script>

<template lang="pug">
.hero-protein-viewer(ref="canvas")
  .message(v-if="message") {{ message }}
</template>

<style lang="stylus" scoped>
.hero-protein-viewer
  position relative
  width 100%
  height 100%
  user-select none

  :deep(canvas)
    display block
    width 100% !important
    height 100% !important

  .message
    position absolute
    inset 0
    display grid
    place-items center
    color text-light
    font-family font-headings
    font-size 1.25rem
    letter-spacing 0.05em
    text-transform uppercase
    pointer-events none
</style>
