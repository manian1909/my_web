import { useState } from 'react'
import { AttentionDemo, NfsDemo, PipelineDemo, ZigsawDemo } from './Demos'
import { AutogradDemo } from './Autograd'

// The Transformer project has two demos: the attention layer and the autodiff engine underneath it.
function TransformerDemos() {
  const [tab, setTab] = useState('attention')
  return (
    <div className="demo-tabbed">
      <div className="demo-controls demo-tabs" role="group" aria-label="Choose a demo">
        <button type="button" className="chip-btn" aria-pressed={tab === 'attention'} onClick={() => setTab('attention')}>
          Attention
        </button>
        <button type="button" className="chip-btn" aria-pressed={tab === 'autograd'} onClick={() => setTab('autograd')}>
          Autograd
        </button>
      </div>
      {tab === 'attention' ? <AttentionDemo /> : <AutogradDemo />}
    </div>
  )
}

function Flow({ steps }) {
  return (
    <ol className="flow">
      {steps.map((s, i) => (
        <li key={s.title} className={`flow-step ${s.accent ? 'is-accent' : ''}`} style={{ '--i': i }}>
          <div className="flow-node">
            <div className="flow-title">{s.title}</div>
            {s.sub && <div className="flow-sub">{s.sub}</div>}
            {s.items && (
              <ul className="flow-items">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Diagram({ diagram }) {
  switch (diagram.type) {
    case 'flow':
      return <Flow steps={diagram.steps} />
    case 'pipeline':
      return <PipelineDemo />
    case 'zigsaw':
      return <ZigsawDemo />
    case 'attention':
      return <TransformerDemos />
    case 'nfs':
      return <NfsDemo />
    default:
      return null
  }
}
