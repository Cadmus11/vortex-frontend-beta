import { Card, CardContent } from "@/components/ui/card"
import { userInstructions } from "@/constants"
import { ThemeToggle } from "@/context/ThemeToggler"
import Menu  from "@/components/custom/Menu"


const UserInfo = () => {
  return (
    <>
    <div className="flex justify-between items-center p-4">
    <h1 className="text-xl capitalize   ">User Instructions</h1>
    <div className="flex justify-center items-center gap-3">

    
    <span className="max-sm:hidden"><ThemeToggle/></span>
    <Menu/>
    </div>
    </div>
    
 {
     userInstructions.map(
         (instruction, index) => <Card key={index} className="m-4">
         <CardContent className="text-center text-lg">
     {
         instruction
     }
         </CardContent>
     </Card>
     )
 }
 
    </>
  )
}

export default UserInfo