

import { fire, water } from "@/assets/images";
import { navList } from "@/constants/navbar";
import { ThemeToggle } from "@/context/ThemeToggler";
import { useAuth } from "@/hooks/useAuth";
import { MenuIcon, Shield, UserCircle, VerifiedIcon, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";



const Menu = () => {
  const {user} = useAuth()


  const [openMenu, setMenu] = useState<boolean | null>(false);
  const [userRole, setRole] = useState<boolean>(false);
  const [image, setImage] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);

 

  const id = 7;

  if (id % 2 === 0)
    setImage(true);





useEffect(
  ( )=>{
    setRole(user?.role.toLowerCase() === "admin"? true : false)
  
  },
  []
)
    




  return (
    <>

      {
        !openMenu ? <MenuIcon onClick={() => setMenu(!openMenu)} className=" rounded-md p-2 cursor-pointer h-8 w-8" /> : <XCircle onClick={() => setMenu(!openMenu)} />
      }

      {
        openMenu && (
          <div className="absolute w-dvw h-dvh bg-zinc-100 z-50 text-black dark:bg-zinc-950 dark:text-zinc-50 right-0 bottom-0 p-8  text-lg capitalize">
            <div className="flex items-center gap-6 justify-between">
              <span className="flex gap-2 items-center">
                <UserCircle />
                {userRole ? "admin" : "voter"}
               
              </span>
              <span className="flex items-center gap-4">
                <Shield />
                <VerifiedIcon className={`${verified ? 'text-green-500' : 'text-red-500'}`} />
                <img src={image ? water : fire} alt="" className="h-8 w-8 rounded-md" />
                <ThemeToggle />
                <XCircle onClick={() => setMenu(!openMenu)} className=" cursor-pointer p-2 rounded-full flex justify-center items-center h-8 w-8" />
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-8 ml-6">
              {
                navList.map((link, index) =>
                  <Link key={index} to={link.link} className="cursor-pointer">
                    {
                      link.title
                    }
                  </Link>
                )
              }
            </div>
          </div>
        )
      }

    </>
  )
}

export default Menu