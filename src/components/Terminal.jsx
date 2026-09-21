import { useEffect, useRef, useState } from 'react'
import { education, featured, more, profile, skills } from '../content'

/* A small simulated shell. The file system is built from content.js so it never drifts from the page. */

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function buildFs() {
  const projects = {}
  featured.forEach((f) => {
    projects[`${f.id}.txt`] = [
      f.title,
      [f.org, f.when].filter(Boolean).join(' · '),
      '',
      f.summary,
      '',
      ...f.points.map((p) => `- ${p}`),
      '',
      `stack: ${f.stack.join(', ')}`,
    ].join('\n')
  })
  more.forEach((m) => {
    projects[`${slug(m.title)}.txt`] = [m.title, m.meta, '', m.text].join('\n')
  })
  return {
    'about.txt': `${profile.intro}\n${profile.offline}`,
    'education.txt': `${education.school}\n${education.degree} (${education.when})\n\n${education.courses.map((c) => `- ${c}`).join('\n')}`,
    'skills.txt': skills.map((g) => `${g.group}: ${g.items.join(', ')}`).join('\n'),
    'contact.txt': `email:    ${profile.email}\ngithub:   ${profile.github}\nlinkedin: ${profile.linkedin}`,
    projects,
  }
}

/* ---- paths ---- */
const isDir = (n) => typeof n === 'object' && n !== null
const has = (o, k) => Object.hasOwn(o, k)

function walk(fs, parts) {
  let n = fs
  for (const p of parts) {
    if (!isDir(n) || !has(n, p)) return undefined
    n = n[p]
  }
  return n
}

function parsePath(cwd, path) {
  const parts = path.startsWith('/') || path.startsWith('~') ? [] : [...cwd]
  for (const seg of path.replace(/^~/, '').split('/')) {
    if (!seg || seg === '.') continue
    if (seg === '..') parts.pop()
    else parts.push(seg)
  }
  return parts
}

const promptOf = (cwd) => `guest@himank:${cwd.length ? `~/${cwd.join('/')}` : '~'}$`

/* ---- parsing ---- */
function tokenize(s) {
  const out = []
  let cur = ''
  let quoted = false
  let inTok = false
  let quote = null
  let justOp = false
  const flush = () => {
    if (inTok) out.push({ text: cur, q: quoted })
    cur = ''
    quoted = false
    inTok = false
  }
  for (const ch of s) {
    const wasOp = justOp
    justOp = false
    if (quote) {
      if (ch === quote) quote = null
      else cur += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
      quoted = true
      inTok = true
    } else if (/\s/.test(ch)) {
      flush()
    } else if (ch === '>') {
      flush()
      if (wasOp) out[out.length - 1].text = '>>'
      else {
        out.push({ text: '>', q: false })
        justOp = true
      }
    } else {
      cur += ch
      inTok = true
    }
  }
  flush()
  return out
}

/* ---- commands: (args, sh) => string, or throw Error for stderr ---- */
function writeFile(sh, path, text, append) {
  const parts = parsePath(sh.cwd, path)
  const name = parts[parts.length - 1]
  const parent = walk(sh.fs, parts.slice(0, -1))
  if (!name) throw new Error(`sh: ${path}: Is a directory`)
  if (!isDir(parent)) throw new Error(`sh: ${path}: No such file or directory`)
  if (name === '__proto__') throw new Error(`sh: ${path}: invalid file name`)
  if (has(parent, name) && isDir(parent[name])) throw new Error(`sh: ${path}: Is a directory`)
  const prev = has(parent, name) && typeof parent[name] === 'string' ? parent[name] : null
  parent[name] = append && prev !== null ? `${prev}\n${text}` : text
}

function makeNodes(sh, args, cmd, create) {
  const names = args.filter((a) => !a.startsWith('-'))
  if (!names.length) throw new Error(`${cmd}: missing operand`)
  for (const path of names) {
    const parts = parsePath(sh.cwd, path)
    const name = parts[parts.length - 1]
    const parent = walk(sh.fs, parts.slice(0, -1))
    if (!name || !isDir(parent)) throw new Error(`${cmd}: cannot create '${path}': No such file or directory`)
    if (name === '__proto__') throw new Error(`${cmd}: invalid name`)
    create(parent, name, path)
  }
  return ''
}

const COMMANDS = {
  help: () =>
    [
      'built-ins:  ls  cd  pwd  cat  echo  mkdir  touch  rm  clear  history',
      '            alias  unalias  jobs  sleep  date  whoami  reset  exit',
      '',
      'try:        cat about.txt      ls projects      cat projects/nfs.txt',
      '            echo hi > note.txt      sleep 4 &      jobs',
      '',
      'Redirection (> and >>), aliases, background jobs (&) and Tab completion work.',
      'Pipes do not, and nothing here touches your real machine.',
    ].join('\n'),

  ls(args, sh) {
    const targets = args.filter((a) => !a.startsWith('-'))
    return (targets.length ? targets : ['.'])
      .map((path) => {
        const node = walk(sh.fs, parsePath(sh.cwd, path))
        if (node === undefined) throw new Error(`ls: cannot access '${path}': No such file or directory`)
        if (!isDir(node)) return path
        return Object.keys(node)
          .sort()
          .map((k) => (isDir(node[k]) ? `${k}/` : k))
          .join('  ')
      })
      .join('\n')
  },

  cd(args, sh) {
    const path = args[0] ?? '~'
    const parts = parsePath(sh.cwd, path)
    const node = walk(sh.fs, parts)
    if (node === undefined) throw new Error(`cd: no such directory: ${path}`)
    if (!isDir(node)) throw new Error(`cd: not a directory: ${path}`)
    sh.cwd = parts
    return ''
  },

  pwd: (_a, sh) => `/home/guest${sh.cwd.length ? `/${sh.cwd.join('/')}` : ''}`,

  cat(args, sh) {
    if (!args.length) throw new Error('cat: missing file operand')
    return args
      .map((path) => {
        const node = walk(sh.fs, parsePath(sh.cwd, path))
        if (node === undefined) throw new Error(`cat: ${path}: No such file or directory`)
        if (isDir(node)) throw new Error(`cat: ${path}: Is a directory`)
        return node
      })
      .join('\n')
  },

  echo: (args) => args.join(' '),

  mkdir: (args, sh) =>
    makeNodes(sh, args, 'mkdir', (parent, name, path) => {
      if (has(parent, name)) throw new Error(`mkdir: cannot create directory '${path}': File exists`)
      parent[name] = {}
    }),

  touch: (args, sh) =>
    makeNodes(sh, args, 'touch', (parent, name) => {
      if (!has(parent, name)) parent[name] = ''
    }),

  rm(args, sh) {
    const recursive = args.some((a) => /^-[a-z]*r/i.test(a))
    const names = args.filter((a) => !a.startsWith('-'))
    if (!names.length) throw new Error('rm: missing operand')
    for (const path of names) {
      const parts = parsePath(sh.cwd, path)
      const name = parts[parts.length - 1]
      const parent = walk(sh.fs, parts.slice(0, -1))
      if (!name || !isDir(parent) || !has(parent, name)) throw new Error(`rm: cannot remove '${path}': No such file or directory`)
      if (isDir(parent[name]) && !recursive) throw new Error(`rm: cannot remove '${path}': Is a directory (use -r)`)
      delete parent[name]
      // If we just deleted a directory we were standing in, step back to the nearest one that exists.
      while (sh.cwd.length && walk(sh.fs, sh.cwd) === undefined) sh.cwd = sh.cwd.slice(0, -1)
    }
    return ''
  },

  history: (_a, sh) => sh.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join('\n'),

  alias(args, sh) {
    if (!args.length) return Object.entries(sh.aliases).map(([k, v]) => `alias ${k}='${v}'`).join('\n')
    for (const a of args) {
      const eq = a.indexOf('=')
      if (eq < 1) {
        if (!has(sh.aliases, a)) throw new Error(`alias: ${a}: not found`)
        continue
      }
      const name = a.slice(0, eq)
      if (!/^[\w.-]+$/.test(name) || name === '__proto__') throw new Error(`alias: invalid alias name: ${name}`)
      sh.aliases[name] = a.slice(eq + 1)
    }
    return ''
  },

  unalias(args, sh) {
    for (const a of args) {
      if (!has(sh.aliases, a)) throw new Error(`unalias: ${a}: not found`)
      delete sh.aliases[a]
    }
    return ''
  },

  jobs: (_a, sh) =>
    [...sh.jobs.entries()].map(([n, j]) => `[${n}]+  Running                 ${j.label} &`).join('\n'),

  sleep(args) {
    const n = Number(args[0])
    if (!args[0] || !Number.isFinite(n) || n < 0) throw new Error('sleep: invalid time interval')
    if (n > 10) throw new Error('sleep: this demo caps it at 10 seconds')
    return { sleep: n }
  },

  date: () => new Date().toString(),
  whoami: () => `guest (you are visiting ${profile.name}'s site. Try: cat about.txt)`,
  reset(_a, sh) {
    sh.fs = buildFs()
    sh.cwd = []
    return 'file system restored'
  },
  exit: () => 'logout\n...just kidding, there is nowhere to go. This is a portfolio.',
  sudo: () => {
    throw new Error('guest is not in the sudoers file. This incident will be reported.')
  },
}
const NAMES = Object.keys(COMMANDS)

/* Runs one line. Returns { lines, sleep?, clear?, job? } and mutates the shell state. */
function execute(raw, sh) {
  const res = { lines: [] }
  let line = raw.trim()
  if (!line) return res
  const bg = /&\s*$/.test(line)
  if (bg) line = line.replace(/&\s*$/, '').trim()

  let toks = tokenize(line)
  if (toks.length && !toks[0].q && has(sh.aliases, toks[0].text)) {
    toks = [...tokenize(sh.aliases[toks[0].text]), ...toks.slice(1)]
  }

  let redirect = null
  const args = []
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    if (!t.q && (t.text === '>' || t.text === '>>')) {
      const target = toks[i + 1]
      if (!target || (!target.q && /^>>?$/.test(target.text))) {
        res.lines.push({ kind: 'err', text: "sh: syntax error near unexpected token `newline'" })
        return res
      }
      redirect = { append: t.text === '>>', path: target.text }
      i++
    } else {
      args.push(t.text)
    }
  }
  const [cmd, ...rest] = args
  if (!cmd) return res
  if (cmd === 'clear') return { lines: [], clear: true }
  if (!has(COMMANDS, cmd)) {
    res.lines.push({ kind: 'err', text: `sh: command not found: ${cmd}` })
    return res
  }

  let jobNo = 0
  const freeJob = () => {
    let n = 1
    while (sh.jobs.has(n)) n++
    return n
  }

  try {
    const out = COMMANDS[cmd](rest, sh)
    if (typeof out === 'object') {
      if (bg) {
        jobNo = freeJob()
        sh.jobs.set(jobNo, { label: line, timer: null })
        res.job = { n: jobNo, seconds: out.sleep, label: line }
        res.lines.push({ kind: 'out', text: `[${jobNo}] ${++sh.pid}` })
      } else {
        res.sleep = out.sleep
      }
      return res
    }
    if (bg) {
      jobNo = freeJob()
      res.lines.push({ kind: 'out', text: `[${jobNo}] ${++sh.pid}` })
    }
    if (redirect) writeFile(sh, redirect.path, out, redirect.append)
    else if (out) res.lines.push({ kind: 'out', text: out })
    if (bg) res.lines.push({ kind: 'out', text: `[${jobNo}]+  Done                    ${line}` })
  } catch (e) {
    res.lines.push({ kind: 'err', text: e.message })
  }
  return res
}

function complete(value, sh) {
  const m = value.match(/^(.*?)(\S*)$/s)
  const head = m[1]
  const word = m[2]
  const first = head.trim() === ''
  let candidates
  let base = ''
  if (first) {
    candidates = NAMES.concat(Object.keys(sh.aliases))
  } else {
    const slash = word.lastIndexOf('/')
    base = slash >= 0 ? word.slice(0, slash + 1) : ''
    const dir = walk(sh.fs, parsePath(sh.cwd, base || '.'))
    candidates = isDir(dir) ? Object.keys(dir).map((k) => (isDir(dir[k]) ? `${k}/` : k)) : []
  }
  const prefix = word.slice(base.length)
  const hits = candidates.filter((c) => c.startsWith(prefix)).sort()
  if (!hits.length) return value
  let common = hits[0]
  for (const h of hits) while (!h.startsWith(common)) common = common.slice(0, -1)
  const done = hits.length === 1 && !common.endsWith('/') ? `${common} ` : common
  return head + base + done
}

const SUGGESTIONS = ['ls', 'cat about.txt', 'ls projects', 'sleep 4 &', 'echo hi > note.txt', 'whoami']
const BANNER = [
  { id: 0, kind: 'out', text: 'himank-sh 0.1: a tiny shell in your browser. Type help, press Tab to complete, or pick a command below.' },
]

export function Terminal() {
  const sh = useRef(null)
  if (sh.current === null) sh.current = { fs: buildFs(), cwd: [], aliases: {}, history: [], jobs: new Map(), pid: 4100 }
  const [lines, setLines] = useState(BANNER)
  const [cwd, setCwd] = useState([])
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const nextId = useRef(1)
  const fgTimer = useRef(null)
  const histPos = useRef(-1)
  const inputRef = useRef(null)
  const logRef = useRef(null)

  const append = (items) => {
    const stamped = items.map((it) => ({ ...it, id: nextId.current++ }))
    setLines((l) => [...l, ...stamped].slice(-300))
  }

  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  useEffect(() => {
    const state = sh.current
    return () => {
      clearTimeout(fgTimer.current)
      state.jobs.forEach((j) => clearTimeout(j.timer))
    }
  }, [])

  const submit = (raw) => {
    const s = sh.current
    const items = [{ kind: 'cmd', prompt: promptOf(s.cwd), text: raw }]
    const line = raw.trim()
    if (line) s.history = [...s.history, line].slice(-50)
    histPos.current = -1

    const res = execute(raw, s)
    if (res.clear) {
      setLines([])
      setCwd(s.cwd)
      return
    }
    items.push(...res.lines)
    append(items)
    setCwd(s.cwd)

    if (res.sleep !== undefined) {
      setBusy(true)
      fgTimer.current = setTimeout(() => setBusy(false), res.sleep * 1000)
    }
    if (res.job) {
      const { n, seconds, label } = res.job
      const timer = setTimeout(() => {
        s.jobs.delete(n)
        append([{ kind: 'out', text: `[${n}]+  Done                    ${label}` }])
      }, seconds * 1000)
      s.jobs.get(n).timer = timer
    }
  }

  const interrupt = () => {
    clearTimeout(fgTimer.current)
    setBusy(false)
    append([{ kind: 'out', text: '^C' }])
  }

  const onKeyDown = (e) => {
    const s = sh.current
    if (e.ctrlKey && e.key.toLowerCase() === 'c' && busy) {
      e.preventDefault()
      interrupt()
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      setLines([])
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!s.history.length) return
      histPos.current = histPos.current < 0 ? s.history.length - 1 : Math.max(histPos.current - 1, 0)
      setValue(s.history[histPos.current])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histPos.current < 0) return
      histPos.current += 1
      if (histPos.current >= s.history.length) {
        histPos.current = -1
        setValue('')
      } else setValue(s.history[histPos.current])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      setValue((v) => complete(v, s))
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (busy) return
    submit(value)
    setValue('')
  }

  const focusInput = () => {
    if (!window.getSelection()?.toString()) inputRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="term-wrap">
      <div className="term" onClick={focusInput}>
        <div className="term-bar" aria-hidden="true">
          <i />
          <i />
          <i />
          <span className="mono">guest@himank: sh</span>
        </div>
        <div className="term-log" ref={logRef} role="log" aria-label="Shell output">
          {lines.map((l) =>
            l.kind === 'cmd' ? (
              <div key={l.id} className="term-line">
                <span className="term-prompt">{l.prompt}</span> {l.text}
              </div>
            ) : (
              <div key={l.id} className={`term-out ${l.kind === 'err' ? 'is-err' : ''}`}>
                {l.text}
              </div>
            ),
          )}
        </div>
        <form className="term-form" onSubmit={onSubmit}>
          <label htmlFor="term-input" className="term-prompt">
            {promptOf(cwd)}
          </label>
          <input
            id="term-input"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={200}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={busy ? 'running… Ctrl+C to stop' : 'type a command'}
            aria-label="Shell command"
          />
        </form>
      </div>
      <div className="term-chips" role="group" aria-label="Try a command">
        {SUGGESTIONS.map((c) => (
          <button key={c} type="button" className="chip-btn" disabled={busy} onClick={() => submit(c)}>
            {c}
          </button>
        ))}
        {busy && (
          <button type="button" className="chip-btn wide" onClick={interrupt}>
            Ctrl+C
          </button>
        )}
      </div>
      <p className="demo-cap mono">
        A JavaScript re-creation of the idea, not my actual C shell. Same flavor, though: redirection, aliases, and foreground and background jobs.
      </p>
    </div>
  )
}
