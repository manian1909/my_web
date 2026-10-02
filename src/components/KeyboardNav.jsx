import { useEffect, useState } from 'react'
import { toggleTheme } from '../theme'

/* Keyboard navigation for the whole page: j / k step between sections, t flips the theme, ? lists the shortcuts.
   Ignored while typing in a field or when a modifier key is held. */

const SECTIONS = ['top', 'work', 'experience', 'about', 'beyond', 'contact']

const SHORTCUTS = [
  ['j', 'Next section'],
  ['k', 'Previous section'],
  ['g g', 'Back to top'],
  ['G', 'Jump to contact'],
  ['t', 'Toggle light / dark'],
  ['/', 'Command menu'],
  ['?', 'This list'],
]

function step(dir) {
  const line = window.innerHeight * 0.35
  let current = 0
  SECTIONS.forEach((id, i) => {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top <= line) current = i
  })
  const next = Math.min(SECTIONS.length - 1, Math.max(0, current + dir))
  document.getElementById(SECTIONS[next])?.scrollIntoView({ behavior: 'smooth' })
}

export function KeyboardNav() {
  const [help, setHelp] = useState(false)

  useEffect(() => {
    let pending = 0
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (/input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable) return
      if (e.key === 'Escape') return setHelp(false)
      if (e.key !== '?' && document.querySelector('.palette-backdrop')) return
      if (e.key === 'j') step(1)
      else if (e.key === 'k') step(-1)
      else if (e.key === 'G') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
      else if (e.key === 'g') {
        if (Date.now() - pending < 600) window.scrollTo({ top: 0, behavior: 'smooth' })
        pending = Date.now()
      } else if (e.key === 't') toggleTheme()
      else if (e.key === '?') setHelp((h) => !h)
    }
    const onOpen = () => setHelp(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-shortcuts', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-shortcuts', onOpen)
    }
  }, [])

  if (!help) return null
  return (
    <div className="palette-backdrop" onMouseDown={() => setHelp(false)}>
      <div className="palette sc-sheet" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sc-head">
          <span className="label">Keyboard shortcuts</span>
          <button type="button" className="chip-btn" onClick={() => setHelp(false)} autoFocus>
            Close
          </button>
        </div>
        <ul>
          {SHORTCUTS.map(([k, label]) => (
            <li key={k}>
              <span>{label}</span>
              <span>
                {k.split(' ').map((part) => (
                  <kbd key={part}>{part}</kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
