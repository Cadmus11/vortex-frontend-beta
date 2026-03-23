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
import { useEffect, useState } from "react"

type Candidate = {
  id: number
  name: string
  position: string
  party: string
  votes: number
}

type NewCandidate = {
  name: string
  position: string
  manifesto?: string
  imageFile?: File
  imagePreview?: string
}

export default function CandidatesManagement() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [editing, setEditing] = useState<Candidate | null>(null)

  // Create form state
  const [newCand, setNewCand] = useState<NewCandidate>({
    name: "",
    position: "",
    manifesto: "",
    imageFile: undefined,
    imagePreview: "",
  })

  // Edit image state for replacement
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const res = await fetch("/api/candidates")
        if (res.ok) {
          const data = await res.json()
          const mapped = data.map((c: any) => ({
            id: c.id,
            name: c.name,
            position: c.position,
            party: c.manifesto ?? "",
            votes: 0,
          }))
          setCandidates(mapped)
        }
      } catch {
        // ignore
      }
    }
    fetchCandidates()
  }, [])

  const deleteCandidate = async (id: string | number) => {
    await fetch(`/api/candidates/${id}`, { method: "DELETE" })
    setCandidates(prev => prev.filter(c => c.id !== id))
  }

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || ""
    const UPLOAD_PRESET = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || ""
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Cloudinary config not set in frontend env")
    }
    const form = new FormData()
    form.append("file", file)
    form.append("upload_preset", UPLOAD_PRESET)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
      method: "POST",
      body: form,
    })
    const data = await res.json()
    if (res.ok && data.secure_url) {
      return data.secure_url
    }
    throw new Error("Cloudinary upload failed")
  }

  const saveEditWithServer = async () => {
    if (!editing) return
    // Build payload for update; include imageUrl if a new image was chosen
    const payload: any = {
      name: editing.name,
      position: editing.position,
      manifesto: editing.party
    }
    if (editImageFile) {
      const url = await uploadToCloudinary(editImageFile)
      payload.imageUrl = url
    }

    const res = await fetch(`/api/candidates/${editing.id}`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      // Update local display values
      setCandidates(prev => prev.map(c => (
        c.id === editing.id ? { ...c, name: editing.name, position: editing.position, party: editing.party } : c
      )))
      setEditing(null)
      setEditImageFile(null)
      setEditImagePreview(null)
    }
  }

  // Helpers for file input (create and edit)
  const onNewFileChange = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewCand(prev => ({ ...prev, imageFile: file }))
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setNewCand(prev => ({ ...prev, imagePreview: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const onEditFileChange = (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setEditImagePreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  const createCandidate = async () => {
    const payload: any = {
      name: newCand.name,
      position: newCand.position,
      manifesto: newCand.manifesto,
    }
    if (newCand.imageFile) {
      const url = await uploadToCloudinary(newCand.imageFile)
      payload.imageUrl = url
    }

    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      const created = await res.json()
      const c = created?.length ? created[0] : created
      if (c) {
        setCandidates(prev => [
          ...prev,
          { id: c.id, name: c.name, position: c.position, party: c.manifesto ?? "", votes: 0 }
        ])
      }
      setNewCand({ name: "", position: "", manifesto: "", imageFile: undefined, imagePreview: "" })
    }
  }

  // Open edit modal with prefilled values
  const editCandidate = (cand: Candidate) => {
    setEditing({ ...cand })
    setEditImageFile(null)
    setEditImagePreview(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Create form */}
      <div className="border rounded-md p-4 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Create Candidate</h2>
          <ThemeToggle />
        </div>
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <Input placeholder="Name" value={newCand.name} onChange={(e) => setNewCand({ ...newCand, name: e.target.value })} />
          <Input placeholder="Position" value={newCand.position} onChange={(e) => setNewCand({ ...newCand, position: e.target.value })} />
          <Input placeholder="Manifesto" value={newCand.manifesto} onChange={(e) => setNewCand({ ...newCand, manifesto: e.target.value })} />
          <div>
            <input type="file" accept="image/*" onChange={onNewFileChange} />
          </div>
        </div>
        {newCand.imagePreview && (
          <div className="mt-2">
            <img src={newCand.imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
          </div>
        )}
        <div className="mt-3">
          <Button onClick={createCandidate}>Create Candidate</Button>
        </div>
      </div>

      {/* Admin list */}
      <div className="grid md:grid-cols-2 gap-6">
        {candidates.map(candidate => (
          <Card key={candidate.id} className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex justify-between">
              <CardTitle>{candidate.name}</CardTitle>
              <Badge>{candidate.position}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-500">{candidate.party}</p>
              <div className="flex gap-3">
                <Button size="sm" variant="secondary" onClick={() => editCandidate(candidate)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteCandidate(candidate.id)}>Delete</Button>
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
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <Input value={editing.position} onChange={(e) => setEditing({ ...editing, position: e.target.value })} />
              <Input value={editing.party} onChange={(e) => setEditing({ ...editing, party: e.target.value })} />
              <div>
                <input type="file" accept="image/*" onChange={onEditFileChange} />
              </div>
              {editImagePreview && (
                <img src={editImagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
              )}
              <Button onClick={saveEditWithServer} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
