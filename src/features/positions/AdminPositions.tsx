import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
// import { api } from '@/utils/api';
import CreatePositionForm from './CreatePositionForm';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Position {
  id?: string;
  name?: string;
  positionId?: string;
  positionName?: string;
  position?: string;
  candidateCount?: number;
  order?: number;
  electionId?: string;
}

export default function AdminPositions() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/positions`, {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch positions');
      }

      const payload = (await res.json()) as { success?: boolean; data?: Position[] };
      setPositions(payload.success && Array.isArray(payload.data) ? payload.data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchPositions();
    }
  }, [authLoading, accessToken]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Positions Management</h1>
          <p className="text-sm text-muted-foreground">Create and manage election positions</p>
        </div>
        <Badge variant="secondary">Admin Panel</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Create New Position</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> New</>}
              </Button>
            </div>
          </CardHeader>
          {showCreateForm && (
            <CardContent>
              <CreatePositionForm onCreated={() => {
                fetchPositions();
                setShowCreateForm(false);
              }} />
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Existing Positions ({positions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            {!loading && !error && positions.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No positions found.</p>
            )}

            {!loading && positions.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {positions.map((p, index) => (
                  <div
                    key={p.id ?? p.positionId ?? `position-${index}`}
                    className="p-3 border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{p.name ?? p.positionName ?? p.position}</p>
                        <p className="text-xs text-muted-foreground">
                          Order: {p.order ?? p.candidateCount ?? 0}
                        </p>
                      </div>
                      {p.electionId && (
                        <Badge variant="outline" className="text-xs">
                          Election linked
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
