import { useEffect, useMemo, useReducer, useState } from 'react'

/* ---------- helpers ---------- */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)

/* ---------- Transformer: live scaled dot-product attention ---------- */
const TOKENS = ['The', 'drone', 'chased', 'the', 'robot', 'quickly']
const D = 8
const DK = 4
const HEADS = 4

function buildAttention() {
  // token embedding + the sinusoidal positional encoding
  const X = TOKENS.map((tok, pos) => {
    const r = rng(hash(tok.toLowerCase()))
    return Array.from({ length: D }, (_, j) => {
      const i = Math.floor(j / 2)
      const f = pos / Math.pow(10000, (2 * i) / D)
      return (r() * 2 - 1) * 1.4 + (j % 2 === 0 ? Math.sin(f) : Math.cos(f))
    })
  })
  const proj = (seed) => {
    const r = rng(seed)
    return Array.from({ length: D }, () => Array.from({ length: DK }, () => (r() * 2 - 1) * 1.5))
  }
  const mul = (A, W) => A.map((row) => W[0].map((_, c) => row.reduce((s, v, k) => s + v * W[k][c], 0)))
  return Array.from({ length: HEADS }, (_, h) => {
    const Q = mul(X, proj(100 + h * 17))
    const K = mul(X, proj(900 + h * 31))
    return [false, true].map((masked) =>
      Q.map((q, i) => {
        const s = K.map((k, j) => (masked && j > i ? -Infinity : q.reduce((a, v, c) => a + v * k[c], 0) / Math.sqrt(DK)))
        const m = Math.max(...s)
        const e = s.map((v) => Math.exp(v - m))
        const z = e.reduce((a, b) => a + b, 0)
        return e.map((v) => v / z)
      }),
    )
  })
}

export function AttentionDemo() {
  const att = useMemo(buildAttention, [])
  const [head, setHead] = useState(0)
  const [mask, setMask] = useState(false)
  const [sel, setSel] = useState(2)
  const row = att[head][mask ? 1 : 0][sel]
  const y = (i) => 30 + i * 40

  return (
    <div className="demo">
      <svg className="att" viewBox="0 0 440 262" role="group" aria-label="Attention weights from one word to every other word">
        {TOKENS.map((_, j) => {
          const w = row[j]
          if (w < 0.004) return null
          return (
            <path
              key={j}
              d={`M132 ${y(sel)} C 226 ${y(sel)}, 226 ${y(j)}, 308 ${y(j)}`}
              fill="none"
              stroke="var(--accent-text)"
              strokeLinecap="round"
              strokeWidth={0.8 + w * 9}
              opacity={0.15 + w * 0.85}
              className="att-line"
            />
          )
        })}
        {TOKENS.map((tok, i) => (
          <g
            key={`q${i}`}
            className={`att-q ${i === sel ? 'is-sel' : ''}`}
            role="button"
            tabIndex={0}
            aria-label={`Show where "${tok}" looks`}
            aria-pressed={i === sel}
            onPointerEnter={() => setSel(i)}
            onFocus={() => setSel(i)}
            onClick={() => setSel(i)}
          >
            <rect x="8" y={y(i) - 17} width="124" height="34" rx="9" />
            <text x="124" y={y(i) + 5} textAnchor="end">
              {tok}
            </text>
          </g>
        ))}
        {TOKENS.map((tok, j) => (
          <g key={`k${j}`} className="att-k">
            <text x="316" y={y(j) + 5}>
              {tok}
            </text>
            <text x="432" y={y(j) + 5} textAnchor="end" className="att-pct">
              {Math.round(row[j] * 100)}%
            </text>
          </g>
        ))}
      </svg>
      <div className="demo-controls">
        <span className="mono dim">Head</span>
        {Array.from({ length: HEADS }, (_, h) => (
          <button key={h} type="button" className="chip-btn" aria-pressed={head === h} onClick={() => setHead(h)}>
            {h + 1}
          </button>
        ))}
        <button type="button" className="chip-btn wide" aria-pressed={mask} onClick={() => setMask((m) => !m)}>
          Causal mask {mask ? 'on' : 'off'}
        </button>
      </div>
      <p className="demo-cap mono">
        Real softmax(QKᵀ/√d) on random toy weights. Hover a word to see where it looks. With the mask on, a word can&rsquo;t look ahead.
      </p>
    </div>
  )
}

/* ---------- Zigsaw: run the two-pass search ---------- */
const N = 200
const COLS = 20

export function ZigsawDemo() {
  const rank = useMemo(() => {
    const r = rng(42)
    const scores = Array.from({ length: N }, () => r())
    const order = [...scores.keys()].sort((a, b) => scores[b] - scores[a])
    const out = Array(N)
    order.forEach((idx, pos) => (out[idx] = pos))
    return out
  }, [])
  const [stage, setStage] = useState(0)
  const label = ['1 · Search by meaning', '2 · Rerank with an LLM', 'Start over'][stage]
  const readout = ['200 candidates in the pool', '100 closest to the job description', '10 best matches, picked by the reranker'][stage]
  const cls = (i) => {
    const r = rank[i]
    if (stage === 0) return ''
    if (r >= 100) return 'out'
    if (stage === 1) return 'in'
    return r < 10 ? 'top' : 'mid'
  }

  return (
    <div className="demo">
      <div className="dots" role="img" aria-label={readout}>
        {rank.map((_, i) => (
          <span key={i} className={`dot ${cls(i)}`} style={{ '--d': `${(i % COLS) * 16 + Math.floor(i / COLS) * 6}ms` }} />
        ))}
      </div>
      <div className="demo-row">
        <p className="readout mono" aria-live="polite">
          {readout}
        </p>
        <button type="button" className="run-btn" onClick={() => setStage((s) => (s + 1) % 3)}>
          {label}
        </button>
      </div>
      <p className="demo-cap mono">Illustration with 200 sample candidates. Step 1 keeps the top 100 by embedding similarity, step 2 an LLM picks the best 10.</p>
    </div>
  )
}

/* ---------- Chubb: run the release pipeline ---------- */
const STAGES = [
  { name: 'Build', note: 'compile and package the service' },
  { name: 'Test', note: 'run the test suite' },
  { name: 'Deploy', note: 'roll out to AKS' },
]

export function PipelineDemo() {
  const [step, setStep] = useState(-1)
  useEffect(() => {
    if (step < 0 || step > 2) return
    const id = setTimeout(() => setStep((s) => s + 1), 1300)
    return () => clearTimeout(id)
  }, [step])
  const running = step >= 0 && step <= 2

  return (
    <div className="demo">
      <div className="pipe-src mono">
        <span>Legacy Java app</span>
        <i aria-hidden="true">→</i>
        <span className="hot">Spring Boot microservice</span>
      </div>
      <ol className="pipe">
        {STAGES.map((s, i) => {
          const state = step > i ? 'done' : step === i ? 'run' : ''
          return (
            <li key={s.name} className={`pipe-stage ${state}`}>
              <div className="pipe-head">
                <strong>{s.name}</strong>
                <span className="mono" aria-hidden="true">
                  {state === 'done' ? '✓' : state === 'run' ? '…' : ''}
                </span>
              </div>
              <p className="mono">{s.note}</p>
              <div className="pbar">
                <i />
              </div>
            </li>
          )
        })}
      </ol>
      <div className={`aks ${step === 3 ? 'live' : ''}`}>
        <span className="mono">Azure Kubernetes Service</span>
        <div className="pods" aria-hidden="true">
          {[0, 1, 2].map((p) => (
            <i key={p} style={{ '--i': p }} />
          ))}
        </div>
        <span className="mono aks-status" aria-live="polite">
          {step === 3 ? 'service live' : running ? 'pipeline running…' : 'waiting for a release'}
        </span>
      </div>
      <div className="demo-row">
        <p className="demo-cap mono">Jenkins runs these stages automatically; Dynaflow orchestrates the pipeline build.</p>
        <button type="button" className="run-btn" disabled={running} onClick={() => setStep(0)}>
          {step === 3 ? 'Run again' : 'Run pipeline'}
        </button>
      </div>
    </div>
  )
}

/* ---------- NFS: exclusive write access ---------- */
function lockReducer(state, action) {
  if (action.type === 'request') {
    const c = action.client
    if (state.holder === c || state.queue.includes(c)) return state
    if (state.holder === null) return { holder: c, queue: [] }
    return { ...state, queue: [...state.queue, c] }
  }
  if (action.type === 'release') {
    const [next, ...rest] = state.queue
    return { holder: next ?? null, queue: rest }
  }
  return state
}

export function NfsDemo() {
  const [{ holder, queue }, dispatch] = useReducer(lockReducer, { holder: null, queue: [] })
  useEffect(() => {
    if (!holder) return
    const id = setTimeout(() => dispatch({ type: 'release' }), 2200)
    return () => clearTimeout(id)
  }, [holder])

  return (
    <div className="demo">
      <div className="nfs-clients">
        {['A', 'B'].map((c) => {
          const state = holder === c ? 'writing' : queue.includes(c) ? 'waiting' : 'idle'
          return (
            <div key={c} className={`nfs-client ${state}`}>
              <strong>Client {c}</strong>
              <span className="mono">{state === 'writing' ? 'writing…' : state === 'waiting' ? 'waiting for the lock' : 'idle'}</span>
              <button type="button" className="run-btn small" onClick={() => dispatch({ type: 'request', client: c })} disabled={state !== 'idle'}>
                Write to file
              </button>
              <i className="wire" aria-hidden="true" />
            </div>
          )
        })}
      </div>
      <div className={`nfs-file ${holder ? 'locked' : ''}`}>
        <div>
          <strong>report.txt</strong>
          <span className="mono">{holder ? `locked by client ${holder}` : 'unlocked'}</span>
        </div>
        <div className="pbar">{holder && <i key={holder} className="run" />}</div>
      </div>
      <p className="demo-cap mono">Press both buttons quickly: only one client can write at a time, the other waits its turn (mutex lock).</p>
    </div>
  )
}
