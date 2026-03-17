import { useState } from "react"

export type Candidate = {
  id: number
  name: string
  position: string
  party: string
  votes: number
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCandidates = async () => {
    setLoading(true)
    // const res = await fetch("/api/candidates")
    // const data = await res.json()
    // setCandidates(data)
    setLoading(false)
  }

  const addCandidate = (candidate: Candidate) => {
    setCandidates(prev => [...prev, candidate])
  }

  const updateCandidate = (updated: Candidate) => {
    setCandidates(prev =>
      prev.map(c => (c.id === updated.id ? updated : c))
    )
  }

  const deleteCandidate = (id: number) => {
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  return {
    candidates,
    loading,
    fetchCandidates,
    addCandidate,
    updateCandidate,
    deleteCandidate,
  }
}