import { useState } from 'react'
export function useAuth() {
  const [user, setUser] = useState({ id: 'demo-user', email: 'demo@sounmix.app' })
  return { user, isAuthenticated: true }
}
