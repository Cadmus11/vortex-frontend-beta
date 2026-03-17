"use client"

import Menu from "@/components/custom/Menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/context/ThemeToggler"

import { useState } from "react"

type Position = {
  id: number
  title: string
  maxWinners: number
  active: boolean
}

export default function ElectionSetup() {
  const [positions, setPositions] = useState<Position[]>([])
  const [title, setTitle] = useState("")
  const [maxWinners, setMaxWinners] = useState(1)

  const addPosition = () => {
    if (!title) return

    setPositions(prev => [
      ...prev,
      {
        id: Date.now(),
        title,
        maxWinners,
        active: true,
      },
    ])

    setTitle("")
    setMaxWinners(1)
  }

  const toggleActive = (id: number) => {
    setPositions(prev =>
      prev.map(p =>
        p.id === id ? { ...p, active: !p.active } : p
      )
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between">
      <h1 className="text-xl font-bold">Election Setup</h1>
      <span className="flex items-center gap-4">
        <ThemeToggle/>
        <Menu/>
      </span>
      </div>
      <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle>Create Position</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input
            placeholder="Position title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Max Winners"
            value={maxWinners}
            onChange={(e) => setMaxWinners(Number(e.target.value))}
          />

          <Button onClick={addPosition}>Add Position</Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {positions.map(position => (
          <Card key={position.id}>
            <CardContent className="flex justify-between items-center p-6">
              <div>
                <p className="font-medium">{position.title}</p>
                <p className="text-sm text-zinc-500">
                  Max Winners: {position.maxWinners}
                </p>
              </div>

              <Switch
                checked={position.active}
                onCheckedChange={() => toggleActive(position.id)}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}