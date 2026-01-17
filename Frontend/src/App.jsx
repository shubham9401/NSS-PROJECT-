import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginRegister from './pages/LoginRegister'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { useAuth } from './context/AuthContext'

function RequireAuth({ role, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-teal-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-stone-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  // Redirect logged in users away from login page
  function LoginRoute() {
    if (loading) return null
    if (user) {
      return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />
    }
    return <LoginRegister />
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/user/*"
        element={<RequireAuth role="user"><UserDashboard /></RequireAuth>}
      />
      <Route
        path="/admin/*"
        element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>}
      />
      <Route path="*" element={<div className="p-8">Not Found</div>} />
    </Routes>
  )
}
