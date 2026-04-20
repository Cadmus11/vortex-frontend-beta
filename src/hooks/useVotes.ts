import useFetch from './useFetch';
import { clearCache } from './useFetch';

export interface Vote {
  id: string;
  electionId: string;
  candidateId: string;
  voterId: string;
  positionId: string;
  createdAt: string;
}

interface VotesResponse {
  success: boolean;
  data: Vote[];
}

interface VoteCheckResponse {
  success: boolean;
  hasVoted: boolean;
  vote?: Vote;
}

export function useVotes(electionId: string, positionId?: string) {
  const endpoint = positionId 
    ? `/votes?electionId=${electionId}&positionId=${positionId}`
    : `/votes?electionId=${electionId}`;
  const { data, loading, error, post, refresh } = useFetch<VotesResponse>(endpoint);

  const votes = data?.data || [];

  const castVote = async (votes: { candidateId: string; positionId: string }[]) => {
    const result = await post({ electionId, votes });
    clearCache(`/votes?electionId=${electionId}`);
    clearCache('/votes');
    return result;
  };

  return {
    votes,
    loading,
    error,
    refresh,
    castVote,
  };
}

export function useHasVoted(electionId: string) {
  const { data, loading, error, refresh } = useFetch<VoteCheckResponse>(`/votes/check?electionId=${electionId}`, {
    immediate: !!electionId,
  });

  const hasVoted = data?.hasVoted ?? false;
  const currentVote = data?.vote;

  return {
    hasVoted,
    currentVote,
    loading,
    error,
    refresh,
  };
}

export function useVoteResults(electionId: string) {
  const endpoint = `/votes/results?electionId=${electionId}`;
  const { data, loading, error, refresh } = useFetch<{
    success: boolean;
    results: Array<{
      positionId: string;
      positionName: string;
      candidates: Array<{
        candidateId: string;
        candidateName: string;
        votes: number;
        percentage: number;
      }>;
    }>;
  }>(endpoint);

  const results = data?.results || [];

  return {
    results,
    loading,
    error,
    refresh,
  };
}