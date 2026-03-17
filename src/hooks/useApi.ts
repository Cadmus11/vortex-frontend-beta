export function useApi() {
    const { user } = useAuth()
  
    const request = async (
      url: string,
      options: RequestInit = {}
    ) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
          ...options.headers,
        },
      })
  
      if (!res.ok) throw new Error("API Error")
  
      return res.json()
    }
  
    return { request }
  }