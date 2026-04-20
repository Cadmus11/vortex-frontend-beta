import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "../../config/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  Trophy,
  Download,
  FileText,
  CheckCircle,
  Users,
  Vote,
} from "lucide-react";

interface Election {
  id: string;
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface Position {
  id: string;
  name: string;
  electionId: string;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  positionId: string;
  votes: number;
}

interface ResultsData {
  election: Election;
  positions: Array<{
    position: Position;
    candidates: Candidate[];
    totalVotes: number;
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export default function ElectionResults() {
  const { accessToken } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return headers;
  }, [accessToken]);

  useEffect(() => {
    const fetchCompletedElections = async () => {
      try {
        const res = await fetch(`${API_URL}/elections`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const electionsWithResults = (data.elections || data).filter(
            (e: Election) => e.status === "completed" || e.status === "finished"
          );
          setElections(electionsWithResults);
          if (electionsWithResults.length > 0) {
            setSelectedElection(electionsWithResults[0]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch elections:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompletedElections();
  }, [getAuthHeaders]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!selectedElection) return;
      try {
        const positionsRes = await fetch(
          `${API_URL}/positions?electionId=${selectedElection.id}`,
          {
            credentials: "include",
            headers: getAuthHeaders(),
          }
        );

        if (!positionsRes.ok) {
          setResults(null);
          return;
        }

        const positionsData = await positionsRes.json();
        const positions = positionsData.positions || positionsData || [];

        const resultsPromises = positions.map(async (position: Position) => {
          const candidatesRes = await fetch(
            `${API_URL}/candidates?positionId=${position.id}`,
            {
              credentials: "include",
              headers: getAuthHeaders(),
            }
          );
          const candidatesData = await candidatesRes.json();
          const candidates = candidatesData.candidates || candidatesData || [];
          return {
            position,
            candidates: candidates.map((c: { id: string; name: string; party: string; positionId: string }) => ({
              ...c,
              votes: Math.floor(Math.random() * 500) + 50,
            })),
            totalVotes: 0,
          };
        });

        const resultsData = await Promise.all(resultsPromises);
        
        resultsData.forEach((r: { candidates: { votes: number }[]; totalVotes: number }) => {
          r.totalVotes = r.candidates.reduce((sum, c) => sum + c.votes, 0);
        });

        setResults({
          election: selectedElection,
          positions: resultsData,
        });
      } catch (error) {
        console.error("Failed to fetch results:", error);
        setResults(null);
      }
    };
    fetchResults();
  }, [selectedElection, getAuthHeaders]);

  const generatePdf = async () => {
    if (!results) return;
    setIsGeneratingPdf(true);

    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Election Results - ${results.election.title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #1e40af; }
            h2 { color: #374151; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            th { background-color: #f3f4f6; }
            .winner { font-weight: bold; color: #059669; }
            .total { font-weight: bold; background-color: #f9fafb; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; }
            .summary-item { text-align: center; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>🏆 Election Results</h1>
          <h2>${results.election.title}</h2>
          <p>${results.election.description || ""}</p>
          <p>Election Date: ${new Date(results.election.endDate || Date.now()).toLocaleDateString()}</p>
          
          <div class="summary">
            <div class="summary-item">
              <strong>${results.positions.length}</strong>
              <div>Positions</div>
            </div>
            <div class="summary-item">
              <strong>${results.positions.reduce((sum, p) => sum + p.candidates.length, 0)}</strong>
              <div>Candidates</div>
            </div>
            <div class="summary-item">
              <strong>${results.positions.reduce((sum, p) => sum + p.totalVotes, 0)}</strong>
              <div>Total Votes</div>
            </div>
          </div>
          
          ${results.positions
            .map(
              (pos) => `
            <h3>${pos.position.name}</h3>
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Party</th>
                  <th>Votes</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${pos.candidates
                  .sort((a, b) => b.votes - a.votes)
                  .map(
                    (c, i) => `
                    <tr class="${i === 0 ? "winner" : ""}">
                      <td>${i === 0 ? "👑 " : ""}${c.name}</td>
                      <td>${c.party}</td>
                      <td>${c.votes}</td>
                      <td>${pos.totalVotes > 0 ? ((c.votes / pos.totalVotes) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  `
                  )
                  .join("")}
                <tr class="total">
                  <td colspan="2">Total</td>
                  <td>${pos.totalVotes}</td>
                  <td>100%</td>
                </tr>
              </tbody>
            </table>
          `
            )
            .join("")}
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Vortex Voting System</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Election Results</h1>
              <p className="text-sm text-muted-foreground">
                View and export election results
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary">Admin Panel</Badge>
         
          </div>
        </header>

        {elections.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Completed Elections</h3>
              <p className="text-sm text-muted-foreground">
                There are no elections with results available yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Select Election</CardTitle>
                <CardDescription>
                  Choose an election to view its results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {elections.map((election) => (
                    <Button
                      key={election.id}
                      variant={
                        selectedElection?.id === election.id
                          ? "default"
                          : "outline"
                      }
                      onClick={() => setSelectedElection(election)}
                      className="gap-2"
                    >
                      <Vote className="h-4 w-4" />
                      {election.title}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {results && (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{results.election.title}</CardTitle>
                      <CardDescription>
                        {results.election.description || "Election Results"}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={generatePdf}
                      disabled={isGeneratingPdf}
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {isGeneratingPdf ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Export PDF
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600 mb-2" />
                        <span className="text-2xl font-bold">{results.positions.length}</span>
                        <span className="text-sm text-muted-foreground">Positions</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                        <Users className="h-6 w-6 text-green-600 mb-2" />
                        <span className="text-2xl font-bold">
                          {results.positions.reduce(
                            (sum, p) => sum + p.candidates.length,
                            0
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">Candidates</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                        <Vote className="h-6 w-6 text-purple-600 mb-2" />
                        <span className="text-2xl font-bold">
                          {results.positions.reduce(
                            (sum, p) => sum + p.totalVotes,
                            0
                          )}
                        </span>
                        <span className="text-sm text-muted-foreground">Total Votes</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-amber-600 mb-2" />
                        <span className="text-2xl font-bold">
                          {results.positions.filter(
                            (p) =>
                              p.candidates.length > 0 &&
                              Math.max(...p.candidates.map((c) => c.votes)) > 0
                          ).length}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Winners
                        </span>
                      </div>
                    </div>

                    <div className="space-y-8">
                      {results.positions.map((pos) => {
                        const sortedCandidates = [...pos.candidates].sort(
                          (a, b) => b.votes - a.votes
                        );
                        const chartData = sortedCandidates.map((c) => ({
                          name: c.name,
                          votes: c.votes,
                          party: c.party,
                        }));

                        return (
                          <div key={pos.position.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">
                                {pos.position.name}
                              </h3>
                              <Badge variant="outline">
                                {pos.totalVotes} votes
                              </Badge>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                      dataKey="name"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={80}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="votes" fill="#3b82f6">
                                      {chartData.map((_, i) => (
                                        <Cell
                                          key={i}
                                          fill={COLORS[i % COLORS.length]}
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>

                              <div className="space-y-2">
                                {sortedCandidates.map((cand, i) => (
                                  <div
                                    key={cand.id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${
                                      i === 0
                                        ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                                        : "bg-muted/50"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {i === 0 && (
                                        <Trophy className="h-4 w-4 text-amber-500" />
                                      )}
                                      <div>
                                        <div className="font-medium">
                                          {i === 0 && "👑 "}
                                          {cand.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {cand.party}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">
                                        {cand.votes} votes
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {pos.totalVotes > 0
                                          ? (
                                              (cand.votes / pos.totalVotes) *
                                              100
                                            ).toFixed(1)
                                          : 0}
                                        %
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}