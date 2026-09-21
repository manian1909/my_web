import { featured, more } from '../content'
import { Diagram } from './Diagrams'
import { Reveal } from './Reveal'
import { Terminal } from './Terminal'
import { ArrowUpRight } from './Icons'

function Feature({ item, index }) {
  return (
    <Reveal as="article" className="feature" id={item.id}>
      <div className="feature-text">
        <div className="feature-meta">
          <span className="feature-index mono">{String(index + 1).padStart(2, '0')}</span>
          <span className="kind">{item.kind}</span>
          <span className="mono dim">{[item.org, item.when].filter(Boolean).join(' · ')}</span>
        </div>
        <h3>{item.title}</h3>
        <p className="feature-summary">{item.summary}</p>
        <ul className="points">
          {item.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="feature-foot">
          <ul className="tags" aria-label="Technologies">
            {item.stack.map((s) => (
              <li key={s} className="tag">
                {s}
              </li>
            ))}
          </ul>
          {item.href && (
            <a className="link" href={item.href} target="_blank" rel="noreferrer">
              Visit {item.org} <ArrowUpRight />
            </a>
          )}
        </div>
      </div>
      <div className="feature-visual">
        <Diagram diagram={item.diagram} />
      </div>
    </Reveal>
  )
}

export function Work() {
  return (
    <section className="section wrap" id="work" aria-labelledby="work-title">
      <div className="section-head">
        <span className="label">Selected work</span>
        <Reveal as="h2" className="section-title" id="work-title">
          What I&rsquo;ve built, and what it does.
        </Reveal>
      </div>

      <div className="features">
        {featured.map((item, i) => (
          <Feature key={item.id} item={item} index={i} />
        ))}
      </div>

      <h3 className="subhead">Also</h3>
      <div className="more">
        {more.map((m, i) => (
          <Reveal as="article" className="more-card" key={m.title} delay={i * 70}>
            <span className="mono dim">{m.meta}</span>
            <h4>{m.title}</h4>
            <p>{m.text}</p>
          </Reveal>
        ))}
      </div>

      <h3 className="subhead" id="shell">
        Try it: a tiny shell
      </h3>
      <Reveal>
        <Terminal />
      </Reveal>
    </section>
  )
}
