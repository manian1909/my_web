import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/* "Stack lens": pick a skill and the projects that use it stay lit while the rest fade. */

const LensContext = createContext({ lens: null, setLens: () => {} })

const tokens = (s) => s.toLowerCase().match(/[a-z0-9+#.]+/g) ?? []

export function LensProvider({ children }) {
  const [lens, set] = useState(null)
  const setLens = useCallback((skill) => set((cur) => (cur === skill ? null : skill)), [])
  const value = useMemo(() => ({ lens, setLens }), [lens, setLens])
  return <LensContext.Provider value={value}>{children}</LensContext.Provider>
}

export const useLens = () => useContext(LensContext)

// True when any label in `labels` contains every token of the lens (so "Kubernetes" matches "Kubernetes (AKS)").
export function matchesLens(lens, labels) {
  if (!lens) return true
  const want = tokens(lens)
  return labels.some((l) => {
    const have = tokens(l)
    return want.every((t) => have.includes(t))
  })
}
