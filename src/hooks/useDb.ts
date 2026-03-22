import { useEffect, useState } from 'react'
import { seedDatabase } from '../db/seed'

export function useDbInit() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    seedDatabase().then(() => setReady(true))
  }, [])
  return ready
}
