import { Card, CardContent } from "@/components/ui/card"
import { instructionsAdmin } from "@/constants"
import { ThemeToggle } from "@/context/ThemeToggler"
const Info = () => {
  return (
   <>
   <div className="flex justify-between items-center p-4">
   <h1 className="text-xl capitalize   ">Admin Instructions</h1>
   <ThemeToggle/>
   </div>
{
    instructionsAdmin.map(
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

export default Info