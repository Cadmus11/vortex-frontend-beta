
import React from "react"

interface AuthComponents{
    children : React.ReactNode
}

const AuthLayout = ({children}:AuthComponents) => {
  return (
   <>
   <div className='w-dvw h-dvh flex justify-center items-center'>
    {
        children
    }

   </div>
   </>
  )
}

export default AuthLayout