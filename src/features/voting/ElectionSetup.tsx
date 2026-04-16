import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

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

import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Loader2,
  Shield,
} from "lucide-react"

import { API_URL } from "../../config/api"
import { useAuth } from "@/context/AuthContext"

/* ---------------------- Schema ---------------------- */
const electionSchema = z.object({
  name: z.string().min(3, "Election name must be at least 3 characters"),
  date: z.string().min(1, "Election date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
})

type ElectionFormValues = z.infer<typeof electionSchema>

/* ---------------------- Helpers ---------------------- */
const getISODateTime = (date: string, time: string) =>
  new Date(`${date}T${time}`).toISOString()

/* ---------------------- Reusable Field ---------------------- */
interface FormFieldProps {
  id: string;
  label: string;
  icon?: React.ElementType;
  error?: { message?: string };
  children: React.ReactNode;
}

function FormField({ id, label, icon: Icon, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </Label>

      {children}

      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error.message}
        </p>
      )}
    </div>
  )
}

/* ---------------------- Component ---------------------- */
export default function ElectionSetup() {
  const { user, accessToken, isLoading } = useAuth()
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
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

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const canSubmit = () => {
    const token = accessToken || localStorage.getItem('accessToken');
    return token && user?.id;
  };

  /* ---------------------- Submit ---------------------- */
  const onSubmit = async (data: ElectionFormValues) => {
    setSubmitStatus("idle")
    setErrorMessage("")

    const token = accessToken || localStorage.getItem('accessToken');
    if (!token || !user?.id) {
      setSubmitStatus("error")
      setErrorMessage("Please log in to create an election")
      return
    }

    try {
      const startTime = getISODateTime(data.date, data.startTime)
      const endTime = getISODateTime(data.date, data.endTime)

      if (new Date(endTime) <= new Date(startTime)) {
        setSubmitStatus("error")
        return setErrorMessage("End time must be after start time")
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const res = await fetch(`${API_URL}/elections`, {
        method: "POST",
        credentials: 'include',
        headers,
        body: JSON.stringify({
          title: data.name,
          description: data.description,
          startDate: startTime,
          endDate: endTime,
          createdBy: user.id,
          status: 'draft',
        }),
      })

      if (!res.ok) {
        const isJson = res.headers.get("content-type")?.includes("application/json")
        const errorData = isJson ? await res.json() : null

        throw new Error(
          errorData?.error ||
            errorData?.message ||
            `Server error: ${res.status}`
        )
      }

      setSubmitStatus("success")
      reset()
    } catch (err: unknown) {
      console.error(err)
      setSubmitStatus("error")
      const message = err instanceof Error ? err.message : "Network error. Please try again."
      setErrorMessage(message)
    }
  }

  /* ---------------------- UI ---------------------- */
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Election Setup</h1>
              <p className="text-sm text-muted-foreground">
                Configure your election parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary">Admin Panel</Badge>
          </div>
        </header>

        {/* Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Create New Election</CardTitle>
            <CardDescription>
              Fill in the election details below. All fields are required.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Name */}
              <FormField
                id="name"
                label="Election Name"
                icon={Shield}
                error={errors.name}
              >
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g., Student Union Presidential Election 2026"
                  className="h-12"
                />
              </FormField>

              {/* Date + Time */}
              <div className="grid md:grid-cols-3 gap-4">
                <FormField id="date" label="Election Date" icon={CalendarDays} error={errors.date}>
                  <Input type="date" {...register("date")} className="h-12" />
                </FormField>

                <FormField id="startTime" label="Start Time" icon={Clock} error={errors.startTime}>
                  <Input type="time" {...register("startTime")} className="h-12" />
                </FormField>

                <FormField id="endTime" label="End Time" icon={Clock} error={errors.endTime}>
                  <Input type="time" {...register("endTime")} className="h-12" />
                </FormField>
              </div>

              {/* Description */}
              <FormField
                id="description"
                label="Election Description"
                icon={FileText}
                error={errors.description}
              >
                <Textarea
                  {...register("description")}
                  placeholder="Describe the purpose and scope of this election..."
                  className="min-h-30 resize-y"
                />
              </FormField>

              {/* Status Messages */}
              {submitStatus === "success" && (
                <div className="p-4 flex items-center gap-2 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                  <Check className="h-5 w-5" />
                  Election created successfully!
                </div>
              )}

              {submitStatus === "error" && (
                <div className="p-4 flex items-center gap-2 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  {errorMessage || "Failed to create election. Please try again."}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-12"
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
                  className="h-12"
                  onClick={() => {
                    reset()
                    setSubmitStatus("idle")
                    setErrorMessage("")
                  }}
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