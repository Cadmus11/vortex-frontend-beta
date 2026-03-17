

import { navList } from "@/constants/navbar";
import { ThemeToggle } from "@/context/ThemeToggler";
import { MenuIcon, Shield, UserCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";



const Menu = () => {


    const [openMenu, setMenu] = useState<boolean | null> (false);
    const [userRole, setRole] = useState<string>('Observer');
    const [faceAuthed, setFaceAuthed] = useState<boolean | null>(false);



  const confirmedFaceRegistration = () =>{
    setFaceAuthed(true);
    setRole("Voter");
  }


  return(
  <>

  {
    !openMenu? <MenuIcon onClick={()=>setMenu(!openMenu)} className=" rounded-md p-2 cursor-pointer h-8 w-8"/> : <XCircle onClick={()=>setMenu(!openMenu)}/>
  }

{
    openMenu && (
       <div className="absolute w-dvw h-dvh bg-zinc-100 z-50 text-black dark:bg-zinc-950 dark:text-zinc-50 right-0 bottom-0 p-8  text-lg capitalize">
      <div className="flex items-center gap-6 justify-between">
        <span className="flex gap-2 items-center">
          <UserCircle/>
          {userRole}
        </span>
        <span className="flex items-center gap-4">
        <Shield/>
        <ThemeToggle/>
        <XCircle onClick={()=>setMenu(!openMenu)} className=" cursor-pointer p-2 rounded-full flex justify-center items-center h-8 w-8"/>
        </span>
      </div>
      <div className="flex flex-col gap-2 mt-8 ml-6">
        {
            navList.map((link, index)=> 
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