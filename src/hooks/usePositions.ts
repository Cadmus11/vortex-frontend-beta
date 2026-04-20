import useFetch from './useFetch';
import { clearCache } from './useFetch';

export interface Position {
  id: string;
  name: string;
  description?: string;
  electionId: string;
  maxSelections: number;
  createdAt?: string;
}

interface PositionsResponse {
  success: boolean;
  data: Position[];
}

interface PositionResponse {
  success: boolean;
  position: Position;
}

export function usePositions(electionId?: string) {
  const endpoint = electionId ? `/positions?electionId=${electionId}` : '/positions';
  const { data, loading, error, post, put, del, refresh } = useFetch<PositionsResponse>(endpoint);

  const positions = data?.data || [];

  const createPosition = async (positionData: Partial<Position>) => {
    const result = await post(positionData);
    clearCache('/positions');
    return result;
  };

  const updatePosition = async (_id: string, updates: Partial<Position>) => {
    const result = await put(updates);
    clearCache('/positions');
    return result;
  };

  const deletePosition = async (_id: string) => {
    const result = await del();
    clearCache('/positions');
    return result;
  };

  return {
    positions,
    loading,
    error,
    refresh,
    createPosition,
    updatePosition,
    deletePosition,
  };
}

export function usePosition(id: string) {
  const { data, loading, error, put, refresh } = useFetch<PositionResponse>(`/positions/${id}`, {
    immediate: !!id,
  });

  const position = data?.position;

  const updatePosition = async (updates: Partial<Position>) => {
    const result = await put(updates);
    clearCache(`/positions/${id}`);
    clearCache('/positions');
    return result;
  };

  return {
    position,
    loading,
    error,
    refresh,
    updatePosition,
  };
}