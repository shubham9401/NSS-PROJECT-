import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI, userAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
      // Verify token is still valid
      authAPI.getMe()
        .then(res => {
          setUser(res.data.user)
          localStorage.setItem('user', JSON.stringify(res.data.user))
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email, password, expectedRole = null) {
    try {
      const res = await authAPI.login({ email, password })
      const { token, user: userData } = res.data

      // Validate role if expectedRole is provided
      if (expectedRole && userData.role !== expectedRole) {
        const roleLabel = expectedRole === 'admin' ? 'Admin' : 'User'
        const actualRoleLabel = userData.role === 'admin' ? 'an Admin' : 'a User'
        const message = `Access denied. You selected ${roleLabel} but this account is ${actualRoleLabel}.`
        toast.error(message)
        return { success: false, message, roleError: true }
      }

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)

      toast.success('Welcome back!')
      navigate(userData.role === 'admin' ? '/admin' : '/user')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  async function register(data) {
    try {
      const res = await authAPI.register({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone
      })

      const { token, user: userData } = res.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)

      toast.success('Registration successful!')
      navigate('/user')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  async function logout() {
    try {
      await authAPI.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      toast.success('Logged out successfully')
      navigate('/login')
    }
  }

  async function updateProfile(data) {
    try {
      const res = await userAPI.updateProfile(data)
      setUser(res.data.user)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      toast.success('Profile updated!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
