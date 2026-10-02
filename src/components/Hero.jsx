import { useRef } from 'react'
import { profile, status } from '../content'
import { PursuitCanvas } from './PursuitCanvas'
import { ArrowDown, ArrowUpRight } from './Icons'

const Letters = ({ text }) =>
  [...text].map((ch, i) => (
    <span className="ch" key={i}>
      {ch}
    </span>
  ))

export function Hero() {
  const hud = useRef(null)

  return (
    <section className="hero" id="top" aria-label="Introduction">
      <PursuitCanvas hudRef={hud} />
      <div className="hero-fade" aria-hidden="true" />

      <div className="wrap hero-inner">
        <h1 className="hero-name">
          <span className="line">
            <span style={{ '--d': '80ms' }}>
              <Letters text={profile.firstName} />
            </span>
          </span>
          <span className="line">
            <span style={{ '--d': '190ms' }}>
              <Letters text={profile.lastName} />
            </span>
          </span>
        </h1>

        <div className="hero-lower">
          <div className="hero-intro fade-in" style={{ '--d': '420ms' }}>
            <p>{profile.intro}</p>
            <p className="offline">{profile.offline}</p>
          </div>

          <div className="hero-actions fade-in" style={{ '--d': '540ms' }}>
            <a className="button" href="#work">
              See my work <ArrowDown />
            </a>
            <a className="button ghost" href={profile.resume} target="_blank" rel="noreferrer">
              Resume <ArrowUpRight />
            </a>
            <a className="link" href={profile.github} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight />
            </a>
            <a className="link" href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn <ArrowUpRight />
            </a>
          </div>
        </div>

        <dl className="status fade-in" style={{ '--d': '700ms' }}>
          {status.map((s) => (
            <div key={s.k}>
              <dt className="label">
                <span className="status-dot" aria-hidden="true" />
                {s.k}
              </dt>
              <dd>
                {s.v}
                <span className="mono">{s.sub}</span>
              </dd>
            </div>
          ))}
        </dl>

        <p className="sim-caption mono fade-in" style={{ '--d': '900ms' }}>
          <span className="sim-dot" aria-hidden="true" />
          Move your cursor: the green drone chases it. A simplified version of my drone project.
          <span ref={hud} className="sim-hud" aria-hidden="true" />
        </p>
      </div>
    </section>
  )
}
