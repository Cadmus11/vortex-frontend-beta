import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import Menu from "@/components/custom/Menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/context/ThemeToggler"
import { AlertCircle, CalendarDays, Check, Clock, FileText, Loader2, Shield } from "lucide-react"

const electionSchema = z.object({
  name: z.string().min(3, "Election name must be at least 3 characters"),
  date: z.string().min(1, "Election date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
})

type ElectionFormValues = z.infer<typeof electionSchema>

export default function ElectionSetup() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ElectionFormValues>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      name: "",
      date: "",
      startTime: "",
      endTime: "",
      description: "",
    },
  })

  const onSubmit = async (data: ElectionFormValues) => {
    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`).toISOString()
      const endDateTime = new Date(`${data.date}T${data.endTime}`).toISOString()

      const payload = {
        title: data.name,
        description: data.description,
        startTime: startDateTime,
        endTime: endDateTime,
      }

      const res = await fetch("/api/elections", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201 || res.ok) {
        setSubmitStatus("success")
        reset()
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("Election creation failed:", errorData)
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Error creating election:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Election Setup</h1>
              <p className="text-sm text-muted-foreground">
                Configure your election parameters
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              Admin Panel
            </Badge>
            <ThemeToggle />
            <Menu />
          </div>
        </header>

        {/* Form Card */}
        <Card className="shadow-xl border-zinc-200 dark:border-zinc-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create New Election</CardTitle>
            <CardDescription>
              Fill in the election details below. All fields are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Election Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Election Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Student Union Presidential Election 2026"
                  {...register("name")}
                  className="h-12"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  A clear, descriptive name for the election
                </p>
              </div>

              {/* Date and Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Election Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Election Date
                  </Label>
                  <Input id="date" type="date" {...register("date")} className="h-12" />
                  {errors.date && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.date.message}
                    </p>
                  )}
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Time
                  </Label>
                  <Input id="startTime" type="time" {...register("startTime")} className="h-12" />
                  {errors.startTime && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.startTime.message}
                    </p>
                  )}
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    End Time
                  </Label>
                  <Input id="endTime" type="time" {...register("endTime")} className="h-12" />
                  {errors.endTime && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.endTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Election Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose and scope of this election..."
                  {...register("description")}
                  className="min-h-[120px] resize-y"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Provide details about the election, its importance, and any relevant information for voters.
                </p>
              </div>

              {/* Status Messages */}
              {submitStatus === "success" && (
                <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Election created successfully!
                </div>
              )}

              {submitStatus === "error" && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Failed to create election. Please try again.
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Election"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  className="h-12"
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
