import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { User, Shield, CheckCircle, XCircle } from "lucide-react"

const VoterProfile = () => {
  const { user } = useAuth()

  return (
    <div className="h-full p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-sm text-muted-foreground">Account information</p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">{user?.username || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </p>
                <p className="font-medium capitalize">{user?.role || 'N/A'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {user?.isVerified ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  Verification
                </p>
                <p className={`font-medium ${user?.isVerified ? 'text-green-500' : 'text-red-500'}`}>
                  {user?.isVerified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            </div>

            {!user?.isVerified && (
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm">
                  Complete face verification to access all voting features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VoterProfile
