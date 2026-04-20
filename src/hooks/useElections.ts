import useFetch from './useFetch';
import { clearCache } from './useFetch';

export interface Election {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ElectionsResponse {
  success: boolean;
  data: Election[];
}

interface ElectionResponse {
  success: boolean;
  election: Election;
}

export function useElections() {
  const { data, loading, error, post, put, del, refresh } = useFetch<ElectionsResponse>('/elections');

  const elections = data?.data || [];

  const createElection = async (electionData: Partial<Election>) => {
    const result = await post(electionData);
    clearCache('/elections');
    return result;
  };

  const updateElection = async (_id: string, updates: Partial<Election>) => {
    const result = await put(updates);
    clearCache('/elections');
    return result;
  };

  const deleteElection = async (_id: string) => {
    const result = await del();
    clearCache('/elections');
    return result;
  };

  return {
    elections,
    loading,
    error,
    refresh,
    createElection,
    updateElection,
    deleteElection,
  };
}

export function useElection(id: string) {
  const { data, loading, error, put, refresh } = useFetch<ElectionResponse>(`/elections/${id}`, {
    immediate: !!id,
  });

  const election = data?.election;

  const updateElection = async (updates: Partial<Election>) => {
    const result = await put(updates);
    clearCache(`/elections/${id}`);
    clearCache('/elections');
    return result;
  };

  const startElection = async () => {
    const result = await put({ status: 'active' });
    clearCache(`/elections/${id}`);
    clearCache('/elections');
    return result;
  };

  const endElection = async () => {
    const result = await put({ status: 'completed' });
    clearCache(`/elections/${id}`);
    clearCache('/elections');
    return result;
  };

  return {
    election,
    loading,
    error,
    refresh,
    updateElection,
    startElection,
    endElection,
  };
}