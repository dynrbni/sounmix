import { useState } from 'react'
export function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(initial)
  return [val, setVal] as const
}
