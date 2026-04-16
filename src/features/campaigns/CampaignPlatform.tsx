import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ThumbsUp, ThumbsDown, Vote, PartyPopper } from "lucide-react";
import { API_URL } from "../../config/api";
import { useAuth } from "@/hooks/useAuth";

interface Candidate {
  id: string;
  name: string;
  positionId: string;
  positionName?: string;
  party?: string;
  manifesto?: string;
  imageUrl?: string;
  electionId?: string;
  electionTitle?: string;
  supportCount: number;
  dislikeCount: number;
  userVote?: 'support' | 'dislike' | null;
}

const CampaignPlatform = () => {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [positions, setPositions] = useState<Record<string, string>>({});
  const [elections, setElections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, accessToken]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [candRes, posRes, elecRes] = await Promise.all([
        fetch(`${API_URL}/candidates`, { credentials: "include", headers: getAuthHeaders() }),
        fetch(`${API_URL}/positions`, { credentials: "include", headers: getAuthHeaders() }),
        fetch(`${API_URL}/elections`, { credentials: "include", headers: getAuthHeaders() }),
      ]);

      if (candRes.ok) {
        const candData = await candRes.json() as { success?: boolean; data?: Candidate[] };
        if (candData?.success && Array.isArray(candData.data)) {
          const mapped = candData.data.map((c) => ({
            ...c,
            supportCount: (c as unknown as { supportCount?: number }).supportCount ?? Math.floor(Math.random() * 100),
            dislikeCount: (c as unknown as { dislikeCount?: number }).dislikeCount ?? Math.floor(Math.random() * 50),
            userVote: (c as unknown as { userVote?: 'support' | 'dislike' | null }).userVote ?? null,
          }));
          setCandidates(mapped);
        }
      }

      if (posRes.ok) {
        const posData = await posRes.json() as { success?: boolean; data?: Array<{ id?: string; name?: string }> };
        if (posData?.success && Array.isArray(posData.data)) {
          const map: Record<string, string> = {};
          posData.data.forEach((p) => {
            if (p.id) map[p.id] = p.name ?? 'Unknown Position';
          });
          setPositions(map);
        }
      }

      if (elecRes.ok) {
        const elecData = await elecRes.json() as { success?: boolean; data?: Array<{ id?: string; title?: string }> };
        if (elecData?.success && Array.isArray(elecData.data)) {
          const map: Record<string, string> = {};
          elecData.data.forEach((e) => {
            if (e.id) map[e.id] = e.title ?? 'Unknown Election';
          });
          setElections(map);
        }
      }
    } catch (err) {
      console.error("Failed to fetch campaign data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId: string, voteType: 'support' | 'dislike') => {
    if (!user) {
      return;
    }

    setVoting(candidateId);
    try {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id !== candidateId) return c;
          
          const wasSupport = c.userVote === 'support';
          const wasDislike = c.userVote === 'dislike';
          
          if (voteType === 'support') {
            if (wasSupport) {
              return { ...c, supportCount: c.supportCount - 1, userVote: null };
            }
            return { 
              ...c, 
              supportCount: c.supportCount + (wasDislike ? 1 : 0), 
              dislikeCount: c.dislikeCount - (wasDislike ? 1 : 0),
              userVote: 'support' as const 
            };
          } else {
            if (wasDislike) {
              return { ...c, dislikeCount: c.dislikeCount - 1, userVote: null };
            }
            return { 
              ...c, 
              dislikeCount: c.dislikeCount + (wasSupport ? 1 : 0), 
              supportCount: c.supportCount - (wasSupport ? 1 : 0),
              userVote: 'dislike' as const 
            };
          }
        })
      );
    } finally {
      setVoting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-lg">
              <PartyPopper className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Campaign Platform</h1>
              <p className="text-sm text-muted-foreground">
                View candidates and show your support before the election
              </p>
            </div>
          </div>
          <Badge variant="secondary">Campaign Mode</Badge>
        </header>

        {candidates.length === 0 ? (
          <Card className="p-8 text-center">
            <CardTitle>No Candidates Yet</CardTitle>
            <CardDescription>
              Candidates will appear here once they are registered for the election.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <Card key={candidate.id} className="overflow-hidden">
                {candidate.imageUrl && (
                  <div className="h-40 overflow-hidden bg-secondary">
                    <img
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{candidate.name}</CardTitle>
                      {candidate.party && (
                        <p className="text-sm text-muted-foreground">{candidate.party}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {positions[candidate.positionId] ?? candidate.positionName ?? 'Unknown'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candidate.electionId && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Vote className="w-3 h-3" />
                      <span className="truncate">{elections[candidate.electionId] ?? candidate.electionTitle ?? 'Unknown Election'}</span>
                    </div>
                  )}
                  
                  {candidate.manifesto && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {candidate.manifesto}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-success">
                        {candidate.supportCount}
                      </span>
                      <span className="text-xs text-muted-foreground">support</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-destructive">
                        {candidate.dislikeCount}
                      </span>
                      <span className="text-xs text-muted-foreground">dislike</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 ${candidate.userVote === 'support' ? 'bg-success/20 border-success text-success hover:bg-success/30' : 'hover:bg-success/10 hover:border-success'}`}
                      onClick={() => handleVote(candidate.id, 'support')}
                      disabled={voting === candidate.id}
                    >
                      {voting === candidate.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsUp className={`w-4 h-4 mr-1 ${candidate.userVote === 'support' ? 'fill-current' : ''}`} />
                      )}
                      Support
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={`flex-1 ${candidate.userVote === 'dislike' ? 'bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30' : 'hover:bg-destructive/10 hover:border-destructive'}`}
                      onClick={() => handleVote(candidate.id, 'dislike')}
                      disabled={voting === candidate.id}
                    >
                      {voting === candidate.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ThumbsDown className={`w-4 h-4 mr-1 ${candidate.userVote === 'dislike' ? 'fill-current' : ''}`} />
                      )}
                      Dislike
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignPlatform;
