import { useState, useEffect } from 'react'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { OverviewPage } from './pages/OverviewPage'
import { SimplePages } from './pages/SimplePages'
import { TransferPage } from './pages/TransferPage'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

function App() {
  const [user, setUser] = useState<{ id: string; email: string; displayName?: string } | null>(null)
  const [route, setRoute] = useState<string>('Landing')
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    async function checkAuthSession() {
      const token = localStorage.getItem('sounmix_auth_token')
      const params = new URLSearchParams(window.location.search)

      try {
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch(`${apiUrl}/auth/me`, {
          headers,
          credentials: 'include',
        }).then((r) => r.json())

        if (res.success && res.data) {
          setUser(res.data)
          setRoute('Overview')
        } else if (params.get('connected') || params.get('error')) {
          setRoute('Overview')
        }
      } catch {
        if (params.get('connected') || params.get('error')) {
          setRoute('Overview')
        }
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthSession()
  }, [])

  async function handleLogout() {
    localStorage.removeItem('sounmix_auth_token')
    try {
      await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {}
    setUser(null)
    setRoute('Landing')
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-aura">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pulse border-t-transparent" />
      </div>
    )
  }

  if (route === 'Landing' && !user) {
    return <LandingPage onGetStarted={() => setRoute('Register')} />
  }

  if ((route === 'Login' || route === 'Register') && !user) {
    return (
      <AuthPage
        mode={route as 'Login' | 'Register'}
        onModeChange={setRoute}
        onSuccess={() => {
          setRoute('Overview')
        }}
      />
    )
  }

  return (
    <DashboardLayout activePage={route} onNavigate={setRoute} onLogout={handleLogout}>
      {route === 'Overview' && <OverviewPage onNavigate={setRoute} />}
      {route === 'Transfer' && <TransferPage />}
      {['Organize', 'Duplicates', 'Merge', 'History', 'Settings'].includes(route) && <SimplePages page={route} />}
    </DashboardLayout>
  )
}

export default App
