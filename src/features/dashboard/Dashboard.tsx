import Menu from "@/components/custom/Menu"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/context/ThemeToggler"
import ReactECharts from "echarts-for-react"
import {
  Activity,
  Shield,
  Trophy,
  Users,
  Vote,
} from "lucide-react"
import { useEffect, useState } from "react"

type Candidate = {
  id: number
  name: string
  votes: number
  trend: { time: string; votes: number }[]
}
export default function Dashboard() {
  const [uptime] = useState(99.98)

  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 1,
      name: "Aether",
      votes: 980,
      trend: [],
    },
    {
      id: 2,
      name: "Nova",
      votes: 765,
      trend: [],
    },
    {
      id: 3,
      name: "Orion",
      votes: 1890,
      trend: [],
    },
  ])

  const totalVoters = 15000
  const votesCasted = candidates.reduce((acc, c) => acc + c.votes, 0)

  // Live simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCandidates((prev) =>
        prev.map((c) => ({
          ...c,
          votes: c.votes + Math.floor(Math.random() * 3),
        }))
      )
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const ranking = [...candidates].sort((a, b) => b.votes - a.votes)

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <header className="flex justify-between items-center p-4">
        <h1 className="text-lg flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600 " />
          
          <span className="max-sm:hidden">Vortex Command Dashboard</span>
        </h1>

        <div className="flex items-center gap-4">
          <Badge className="bg-emerald-500 text-white">
            Live
          </Badge>
         <span className="max-sm:hidden"> <ThemeToggle  /></span>
      <Menu/>
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard
          title="Total Voters"
          value={totalVoters.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Votes Casted"
          value={votesCasted}
          icon={<Vote className="w-5 h-5" />}
        />
        <StatCard
          title="System Uptime"
          value={`${uptime}%`}
          icon={<Activity className="w-5 h-5" />}
        />
        <StatCard
          title="Leading Candidate"
          value={ranking[0]?.name ?? "—"}
          icon={<Trophy className="w-5 h-5" />}
        />
      </div>

      {/* Ranking */}
      <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Real-Time Candidate Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ranking.map((candidate, index) => {
            const percentage =
              votesCasted > 0
                ? (candidate.votes / votesCasted) * 100
                : 0

            return (
              <div key={candidate.id} className="space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {index + 1}. {candidate.name}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {candidate.votes} votes
                  </span>
                </div>
                <Progress value={percentage} />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Doughnut Charts */}
      <div className="grid md:grid-cols-3 gap-6">
        {candidates.map((candidate) => {
          const percentage =
            votesCasted > 0
              ? ((candidate.votes / votesCasted) * 100).toFixed(1)
              : "0"

          const option = {
            tooltip: { trigger: "item" },
            series: [
              {
                type: "pie",
                radius: ["60%", "80%"],
                label: {
                  show: true,
                  position: "center",
                  formatter: `${percentage}%`,
                  fontSize: 20,
                  fontWeight: "bold",
                },
                labelLine: { show: false },
                data: [
                  {
                    value: candidate.votes,
                    name: candidate.name,
                  },
                  {
                    value: votesCasted - candidate.votes,
                    name: "Other",
                  },
                ],
              },
            ],
          }

          return (
            <Card
              key={candidate.id}
              className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            >
              <CardHeader>
                <CardTitle>
                  {candidate.name} Vote Share
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ReactECharts
                  option={option}
                  style={{ height: "100%", width: "100%" }}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardContent className="flex justify-between items-center p-4">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-3 bg-emerald-500/20 rounded-md  dark:bg-zinc-800">
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}