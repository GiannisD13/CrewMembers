import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Login from './pages/Login'
import Register from './pages/Register'
import OwnerDashboard from './pages/OwnerDashboard'
import CrewDashboard from './pages/CrewDashboard'

function ProtectedRoute({ role }: { role: 'owner' | 'crew' }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="min-h-screen bg-navy" />
  if (!user) return <Navigate to="/login" replace />
  if (user.account_type !== role) return <Navigate to={`/dashboard/${user.account_type}`} replace />
  return <Outlet />
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Home />}     />
        <Route path="/browse"   element={<Browse />}   />
        <Route path="/login"    element={<Login />}    />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute role="owner" />}>
          <Route path="/dashboard/owner" element={<OwnerDashboard />} />
        </Route>
        <Route element={<ProtectedRoute role="crew" />}>
          <Route path="/dashboard/crew" element={<CrewDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
