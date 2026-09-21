import { useEffect, useState } from 'react'
import { profile } from '../content'
import { HalfMoon } from './Icons'
import { toggleTheme } from '../theme'
import { useScrollSpy } from '../hooks/useScrollSpy'

const sections = [
  { id: 'work', label: 'Work' },
  { id: 'experience', label: 'Experience' },
  { id: 'about', label: 'About' },
  { id: 'beyond', label: 'Beyond' },
  { id: 'contact', label: 'Contact' },
]

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const active = useScrollSpy(sections.map((s) => s.id), 0.5)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="header-pill">
        <a href="#top" className="brand" aria-label="Himank Singhvi, back to top">
          <span className="brand-mark" aria-hidden="true">
            HS
          </span>
          <span className="brand-name">Himank Singhvi</span>
        </a>
        <nav className="nav" aria-label="Primary">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={active === s.id ? 'is-active' : ''}
              aria-current={active === s.id ? 'true' : undefined}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <button type="button" className="header-k" onClick={() => window.dispatchEvent(new Event('open-palette'))} aria-label="Open command menu">
          <kbd>{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
        <a className="header-cta" href={profile.resume} target="_blank" rel="noreferrer">
          Resume
        </a>
        <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle color theme">
          <HalfMoon />
        </button>
      </div>
    </header>
  )
}
