import { useCallback, useEffect, useRef, useState } from 'react'
import { hobbies, profile } from '../content'
import { useCanvas } from '../hooks/useCanvas'
import { fourierScene, gardenScene, gravityScene, kitchenScene, scopeScene } from '../scenes'
import { Reveal } from './Reveal'

const NO_PARAMS = { current: null }

function Stage({ scene, params = NO_PARAMS, label, className = '' }) {
  const ref = useCanvas(scene, params)
  return (
    <div className={`stage ${className}`}>
      <canvas ref={ref} role="img" aria-label={label} />
    </div>
  )
}

/* ---- Singing: a small playable piano ---- */
const KEYS = [
  { n: 'C', f: 261.63, key: 'a' },
  { n: 'D', f: 293.66, key: 's' },
  { n: 'E', f: 329.63, key: 'd' },
  { n: 'F', f: 349.23, key: 'f' },
  { n: 'G', f: 392.0, key: 'g' },
  { n: 'A', f: 440.0, key: 'h' },
  { n: 'B', f: 493.88, key: 'j' },
  { n: 'C', f: 523.25, key: 'k' },
]
const SHARPS = [
  { n: 'C♯', f: 277.18, key: 'w', at: 0 },
  { n: 'D♯', f: 311.13, key: 'e', at: 1 },
  { n: 'F♯', f: 369.99, key: 't', at: 3 },
  { n: 'G♯', f: 415.3, key: 'y', at: 4 },
  { n: 'A♯', f: 466.16, key: 'u', at: 5 },
]

function Piano() {
  const params = useRef({ analyser: null })
  const audio = useRef(null)
  const [down, setDown] = useState({})

  const ensure = useCallback(() => {
    if (audio.current) return audio.current
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0.5
    const an = ctx.createAnalyser()
    an.fftSize = 1024
    master.connect(an)
    an.connect(ctx.destination)
    audio.current = { ctx, master }
    params.current.analyser = an
    return audio.current
  }, [])

  const play = useCallback(
    (note) => {
      const a = ensure()
      if (!a) return
      if (a.ctx.state === 'suspended') a.ctx.resume()
      const now = a.ctx.currentTime
      const g = a.ctx.createGain()
      g.gain.setValueAtTime(0.0001, now)
      g.gain.exponentialRampToValueAtTime(0.5, now + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4)
      g.connect(a.master)
      for (const [type, mul, vol] of [
        ['triangle', 1, 1],
        ['sine', 2, 0.25],
      ]) {
        const o = a.ctx.createOscillator()
        const og = a.ctx.createGain()
        o.type = type
        o.frequency.value = note.f * mul
        og.gain.value = vol
        o.connect(og)
        og.connect(g)
        o.start(now)
        o.stop(now + 1.5)
      }
      setDown((d) => ({ ...d, [note.key]: true }))
      setTimeout(() => setDown((d) => ({ ...d, [note.key]: false })), 180)
    },
    [ensure],
  )

  useEffect(
    () => () => {
      audio.current?.ctx.close()
      audio.current = null
    },
    [],
  )

  const onKeyDown = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
    const note = [...KEYS, ...SHARPS].find((k) => k.key === e.key.toLowerCase())
    if (note) {
      e.preventDefault()
      play(note)
    }
  }

  return (
    <div className="piano" tabIndex={0} onKeyDown={onKeyDown} aria-label="Piano. Press A to K for notes, W E T Y U for sharps.">
      <Stage scene={scopeScene} params={params} label="Live waveform of the notes you play" className="scope" />
      <div className="keys">
        {KEYS.map((k) => (
          <button key={k.key} type="button" className={`key ${down[k.key] ? 'is-down' : ''}`} onPointerDown={() => play(k)} aria-label={`Note ${k.n}`}>
            <span>{k.key.toUpperCase()}</span>
          </button>
        ))}
        {SHARPS.map((k) => (
          <button
            key={k.key}
            type="button"
            className={`key sharp ${down[k.key] ? 'is-down' : ''}`}
            style={{ left: `${((k.at + 1) / KEYS.length) * 100}%` }}
            onPointerDown={() => play(k)}
            aria-label={`Note ${k.n}`}
          />
        ))}
      </div>
    </div>
  )
}

/* ---- Math: epicycles with a slider ---- */
function Epicycles() {
  const params = useRef({ k: 14 })
  const [k, setK] = useState(14)
  return (
    <>
      <Stage scene={fourierScene} params={params} label="Spinning circles tracing a shape" className="tall" />
      <label className="slider mono">
        <span>Circles: {k}</span>
        <input
          type="range"
          min="1"
          max="60"
          value={k}
          onChange={(e) => {
            params.current.k = +e.target.value
            setK(+e.target.value)
          }}
          aria-label="Number of circles"
        />
      </label>
    </>
  )
}

const cards = {
  singing: { body: <Piano />, hint: 'Tap the keys, or click here and press A to K' },
  math: { body: <Epicycles />, hint: 'Draw any shape. Spinning circles rebuild it' },
  physics: { body: <Stage scene={gravityScene} label="Gravity sandbox" className="tall" />, hint: 'Click to add a planet. Drag and release to launch one' },
  cooking: { body: <Stage scene={kitchenScene} label="A bubbling pot" className="tall" />, hint: 'Click to drop an ingredient into the pot' },
  gardening: { body: <Stage scene={gardenScene} label="A small garden" className="tall" />, hint: 'Click the ground to plant a flower' },
}

export function Hobbies() {
  return (
    <section className="section wrap" id="beyond" aria-labelledby="beyond-title">
      <div className="section-head">
        <span className="label">Beyond code</span>
        <Reveal as="h2" className="section-title" id="beyond-title">
          The rest of me. Go on, play.
        </Reveal>
        <Reveal as="p" className="section-intro" delay={60}>
          {profile.offline} These are little toys for each of them.
        </Reveal>
      </div>

      <div className="hobbies">
        {hobbies.map((h, i) => (
          <Reveal as="article" className={`hobby hobby-${h.id}`} key={h.id} delay={i * 60}>
            <div className="hobby-art">{cards[h.id].body}</div>
            <h3>{h.title}</h3>
            <p>{h.text}</p>
            <p className="hint mono">{cards[h.id].hint}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
