import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

/* Reverse-mode autodiff on a tiny expression language: numbers, variables, + - * / ^n, tanh, exp, relu. */

const MAX_NODES = 18
const FUNCS = new Set(['tanh', 'exp', 'relu'])
const DEFAULTS = { a: 2, b: -3, c: 10, x: 2, y: 3, w: 0.5 }
const PRESETS = ['a*b + c', '(a*b + c)^2', 'tanh(a*b + c)', 'a*a + 3*a']

function parse(src) {
  const toks = src.match(/(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?|[a-z_]\w*|[-+*/^(),]/gi) ?? []
  if (toks.join('') !== src.replace(/\s+/g, '')) throw new Error('Unexpected character')
  if (!toks.length) throw new Error('Type an expression')

  const nodes = []
  const vars = new Map()
  let pos = 0
  const peek = () => toks[pos]
  const next = () => toks[pos++]
  const add = (op, args = [], extra = {}) => {
    if (nodes.length >= MAX_NODES) throw new Error(`Keep it under ${MAX_NODES} nodes`)
    nodes.push({ op, args, ...extra })
    return nodes.length - 1
  }

  const expr = () => {
    let l = term()
    while (peek() === '+' || peek() === '-') {
      const op = next()
      l = add(op, [l, term()])
    }
    return l
  }
  const term = () => {
    let l = unary()
    while (peek() === '*' || peek() === '/') {
      const op = next()
      l = add(op, [l, unary()])
    }
    return l
  }
  const unary = () => {
    if (peek() === '-') {
      next()
      return add('neg', [unary()])
    }
    return power()
  }
  const power = () => {
    const base = atom()
    if (peek() !== '^') return base
    next()
    const sign = peek() === '-' ? (next(), -1) : 1
    const t = next()
    if (t === undefined || !/^(?:\d|\.\d)/.test(t)) throw new Error('The exponent must be a number')
    return add('pow', [base], { k: sign * Number(t) })
  }
  const atom = () => {
    const t = next()
    if (t === undefined) throw new Error('Expression ends too early')
    if (/^(?:\d|\.\d)/.test(t)) return add('num', [], { value: Number(t) })
    if (t === '(') {
      const e = expr()
      if (next() !== ')') throw new Error('Missing )')
      return e
    }
    if (/^[a-z_]/i.test(t)) {
      if (FUNCS.has(t)) {
        if (next() !== '(') throw new Error(`${t} needs parentheses`)
        const e = expr()
        if (next() !== ')') throw new Error('Missing )')
        return add(t, [e])
      }
      if (!vars.has(t)) vars.set(t, add('var', [], { name: t }))
      return vars.get(t)
    }
    throw new Error(`Unexpected "${t}"`)
  }

  expr()
  if (pos < toks.length) throw new Error(`Unexpected "${toks[pos]}"`)
  const root = nodes.length - 1

  // Layer each node left to right; leaves sit just before their first consumer.
  const layer = nodes.map(() => 0)
  nodes.forEach((n, i) => {
    if (n.args.length) layer[i] = 1 + Math.max(...n.args.map((a) => layer[a]))
  })
  nodes.forEach((n, i) => {
    if (n.args.length) n.args.forEach((a) => !nodes[a].args.length && (nodes[a].first = Math.min(nodes[a].first ?? Infinity, layer[i])))
  })
  nodes.forEach((n, i) => {
    if (!n.args.length) layer[i] = Math.max(0, (n.first ?? 1) - 1)
  })
  return { nodes, root, layer, vars: [...vars.keys()] }
}

function forward(g, vals) {
  const v = []
  g.nodes.forEach((n, i) => {
    const [a, b] = n.args.map((k) => v[k])
    switch (n.op) {
      case 'num': v[i] = n.value; break
      case 'var': v[i] = vals[n.name]; break
      case '+': v[i] = a + b; break
      case '-': v[i] = a - b; break
      case '*': v[i] = a * b; break
      case '/': v[i] = a / b; break
      case 'neg': v[i] = -a; break
      case 'pow': v[i] = a ** n.k; break
      case 'tanh': v[i] = Math.tanh(a); break
      case 'exp': v[i] = Math.exp(a); break
      case 'relu': v[i] = a > 0 ? a : 0; break
    }
  })
  return v
}

function backward(g, v) {
  const grad = g.nodes.map(() => 0)
  grad[g.root] = 1
  for (let i = g.nodes.length - 1; i >= 0; i--) {
    const n = g.nodes[i]
    const [a, b] = n.args.map((k) => v[k])
    let local = []
    switch (n.op) {
      case '+': local = [1, 1]; break
      case '-': local = [1, -1]; break
      case '*': local = [b, a]; break
      case '/': local = [1 / b, -a / (b * b)]; break
      case 'neg': local = [-1]; break
      case 'pow': local = [n.k * a ** (n.k - 1)]; break
      case 'tanh': local = [1 - v[i] ** 2]; break
      case 'exp': local = [v[i]]; break
      case 'relu': local = [a > 0 ? 1 : 0]; break
    }
    n.args.forEach((k, j) => (grad[k] += grad[i] * local[j]))
  }
  return grad
}

const fmt = (n) => {
  if (!Number.isFinite(n)) return String(n)
  if (Math.abs(n) >= 1e5) return n.toExponential(1)
  return String(+n.toFixed(3))
}
const label = (n) =>
  ({ num: 'const', var: n.name, '*': '×', '/': '÷', '-': '−', neg: 'neg', pow: `^${n.k}` })[n.op] ?? n.op

export function AutogradDemo() {
  const reduced = useReducedMotion()
  const [expr, setExpr] = useState(PRESETS[0])
  const [raw, setRaw] = useState({})
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const lastGood = useRef(null)

  const parsed = useMemo(() => {
    try {
      return { g: parse(expr) }
    } catch (e) {
      return { error: e.message }
    }
  }, [expr])
  if (parsed.g) lastGood.current = parsed.g
  const g = lastGood.current

  const vals = useMemo(() => {
    const out = {}
    g.vars.forEach((name) => {
      const n = Number(raw[name])
      out[name] = raw[name] === undefined || raw[name] === '' || !Number.isFinite(n) ? (DEFAULTS[name] ?? 1) : n
    })
    return out
  }, [g, raw])

  const values = useMemo(() => forward(g, vals), [g, vals])
  const grads = useMemo(() => backward(g, values), [g, values])
  const finite = values.every(Number.isFinite) && grads.every(Number.isFinite)
  const total = g.nodes.length

  // any edit to the problem resets the animation
  useEffect(() => {
    setStep(0)
    setPlaying(false)
  }, [g, vals])

  useEffect(() => {
    if (!playing) return
    if (step >= total) {
      setPlaying(false)
      return
    }
    const id = setTimeout(() => setStep((s) => s + 1), 420)
    return () => clearTimeout(id)
  }, [playing, step, total])

  const run = () => {
    if (step >= total) return setStep(0)
    if (reduced) return setStep(total)
    setStep(0)
    setPlaying(true)
  }

  const checks = useMemo(() => {
    if (!finite) return []
    return g.vars.map((name) => {
      const h = 1e-5
      const f = (d) => forward(g, { ...vals, [name]: vals[name] + d })[g.root]
      const numeric = (f(h) - f(-h)) / (2 * h)
      const analytic = grads[g.nodes.findIndex((n) => n.op === 'var' && n.name === name)]
      return { name, analytic, numeric, ok: Math.abs(analytic - numeric) <= 1e-4 * (1 + Math.abs(analytic)) }
    })
  }, [g, vals, grads, finite])

  // layout
  const L = Math.max(...g.layer)
  const W = Math.max(460, (L + 1) * 62 + 16) // long chains widen the canvas instead of squeezing the nodes
  const cols = Array.from({ length: L + 1 }, () => [])
  g.nodes.forEach((_, i) => cols[g.layer[i]].push(i))
  const rows = Math.max(...cols.map((c) => c.length))
  const nw = Math.min(62, (W - 20) / (L + 1) - 14)
  const nh = 48
  const H = Math.max(190, rows * (nh + 14) + 16)
  const dx = L ? (W - nw - 16) / L : 0
  const pos = g.nodes.map((_, i) => {
    const col = cols[g.layer[i]]
    const k = col.indexOf(i)
    return { x: 8 + g.layer[i] * dx, y: (H / col.length) * (k + 0.5) - nh / 2 }
  })
  const shown = (i) => step > 0 && i >= total - step

  return (
    <div className="demo">
      <div className="ag-inputs">
        <label className="ag-expr">
          <span className="mono dim">f =</span>
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            maxLength={60}
            spellCheck={false}
            autoComplete="off"
            aria-label="Expression to differentiate"
            aria-invalid={Boolean(parsed.error)}
          />
        </label>
        {g.vars.map((name) => (
          <label key={name} className="ag-var">
            <span className="mono dim">{name} =</span>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={raw[name] ?? vals[name]}
              onChange={(e) => setRaw((r) => ({ ...r, [name]: e.target.value }))}
              aria-label={`Value of ${name}`}
            />
          </label>
        ))}
      </div>
      <p className={`ag-msg mono ${parsed.error || !finite ? 'is-err' : ''}`} role="status">
        {parsed.error
          ? `${parsed.error}. Showing the last valid expression.`
          : finite
            ? `f = ${fmt(values[g.root])}`
            : 'That value is not finite here (division by zero or overflow).'}
      </p>

      <svg className="ag" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Computation graph for ${expr}`}>
        {g.nodes.flatMap((n, i) =>
          n.args.map((a, j) => {
            const x1 = pos[a].x + nw
            const y1 = pos[a].y + nh / 2
            const x2 = pos[i].x
            const y2 = pos[i].y + nh / 2
            const mid = (x1 + x2) / 2
            return (
              <path
                key={`${a}-${i}-${j}`}
                d={`M${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                className={`ag-edge ${shown(a) ? 'is-hot' : ''}`}
                fill="none"
              />
            )
          }),
        )}
        {g.nodes.map((n, i) => (
          <g key={i} transform={`translate(${pos[i].x} ${pos[i].y})`} className={`ag-node ${shown(i) ? 'is-hot' : ''} ${i === g.root ? 'is-root' : ''}`}>
            <rect width={nw} height={nh} rx="9" />
            <text x={nw / 2} y="14" textAnchor="middle" className="ag-op">{label(n)}</text>
            <text x={nw / 2} y="28" textAnchor="middle" className="ag-val">{fmt(values[i])}</text>
            <text x={nw / 2} y="41" textAnchor="middle" className="ag-grad" opacity={shown(i) ? 1 : 0}>∂ {fmt(grads[i])}</text>
          </g>
        ))}
      </svg>

      <div className="demo-row">
        <p className="demo-cap mono" aria-live="polite">
          {step >= total && finite
            ? 'Gradients, in reverse order. Each one is the sum over every path to the output.'
            : 'Top line: the operation. Middle: forward value. ∂: gradient of the output with respect to that node.'}
        </p>
        <button type="button" className="run-btn" disabled={!finite || playing} onClick={run}>
          {step >= total ? 'Reset' : 'Run backward pass'}
        </button>
      </div>

      {step >= total && finite && (
        <ul className="ag-checks mono" aria-label="Gradient check against finite differences">
          {checks.map((c) => (
            <li key={c.name} className={c.ok ? 'is-ok' : 'is-bad'}>
              <span>∂f/∂{c.name} = {fmt(c.analytic)}</span>
              <span className="dim">numeric {fmt(c.numeric)}</span>
              <b aria-label={c.ok ? 'matches' : 'mismatch'}>{c.ok ? '✓' : '✗'}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
