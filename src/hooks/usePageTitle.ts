import { useEffect } from 'react'

const BASE_TITLE = 'RevizePlyn'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} — Evidence revizí plynových zařízení`
    return () => { document.title = `${BASE_TITLE} — Evidence revizí plynových zařízení` }
  }, [title])
}
