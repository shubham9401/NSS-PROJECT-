import React, { createContext, useContext, useState } from 'react'
import mock from '../mock/data'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState(mock.users)
  const [donations, setDonations] = useState(mock.donations)
  const navigate = useNavigate()

  function login({ name, email, phone, role }) {
    // Mocked login/register: create or reuse user
    const existing = users.find(u => u.email === email)
    let active = existing
    if (!existing) {
      active = { id: Date.now(), name, email, phone, role }
      setUsers(prev => [active, ...prev])
    }
    setUser({ ...active, role })
    // redirect based on role
    navigate(role === 'admin' ? '/admin' : '/user')
  }

  function logout() {
    setUser(null)
    navigate('/login')
  }

  function addDonation({ userId, amount }) {
    const statuses = ['Success', 'Pending', 'Failed']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const donation = {
      id: Date.now(),
      userId,
      amount: Number(amount),
      status,
      timestamp: new Date().toISOString()
    }
    setDonations(prev => [donation, ...prev])
    return donation
  }

  return (
    <AuthContext.Provider value={{ user, users, donations, login, logout, addDonation, setUsers }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
