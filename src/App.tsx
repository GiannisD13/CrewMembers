import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationsProvider } from './context/NotificationsContext'
import AppShell from './components/AppShell'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import OwnerDashboard from './pages/OwnerDashboard'
import CrewDashboard from './pages/CrewDashboard'
import MyListings from './pages/MyListings'
import Browse from './pages/Browse'
import Applications from './pages/Applications'
import Messages from './pages/Messages'

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

function RequireAuth() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen bg-navy" />
  if (!user) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

function RequireRole({ role }: { role: 'owner' | 'crew' }) {
  const { user } = useAuth()
  if (!user) return null
  if (user.account_type !== role) return <Navigate to={`/dashboard/${user.account_type}`} replace />
  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes (top navbar) */}
      <Route element={<PublicLayout />}>
        <Route path="/"         element={<Home />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected routes (sidebar) */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole role="owner" />}>
          <Route path="/dashboard/owner" element={<OwnerDashboard />} />
        </Route>
        <Route element={<RequireRole role="crew" />}>
          <Route path="/dashboard/crew" element={<CrewDashboard />} />
        </Route>
        <Route path="/my-listings"   element={<MyListings />} />
        <Route path="/browse"        element={<Browse />} />
        <Route path="/applications"  element={<Applications />} />
        <Route path="/messages"      element={<Messages />} />
        <Route path="/messages/:id"  element={<Messages />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationsProvider>
          <AppRoutes />
        </NotificationsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
