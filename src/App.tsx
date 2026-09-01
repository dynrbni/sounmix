import { useState } from 'react'
import { DashboardLayout } from './layouts/DashboardLayout'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { OverviewPage } from './pages/OverviewPage'
import { SimplePages } from './pages/SimplePages'
import { TransferPage } from './pages/TransferPage'

function App() {
  const [route, setRoute] = useState('Landing')

  if (route === 'Landing') {
    return <LandingPage onGetStarted={() => setRoute('Register')} />
  }

  if (route === 'Login' || route === 'Register') {
    return <AuthPage mode={route} onModeChange={setRoute} onSuccess={() => setRoute('Overview')} />
  }

  return (
    <DashboardLayout activePage={route} onNavigate={setRoute}>
      {route === 'Overview' && <OverviewPage />}
      {route === 'Transfer' && <TransferPage />}
      {['Organize', 'Duplicates', 'Merge', 'History', 'Settings'].includes(route) && <SimplePages page={route} />}
    </DashboardLayout>
  )
}

export default App
