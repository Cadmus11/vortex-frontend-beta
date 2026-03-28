import { useState } from "react"
import { api } from "@/utils/api"

export interface Candidate {
  id: string
  name: string
  position: string
  manifesto?: string
  imageUrl?: string
  electionId?: string
  createdAt?: string
}

interface CandidateResponse {
  id: number | string;
  name: string;
  position: string;
  manifesto?: string;
  imageUrl?: string;
  electionId?: string;
  createdAt?: string;
}

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)

  const fetchCandidates = async () => {
    setLoading(true)
    try {
      const res = await api("/api/candidates", { method: "GET" })
      if (res.ok) {
        const data = await res.json() as CandidateResponse[]
        const mapped: Candidate[] = data.map((c) => ({
          id: String(c.id),
          name: c.name,
          position: c.position,
          manifesto: c.manifesto,
          imageUrl: c.imageUrl,
          electionId: c.electionId,
          createdAt: c.createdAt
        }))
        setCandidates(mapped)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const addCandidate = async (candidate: Candidate) => {
    const res = await api("/api/candidates", {
      method: "POST",
      body: JSON.stringify(candidate)
    })
    if (res.ok) {
      const newCand = await res.json() as Candidate
      setCandidates(prev => [...prev, newCand])
    }
  }

  const updateCandidate = async (updated: Candidate) => {
    const res = await api(`/api/candidates/${updated.id}`, {
      method: "PUT",
      body: JSON.stringify(updated)
    })
    if (res.ok) {
      setCandidates(prev => prev.map(c => (c.id === updated.id ? updated : c)))
    }
  }

  const deleteCandidate = async (id: string) => {
    const res = await api(`/api/candidates/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCandidates(prev => prev.filter(c => c.id !== id))
    }
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
