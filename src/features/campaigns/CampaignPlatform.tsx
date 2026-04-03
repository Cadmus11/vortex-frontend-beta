import { useState, useEffect } from "react";
import Menu from "@/components/custom/Menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/context/ThemeToggler";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Users, Loader2 } from "lucide-react";
import { API_URL } from "../../config/api";

type CampaignCandidate = {
  id: string;
  name: string;
  position: string;
  manifesto: string;
  imageUrl: string | null;
  supportCount: number;
  isSupported?: boolean;
};

const CampaignPlatform = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<CampaignCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [supporting, setSupporting] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaignCandidates();
  }, []);

  const fetchCampaignCandidates = async () => {
    try {
      const res = await fetch(`${API_URL}/campaigns/candidates`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (err) {
      console.error("Failed to fetch campaign candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSupport = async (candidateId: string) => {
    if (!user) {
      alert("Please login to support candidates");
      return;
    }

    setSupporting(candidateId);
    try {
      const res = await fetch(`${API_URL}/campaigns/support`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, userId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  supportCount: data.supportCount,
                  isSupported: data.isSupported,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to support candidate:", err);
    } finally {
      setSupporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Campaign Platform</h1>
              <p className="text-sm text-muted-foreground">
                Support your preferred candidates before the election
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">Campaign Mode</Badge>
            <ThemeToggle />
            <Menu />
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : candidates.length === 0 ? (
          <Card className="p-8 text-center">
            <CardTitle>No Candidates Yet</CardTitle>
            <CardDescription>
              Candidates will appear here once they are registered for the election.
            </CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <Card
                key={candidate.id}
                className="overflow-hidden border-zinc-200 dark:border-zinc-800"
              >
                {candidate.imageUrl && (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{candidate.name}</CardTitle>
                      <CardDescription className="text-purple-600 font-medium">
                        {candidate.position}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Heart className="h-3 w-3 text-red-500" />
                      {candidate.supportCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {candidate.manifesto}
                  </p>
                  <Button
                    className={`w-full mt-4 ${
                      candidate.isSupported
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                    onClick={() => handleSupport(candidate.id)}
                    disabled={supporting === candidate.id}
                  >
                    {supporting === candidate.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : candidate.isSupported ? (
                      <>
                        <Heart className="mr-2 h-4 w-4 fill-current" />
                        Supported
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Support
                      </>
                    )}
                  </Button>
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
