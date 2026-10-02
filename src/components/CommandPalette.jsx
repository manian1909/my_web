import { useEffect, useMemo, useRef, useState } from 'react'
import { featured, profile } from '../content'
import { toggleTheme } from '../theme'

const go = (id) => () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
const open = (url) => () => window.open(url, '_blank', 'noopener')
const download = (url) => () => {
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.click()
}

export function CommandPalette() {
  const [isOpen, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const returnTo = useRef(null)

  const actions = useMemo(
    () => [
      { group: 'Go to', label: 'Work', run: go('work') },
      { group: 'Go to', label: 'Experience', run: go('experience') },
      { group: 'Go to', label: 'Education and awards', run: go('about') },
      { group: 'Go to', label: 'Beyond code (toys)', run: go('beyond') },
      { group: 'Go to', label: 'Contact', run: go('contact') },
      { group: 'Go to', label: 'Try the tiny shell', keywords: 'terminal demo command line', run: go('shell') },
      ...featured.map((f) => ({
        group: 'Project',
        label: f.title,
        keywords: `${f.org} ${f.stack.join(' ')}`,
        run: go(f.id),
      })),
      { group: 'Open', label: 'Resume (PDF)', run: open(profile.resume) },
      { group: 'Open', label: 'GitHub', run: open(profile.github) },
      { group: 'Open', label: 'LinkedIn', run: open(profile.linkedin) },
      { group: 'Do', label: 'Download resume', keywords: 'cv pdf', run: download(profile.resume) },
      { group: 'Do', label: 'Back to top', run: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { group: 'Do', label: 'Copy email address', run: () => navigator.clipboard?.writeText(profile.email) },
      { group: 'Do', label: 'Keyboard shortcuts', keywords: 'keys help vim j k', run: () => window.dispatchEvent(new Event('open-shortcuts')) },
      { group: 'Do', label: 'Leave a message', keywords: 'contact form write send mail comment', run: go('message') },
      { group: 'Do', label: 'Toggle light / dark theme', run: toggleTheme },
    ],
    [],
  )
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  const results = actions.filter((a) => {
    const hay = `${a.label} ${a.group} ${a.keywords ?? ''}`.toLowerCase()
    return terms.every((t) => hay.includes(t))
  })

  const close = () => {
    setOpen(false)
    setQ('')
    setIdx(0)
    returnTo.current?.focus?.()
  }

  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(e.target.tagName) || e.target.isContentEditable
      if ((e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !isOpen)) {
        e.preventDefault()
        returnTo.current = document.activeElement
        setOpen((o) => !o)
      } else if (e.key === 'Escape') {
        close()
      }
    }
    const onOpen = () => {
      returnTo.current = document.activeElement
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-palette', onOpen)
    }
  })

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    listRef.current?.children[idx]?.scrollIntoView({ block: 'nearest' })
  }, [idx, isOpen])

  if (!isOpen) return null

  const run = (a) => {
    close()
    setTimeout(a.run, 30)
  }
  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIdx((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[idx]) {
      run(results[idx])
    }
  }

  return (
    <div className="palette-backdrop" onMouseDown={close}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Command menu" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setIdx(0)
          }}
          onKeyDown={onInputKey}
          placeholder="Jump to a section or project, open a link…"
          aria-label="Search commands"
        />
        <ul role="listbox" ref={listRef}>
          {results.length === 0 && <li className="palette-empty mono">Nothing matches “{q}”</li>}
          {results.map((a, i) => (
            <li key={a.label} role="option" aria-selected={i === idx} className={i === idx ? 'is-active' : ''} onMouseEnter={() => setIdx(i)} onClick={() => run(a)}>
              <span>{a.label}</span>
              <span className="mono">{a.group}</span>
            </li>
          ))}
        </ul>
        <div className="palette-foot mono">
          <span>↑↓ move</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  )
}
