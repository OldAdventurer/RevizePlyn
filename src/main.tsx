import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const themeMedia = window.matchMedia('(prefers-color-scheme: dark)')
const applySystemTheme = (isDark: boolean) => {
  document.documentElement.classList.toggle('dark', isDark)
}

applySystemTheme(themeMedia.matches)
if (typeof themeMedia.addEventListener === 'function') {
  themeMedia.addEventListener('change', (event) => applySystemTheme(event.matches))
} else {
  themeMedia.addListener((event) => applySystemTheme(event.matches))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
