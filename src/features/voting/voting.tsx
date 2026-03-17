"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ThemeToggle } from "@/context/ThemeToggler"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"
import { useState } from "react"

type Candidate = {
  id: number
  name: string
  party: string
  slogan: string
  color: string
}

const candidates: Candidate[] = [
  {
    id: 1,
    name: "Aether",
    party: "Digital Front",
    slogan: "Future First.",
    color: "from-indigo-500/20 to-indigo-700/20",
  },
  {
    id: 2,
    name: "Nova",
    party: "Progress Alliance",
    slogan: "Forward Together.",
    color: "from-emerald-500/20 to-emerald-700/20",
  },
  {
    id: 3,
    name: "Orion",
    party: "Unity Core",
    slogan: "Strength in Unity.",
    color: "from-rose-500/20 to-rose-700/20",
  },
]

export default function VotingPanel() {
  const [selected, setSelected] = useState<number | null>(null)
  const selectedCandidate = candidates.find((c) => c.id === selected)

  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-500 p-6",
        "bg-zinc-50 dark:bg-zinc-950",
        selectedCandidate &&
          `bg-linear-to-br ${selectedCandidate.color}`
      )}
    >
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-cente p-6">
          <h1 className="text-3xl font-bold tracking-tight p-3 text-zinc-900 dark:text-zinc-100">
            Cast Your Vote
          </h1>
<ThemeToggle/>
          {selectedCandidate && (
            <Badge className="bg-emerald-500 text-white">
              Selected
            </Badge>
          )}
        </div>

        {/* Carousel */}
        <Card className="bg-zinc-100/70 dark:bg-zinc-900/70 backdrop-blur border-zinc-200 dark:border-zinc-800 w-full   flex justify-center items-center">
          <CardHeader>
            <CardTitle className="text-center">
              Choose Your Candidate
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Carousel className="w-full">
              <CarouselContent>
                {candidates.map((candidate) => (
                  <CarouselItem
                    key={candidate.id}
                    className="md:basis-1/2 lg:basis-1/3 p-4"
                  >
                    <div
                      onClick={() => setSelected(candidate.id)}
                      className={cn(
                        "cursor-pointer rounded-2xl p-6 border transition-all duration-300",
                        "bg-zinc-200 dark:bg-zinc-800",
                        selected === candidate.id
                          ? "border-emerald-500 ring-2 ring-emerald-500 scale-105"
                          : "border-zinc-300 dark:border-zinc-700 hover:scale-105"
                      )}
                    >
                      <div className="space-y-4 text-center">
                        <div className="h-20 w-20 mx-auto rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center text-xl font-bold">
                          {candidate.name[0]}
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold">
                            {candidate.name}
                          </h2>
                          <p className="text-sm text-zinc-500">
                            {candidate.party}
                          </p>
                        </div>

                        <p className="text-sm italic text-zinc-600 dark:text-zinc-400">
                          "{candidate.slogan}"
                        </p>

                        {selected === candidate.id && (
                          <CheckCircle2 className="mx-auto text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* Confirm Section */}
        {selectedCandidate && (
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-10"
            >
              Confirm Vote for {selectedCandidate.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}