import { useState, useEffect } from 'react'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { OverviewPage } from './pages/OverviewPage'
import { PlaylistPreviewPage } from './pages/PlaylistPreviewPage'
import { SimplePages } from './pages/SimplePages'
import { TransferPage } from './pages/TransferPage'


const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

interface AuthUser {
  id: string
  email: string
  displayName?: string
}

function getInitialUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('sounmix_user')
    const token = localStorage.getItem('sounmix_auth_token')
    if (token && raw) {
      return JSON.parse(raw)
    }
    return null
  } catch {
    return null
  }
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser)
  const [route, setRoute] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') || params.get('error')) {
      return 'Overview'
    }
    return getInitialUser() ? 'Overview' : 'Landing'
  })

  useEffect(() => {
    async function checkAuthSession() {
      const token = localStorage.getItem('sounmix_auth_token')
      if (!token) return

      try {
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).then((r) => r.json())

        if (res.success && res.data) {
          setUser(res.data)
          localStorage.setItem('sounmix_user', JSON.stringify(res.data))
        }
      } catch (err) {
        console.error('Session check error:', err)
      }
    }

    checkAuthSession()
  }, [])

  async function handleLogout() {
    localStorage.removeItem('sounmix_auth_token')
    localStorage.removeItem('sounmix_user')
    try {
      await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch {}
    setUser(null)
    setRoute('Landing')
  }

  function handleLoginSuccess(loggedInUser?: AuthUser) {
    if (loggedInUser) {
      setUser(loggedInUser)
      localStorage.setItem('sounmix_user', JSON.stringify(loggedInUser))
    }
    setRoute('Overview')
  }

  if (route === 'Landing' && !user) {
    return <LandingPage onGetStarted={() => setRoute('Register')} />
  }

  if ((route === 'Login' || route === 'Register') && !user) {
    return (
      <AuthPage
        mode={route as 'Login' | 'Register'}
        onModeChange={setRoute}
        onSuccess={handleLoginSuccess}
      />
    )
  }

  return (
    <DashboardLayout activePage={route} onNavigate={setRoute} onLogout={handleLogout}>
      {route === 'Overview' && <OverviewPage onNavigate={setRoute} />}
      {route === 'Preview' && <PlaylistPreviewPage onNavigate={setRoute} />}
      {route === 'Transfer' && <TransferPage />}
      {['Organize', 'Duplicates', 'Merge', 'History', 'Settings'].includes(route) && <SimplePages page={route} />}
    </DashboardLayout>
  )

}

export default App
