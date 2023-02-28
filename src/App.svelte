<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import * as tf from '@tensorflow/tfjs'
  import * as THREE from 'three'
  import { Vector2 } from 'three'

  let container: HTMLDivElement | null
  let canvas: HTMLCanvasElement | null
  let renderer: THREE.WebGLRenderer | null

    // Scene and Camera
  const scene  = new THREE.Scene()
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

    // Circle
  const radius = 1.5
  const circle = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CircleGeometry(radius, 16)),
    new THREE.LineBasicMaterial({ color: 0xFFFFFF })
  )
  scene.add(circle)

  let guessed = 0
  let confidence = 0
  let animationID = 0
  let outputs: number[] = new Array(10).fill(0.0)

  let previousPos = new Vector2(0, 0)

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
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const offset = new Vector2(pos.x - rect.left, pos.y - rect.top)
    const normalized = new Vector2(offset.x / rect.width, offset.y / rect.height)
    const previousPos = normalized

    circle.position.set(
      (normalized.x - 0.5) * 28,
      -(normalized.y - 0.5) * 28,
      0
    )
  }

  function onMouseMove(e: MouseEvent) {
    onMove(new Vector2(e.clientX, e.clientY))
  }

  function onMouseDown(e: MouseEvent) {
    //
  }

  function onMouseUp(e: MouseEvent) {
    //
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

<main class="h-full flex flex-col p-5">
  <h1 class="text-center text-2xl pb-5">MNIST + TF</h1>
  <div class="flex-grow flex flex-col">
    <div id="canvas_render" class="w-full md:w-[256px] rounded-lg overflow-hidden isolate" bind:this={container}>
      <canvas bind:this={canvas} class="w-full h-full cursor-none"></canvas>
    </div>
    <div>
      <!-- <p>Detected: {guessed}</p> -->
      <!-- <p>Confidence: {confidence.toPrecision(3)}</p> -->
      <!-- <p>Model Outputs</p> -->
      <!-- <div class="flex space-x-2">
        {#each outputs as confidence, i}
          <span>{i}:{confidence.toPrecision(3)}</span>
        {/each}
      </div> -->
    </div>
    <!-- <div>
      <p>Model Info</p>
    </div> -->
  </div>
  <footer class="text-center dark:text-zinc-500">
    <div>
      <a
        class="hover:dark:text-zinc-50 transition-colors"
        rel="noreferrer"
        href='https://github.com/mnerv/cnn_from_scratch'
        title='Open Github repository for CNN model source code'
        target='_blank'
      >
      Model Source Code
      </a>
      <span>|</span>
      <a
        class="hover:dark:text-zinc-50 transition-colors"
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