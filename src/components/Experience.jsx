import { experience } from '../content'
import { Reveal } from './Reveal'

export function Experience() {
  return (
    <section className="section wrap" id="experience" aria-labelledby="experience-title">
      <div className="section-head">
        <span className="label">Experience</span>
        <Reveal as="h2" className="section-title" id="experience-title">
          Where I&rsquo;ve worked.
        </Reveal>
      </div>

      <ol className="ledger">
        {experience.map((e, i) => {
          const Row = e.target ? 'a' : 'div'
          return (
            <Reveal as="li" key={e.org} delay={i * 50}>
              <Row className="ledger-row" {...(e.target ? { href: `#${e.target}` } : {})}>
                <span className="ledger-when mono">{e.when}</span>
                <span className="ledger-org">{e.org}</span>
                <span className="ledger-what">
                  <span className="ledger-role">{e.role}</span>
                  <span className="ledger-note">{e.note}</span>
                </span>
                <span className="ledger-go mono" aria-hidden="true">
                  {e.target ? '↓' : ''}
                </span>
              </Row>
            </Reveal>
          )
        })}
      </ol>
    </section>
  )
}
