import { useState } from 'react'
export function useDuplicateScan() {
  const [duplicates, setDuplicates] = useState([])
  return { duplicates, scan: () => {} }
}
