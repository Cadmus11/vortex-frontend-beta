
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Activity, Calendar, Clock, Shield, Users, LayoutDashboardIcon } from "lucide-react"
import { useEffect, useState, useCallback } from "react"
import { API_URL } from "../../config/api"
import { useAuth } from "@/context/AuthContext"

interface Election {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  status: 'draft' | 'active' | 'ended' | 'cancelled'
  createdAt?: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Stats {
  totalElections: number
  activeElections: number
  totalPositions: number
  totalCandidates: number
}

export default function Dashboard() {
  const { accessToken } = useAuth()
  const [elections, setElections] = useState<Election[]>([])
  const [stats, setStats] = useState<Stats>({
    totalElections: 0,
    activeElections: 0,
    totalPositions: 0,
    totalCandidates: 0,
  })
  const [loading, setLoading] = useState(true)

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  }, [accessToken]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [electionsRes, positionsRes, candidatesRes] = await Promise.all([
          fetch(`${API_URL}/elections`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/positions`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/candidates`, { headers: getAuthHeaders() }),
        ])

        const electionsJson: ApiResponse<Election[]> = electionsRes.ok ? await electionsRes.json() : { success: false }
        const positionsJson: ApiResponse<unknown[]> = positionsRes.ok ? await positionsRes.json() : { success: false }
        const candidatesJson: ApiResponse<unknown[]> = candidatesRes.ok ? await candidatesRes.json() : { success: false }

        const electionsData = electionsJson.success ? (electionsJson.data || []) : []
        const positionsData = positionsJson.success ? (positionsJson.data || []) : []
        const candidatesData = candidatesJson.success ? (candidatesJson.data || []) : []

        setElections(electionsData)
        setStats({
          totalElections: electionsData.length,
          activeElections: electionsData.filter((e) => e.status === 'active').length,
          totalPositions: positionsData.length,
          totalCandidates: candidatesData.length,
        })
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

const getCountdown = (election: Election) => {
    const start = new Date(election.startDate);
    const now = new Date();
    if (start <= now) return "Started";
    const diff = start.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const getTimeRemaining = (election: Election) => {
    const end = new Date(election.endDate);
    const now = new Date();
    if (end <= now) return "Ended";
    const diff = end.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6 p-2">
      <header className="flex justify-between items-center p-4">
        <h1 className="text-lg flex items-center gap-3">
          <LayoutDashboardIcon className="h-8 w-8 text-blue-600" />
          <span className="max-sm:hidden">Vortex Command Dashboard</span>
        </h1>

        <div className="flex items-center gap-4">
          <Badge className="bg-emerald-500 text-white">
            Live
          </Badge>
        
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Elections"
              value={stats.totalElections}
              icon={<Calendar className="w-5 h-5" />}
            />
            <StatCard
              title="Active Elections"
              value={stats.activeElections}
              icon={<Activity className="w-5 h-5" />}
            />
            <StatCard
              title="Total Positions"
              value={stats.totalPositions}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              title="Total Candidates"
              value={stats.totalCandidates}
              icon={<Shield className="w-5 h-5" />}
            />
          </div>

          <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-xl">Elections</CardTitle>
            </CardHeader>
            <CardContent>
              {elections.length === 0 ? (
                <p className="text-zinc-500 text-center py-4">No elections found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {elections.map((election) => (
                    <div
                      key={election.id}
                      className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{election.title}</p>
                        <Badge variant={election.status === 'active' ? "default" : "secondary"}>
                          {election.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-500 mb-2">
                        {formatDate(election.startDate)} - {formatDate(election.endDate)}
                      </p>
                      {election.status === 'active' ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600 dark:text-orange-400">Ends in: {getTimeRemaining(election)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600 dark:text-blue-400">Starts in: {getCountdown(election)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          
        </>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
}) {
  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="flex justify-between items-center">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="text-2xl font-extrabold">{value}</p>
        </div>
        <div className="p-3 bg-emerald-500/20 rounded-md dark:bg-zinc-800">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
