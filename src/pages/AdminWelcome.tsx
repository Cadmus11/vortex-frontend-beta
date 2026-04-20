import { useNavigate } from "react-router";
import { Shield, Users, Vote, Settings, BarChart3, UserPlus, FileText, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

interface Feature {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const adminFeatures: Feature[] = [
  {
    title: "Dashboard",
    description: "Overview of all elections and voting statistics",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Manage Elections",
    description: "Create, configure and manage election cycles",
    icon: Vote,
    href: "/admin/election",
  },
  {
    title: "Manage Positions",
    description: "Add or edit positions for elections",
    icon: Settings,
    href: "/admin/positions",
  },
  {
    title: "Manage Candidates",
    description: "Add or edit candidate information",
    icon: UserPlus,
    href: "/admin/candidates",
  },
  {
    title: "Manage Users",
    description: "View and manage voter accounts",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "View Results",
    description: "View election results and analytics",
    icon: BarChart3,
    href: "/admin/results",
  },
];

export default function AdminWelcome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.username || 'Admin'}!</h1>
            <p className="text-muted-foreground mt-2">
              This is the Vortex Admin Management Center
            </p>
          </div>
          <Button
            onClick={() => navigate("/admin/dashboard")}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Dashboard
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminFeatures.map((feature) => (
            <button
              key={feature.href}
              onClick={() => navigate(feature.href)}
              className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition">
                  <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <footer className="text-center text-sm text-muted-foreground pt-8">
          <p>Vortex Secure Voting System &bull; Admin Panel</p>
        </footer>
      </div>
    </div>
  );
}