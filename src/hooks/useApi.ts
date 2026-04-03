export function useApi() {
  
    const request = async (
      url: string,
      options: RequestInit = {}
    ) => {
      const res = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })
  
      if (!res.ok) throw new Error("API Error")
  
      return res.json()
    }
  
    return { request }
  }