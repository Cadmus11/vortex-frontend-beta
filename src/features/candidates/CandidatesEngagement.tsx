import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Heart, MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"
import Menu from "@/components/custom/Menu"

interface CandidateAPI {
  id: number | string;
  name: string;
  position: string;
  manifesto?: string;
  imageUrl?: string;
}

interface CandidateUI {
  id: string
  name: string
  position: string
  bio: string
  image: string
  supportCount: number
  supportedByUser?: boolean
}

export default function CandidatesEngagementPage() {
  const [candidates, setCandidates] = useState<CandidateUI[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch("/api/candidates", { credentials: "include" })
        const data = await res.json() as CandidateAPI[]
        const mapped: CandidateUI[] = data.map((c) => ({
          id: String(c.id),
          name: c.name,
          position: c.position,
          bio: c.manifesto ?? "",
          image: c.imageUrl ?? "",
          supportCount: 0,
          supportedByUser: false
        }))
        setCandidates(mapped)
      } catch {
        setCandidates([])
      }
    }
    fetchCandidates()
  }, [])

  const totalSupport = candidates.reduce(
    (sum, c) => sum + c.supportCount,
    0
  )

  const handleSupportToggle = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              supportCount: c.supportedByUser
                ? c.supportCount - 1
                : c.supportCount + 1,
              supportedByUser: !c.supportedByUser,
            }
          : c
      )
    )
  }

  const filtered = candidates.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center max-sm:flex-col max-sm:gap-4">
        <div className="flex items-center gap-2 max-sm:flex-row-reverse max-sm:justify-between max-sm:w-full">
          <Menu />
          <h1 className="text-2xl font-bold">Campaigns</h1>
        </div>
        <Input
          placeholder="Search candidate..."
          className="w-64 max-sm:w-9/10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((candidate) => {
          const supportPercentage =
            totalSupport === 0 ? 0 : (candidate.supportCount / totalSupport) * 100

          return (
            <Card key={candidate.id} className="hover:shadow-lg transition">
              <CardHeader>
                <img
                  src={candidate.image}
                  alt={candidate.name}
                  className="rounded-xl h-48 w-full object-cover"
                />
                <CardTitle className="flex justify-between items-center mt-3">
                  {candidate.name}
                  <Badge variant="secondary">{candidate.position}</Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{candidate.bio}</p>
                <div>
                  <Progress value={supportPercentage} />
                  <p className="text-xs mt-1 text-muted-foreground">
                    {candidate.supportCount} supporters
                  </p>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant={candidate.supportedByUser ? "default" : "outline"}
                    onClick={() => handleSupportToggle(candidate.id)}
                    className="flex gap-2"
                  >
                    <Heart size={16} />
                    {candidate.supportedByUser ? "Supported" : "Support"}
                  </Button>

                  <Button variant="ghost" size="icon">
                    <MessageCircle size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
