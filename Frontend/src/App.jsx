import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginRegister from './pages/LoginRegister'
import UserDashboard from './pages/UserDashboard'
import AdminDashboard from './pages/AdminDashboard'
import { useAuth } from './context/AuthContext'

function RequireAuth({ role, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRegister />} />
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
