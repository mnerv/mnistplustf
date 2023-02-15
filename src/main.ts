import './style.css'
import * as tf from '@tensorflow/tfjs'
import * as THREE from 'three'

function row_col_to_index(
  row: number, col: number,
  width: number, channel: number
) {
  return row * width * channel + col * channel
}

async function main() {
  // Create canvas element for Three.js
  const canvas = document.querySelector('#renderer')
  if (!canvas) throw new Error('Canvas element not found')

  tf.setBackend('cpu')
  console.log(tf.getBackend())
  const model = await tf.loadGraphModel('/mobile/model.json')

  // Three.js setup
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-256, 256, 256, -256, 1, 100)
  camera.position.set(0, 0, 10)
  // camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ canvas })
  renderer.setClearColor(0xFF00FF, 1)
  renderer.setSize(400, 400)  // FIXME: Handle resize

  // Image buffer
  const image = new Uint8Array(28 * 28 * 4)

  // Create texture using image buffer
  const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, map: null })
  const texture = new THREE.DataTexture(
    image,
    28, 28,
    THREE.RGBAFormat, THREE.UnsignedByteType
  )
  texture.minFilter = THREE.NearestFilter
  texture.magFilter = THREE.NearestFilter
  material.map = texture

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(512, 512), material)
  scene.add(mesh)

  const mouse = new THREE.Vector2(0, 0)
  const offset = canvas.getBoundingClientRect()

  let is_pen_down = false

  let animation_id = 0
  function animate(_: number) {
    const m_s = new THREE.Vector2(
      mouse.x - offset.left,
      mouse.y - offset.top
    )
    const size = new THREE.Vector2()
    renderer.getSize(size)
    const m_n =  m_s.divide(size)
    if (is_pen_down) {
      // console.log('pen_down', m_n.x, m_n.y)
      const x = Math.floor(m_n.x * 28)
      const y = Math.floor(m_n.y * 28)
      if (x >= 0 && x < 28 && y >= 0 && y < 28) {
        image.set([255, 255, 255], row_col_to_index(y, x, 28, 4))
        texture.image.data.set(image)
        texture.flipY = true
        texture.needsUpdate = true
      }
    }

    // const noise = new Uint8Array(28 * 28 * 4).map(() => Math.random() * 255)
    // texture.image.data.set(noise)
    // texture.needsUpdate = true

    animation_id = requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  animate(0)
  console.log(animation_id)

  // const input = tf.zeros([1, 1, 28, 28])
  // const output = model.predict(input) as tf.Tensor
  // const sum = tf.sum(output, 0)
  // const result_arr = await sum.array()
  // console.log(result_arr)

  // Register event
  function on_move(event: MouseEvent) {
    mouse.x = event.clientX
    mouse.y = event.clientY
  }
  function on_down(event: MouseEvent) {
    if (event.button === 0)
      is_pen_down = true
  }
  function on_up(event: MouseEvent) {
    if (event.button === 0) {
      is_pen_down = false

      const gray = new Float32Array(28 * 28)
      for (let i = 0; i < 28 * 28; i++) {
        gray[i] = image[i * 4] / 255
      }
      const input = tf.tensor(gray, [1, 1, 28, 28])
      const output = model.predict(input) as tf.Tensor

      const sum = tf.sum(output, 0)
      const find_max = tf.argMax(sum, 0)
      const max = tf.max(sum, 0)

      // console.log(find_max.toString(), max.toString())
      const predict = document.querySelector('#predict')!
      // eslint-disable-next-line max-len
      predict.innerHTML = `${find_max.dataSync()[0]}, ${max.dataSync()[0].toPrecision(3)}`
    }
  }
  addEventListener('mousemove', on_move)
  addEventListener('mousedown', on_down)
  addEventListener('mouseup', on_up)

}

window.onload = main
