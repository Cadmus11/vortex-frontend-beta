import { navList, voterList } from "@/constants/navbar";
import { ThemeToggle } from "@/context/ThemeToggler";
import { useAuth } from "@/context/AuthContext";
import {
  LogOut,
  Menu as MenuIcon,
  BadgeCheck,
  RefreshCw,
  Loader2,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

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
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const navItems = isAdmin ? navList : voterList;

  const displayName = user.username || user.email.split("@")[0];
  const displayEmail = user.email;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-70 p-0 flex flex-col">
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-sm font-semibold truncate">
                  {displayName}
                </SheetTitle>

                {user.isVerified ? (
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
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-3" />

        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isAdmin ? "Admin Navigation" : "Voter Navigation"}
          </div>

          {navItems.map((item) => {
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
            onClick={handleLogout}
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
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <MenuSheet />
    </div>
  );
};

export default Menu;