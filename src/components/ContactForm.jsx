import { useEffect, useRef, useState } from 'react'
import { contactEndpoint, profile } from '../content'

/* Sends the message to my inbox through FormSubmit (https://formsubmit.co), a free form-to-email service,
   so the site needs no backend. Drafts survive a reload; a honeypot field and a cooldown discourage spam. */

const TOPICS = ['Internship', 'Project', 'Feedback', 'Just saying hi']
const LIMIT = 2000
const COOLDOWN = 60_000
const DRAFT = 'contact-draft'
const SENT = 'contact-last-sent'

const store = {
  get(k) {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* storage unavailable */
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k)
    } catch {
      /* storage unavailable */
    }
  },
}

function loadDraft() {
  try {
    return { topic: TOPICS[0], name: '', email: '', message: '', ...JSON.parse(store.get(DRAFT)) }
  } catch {
    return { topic: TOPICS[0], name: '', email: '', message: '' }
  }
}

export function ContactForm() {
  const [f, setF] = useState(loadDraft)
  const [state, setState] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    if (state === 'sent') return
    store.set(DRAFT, JSON.stringify(f))
  }, [f, state])

  const set = (k) => (e) => setF((cur) => ({ ...cur, [k]: e.target.value }))
  const message = f.message.trim()
  const emailOk = !f.email || /^\S+@\S+\.\S+$/.test(f.email.trim())
  const canSend = message.length >= 10 && emailOk && state !== 'sending'

  const mailto = `mailto:${profile.email}?subject=${encodeURIComponent(`[${f.topic}] Message from ${f.name || 'your website'}`)}&body=${encodeURIComponent(f.message)}`

  const submit = async (e) => {
    e?.preventDefault()
    if (!canSend) return
    const since = Date.now() - Number(store.get(SENT) || 0)
    if (since < COOLDOWN) {
      setError(`Please wait ${Math.ceil((COOLDOWN - since) / 1000)}s before sending another message.`)
      setState('error')
      return
    }
    const honey = formRef.current?.elements._honey?.value
    if (honey) {
      // A bot filled the hidden field: pretend it worked.
      setState('sent')
      return
    }
    setState('sending')
    setError('')
    try {
      const res = await fetch(contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: f.name.trim() || 'Anonymous',
          email: f.email.trim() || undefined,
          message,
          topic: f.topic,
          _subject: `[${f.topic}] Website message from ${f.name.trim() || 'a visitor'}`,
          _template: 'table',
          _captcha: 'false',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.success === false || data.success === 'false') throw new Error(data.message || `Request failed (${res.status})`)
      store.set(SENT, String(Date.now()))
      store.del(DRAFT)
      setState('sent')
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Could not reach the mail service. Check your connection.' : err.message)
      setState('error')
    }
  }

  const reset = () => {
    setF({ topic: TOPICS[0], name: '', email: '', message: '' })
    setState('idle')
  }

  if (state === 'sent') {
    return (
      <div className="cf cf-done" role="status">
        <span className="label">Sent</span>
        <h3>Thanks{f.name.trim() ? `, ${f.name.trim().split(' ')[0]}` : ''}. Your message is in my inbox.</h3>
        <p>{f.email.trim() ? 'I will reply to the address you gave.' : 'You did not leave an email, so I will not be able to reply. Feel free to send another with one.'}</p>
        <button type="button" className="chip-btn" onClick={reset}>
          Write another
        </button>
      </div>
    )
  }

  return (
    <form
      className="cf"
      ref={formRef}
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e)
      }}
      noValidate
    >
      <div className="cf-head">
        <span className="label">Leave a message</span>
        <span className="mono dim">Goes straight to my inbox</span>
      </div>

      <div className="cf-topics" role="radiogroup" aria-label="What is this about?">
        {TOPICS.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={f.topic === t} className="chip-btn" aria-pressed={f.topic === t} onClick={() => setF((c) => ({ ...c, topic: t }))}>
            {t}
          </button>
        ))}
      </div>

      <div className="cf-row">
        <label>
          <span>Name</span>
          <input type="text" value={f.name} onChange={set('name')} autoComplete="name" maxLength={80} placeholder="Optional" />
        </label>
        <label>
          <span>Email, so I can reply</span>
          <input type="email" value={f.email} onChange={set('email')} autoComplete="email" maxLength={120} placeholder="Optional" aria-invalid={!emailOk} />
        </label>
      </div>

      <label className="cf-msg">
        <span>Message</span>
        <textarea value={f.message} onChange={set('message')} rows={6} maxLength={LIMIT} placeholder="Say hello, ask a question, or tell me what you are working on…" required />
        <em className="mono dim">
          {f.message.length}/{LIMIT}
        </em>
      </label>

      {/* Honeypot: hidden from people, tempting to bots. */}
      <input className="cf-honey" type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="cf-foot">
        <button type="submit" className="button" disabled={!canSend}>
          {state === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        <span className="mono dim cf-hint">Ctrl + Enter to send</span>
      </div>

      {!emailOk && <p className="cf-err mono">That email address does not look right.</p>}
      {state === 'error' && (
        <p className="cf-err mono" role="alert">
          {error} <a href={mailto}>Open in your mail app instead</a>
        </p>
      )}
    </form>
  )
}
