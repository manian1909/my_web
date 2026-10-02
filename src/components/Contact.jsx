import { useEffect, useState } from 'react'
import { profile } from '../content'
import { Reveal } from './Reveal'
import { ArrowUp, ArrowUpRight } from './Icons'
import { ContactForm } from './ContactForm'

const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' })

function LocalTime() {
  const [now, setNow] = useState(() => clock.format(new Date()))
  useEffect(() => {
    const id = setInterval(() => setNow(clock.format(new Date())), 15000)
    return () => clearInterval(id)
  }, [])
  return (
    <span>
      Hyderabad, India · {now} IST
    </span>
  )
}

export function Contact() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <footer className="contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <span className="label">Contact</span>
        <Reveal as="h2" className="contact-title" id="contact-title">
          Let&rsquo;s talk.
        </Reveal>

        <div className="contact-grid">
        <Reveal className="contact-body" delay={80}>
          <p>
            Working on something in backend, ML or robotics, or have an internship or project in mind? Email is the
            fastest way to reach me.
          </p>
          <div className="email">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <button type="button" className="copy" onClick={copy} aria-live="polite">
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="contact-links">
            <a className="link" href={profile.github} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight />
            </a>
            <a className="link" href={profile.linkedin} target="_blank" rel="noreferrer">
              LinkedIn <ArrowUpRight />
            </a>
            <a className="link" href={profile.resume} target="_blank" rel="noreferrer">
              Resume (PDF) <ArrowUpRight />
            </a>
          </div>
        </Reveal>
        <Reveal delay={160}>
          <div id="message"><ContactForm /></div>
        </Reveal>
        </div>

        <div className="footer mono">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <LocalTime />
          <button type="button" className="link linklike" onClick={() => window.dispatchEvent(new Event('open-shortcuts'))}>
            Shortcuts <kbd>?</kbd>
          </button>
          <a className="link" href="#top">
            Back to top <ArrowUp />
          </a>
        </div>
      </div>
    </footer>
  )
}
