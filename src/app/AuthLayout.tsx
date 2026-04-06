import { Outlet } from "react-router"

const AuthLayout = () => {
  return (
    <div className='w-dvw h-dvh flex justify-center items-center'>
      <Outlet />
    </div>
  )
}

export default AuthLayout
