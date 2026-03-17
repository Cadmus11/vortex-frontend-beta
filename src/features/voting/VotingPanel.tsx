import Menu from "@/components/custom/Menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/context/ThemeToggler"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router"



type Candidate = {
  id: number
  name: string
  party: string
  slogan: string
  color: string
}

const candidates: Candidate[] = [
  {
    id: 1,
    name: "Aether Ricky",
    party: "Digital Front",
    slogan: "Future First.",
    color: "from-indigo-500/20 to-indigo-700/20",
  },
  {
    id: 2,
    name: "Nova Chrono",
    party: "Progress Alliance",
    slogan: "Forward Together.",
    color: "from-emerald-500/20 to-emerald-700/20",
  },
  {
    id: 3,
    name: "Orion Lioness",
    party: "Unity Core",
    slogan: "Strength in Unity.",
    color: "from-rose-500/20 to-rose-700/20",
  },
  {
    id: 4,
    name: "Lost Universe",
    party: "Lasting Days",
    slogan: "Forever and ever",
    color: "from-rose-500/20 to-rose-700/20",
  },
]


const VotingPanel = () => {
  const navigate = useNavigate()

  const [selected, setSelected  ] =  useState<number | null>(null)
  const selectedCandidate = () => candidates.find((x)=> x.id === selected)
  return (
    <>
    <div className="flex justify-between p-4">
      <h1 className="text-lg capitalize flex items-center gap-2">
        <Check className="ring-1 rounded-full p-2 text-green-500"/> Voting Panel</h1>
        <div className="flex gap-4">
          {
            selected && (
              <Badge className="px bg-emerald-500">
selected
              </Badge>
            )
          }
        <ThemeToggle/>
        <Menu/>
        </div>
     
    </div>

    <div className="flex flex-wrap justify-center items-center w-full">
      {
        candidates.map(
          (candidate)=>(
            <Card key={candidate.id} className={cn("p-4 m-1 max-sm:w-full w-1/3",
              selected === candidate.id? "border-green-500 border-4" : ""
            )
            } onClick={()=>setSelected(candidate.id)}>
              <CardTitle className="text-center uppercase text-lg">{`file no.000000000${candidate.id}`}</CardTitle>
              <CardContent className="flex justify-center gap-4 items-center text-lg">
                <span className="h-20 w-20 bg-red-400 flex justify-center items-center overflow-hidden rounded-md">
                  {
                    candidate.name[0]
                  }
                </span>
               <div><h1>{candidate.name}</h1>
               <p className="text-xs">{candidate.party}</p></div>
              </CardContent>

            </Card>
          )
        )
      }
   

    </div>
    {
        selected && (
          <div className="flex justify-center items-center ">
          <Button className="px text-md font-bold " onClick={()=>navigate('/face')}>
            Submit Vote
          </Button>
          </div>
        )
      }


    
    </>
  )
}

export default VotingPanel