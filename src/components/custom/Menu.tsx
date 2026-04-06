import { navList, voterList } from "@/constants/navbar";
import { ThemeToggle } from "@/context/ThemeToggler";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Menu as MenuIcon, LayoutDashboard, Vote, Megaphone, Users, FileText, ScanFace } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";

const iconMap: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Election: Vote,
  Positions: FileText,
  Candidates: Users,
  Users: Users,
  Campaigns: Megaphone,
  "Face Verification": ScanFace,
  "Cast Vote": Vote,
};

const NavItem = ({ to, label, onClick, isActive }: { 
  to: string; 
  label: string; 
  onClick?: () => void;
  isActive?: boolean;
}) => {
  const Icon = iconMap[label] || LayoutDashboard;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${isActive 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

const MenuSheet = () => {
  const [open, setOpen] = useState(false);
  const { user, logout, isSignedIn } = useAuth();
  const location = useLocation();
  
  if (!isSignedIn) return null;

  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? navList : voterList;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MenuIcon className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-70 p-0 flex flex-col">
        <SheetHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/login" />
              <div className="min-w-0">
                <SheetTitle className="text-sm font-semibold truncate">
                  {user?.username || 'User'}
                </SheetTitle>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || 'voter'}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>
        
        <Separator className="my-3" />
        
        <nav className="flex-1 overflow-y-auto px-3 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.link}
              to={item.link}
              label={item.title}
              isActive={location.pathname === item.link}
              onClick={() => setOpen(false)}
            />
          ))}
        </nav>
        
        <div className="p-3 space-y-3 border-t">
          <div className="flex items-center justify-between px-3">
            <span className="text-sm font-medium text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" 
            onClick={logout}
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
  const { isSignedIn } = useAuth();

  if (!isSignedIn) return null;

  return (
    <div className="flex items-center gap-1">
      <ThemeToggle />
      <MenuSheet />
    </div>
  );
};

export default Menu;
