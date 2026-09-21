import { useEffect, useRef } from 'react'

// A tiny pursuit simulation: a chaser drone steers toward where the target *will be*.
// The target follows the pointer, or drifts along a looping path when idle.
// This is a simplified stand-in — the real project uses an RL policy in ROS2 / Gazebo.

const MAX_SPEED = 260 // px/s
const MAX_ACCEL = 520
const TRAIL = 46

function readColors() {
  const cs = getComputedStyle(document.documentElement)
  const get = (n) => cs.getPropertyValue(n).trim()
  return { ink: get('--sim-ink'), dim: get('--sim-dim'), accent: get('--accent-text') }
}

export function PursuitCanvas({ hudRef }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas.parentElement
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let colors = readColors()
    let raf = 0
    let running = false
    let last = 0
    let t = 0
    let pointer = null
    let idleFor = 0

    const target = { x: 0, y: 0, vx: 0, vy: 0 }
    const chaser = { x: 0, y: 0, vx: 0, vy: 0, a: 0 }
    const tTrail = []
    const cTrail = []

    const resize = () => {
      const r = host.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const path = (time) => ({
      x: w * (0.66 + 0.26 * Math.sin(time * 0.55)),
      y: h * (0.5 + 0.28 * Math.sin(time * 0.85 + 1)),
    })

    const reset = () => {
      const p = path(0)
      target.x = p.x
      target.y = p.y
      chaser.x = w * 0.18
      chaser.y = h * 0.78
      chaser.vx = chaser.vy = 0
      tTrail.length = cTrail.length = 0
    }

    const step = (dt) => {
      t += dt
      idleFor += dt
      // target: ease toward pointer if recently moved, otherwise follow the looping path
      const goal = pointer && idleFor < 2.5 ? pointer : path(t)
      const k = 1 - Math.exp(-dt * (pointer && idleFor < 2.5 ? 5 : 3))
      const px = target.x
      const py = target.y
      target.x += (goal.x - target.x) * k
      target.y += (goal.y - target.y) * k
      target.vx = (target.x - px) / dt
      target.vy = (target.y - py) / dt

      // chaser: lead pursuit — aim at the target's predicted position
      const dx = target.x - chaser.x
      const dy = target.y - chaser.y
      const dist = Math.hypot(dx, dy)
      const lead = Math.min(dist / MAX_SPEED, 0.9)
      const ax = target.x + target.vx * lead - chaser.x
      const ay = target.y + target.vy * lead - chaser.y
      const al = Math.hypot(ax, ay) || 1
      const desiredSpeed = Math.min(MAX_SPEED, Math.max(40, dist * 1.6))
      const dvx = (ax / al) * desiredSpeed - chaser.vx
      const dvy = (ay / al) * desiredSpeed - chaser.vy
      const dl = Math.hypot(dvx, dvy) || 1
      const acc = Math.min(dl / dt, MAX_ACCEL)
      chaser.vx += (dvx / dl) * acc * dt
      chaser.vy += (dvy / dl) * acc * dt
      chaser.x += chaser.vx * dt
      chaser.y += chaser.vy * dt
      chaser.a = Math.atan2(chaser.vy, chaser.vx)

      tTrail.push({ x: target.x, y: target.y })
      cTrail.push({ x: chaser.x, y: chaser.y })
      if (tTrail.length > TRAIL) tTrail.shift()
      if (cTrail.length > TRAIL) cTrail.shift()
      return dist
    }

    const trail = (pts, color) => {
      ctx.lineCap = 'round'
      for (let i = 1; i < pts.length; i++) {
        ctx.globalAlpha = (i / pts.length) * 0.55
        ctx.strokeStyle = color
        ctx.lineWidth = 1 + (i / pts.length) * 1.5
        ctx.beginPath()
        ctx.moveTo(pts[i - 1].x, pts[i - 1].y)
        ctx.lineTo(pts[i].x, pts[i].y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    const draw = (dist, time) => {
      ctx.clearRect(0, 0, w, h)
      trail(tTrail, colors.dim)
      trail(cTrail, colors.accent)

      // line of sight
      ctx.setLineDash([3, 6])
      ctx.strokeStyle = colors.dim
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(chaser.x, chaser.y)
      ctx.lineTo(target.x, target.y)
      ctx.stroke()
      ctx.setLineDash([])

      // target: ring + reticle
      const pulse = 1 + 0.08 * Math.sin(time * 4)
      ctx.strokeStyle = colors.ink
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.arc(target.x, target.y, 15 * pulse, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(target.x - 24, target.y)
      ctx.lineTo(target.x - 9, target.y)
      ctx.moveTo(target.x + 9, target.y)
      ctx.lineTo(target.x + 24, target.y)
      ctx.moveTo(target.x, target.y - 24)
      ctx.lineTo(target.x, target.y - 9)
      ctx.moveTo(target.x, target.y + 9)
      ctx.lineTo(target.x, target.y + 24)
      ctx.stroke()

      // chaser: quadcopter — body, four arms, spinning rotor rings
      ctx.save()
      ctx.translate(chaser.x, chaser.y)
      ctx.rotate(chaser.a + Math.PI / 4)
      ctx.strokeStyle = colors.accent
      ctx.fillStyle = colors.accent
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-13, 0)
      ctx.lineTo(13, 0)
      ctx.moveTo(0, -13)
      ctx.lineTo(0, 13)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.lineWidth = 1.2
      for (const [rx, ry] of [
        [-13, 0],
        [13, 0],
        [0, -13],
        [0, 13],
      ]) {
        ctx.beginPath()
        ctx.ellipse(rx, ry, 6.5, 6.5 * (0.35 + 0.65 * Math.abs(Math.sin(time * 30 + rx))), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      if (hudRef?.current) {
        const speed = Math.hypot(chaser.vx, chaser.vy)
        hudRef.current.textContent = `range ${(dist / 10).toFixed(1).padStart(5, ' ')} · speed ${(speed / 10)
          .toFixed(1)
          .padStart(4, ' ')}`
      }
    }

    const frame = (now) => {
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016
      last = now
      draw(step(dt), t)
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (running || reduced) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    resize()
    reset()
    if (reduced) {
      // warm the sim up and draw a single still frame
      let d = 0
      for (let i = 0; i < 90; i++) d = step(1 / 30)
      draw(d, 0)
    }

    const onMove = (e) => {
      const r = host.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (x >= 0 && y >= 0 && x <= r.width && y <= r.height) {
        pointer = { x, y }
        idleFor = 0
      }
    }
    const ro = new ResizeObserver(() => {
      const first = w === 0
      resize()
      if (first) reset()
    })
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()))
    io.observe(host)
    const mo = new MutationObserver(() => (colors = readColors()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    window.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [hudRef])

  return <canvas ref={canvasRef} className="sim-canvas" aria-hidden="true" />
}
