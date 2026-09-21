import { useEffect, useRef } from 'react'

export function readColors() {
  const cs = getComputedStyle(document.documentElement)
  const g = (n) => cs.getPropertyValue(n).trim()
  return {
    accent: g('--accent-text'),
    accentFill: g('--accent'),
    accentRgb: g('--accent-rgb'),
    ink: g('--ink'),
    ink2: g('--ink-2'),
    dim: g('--ink-3'),
    rule: g('--rule-strong'),
    bg: g('--bg-inset'),
  }
}

// Runs a canvas "scene" with DPR handling, resize, pause-when-offscreen, theme colours and pointer events.
// A scene is `init(env, paramsRef) => { frame(dt, t, env), resize?, down?, move?, up?, leave?, dbl? }`.
export function useCanvas(init, paramsRef) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const host = canvas.parentElement
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const env = { ctx, canvas, w: 0, h: 0, colors: readColors() }
    let scene = null
    let raf = 0
    let running = false
    let last = 0
    let t = 0

    const measure = () => {
      const r = host.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      env.w = r.width
      env.h = r.height
      canvas.width = Math.max(1, Math.round(r.width * dpr))
      canvas.height = Math.max(1, Math.round(r.height * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    const render = (dt) => {
      ctx.clearRect(0, 0, env.w, env.h)
      scene.frame(dt, t, env)
    }
    const frame = (now) => {
      if (!running) return
      const dt = Math.min((now - last) / 1000, 0.05) || 0.016
      last = now
      t += dt
      render(dt)
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
    const poke = () => {
      if (reduced && scene) render(0.016)
    }

    measure()
    scene = init(env, paramsRef)
    render(0)

    const pos = (e) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onDown = (e) => {
      canvas.setPointerCapture?.(e.pointerId)
      scene.down?.(pos(e), env)
      poke()
    }
    const onMove = (e) => {
      scene.move?.(pos(e), env)
      poke()
    }
    const onUp = (e) => {
      scene.up?.(pos(e), env)
      poke()
    }
    const onLeave = () => {
      scene.leave?.(env)
      poke()
    }
    const onDbl = () => {
      scene.dbl?.(env)
      poke()
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('dblclick', onDbl)

    const ro = new ResizeObserver(() => {
      measure()
      scene.resize?.(env)
      if (!running) render(0)
    })
    ro.observe(host)
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()))
    io.observe(host)
    const mo = new MutationObserver(() => {
      env.colors = readColors()
      if (!running) render(0)
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('dblclick', onDbl)
      scene?.destroy?.()
    }
  }, [init, paramsRef])

  return ref
}
