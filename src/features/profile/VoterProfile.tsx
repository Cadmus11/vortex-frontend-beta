import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Menu from "@/components/custom/Menu"
import { ThemeToggle } from "@/context/ThemeToggler"
import { useAuth } from "@/hooks/useAuth"
import { User, Mail, Shield, CheckCircle, XCircle, Calendar } from "lucide-react"

const VoterProfile = () => {
  const { user } = useAuth()

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Profile</h1>
              <p className="text-sm text-muted-foreground">View your account information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Menu />
          </div>
        </header>

        <Card className="shadow-xl border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Account Details
            </CardTitle>
            <CardDescription>Your personal information and account status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </div>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Account Role
                </div>
                <p className="font-medium capitalize">{user?.role || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {user?.isVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  Verification Status
                </div>
                <p className={`font-medium ${user?.isVerified ? 'text-green-500' : 'text-red-500'}`}>
                  {user?.isVerified ? 'Verified' : 'Not Verified'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </div>
                <p className="font-medium">Recently</p>
              </div>
            </div>

            {!user?.isVerified && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  <strong>Note:</strong> Complete face verification to access all voting features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xl border-zinc-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Account Security</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your account is secured with JWT authentication. Session tokens are stored securely in HTTP-only cookies.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VoterProfile
