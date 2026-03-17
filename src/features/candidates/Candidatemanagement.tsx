"use client"
import Menu from "@/components/custom/Menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/context/ThemeToggler"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

type Candidate = {
  id: number
  name: string
  position: string
  party: string
  votes: number
}

export default function CandidatesManagement() {
  const [candidates, setCandidates] = useState<Candidate[]>([
    { id: 1, name: "Aether", position: "President", party: "Unity", votes: 420 },
    { id: 2, name: "Nova", position: "Vice President", party: "Reform", votes: 390 },
  ])

  const [editing, setEditing] = useState<Candidate | null>(null)

  const deleteCandidate = (id: number) => {
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  const saveEdit = () => {
    if (!editing) return
    setCandidates(prev =>
      prev.map(c => (c.id === editing.id ? editing : c))
    )
    setEditing(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
      <h1 className="text-lg font-bold">Manage Candidates</h1>
      <div className="flex items-center gap-4">
      <ThemeToggle/>
      <Menu/>
      </div>
      </div>
      

      <div className="grid md:grid-cols-2 gap-6">
        {candidates.map(candidate => (
          <Card
            key={candidate.id}
            className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
          >
            <CardHeader className="flex justify-between">
              <CardTitle>{candidate.name}</CardTitle>
              <Badge>{candidate.position}</Badge>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-500">
                Party: {candidate.party}
              </p>
              <p className="text-sm text-zinc-500">
                Votes: {candidate.votes}
              </p>

              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing(candidate)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteCandidate(candidate.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
              <Input
                value={editing.party}
                onChange={(e) =>
                  setEditing({ ...editing, party: e.target.value })
                }
              />

              <Button onClick={saveEdit} className="w-full">
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}