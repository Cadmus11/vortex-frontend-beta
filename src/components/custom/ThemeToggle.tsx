import { useTheme } from "@/app/ThemeProvider"
import { Moon, Sun } from "lucide-react"
import { Button } from "../ui/button"


const ThemeToggle = () => {
    const {theme, setTheme} = useTheme()
  return (
   <Button variant={'ghost'} onClick={()=>setTheme(theme === 'dark'? 'light': "dark")} className="cursor-pointer ring-1 h-10 w-10">
{
theme === 'dark'? 
 <Sun className="h-4 w-4"/> : 
 <Moon/>
}
   </Button>
  )
}

export default ThemeToggle