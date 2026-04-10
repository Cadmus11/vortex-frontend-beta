import { navList, voterList } from "@/constants/navbar";
import { ThemeToggle } from "@/context/ThemeToggler";
import {
  LogOut,
  Menu as MenuIcon,
  BadgeCheck,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link, useLocation } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/clerk-react";
import { API_URL } from "@/config/api";


interface BackendUser {
  id: string;
  clerkId: string;
  email: string;
  username: string;
  role: "admin" | "voter";
  isVerified: boolean;
}

const NavItem = ({
  to,
  label,
  icon: Icon,
  onClick,
  isActive,
}: {
  to: string;
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
  isActive?: boolean;
}) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Link>
  );
};

const MenuSheet = () => {
  const [open, setOpen] = useState(false);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [role, setRole] = useState<"admin" | "voter" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user: clerkUser, isSignedIn: clerkSignedIn, isLoaded: clerkLoaded } = useUser();
  const location = useLocation();

  const fetchUserRole = useCallback(async () => {
    if (!clerkUser?.id) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/me`, {
        credentials: "include",
        headers: {
          "x-clerk-user-id": clerkUser.id,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setBackendUser(data.data);
          setRole(data.data.role);
        }
      } else {
        setRole("voter");
      }
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      setRole("voter");
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser?.id]);

  useEffect(() => {
    if (clerkUser?.id) {
      fetchUserRole();
    }
  }, [clerkUser?.id, fetchUserRole]);

  const handleRefresh = () => {
    fetchUserRole();
  };

  if (!clerkLoaded || !clerkSignedIn || !clerkUser) return null;

  if (role === null) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const isAdmin = role === "admin";
  const navItems = isAdmin ? navList : voterList;

  const displayName =
    backendUser?.username ||
    clerkUser.username ||
    clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "User";

  const displayEmail =
    backendUser?.email || clerkUser.primaryEmailAddress?.emailAddress || "";

  const isVerified =
    backendUser?.isVerified ??
    clerkUser.primaryEmailAddress?.verification?.status === "verified";

    
    
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <MenuIcon className="h-5 w-5" />
          {isLoading && (
            <span className="absolute -top-1 -right-1 h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-70 p-0 flex flex-col">
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/login" />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm font-semibold truncate">
                  {displayName}
                </SheetTitle>

                {isVerified ? (
                  <BadgeCheck className="h-4 w-4 text-green-500 fill-green-500/20" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-yellow-500" />
                )}
              </div>

              {displayEmail && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {displayEmail}
                </p>
              )}

              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize
                    ${
                      isAdmin
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                >
                  {role}
                </span>

                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-3" />

        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isAdmin ? "Admin Navigation" : "Voter Navigation"}
          </div>

          { navItems.map((item) => {
            const isActive =
              item.link === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.link);

            return (
              <NavItem
                key={item.link}
                to={item.link}
                label={item.title}
                icon={item.icon}
                isActive={isActive}
                onClick={() => setOpen(false)}
              />
            );
          })}
        </nav>

        <div className="p-3 space-y-3 border-t">
          <div className="flex items-center justify-between px-3">
            <span className="text-sm font-medium text-muted-foreground">
              Theme
            </span>
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => {
              setBackendUser(null);
              setRole(null);
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Menu = () => {
  const { isSignedIn: clerkSignedIn } = useUser();

  if (!clerkSignedIn) return null;

  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <MenuSheet />
    </div>
  );
};

export default Menu;