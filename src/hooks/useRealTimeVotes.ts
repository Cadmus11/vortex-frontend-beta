import { useEffect } from "react"

export function useRealtimeVotes(
  updateFn: () => void,
  interval = 4000
) {
  useEffect(() => {
    const id = setInterval(updateFn, interval)
    return () => clearInterval(id)
  }, [updateFn, interval])
}


// useRealtimeVotes(() => {
//     setCandidates(prev =>
//       prev.map(c => ({
//         ...c,
//         votes: c.votes + Math.floor(Math.random() * 3),
//       }))
//     )
//   })