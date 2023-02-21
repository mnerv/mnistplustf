<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as tf from '@tensorflow/tfjs'
  import * as THREE from 'three'
  import {Vector2} from 'three'

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

  let guessed = 0
  let confidence = 0
  let animationID = 0
  let outputs: number[] = new Array(10).fill(0.0)

  function loop(now: number) {
    renderer.clear()
    renderer.render(scene, camera)
    animationID = requestAnimationFrame(loop)
  }

  function onResize() {
    renderer.setSize(
      container.clientWidth * window.devicePixelRatio,
      container.clientWidth * window.devicePixelRatio,
      false
    )
  }

  function onMove(pos: Vector2) {
  }

  function onMouseMove(e: MouseEvent) {
    onMove(new Vector2(
      e.clientX / window.innerWidth,
      e.clientY / window.innerHeight
    ))
  }

  function onMouseDown(e: MouseEvent) {
  }

  function onMouseUp(e: MouseEvent) {
  }

  onMount(async () => {
    camera.position.set(0, 0, 10)
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    onResize()
    renderer.setClearColor(0xFF00FF, 1)

    // Register events
    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousedown', onMouseUp)
    loop(0)
  })

  onDestroy(async () => {
    cancelAnimationFrame(animationID)
    renderer.dispose()
    animationID = 0

    // Unregister events
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousedown', onMouseUp)
  })
</script>

<main class="flex-row">
  <h1 class="text-center text-2xl">MNIST + TF</h1>
  <div class="flex flex-shrink-1">
    <div id="canvas_render" class="w-full md:w-[256px] overflow-clip" bind:this={container}>
      <canvas bind:this={canvas} class="w-full h-full"></canvas>
    </div>
    <div>
      <p>Detected: {guessed}</p>
      <p>Confidence: {confidence.toPrecision(3)}</p>
      <p>Model Outputs</p>
      <div class="flex space-x-2">
        {#each outputs as confidence, i}
          <span>{i}:{confidence.toPrecision(3)}</span>
        {/each}
      </div>
    </div>
    <div>
      <p>Model Info</p>
    </div>
  </div>
  <footer class="mt-auto">
    <div>
      <a
        rel="noreferrer"
        href='https://github.com/mnerv/cnn_from_scratch'
        title='Open Github repository for CNN model source code'
        target='_blank'
      >
      Model Source Code
      </a>
      <span>|</span>
      <a
        rel="noreferrer"
        href='https://github.com/mnerv/mnistplustf'
        title='Open Github repository for website source code'
        target='_blank'
      >
      Source Code
      </a>
    </div>
  </footer>
</main>