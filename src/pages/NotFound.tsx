import { useNavigate } from 'react-router-dom'
import Logo from '@/components/ui/logo'
import Button from '@/components/ui/button'
import { usePageTitle } from '../hooks/usePageTitle'

export default function NotFound() {
  usePageTitle('Stránka nenalezena')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Logo size={48} />
        </div>
        <p className="text-[120px] font-bold leading-none text-muted select-none">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">Stránka nenalezena</h1>
        <p className="mt-2 text-muted-foreground">
          Omlouváme se, ale stránka, kterou hledáte, neexistuje.
        </p>
        <div className="mt-8">
          <Button onClick={() => navigate('/')}>Zpět na nástěnku</Button>
        </div>
      </div>
    </div>
  )
}
