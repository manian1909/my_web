import { useMemo, useState } from 'react'
import { featured, more, skills } from '../content'

/* Paste a job description and see which of my projects are most relevant.
   Runs entirely in the browser: the text never leaves this page. */

// Concepts a job description is likely to mention, with the phrasings that count as a hit.
const CONCEPTS = [
  { label: 'Backend', pats: ['backend', 'back-end', 'back end', 'server-side'] },
  { label: 'Frontend', pats: ['frontend', 'front-end', 'front end'] },
  { label: 'REST APIs', pats: ['rest', 'restful', 'api', 'apis'] },
  { label: 'Microservices', pats: ['microservice', 'microservices'] },
  { label: 'CI/CD', pats: ['ci/cd', 'cicd', 'ci-cd', 'pipeline', 'pipelines', 'continuous integration', 'continuous delivery'] },
  { label: 'Cloud', pats: ['cloud', 'azure', 'aws', 'gcp'] },
  { label: 'Kubernetes', pats: ['kubernetes', 'k8s', 'aks'] },
  { label: 'Machine learning', pats: ['machine learning', 'ml', 'deep learning', 'neural network', 'neural networks', 'model training'] },
  { label: 'LLMs & RAG', pats: ['llm', 'llms', 'rag', 'retrieval', 'generative ai', 'genai', 'embeddings', 'embedding', 'vector'] },
  { label: 'Search & ranking', pats: ['search', 'ranking', 'rerank', 'reranking', 'recommendation'] },
  { label: 'Transformers', pats: ['transformer', 'transformers', 'attention'] },
  { label: 'Reinforcement learning', pats: ['reinforcement learning', 'rl'] },
  { label: 'Computer vision', pats: ['computer vision', 'vision', 'object detection', 'lidar', 'perception'] },
  { label: 'Robotics', pats: ['robotics', 'robot', 'robots', 'ros', 'ros2', 'drone', 'drones', 'uav', 'autonomous', 'gazebo', 'simulation'] },
  { label: 'Concurrency', pats: ['concurrency', 'multithreading', 'multi-threading', 'threads', 'mutex', 'parallel'] },
  { label: 'Networking', pats: ['networking', 'tcp', 'sockets', 'distributed', 'distributed systems'] },
  { label: 'Operating systems', pats: ['operating systems', 'posix', 'unix', 'linux', 'kernel', 'shell'] },
  { label: 'Databases', pats: ['database', 'databases', 'sql', 'nosql', 'schema'] },
  { label: 'Full-stack', pats: ['full-stack', 'full stack', 'fullstack'] },
  { label: 'Automation', pats: ['automation', 'workflow', 'workflows', 'n8n'] },
]

// Common technologies that are not on my resume, so a mismatch is reported honestly.
const OUTSIDE = [
  'typescript', 'go', 'golang', 'rust', 'docker', 'terraform', 'graphql', 'redis', 'spark', 'airflow',
  'tensorflow', 'scikit-learn', 'pandas', 'android', 'ios', 'swift', 'kotlin', 'c#', '.net', 'ruby', 'php', 'django', 'vue', 'angular',
]

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
const has = (text, pat) => new RegExp(`(^|[^a-z0-9+#])${escape(pat)}(?![a-z0-9+#])`).test(text)
const anyOf = (text, pats) => pats.some((p) => has(text, p))

// Every listed skill / stack item also counts as a concept of its own.
const bare = (n) => n.toLowerCase().replace(/\s*\(.*\)/, '')
const literal = [...new Set([...skills.flatMap((g) => g.items), ...featured.flatMap((f) => f.stack)].map(bare))]
  .filter((n) => !CONCEPTS.some((c) => c.pats.includes(n) || c.label.toLowerCase() === n))
  .map((n) => ({ label: [...skills.flatMap((g) => g.items), ...featured.flatMap((f) => f.stack)].find((x) => bare(x) === n), pats: [n] }))
const TOPICS = [...CONCEPTS, ...literal]

const evidence = (o) => {
  const stack = (o.stack ?? [o.meta]).join(' ').toLowerCase()
  const body = [o.title, o.summary ?? o.text, ...(o.points ?? [])].join(' ').toLowerCase()
  return { stack, body }
}
const PROJECTS = [
  ...featured.map((f) => ({ id: f.id, title: f.title, org: f.org, ...evidence(f) })),
  ...more.map((m) => ({ title: m.title, org: m.meta, ...evidence(m) })),
]

function analyse(jd) {
  const text = jd.toLowerCase()
  const asked = TOPICS.filter((t) => anyOf(text, t.pats))
  const outside = OUTSIDE.filter((t) => has(text, t))
  const ranked = PROJECTS.map((p) => {
    const hits = asked.filter((t) => anyOf(p.stack, t.pats) || anyOf(p.body, t.pats))
    const score = hits.reduce((n, t) => n + (anyOf(p.stack, t.pats) ? 2 : 1), 0)
    return { ...p, hits, score }
  })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
  const covered = new Set(ranked.flatMap((p) => p.hits.map((h) => h.label)))
  return { asked, outside, ranked: ranked.slice(0, 3), covered, missing: asked.filter((t) => !covered.has(t.label)) }
}

const SAMPLES = [
  {
    label: 'Backend intern',
    text: 'Backend engineering intern. Build and ship REST APIs and microservices in Java / Spring Boot, deploy on Kubernetes in the cloud, and help maintain our CI/CD pipeline. Familiarity with SQL databases and Docker is a plus.',
  },
  {
    label: 'ML engineer',
    text: 'Machine learning engineer to work on LLM applications: retrieval-augmented generation, embeddings and semantic search, reranking, and evaluation. Strong Python and PyTorch; transformers experience preferred.',
  },
  {
    label: 'Robotics',
    text: 'Robotics software engineer for autonomous drones. ROS2, Gazebo simulation, computer vision and LiDAR-based perception, reinforcement learning for control. C++ and Python.',
  },
]

export function RoleMatch() {
  const [jd, setJd] = useState('')
  const res = useMemo(() => (jd.trim().length > 12 ? analyse(jd) : null), [jd])
  const top = res?.ranked[0]?.score || 1

  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="card rolematch">
      <div className="rm-in">
        <label htmlFor="rm-jd" className="label">
          Paste a job description
        </label>
        <textarea
          id="rm-jd"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={7}
          maxLength={6000}
          placeholder="Paste the role's responsibilities and requirements here…"
        />
        <div className="rm-samples">
          <span className="mono dim">Or try one:</span>
          {SAMPLES.map((s) => (
            <button key={s.label} type="button" className="chip-btn" onClick={() => setJd(s.text)}>
              {s.label}
            </button>
          ))}
          {jd && (
            <button type="button" className="chip-btn wide" onClick={() => setJd('')}>
              Clear
            </button>
          )}
        </div>
        <p className="rm-note mono dim">Matching runs in your browser. Nothing is uploaded.</p>
      </div>

      <div className="rm-out" aria-live="polite">
        {!jd.trim() && <p className="rm-empty">Ranks my projects by how well they line up with the role, and says plainly what isn&rsquo;t covered.</p>}
        {jd.trim() && !res && <p className="rm-empty">Keep going, this needs a few more words.</p>}
        {res && res.asked.length + res.outside.length === 0 && (
          <p className="rm-empty">No recognisable skills in that text. Try including the tools and technologies the role names.</p>
        )}
        {res && res.asked.length + res.outside.length > 0 && (
          <>
            <p className="rm-summary">
              The role names <b>{res.asked.length + res.outside.length}</b> skills or topics. I have direct project experience with{' '}
              <b>{res.covered.size}</b>.
            </p>
            {res.ranked.length > 0 && (
              <ol className="rm-list">
                {res.ranked.map((p) => (
                  <li key={p.title}>
                    <div className="rm-row">
                      <strong>{p.title}</strong>
                      {p.id && (
                        <button type="button" className="rm-open mono" onClick={() => jump(p.id)}>
                          View ↓
                        </button>
                      )}
                    </div>
                    <div className="rm-bar" aria-hidden="true">
                      <i style={{ width: `${Math.max(12, (p.score / top) * 100)}%` }} />
                    </div>
                    <ul className="tags">
                      {p.hits.map((h) => (
                        <li key={h.label} className="tag is-static">
                          {h.label}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
            {(res.missing.length > 0 || res.outside.length > 0) && (
              <div className="rm-gaps">
                <span className="label sub">Not shown in my projects</span>
                <ul className="tags">
                  {[...res.missing.map((m) => m.label), ...res.outside].map((g) => (
                    <li key={g} className="tag is-static is-gap">
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
