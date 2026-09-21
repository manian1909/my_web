import { useEffect, useState } from 'react'

// Returns the id of the section currently crossing a horizontal line near the top of the viewport.
export function useScrollSpy(ids, offset = 0.35) {
  const [active, setActive] = useState(null)
  const key = ids.join('|')

  useEffect(() => {
    const els = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (!els.length) return

    const bottom = Math.round((1 - offset) * 100)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: `-${Math.round(offset * 100)}% 0px -${bottom - 1}% 0px` },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key, offset])

  return active
}
