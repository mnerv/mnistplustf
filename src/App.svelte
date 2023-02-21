<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as tf from '@tensorflow/tfjs'
  import * as THREE from 'three'

  let container: HTMLDivElement
  let canvas: HTMLCanvasElement
  let renderer: THREE.WebGLRenderer

  // Scene and Camera
  const scene  = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-14, 14, 14, -14, 1, 100)

  // Model buffer
  const size = 28
  const modelBuffer = new Uint8Array(size * size).fill(0)

  // Image
  const channels = 4
  const image = new Uint8Array(size * size * channels).fill(0)
  const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, map: null })
  const texture  = new THREE.DataTexture(image, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  texture.minFilter   = THREE.NearestFilter
  texture.magFilter   = THREE.NearestFilter
  texture.needsUpdate = true
  material.map = texture
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material)
  scene.add(mesh)

  // // Overlay image
  // const overlay = new Uint8Array(size * size * channels).fill(0)
  // // for (let i = 0; i < size; ++i) {
  // //   for (let j = 0; j < size; ++j) {
  // //     const index = (i * size + j) * channels
  // //     overlay[index + 0] = 0
  // //     overlay[index + 1] = 0
  // //     overlay[index + 2] = 0
  // //     overlay[index + 3] = 0
  // //   }
  // // }
  // const overlayMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, map: null })
  // const overlayTexture = new THREE.DataTexture(overlay, size, size, THREE.RGBAFormat, THREE.UnsignedByteType)
  // overlayTexture.minFilter   = THREE.NearestFilter
  // overlayTexture.magFilter   = THREE.NearestFilter
  // overlayTexture.needsUpdate = true
  // overlayMaterial.map = overlayTexture
  // const overlayMesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), overlayMaterial)
  // scene.add(overlayMesh)

  // Circle
  let radius = 1.5
  const circle = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CircleGeometry(radius, 16)),
    new THREE.LineBasicMaterial({ color: 0xFFFFFF })
  )
  scene.add(circle)

  let number_guessed = 0
  let confidence = 0
  let animation_id = 0

  function loop(now: number) {
    renderer.clear()
    renderer.render(scene, camera)
    animation_id = requestAnimationFrame(loop)
  }

  function onResize() {
    renderer.setSize(container.clientWidth, container.clientWidth)
  }

  onMount(async () => {
    camera.position.set(0, 0, 10)

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(container.clientWidth, container.clientWidth)
    renderer.setClearColor(0xFF00FF, 1)

    window.addEventListener('resize', onResize)
    loop(0)
  })

  onDestroy(async () => {
    cancelAnimationFrame(animation_id)
    renderer.dispose()
    animation_id = 0
    window.removeEventListener('resize', onResize)
  })
</script>

<main class="p-6 flex-col space-y-4">
  <h1 class="text-center text-2xl">MNIST + TF</h1>
  <div id="canvas_render" class="w-full md:w-[256px] overflow-clip mx-auto" bind:this={container}>
    <canvas bind:this={canvas} class="w-full h-full"></canvas>
  </div>
  <div class="info">
    <span>{number_guessed}</span>
    <span>,</span>
    <span>{confidence.toPrecision(3)}</span>
  </div>
  <footer></footer>
</main>