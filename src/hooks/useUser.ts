import { useState, useEffect } from 'react'

interface User {
  id: number
  email: string
  role: 'RMO' | 'user'
  name: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUser({
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name
      })
    } catch (error) {
      console.error('Error decoding JWT:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, loading }
}
