

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Activity, Calendar, Clock, Shield, Users, LayoutDashboardIcon } from "lucide-react"
import { useEffect, useState } from "react"
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

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  };

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
  }, [accessToken])

  const nextElection = elections
    .filter((e) => new Date(e.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

  const getCountdown = () => {
    if (!nextElection) return "—"
    const diff = new Date(nextElection.startDate).getTime() - Date.now()
    if (diff <= 0) return "Started"
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h`
  }

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
          <LayoutDashboardIcon className="h-8 w-8 text-primary" />
          <span className="max-sm:hidden">Dashboard</span>
        </h1>

        <div className="flex items-center gap-4">
          <Badge className="bg-success text-success-foreground">
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
              icon={<Calendar className="w-5 h-5 text-primary" />}
            />
            <StatCard
              title="Active Elections"
              value={stats.activeElections}
              icon={<Activity className="w-5 h-5 text-primary" />}
            />
            <StatCard
              title="Total Positions"
              value={stats.totalPositions}
              icon={<Users className="w-5 h-5 text-primary" />}
            />
            <StatCard
              title="Total Candidates"
              value={stats.totalCandidates}
              icon={<Shield className="w-5 h-5 text-primary" />}
            />
          </div>

          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle className="text-xl">Elections</CardTitle>
            </CardHeader>
            <CardContent>
              {elections.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No elections found</p>
              ) : (
                <div className="space-y-3">
                  {elections.map((election) => (
                    <div
                      key={election.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-background"
                    >
                      <div>
                        <p className="font-medium">{election.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(election.startDate)} - {formatDate(election.endDate)}
                        </p>
                      </div>
                      <Badge variant={election.status === 'active' ? "default" : "secondary"}>
                        {election.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {nextElection && (
            <Card className="bg-secondary/50">
              <CardContent className="flex justify-between items-center py-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Next Election: <strong>{nextElection.title}</strong></span>
                </div>
                <div className="text-lg font-bold text-primary">
                  {getCountdown()}
                </div>
              </CardContent>
            </Card>
          )}
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
    <Card className="bg-secondary/50">
      <CardContent className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-extrabold">{value}</p>
        </div>
        <div className="p-3 bg-primary/10 rounded-md">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
