import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
          ? 'bg-teal-50 text-teal-700'
          : 'text-stone-600 hover:text-stone-800 hover:bg-stone-100'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function Layout({ role }) {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={role === 'admin' ? '/admin' : '/user'} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-semibold text-stone-800">HopeHands</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {role === 'user' ? (
                <>
                  <NavItem to="/user">Dashboard</NavItem>
                  <NavItem to="/user/profile">Profile</NavItem>
                  <NavItem to="/user/donations">My Donations</NavItem>
                </>
              ) : (
                <>
                  <NavItem to="/admin">Dashboard</NavItem>
                  <NavItem to="/admin/registrations">Registrations</NavItem>
                  <NavItem to="/admin/donations">Donations</NavItem>
                </>
              )}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-medium">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-stone-600">{user?.firstName} {user?.lastName}</span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-auto">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-stone-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span>HopeHands Foundation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
