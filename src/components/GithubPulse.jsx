import { useEffect, useState } from 'react'
import { profile } from '../content'
import { ArrowUpRight } from './Icons'

/* Most recently pushed public repos, fetched live from the GitHub API.
   Cached for 30 minutes in sessionStorage (the unauthenticated limit is 60 requests/hour) and replaced by a plain line if the request fails. */

const user = profile.github.split('/').filter(Boolean).pop()
const KEY = `gh-repos:${user}`
const TTL = 30 * 60 * 1000

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
function ago(iso) {
  const s = (new Date(iso) - Date.now()) / 1000
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [u, n] of units) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u)
  return 'just now'
}

function readCache() {
  try {
    const c = JSON.parse(sessionStorage.getItem(KEY))
    if (c && Date.now() - c.at < TTL) return c.repos
  } catch {
    /* no cache */
  }
  return null
}

export function GithubPulse() {
  const [repos, setRepos] = useState(readCache)

  useEffect(() => {
    if (repos) return
    const ctl = new AbortController()
    fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=12`, {
      signal: ctl.signal,
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((all) => {
        const list = all
          .filter((r) => !r.fork && !r.private)
          .slice(0, 4)
          .map((r) => ({ name: r.name, url: r.html_url, desc: r.description, lang: r.language, pushed: r.pushed_at }))
        setRepos(list)
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), repos: list }))
        } catch {
          /* storage unavailable */
        }
      })
      .catch(() => {})
    return () => ctl.abort()
  }, [repos])

  if (!repos?.length) return <p className="gh-empty mono dim">Recent repositories are on my GitHub profile.</p>

  return (
    <ul className="gh">
      {repos.map((r) => (
        <li key={r.name}>
          <a href={r.url} target="_blank" rel="noreferrer">
            <span className="gh-name">
              {r.name} <ArrowUpRight />
            </span>
            <span className="gh-desc">{r.desc || 'No description'}</span>
            <span className="gh-meta mono">
              {r.lang && <span>{r.lang}</span>}
              <span>pushed {ago(r.pushed)}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
