import { awards, education, skills } from '../content'
import { Reveal } from './Reveal'
import { useLens } from '../lens'

export function About() {
  const { lens, setLens } = useLens()
  return (
    <section className="section wrap" id="about" aria-labelledby="about-title">
      <div className="section-head">
        <span className="label">Education &amp; skills</span>
        <Reveal as="h2" className="section-title" id="about-title">
          Where I study, and what I use.
        </Reveal>
      </div>

      <div className="about-grid">
        <Reveal className="card edu">
          <span className="label">Education</span>
          <h3>{education.school}</h3>
          <p className="edu-degree">{education.degree}</p>
          <div className="edu-facts mono">
            <span>{education.when}</span>
            <span>GPA {education.gpa} / 10</span>
          </div>
          <span className="label sub">Key courses</span>
          <ul className="tags">
            {education.courses.map((c) => (
              <li className="tag" key={c}>
                {c}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="card awards" delay={80}>
          <span className="label">Awards &amp; achievements</span>
          <ul>
            {awards.map((a) => (
              <li key={a.label}>
                <span className={`award-figure ${a.word ? 'is-word' : ''}`}>
                  {a.prefix && <small>{a.prefix}</small>}
                  {a.figure}
                </span>
                <span className="award-text">
                  <strong>{a.label}</strong>
                  <span className="mono dim">{a.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <div className="skills">
        {skills.map((g, i) => (
          <Reveal className="skill-group" key={g.group} delay={i * 70}>
            <span className="label">{g.group}</span>
            <ul>
              {g.items.map((s) => (
                <li key={s}>
                  <button type="button" className="skill-btn" aria-pressed={lens === s} onClick={() => { setLens(s); document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }) }} title={`Show work that uses ${s}`}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
