// Canvas scenes for the "Beyond code" section. Each is `(env, paramsRef) => scene` for useCanvas.

const TAU = Math.PI * 2
const rand = (a, b) => a + Math.random() * (b - a)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/* ---------- Physics: gravity sandbox ---------- */
export function gravityScene(env) {
  let bodies = []
  let drag = null
  let cx = 0
  let cy = 0
  let GM = 0
  let sunR = 10

  const setup = () => {
    cx = env.w / 2
    cy = env.h / 2
    const s = Math.min(env.w, env.h)
    const r1 = s * 0.2
    const v1 = (TAU * r1) / 6.5
    GM = r1 * v1 * v1
    sunR = Math.max(8, s * 0.045)
  }
  const orbiter = (x, y, dir = 1) => {
    const dx = x - cx
    const dy = y - cy
    const r = Math.hypot(dx, dy) || 1
    const v = Math.sqrt(GM / r)
    return { x, y, vx: (-dy / r) * v * dir, vy: (dx / r) * v * dir, trail: [] }
  }
  const seed = () => {
    const s = Math.min(env.w, env.h)
    const at = (r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
    bodies = [orbiter(...at(s * 0.2, 0.2)), orbiter(...at(s * 0.33, 2.5)), orbiter(...at(s * 0.43, 4.4), -1)]
  }
  setup()
  seed()

  const accel = (x, y) => {
    const dx = cx - x
    const dy = cy - y
    const d2 = dx * dx + dy * dy + 30
    const d = Math.sqrt(d2)
    const a = GM / d2
    return [(dx / d) * a, (dy / d) * a]
  }
  const step = (dt) => {
    const n = 4
    const h = dt / n
    for (let s = 0; s < n; s++) {
      for (const b of bodies) {
        const [ax, ay] = accel(b.x, b.y)
        b.vx += ax * h
        b.vy += ay * h
        b.x += b.vx * h
        b.y += b.vy * h
      }
    }
    for (const b of bodies) {
      b.trail.push(b.x, b.y)
      if (b.trail.length > 140) b.trail.splice(0, 2)
    }
    const far = Math.max(env.w, env.h) * 2
    bodies = bodies.filter((b) => {
      const d = Math.hypot(b.x - cx, b.y - cy)
      return d > sunR * 0.8 && d < far
    })
  }
  const spawn = (b) => {
    bodies.push(b)
    if (bodies.length > 14) bodies.shift()
  }
  const preview = (x, y, vx, vy) => {
    const pts = []
    let px = x
    let py = y
    let pvx = vx
    let pvy = vy
    for (let i = 0; i < 80; i++) {
      for (let k = 0; k < 2; k++) {
        const [ax, ay] = accel(px, py)
        pvx += ax * 0.02
        pvy += ay * 0.02
        px += pvx * 0.02
        py += pvy * 0.02
      }
      if (Math.hypot(px - cx, py - cy) < sunR) break
      pts.push(px, py)
    }
    return pts
  }

  return {
    resize: () => {
      setup()
      seed()
    },
    down: (p) => {
      drag = { sx: p.x, sy: p.y, x: p.x, y: p.y }
    },
    move: (p) => {
      if (drag) {
        drag.x = p.x
        drag.y = p.y
      }
    },
    up: () => {
      if (!drag) return
      const vx = (drag.sx - drag.x) * 2.6
      const vy = (drag.sy - drag.y) * 2.6
      if (Math.hypot(vx, vy) < 12) spawn(orbiter(drag.sx, drag.sy))
      else spawn({ x: drag.sx, y: drag.sy, vx, vy, trail: [] })
      drag = null
    },
    dbl: () => seed(),
    frame: (dt, t, { ctx, colors, w, h }) => {
      step(Math.min(dt, 0.05))
      // orbit guides
      ctx.strokeStyle = colors.rule
      ctx.globalAlpha = 0.35
      ctx.setLineDash([2, 6])
      ctx.lineWidth = 1
      for (const f of [0.2, 0.33, 0.43]) {
        ctx.beginPath()
        ctx.arc(cx, cy, Math.min(w, h) * f, 0, TAU)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1
      // sun
      const g = ctx.createRadialGradient(cx, cy, sunR * 0.4, cx, cy, sunR * 4)
      g.addColorStop(0, `rgba(${colors.accentRgb}, 0.55)`)
      g.addColorStop(1, `rgba(${colors.accentRgb}, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, sunR * 4, 0, TAU)
      ctx.fill()
      ctx.fillStyle = colors.accent
      ctx.beginPath()
      ctx.arc(cx, cy, sunR, 0, TAU)
      ctx.fill()
      // bodies
      for (const b of bodies) {
        const n = b.trail.length / 2
        for (let i = 1; i < n; i++) {
          ctx.globalAlpha = (i / n) * 0.7
          ctx.strokeStyle = colors.accent
          ctx.lineWidth = 1.6
          ctx.beginPath()
          ctx.moveTo(b.trail[(i - 1) * 2], b.trail[(i - 1) * 2 + 1])
          ctx.lineTo(b.trail[i * 2], b.trail[i * 2 + 1])
          ctx.stroke()
        }
        ctx.globalAlpha = 1
        ctx.fillStyle = colors.ink
        ctx.beginPath()
        ctx.arc(b.x, b.y, 4.2, 0, TAU)
        ctx.fill()
      }
      // slingshot
      if (drag) {
        const vx = (drag.sx - drag.x) * 2.6
        const vy = (drag.sy - drag.y) * 2.6
        ctx.strokeStyle = colors.dim
        ctx.setLineDash([3, 4])
        ctx.beginPath()
        ctx.moveTo(drag.sx, drag.sy)
        ctx.lineTo(drag.x, drag.y)
        ctx.stroke()
        ctx.setLineDash([])
        const pts = preview(drag.sx, drag.sy, vx, vy)
        ctx.fillStyle = colors.accent
        for (let i = 0; i < pts.length; i += 6) {
          ctx.globalAlpha = 1 - i / pts.length
          ctx.beginPath()
          ctx.arc(pts[i], pts[i + 1], 1.8, 0, TAU)
          ctx.fill()
        }
        ctx.globalAlpha = 1
        ctx.fillStyle = colors.ink
        ctx.beginPath()
        ctx.arc(drag.sx, drag.sy, 4.2, 0, TAU)
        ctx.fill()
      }
    },
  }
}

/* ---------- Math: Fourier epicycles ---------- */
export function fourierScene(env, params) {
  let coeffs = []
  let t = 0
  let trail = []
  let drawing = null
  let lastK = -1

  const heart = () =>
    Array.from({ length: 128 }, (_, i) => {
      const a = (i / 128) * TAU
      return {
        x: 16 * Math.sin(a) ** 3,
        y: -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)),
      }
    })

  const resample = (pts, n) => {
    const closed = [...pts, pts[0]]
    const lens = [0]
    for (let i = 1; i < closed.length; i++) {
      lens.push(lens[i - 1] + Math.hypot(closed[i].x - closed[i - 1].x, closed[i].y - closed[i - 1].y))
    }
    const total = lens[lens.length - 1] || 1
    const out = []
    let j = 1
    for (let i = 0; i < n; i++) {
      const d = (i / n) * total
      while (j < lens.length - 1 && lens[j] < d) j++
      const seg = lens[j] - lens[j - 1] || 1
      const f = (d - lens[j - 1]) / seg
      out.push({
        x: closed[j - 1].x + (closed[j].x - closed[j - 1].x) * f,
        y: closed[j - 1].y + (closed[j].y - closed[j - 1].y) * f,
      })
    }
    return out
  }

  const build = (raw) => {
    const pts = resample(raw, 128)
    let mx = 0
    let my = 0
    pts.forEach((p) => {
      mx += p.x
      my += p.y
    })
    mx /= pts.length
    my /= pts.length
    let r = 0
    pts.forEach((p) => {
      r = Math.max(r, Math.hypot(p.x - mx, p.y - my))
    })
    const s = (Math.min(env.w, env.h) * 0.4) / (r || 1)
    const P = pts.map((p) => ({ x: (p.x - mx) * s, y: (p.y - my) * s }))
    const N = P.length
    const out = []
    for (let k = 0; k < N; k++) {
      let re = 0
      let im = 0
      for (let n = 0; n < N; n++) {
        const ph = (TAU * k * n) / N
        const c = Math.cos(ph)
        const sn = Math.sin(ph)
        re += P[n].x * c + P[n].y * sn
        im += P[n].y * c - P[n].x * sn
      }
      out.push({ freq: k <= N / 2 ? k : k - N, amp: Math.hypot(re / N, im / N), ph: Math.atan2(im, re) })
    }
    out.sort((a, b) => b.amp - a.amp)
    coeffs = out
    t = 0
    trail = []
  }
  build(heart())

  return {
    resize: () => build(heart()),
    down: (p) => {
      drawing = [p]
    },
    move: (p) => {
      if (drawing) drawing.push(p)
    },
    up: () => {
      if (drawing && drawing.length > 12) build(drawing)
      drawing = null
    },
    dbl: () => build(heart()),
    frame: (dt, time, { ctx, colors, w, h }) => {
      if (drawing) {
        ctx.strokeStyle = colors.ink
        ctx.lineWidth = 2.4
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        drawing.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
        ctx.stroke()
        return
      }
      const K = clamp(Math.round(params?.current?.k ?? 12), 1, coeffs.length)
      if (K !== lastK) {
        trail = []
        lastK = K
      }
      t = (t + dt / 9) % 1
      let x = w / 2
      let y = h / 2
      for (let i = 0; i < K; i++) {
        const c = coeffs[i]
        const a = TAU * c.freq * t + c.ph
        const nx = x + c.amp * Math.cos(a)
        const ny = y + c.amp * Math.sin(a)
        if (c.amp > 0.6) {
          ctx.strokeStyle = colors.rule
          ctx.globalAlpha = 0.55
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(x, y, c.amp, 0, TAU)
          ctx.stroke()
          ctx.globalAlpha = 0.9
          ctx.strokeStyle = colors.dim
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(nx, ny)
          ctx.stroke()
        }
        x = nx
        y = ny
      }
      ctx.globalAlpha = 1
      trail.push(x, y)
      if (trail.length > 1100) trail.splice(0, 2)
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 2.6
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (let i = 0; i < trail.length; i += 2) (i ? ctx.lineTo(trail[i], trail[i + 1]) : ctx.moveTo(trail[i], trail[i + 1]))
      ctx.stroke()
      ctx.fillStyle = colors.ink
      ctx.beginPath()
      ctx.arc(x, y, 3.6, 0, TAU)
      ctx.fill()
    },
  }
}

/* ---------- Cooking: bubbling pot ---------- */
export function kitchenScene(env) {
  let bubbles = []
  let steam = []
  let drops = []
  let ripples = []
  let heat = 0.35
  let hoverX = null

  const geo = () => {
    const pw = Math.min(env.w * 0.62, 250)
    return { pw, x0: (env.w - pw) / 2, rim: env.h * 0.46, bottom: env.h * 0.86, surf: env.h * 0.46 + 16 }
  }

  return {
    move: (p) => {
      hoverX = p.x
    },
    leave: () => {
      hoverX = null
    },
    down: (p) => {
      const g = geo()
      drops.push({ x: clamp(p.x, g.x0 + 14, g.x0 + g.pw - 14), y: -10, vy: 0, s: rand(8, 12), rot: rand(-0.6, 0.6), sunk: 0, state: 'fall' })
    },
    dbl: () => {
      drops = []
      heat = 0.35
    },
    frame: (dt, time, { ctx, colors, w, h }) => {
      const g = geo()
      heat += (0.35 - heat) * Math.min(1, dt * 0.7)

      // spawn
      if (Math.random() < dt * (4 + heat * 16)) {
        bubbles.push({ x: rand(g.x0 + 14, g.x0 + g.pw - 14), y: g.bottom - 12, r: rand(2, 5.5), vy: rand(28, 58) * (0.7 + heat) })
      }
      if (Math.random() < dt * (3 + heat * 9)) {
        steam.push({ x: rand(g.x0 + 20, g.x0 + g.pw - 20), y: g.rim - 4, r: rand(4, 8), life: 1 })
      }
      // update
      bubbles.forEach((b) => (b.y -= b.vy * dt))
      bubbles = bubbles.filter((b) => {
        if (b.y <= g.surf + 4) {
          if (Math.random() < 0.3) ripples.push({ x: b.x, r: 2, a: 0.6 })
          return false
        }
        return true
      })
      steam.forEach((s) => {
        s.y -= (22 + heat * 30) * dt
        s.x += Math.sin(time * 2 + s.y * 0.05) * 6 * dt
        s.r += 5 * dt
        s.life -= dt * 0.6
      })
      steam = steam.filter((s) => s.life > 0)
      ripples.forEach((r) => {
        r.r += 26 * dt
        r.a -= dt * 0.9
      })
      ripples = ripples.filter((r) => r.a > 0)
      drops.forEach((d) => {
        if (d.state === 'fall') {
          d.vy += 900 * dt
          d.y += d.vy * dt
          d.rot += dt * 2
          if (d.y >= g.surf - d.s) {
            d.state = 'sink'
            heat = Math.min(1.2, heat + 0.4)
            ripples.push({ x: d.x, r: 4, a: 1 }, { x: d.x, r: 0, a: 0.7 })
            for (let i = 0; i < 6; i++) {
              bubbles.push({ x: d.x + rand(-10, 10), y: g.surf + rand(4, 16), r: rand(2, 5), vy: rand(30, 70) })
            }
          }
        } else {
          d.sunk += dt
          d.y += 22 * dt
        }
      })
      drops = drops.filter((d) => d.sunk < 2.6)

      // flames
      const fl = 8 + heat * 16
      ctx.fillStyle = colors.accent
      for (let i = 0; i < 4; i++) {
        const fx = g.x0 + g.pw * (0.2 + i * 0.2)
        const fh = fl * (0.7 + 0.3 * Math.sin(time * 9 + i * 1.7))
        ctx.globalAlpha = 0.5 + heat * 0.4
        ctx.beginPath()
        ctx.moveTo(fx - 5, g.bottom + 6)
        ctx.quadraticCurveTo(fx - 5, g.bottom + 6 + fh * 0.6, fx, g.bottom + 6 + fh)
        ctx.quadraticCurveTo(fx + 5, g.bottom + 6 + fh * 0.6, fx + 5, g.bottom + 6)
        ctx.closePath()
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // liquid
      ctx.beginPath()
      ctx.moveTo(g.x0 + 3, g.surf)
      for (let x = 0; x <= g.pw - 6; x += 6) {
        ctx.lineTo(g.x0 + 3 + x, g.surf + Math.sin(time * 3 + x * 0.09) * (1.2 + heat * 2.2))
      }
      ctx.lineTo(g.x0 + g.pw - 3, g.bottom - 20)
      ctx.quadraticCurveTo(g.x0 + g.pw - 3, g.bottom - 3, g.x0 + g.pw - 22, g.bottom - 3)
      ctx.lineTo(g.x0 + 22, g.bottom - 3)
      ctx.quadraticCurveTo(g.x0 + 3, g.bottom - 3, g.x0 + 3, g.bottom - 20)
      ctx.closePath()
      ctx.fillStyle = `rgba(${colors.accentRgb}, 0.2)`
      ctx.fill()

      // ripples on the surface
      ripples.forEach((r) => {
        ctx.strokeStyle = colors.accent
        ctx.globalAlpha = Math.max(0, r.a) * 0.7
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.ellipse(r.x, g.surf, r.r, r.r * 0.22, 0, 0, TAU)
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      // bubbles
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = 1.4
      bubbles.forEach((b) => {
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, TAU)
        ctx.stroke()
      })

      // pot
      ctx.strokeStyle = colors.ink
      ctx.lineWidth = 3
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(g.x0, g.rim)
      ctx.lineTo(g.x0, g.bottom - 22)
      ctx.quadraticCurveTo(g.x0, g.bottom, g.x0 + 22, g.bottom)
      ctx.lineTo(g.x0 + g.pw - 22, g.bottom)
      ctx.quadraticCurveTo(g.x0 + g.pw, g.bottom, g.x0 + g.pw, g.bottom - 22)
      ctx.lineTo(g.x0 + g.pw, g.rim)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(g.x0 - 10, g.rim)
      ctx.lineTo(g.x0 + g.pw + 10, g.rim)
      ctx.moveTo(g.x0, g.rim + 22)
      ctx.lineTo(g.x0 - 20, g.rim + 22)
      ctx.moveTo(g.x0 + g.pw, g.rim + 22)
      ctx.lineTo(g.x0 + g.pw + 20, g.rim + 22)
      ctx.stroke()

      // steam
      steam.forEach((s) => {
        ctx.strokeStyle = colors.dim
        ctx.globalAlpha = Math.max(0, s.life) * 0.5
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, TAU)
        ctx.stroke()
      })
      ctx.globalAlpha = 1

      // guide + ingredients
      if (hoverX !== null) {
        ctx.strokeStyle = colors.dim
        ctx.globalAlpha = 0.5
        ctx.setLineDash([3, 5])
        ctx.beginPath()
        ctx.moveTo(clamp(hoverX, g.x0 + 14, g.x0 + g.pw - 14), 0)
        ctx.lineTo(clamp(hoverX, g.x0 + 14, g.x0 + g.pw - 14), g.surf)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.globalAlpha = 1
      }
      drops.forEach((d) => {
        ctx.save()
        ctx.translate(d.x, d.y)
        ctx.rotate(d.rot)
        ctx.globalAlpha = d.state === 'sink' ? Math.max(0, 1 - d.sunk / 2.6) : 1
        ctx.fillStyle = colors.accent
        ctx.beginPath()
        ctx.roundRect(-d.s / 2, -d.s / 2, d.s, d.s, 3)
        ctx.fill()
        ctx.restore()
      })
      ctx.globalAlpha = 1
    },
  }
}

/* ---------- Gardening: click to plant ---------- */
export function gardenScene(env) {
  let plants = []
  let t = 0
  const ease = (x) => 1 - (1 - x) ** 3
  const add = (fx, age = 0) => {
    plants.push({
      fx,
      born: t - age,
      h: rand(0.3, 0.6),
      petals: Math.floor(rand(5, 9)),
      size: rand(12, 20),
      phase: rand(0, TAU),
      side: Math.random() < 0.5 ? 1 : -1,
    })
    if (plants.length > 16) plants.shift()
  }
  const seed = () => {
    plants = []
    add(0.2, 6)
    add(0.52, 6)
    add(0.8, 6)
  }
  seed()

  return {
    down: (p) => {
      if (p.y > env.h * 0.25) add(clamp(p.x / env.w, 0.04, 0.96))
    },
    dbl: () => seed(),
    frame: (dt, time, { ctx, colors, w, h }) => {
      t += dt
      const ground = h * 0.84
      // sun
      const sr = 18 + Math.sin(time * 1.5) * 1.5
      ctx.fillStyle = `rgba(${colors.accentRgb}, 0.3)`
      ctx.beginPath()
      ctx.arc(w * 0.86, h * 0.2, sr, 0, TAU)
      ctx.fill()
      // ground
      ctx.strokeStyle = colors.ink
      ctx.lineWidth = 2.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(0, ground)
      ctx.lineTo(w, ground)
      ctx.stroke()
      ctx.fillStyle = colors.dim
      for (let i = 0; i < w; i += 18) {
        ctx.globalAlpha = 0.5
        ctx.fillRect(i + ((i * 7) % 9), ground + 8 + ((i * 13) % 20), 2, 2)
      }
      ctx.globalAlpha = 1

      for (const p of plants) {
        const x = p.fx * w
        const g = ease(clamp((t - p.born) / 3.4, 0, 1))
        if (g <= 0) continue
        const topY = ground - p.h * h * g
        const sway = Math.sin(time * 1.1 + p.phase) * 6 * g
        const cxp = x
        const cyp = (ground + topY) / 2
        const at = (f) => {
          const u = 1 - f
          return [u * u * x + 2 * u * f * cxp + f * f * (x + sway), u * u * ground + 2 * u * f * cyp + f * f * topY]
        }
        ctx.strokeStyle = colors.ink2
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(x, ground)
        ctx.quadraticCurveTo(cxp, cyp, x + sway, topY)
        ctx.stroke()
        // leaves
        for (const [f, dir] of [
          [0.38, p.side],
          [0.62, -p.side],
        ]) {
          const k = clamp((g - 0.3) / 0.4, 0, 1)
          if (k <= 0) continue
          const [lx, ly] = at(f)
          ctx.save()
          ctx.translate(lx, ly)
          ctx.rotate(dir * -0.7 + sway * 0.01)
          ctx.fillStyle = `rgba(${colors.accentRgb}, 0.55)`
          ctx.beginPath()
          ctx.ellipse(dir * 11 * k, 0, 12 * k, 5 * k, 0, 0, TAU)
          ctx.fill()
          ctx.restore()
        }
        // bloom
        const bk = clamp((g - 0.7) / 0.3, 0, 1)
        if (bk > 0) {
          ctx.save()
          ctx.translate(x + sway, topY)
          ctx.rotate(time * 0.15 + p.phase)
          for (let i = 0; i < p.petals; i++) {
            ctx.save()
            ctx.rotate((i / p.petals) * TAU)
            ctx.fillStyle = `rgba(${colors.accentRgb}, 0.85)`
            ctx.beginPath()
            ctx.ellipse(0, -p.size * bk * 0.8, p.size * 0.32 * bk, p.size * 0.7 * bk, 0, 0, TAU)
            ctx.fill()
            ctx.restore()
          }
          ctx.fillStyle = colors.ink
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.26 * bk, 0, TAU)
          ctx.fill()
          ctx.restore()
        }
      }
    },
  }
}

/* ---------- Singing: oscilloscope for the piano ---------- */
export function scopeScene(env, params) {
  let data = null
  return {
    frame: (dt, time, { ctx, colors, w, h }) => {
      const an = params?.current?.analyser
      const mid = h / 2
      let live = false
      if (an) {
        if (!data || data.length !== an.fftSize) data = new Uint8Array(an.fftSize)
        an.getByteTimeDomainData(data)
        let peak = 0
        for (let i = 0; i < data.length; i += 8) peak = Math.max(peak, Math.abs(data[i] - 128))
        live = peak > 3
      }
      ctx.lineWidth = 1
      ctx.strokeStyle = colors.rule
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(0, mid)
      ctx.lineTo(w, mid)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.strokeStyle = colors.accent
      ctx.lineWidth = live ? 2.4 : 1.6
      ctx.lineJoin = 'round'
      ctx.beginPath()
      if (live) {
        const step = data.length / w
        for (let x = 0; x < w; x++) {
          const v = (data[Math.floor(x * step)] - 128) / 128
          const y = mid + v * (h * 0.42)
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
      } else {
        for (let x = 0; x < w; x += 3) {
          const y = mid + Math.sin(x * 0.04 + time * 2.2) * 3
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
        }
      }
      ctx.stroke()
    },
  }
}
