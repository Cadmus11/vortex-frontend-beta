import { fire, water } from "@/assets/images";
import { navList, voterList } from "@/constants/navbar";
import { ThemeToggle } from "@/context/ThemeToggler";
import { useAuth } from "@/hooks/useAuth";
import {
  LogOut,
  MenuIcon,
  Shield,
  UserCircle,
  VerifiedIcon,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

// Minimal, robust Menu component with safe role handling
const Menu = () => {
  const { user, logout } = useAuth();
  const [openMenu, setMenu] = useState(false);

  // Safer role handling with sane defaults
  const roleRaw = (user?.role ?? '') as string;
  const isAdmin = roleRaw.toLowerCase() === 'admin';
  const username = user?.email?.split('@')[0]?.slice(0, 8) ?? '';
  const userRole = isAdmin ? 'admin' : 'voter';

  return (
    <>
      {!openMenu ? (
        <MenuIcon
          onClick={() => setMenu(true)}
          className="rounded-md p-2 cursor-pointer h-8 w-8"
        />
      ) : (
        <XCircle onClick={() => setMenu(false)} />
      )}

      {openMenu && (
        <div className="absolute w-dvw h-dvh bg-zinc-100 z-50 text-black dark:bg-zinc-950 dark:text-zinc-50 right-0 bottom-0 p-8 text-lg capitalize">
          <div className="flex items-center gap-6 justify-between max-sm:flex-col">
            <span className="flex gap-2 items-center">
              <UserCircle />
              <p className="max-sm:text-sm md:text-md capitalize">
                {username ? `${username} - ` : ""}{userRole}
              </p>
            </span>
            <span className="flex items-center gap-4">
              <Shield />
              <VerifiedIcon className="text-green-500" />
              <img src={water} alt="" className="h-8 w-8 rounded-md" />
              <ThemeToggle />
              <XCircle onClick={() => setMenu(false)} className="cursor-pointer p-2 rounded-full flex justify-center items-center h-8 w-8" />
            </span>
          </div>
          <div className="flex flex-col gap-2 mt-8 ml-6">
            {isAdmin
              ? navList.map((link, index) => (
                  <Link to={link.link} key={index}>{link.title}</Link>
                ))
              : voterList.map((link, index) => (
                  <Link to={link.link} key={index}>{link.title}</Link>
                ))}
            <button onClick={logout} className="flex items-center cursor-pointer text-red-700 gap-2 text-md rounded">
              <LogOut className="h-4 w-4"/>Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Menu;
