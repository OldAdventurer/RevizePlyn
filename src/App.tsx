import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useDbInit } from './hooks/useDb'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import ZakazkyList from './pages/zakazky/ZakazkyList'
import ZakazkaDetail from './pages/zakazky/ZakazkaDetail'
import ZakazkaForm from './pages/zakazky/ZakazkaForm'
import ZakazniciList from './pages/zakaznici/ZakazniciList'
import ZakaznikDetail from './pages/zakaznici/ZakaznikDetail'
import ZarizeniList from './pages/zarizeni/ZarizeniList'
import ZarizeniDetail from './pages/zarizeni/ZarizeniDetail'
import ZarizeniQR from './pages/zarizeni/ZarizeniQR'
import RevizeList from './pages/revize/RevizeList'
import RevizeDetail from './pages/revize/RevizeDetail'
import RevizeForm from './pages/revize/RevizeForm'
import SdileniPage from './pages/sdileni/SdileniPage'
import NastaveniPage from './pages/nastaveni/NastaveniPage'

export default function App() {
  const dbReady = useDbInit()

  if (!dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4" />
          <p className="text-lg text-gray-600">Načítám aplikaci...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sdileni/:token" element={<SdileniPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/zakazky" element={<ZakazkyList />} />
          <Route path="/zakazky/nova" element={<ZakazkaForm />} />
          <Route path="/zakazky/:id" element={<ZakazkaDetail />} />
          <Route path="/zakazky/:id/upravit" element={<ZakazkaForm />} />
          <Route path="/zakazky/:id/revize" element={<RevizeForm />} />
          <Route path="/zarizeni" element={<ZarizeniList />} />
          <Route path="/zarizeni/:id" element={<ZarizeniDetail />} />
          <Route path="/zarizeni/:id/qr" element={<ZarizeniQR />} />
          <Route path="/zakaznici" element={<ZakazniciList />} />
          <Route path="/zakaznici/:id" element={<ZakaznikDetail />} />
          <Route path="/revizni-zpravy" element={<RevizeList />} />
          <Route path="/revizni-zpravy/:id" element={<RevizeDetail />} />
          <Route path="/nastaveni" element={<NastaveniPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
