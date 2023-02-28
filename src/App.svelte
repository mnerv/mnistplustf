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
  // const modelBuffer = new Uint8Array(size * size).fill(0)
  const modelBuffer = new Float32Array(size * size).fill(0)

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
  const radius = 2.0
  const circle = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.CircleGeometry(radius, 18)),
    new THREE.LineBasicMaterial({ color: 0xFFFFFF })
  )
  scene.add(circle)

  let predicted = 0
  let confidence = 0
  let animationID = 0
  let outputs: number[] = new Array(10).fill(0.0)
  let currentPenPos = new Vector2(0, 0)
  let previousPenPos = new Vector2(0, 0)
  let isDraw = false
  let model: tf.GraphModel | null = null

  function loop(now: number) {
    renderer.clear()
    renderer.render(scene, camera)
    animationID = requestAnimationFrame(loop)
  }

  function line(a: Vector2, b: Vector2) {
    const drawPixel = (x: number, y: number) => {
      for (let i = -radius; i < radius; ++i) {
        for (let j = -radius; j < radius; ++j) {
          if (x + j < 0 || x + j >= size || y + i < 0 || y + i >= size) continue
          const length = Math.sqrt(i * i + j * j)
          if (length >= radius) continue
          const index = (y + i) * size + (x + j)

          const color = (radius - length) / radius
          const currentColor = modelBuffer[index]
          const newColor = THREE.MathUtils.clamp(currentColor + color * 0.55, 0, 1)
          const imageColor = Math.floor(newColor * 255)
  
          modelBuffer[index] = newColor
          image[index * 4 + 0] = imageColor
          image[index * 4 + 1] = imageColor
          image[index * 4 + 2] = imageColor
          image[index * 4 + 3] = imageColor
        }
      }
    }

    let steep = false
    if (Math.abs(a.x - b.x) < Math.abs(a.y - b.y)) {
      let temp = a.x
      a.x = a.y
      a.y = temp
      temp = b.x
      b.x = b.y
      b.y = temp
      steep = true
    }
    if (a.x > b.x) {
      let temp = a.x
      a.x = b.x
      b.x = temp
      temp = a.y
      a.y = b.y
      b.y = temp
    }
    let dx = b.x - a.x
    let dy = b.y - a.y
    let derror2 = Math.abs(dy) * 2
    let error2 = 0
    let y = a.y
    for (let x = a.x; x <= b.x; ++x) {
      if (steep)
        drawPixel(y, x)
      else
        drawPixel(x, y)
      error2 += derror2
      if (error2 > dx) {
        y += (b.y > a.y ? 1 : -1)
        error2 -= dx * 2
      }
    }
  }

  function onResize() {
    renderer.setSize(
      container.clientWidth * window.devicePixelRatio,
      container.clientWidth * window.devicePixelRatio,
      false
    )
  }

  function onDraw() {
    const pPen = new Vector2(
      Math.floor(previousPenPos.x * size),
      Math.floor(size - previousPenPos.y * size)
    )
    const cPen = new Vector2(
      Math.floor(currentPenPos.x * size),
      Math.floor(size - currentPenPos.y * size)
    )
    line(pPen, cPen)
    texture.needsUpdate = true
  }
  function onEval() {
    if (model == null) return
    const input = tf.tensor(modelBuffer, [1, 1, size, size])
    const flipped = tf.reverse(input, 2)
    const output = model.predict(flipped) as tf.Tensor
    const argmax = tf.argMax(output, 1)

    predicted = argmax.dataSync()[0]
    confidence = output.dataSync()[predicted]
  }
  function onClear() {
    image.fill(0)
    modelBuffer.fill(0)
    texture.needsUpdate = true
  }

  function onMove(pos: Vector2) {
    const rect = canvas.getBoundingClientRect()
    const offset = new Vector2(pos.x - rect.left, pos.y - rect.top)
    const normalized = new Vector2(offset.x / rect.width, offset.y / rect.height)
    previousPenPos = currentPenPos
    currentPenPos = new Vector2(normalized.x, normalized.y)

    circle.position.set(
      currentPenPos.x * size - size / 2,
      -(currentPenPos.y * size - size / 2),
      0
    )
  }

  function onMouseDown(e: MouseEvent) {
    isDraw = true
    onMove(new Vector2(e.clientX, e.clientY))
    onMove(new Vector2(e.clientX, e.clientY))
    onDraw()
  }
  function onMouseMove(e: MouseEvent) {
    onMove(new Vector2(e.clientX, e.clientY))
    if (isDraw) onDraw()
  }
  function onMouseUp(e: MouseEvent) {
    isDraw = false
    onEval()
  }

  function onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      isDraw = true
      onMove(new Vector2(e.touches[0].clientX, e.touches[0].clientY))
      onMove(new Vector2(e.touches[0].clientX, e.touches[0].clientY))
    }
  }
  function onTouchMove(e: TouchEvent) {
    onMove(new Vector2(e.touches[0].clientX, e.touches[0].clientY))
    onDraw()
  }
  function onTouchEnd(e: TouchEvent) {
    if (e.touches.length === 0) {
      isDraw = false
      onEval()
    }
  }

  onMount(async () => {
    camera.position.set(0, 0, 10)
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    onResize()
    renderer.setClearColor(0xFF00FF, 1)

    tf.loadGraphModel('/model.json').then((m) => {
      model = m
      model.predict(tf.zeros([1, 1, size, size]))
    })

    window.addEventListener('resize', onResize)

    // Register mouse events
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    // Register touch events
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('touchend', onTouchEnd)
    loop(0)
  })

  onDestroy(async () => {
    cancelAnimationFrame(animationID)
    renderer.dispose()
    animationID = 0

    window.removeEventListener('resize', onResize)

    // Unregister mouse events
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousedown', onMouseUp)

    // Unregister touch events
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  })
</script>

<main class="h-full flex flex-col">
  <h1 class="text-center text-2xl pt-5 pb-5">MNIST + TF</h1>
  <div class="flex-grow flex flex-col p-5">
    <div class="px-8 md:w-[400px] md:mx-auto">
      <div id="canvas_render" class="w-full rounded-lg overflow-hidden isolate" bind:this={container}>
        <canvas bind:this={canvas} class="w-full h-full cursor-none"></canvas>
      </div>
      <div class="mx-auto flex px-2">
        <p class="py-1">{predicted} : {confidence.toPrecision(3)}</p>
        <button class="active:scale-90 ml-auto py-1" on:click={onClear}>clear</button>
      </div>
    </div>
  </div>
  <footer class="text-center dark:text-zinc-500 pb-2 text-sm">
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