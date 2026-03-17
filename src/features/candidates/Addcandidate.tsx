"use client"
import { ThemeToggle } from "@/context/ThemeToggler"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import Menu from "@/components/custom/Menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Upload, UserPlus } from "lucide-react"

const candidateSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  position: z.string().min(1, "Position is required"),
  party: z.string().min(2, "Party must be at least 2 characters"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
})

type CandidateFormValues = z.infer<typeof candidateSchema>

export default function AddCandidate() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
  })

  const onSubmit = async (data: CandidateFormValues) => {
    console.log("Candidate Data:", data)

    // TODO: connect to backend API
    // await fetch("/api/candidates", { method: "POST", body: JSON.stringify(data) })

    alert("Candidate Added Successfully")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <span className="flex gap-3 items-center">
          <UserPlus className="w-4 h-4 text-blue-600" />
          <h1 className="text-lg font-bold max-sm:hidden">Add Election Candidate</h1>
          <Badge className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            Admin Panel
          </Badge>
          </span>
          <span className="flex gap-4">
          <ThemeToggle/>
          <Menu/>
          </span>
        </div>

        {/* Form Card */}
        <Card className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle>Candidate Information</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Name */}
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter candidate name" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label>Position</Label>
                <Select onValueChange={(value) => setValue("position", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="President">President</SelectItem>
                    <SelectItem value="Vice President">Vice President</SelectItem>
                    <SelectItem value="Secretary">Secretary</SelectItem>
                    <SelectItem value="Treasurer">Treasurer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.position && (
                  <p className="text-sm text-red-500">{errors.position.message}</p>
                )}
              </div>

              {/* Party */}
              <div className="space-y-2">
                <Label>Political Party</Label>
                <Input placeholder="Enter party name" {...register("party")} />
                {errors.party && (
                  <p className="text-sm text-red-500">{errors.party.message}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label>Biography</Label>
                <Textarea
                  placeholder="Write short biography..."
                  rows={4}
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-red-500">{errors.bio.message}</p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <Label>Candidate Image</Label>

                <div className="flex items-center gap-4">
                  <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-800 rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-700 transition">
                    <Upload className="w-4 h-4" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>

                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md border border-zinc-300 dark:border-zinc-700"
                    />
                  )}
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Adding..." : "Add Candidate"}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}