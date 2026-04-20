import useFetch from './useFetch';
import { clearCache } from './useFetch';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  positionId: string;
  electionId: string;
  slogan?: string;
  color?: string;
  imageUrl?: string;
  votes?: number;
  createdAt?: string;
}

interface CandidatesResponse {
  success: boolean;
  data: Candidate[];
}

interface CandidateResponse {
  success: boolean;
  candidate: Candidate;
}

export function useCandidates(electionId?: string) {
  const endpoint = electionId ? `/candidates?electionId=${electionId}` : '/candidates';
  const { data, loading, error, post, put, del, refresh } = useFetch<CandidatesResponse>(endpoint);

  const candidates = data?.data || [];

  const createCandidate = async (candidateData: Partial<Candidate>) => {
    const result = await post(candidateData);
    clearCache('/candidates');
    return result;
  };

  const updateCandidate = async (_id: string, updates: Partial<Candidate>) => {
    const result = await put(updates);
    clearCache('/candidates');
    return result;
  };

  const deleteCandidate = async (_id: string) => {
    const result = await del();
    clearCache('/candidates');
    return result;
  };

  return {
    candidates,
    loading,
    error,
    refresh,
    createCandidate,
    updateCandidate,
    deleteCandidate,
  };
}

export function useCandidate(id: string) {
  const { data, loading, error, put, refresh } = useFetch<CandidateResponse>(`/candidates/${id}`, {
    immediate: !!id,
  });

  const candidate = data?.candidate;

  const updateCandidate = async (updates: Partial<Candidate>) => {
    const result = await put(updates);
    clearCache(`/candidates/${id}`);
    clearCache('/candidates');
    return result;
  };

  return {
    candidate,
    loading,
    error,
    refresh,
    updateCandidate,
  };
}