import { useState } from 'react'
export function useToast() {
  const [toasts, setToasts] = useState([])
  return { toasts, showToast: (msg: string) => {} }
}
