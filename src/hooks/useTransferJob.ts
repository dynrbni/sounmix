import { useState } from 'react'
export function useTransferJob() {
  const [job, setJob] = useState(null)
  return { job, startTransfer: () => {} }
}
