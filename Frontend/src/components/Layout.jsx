import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
          ? 'bg-primary-50 text-primary-700 shadow-sm'
          : 'text-neutral-600 hover:text-primary-700 hover:bg-primary-50/50'
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={role === 'admin' ? '/admin' : '/user'} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-lg transition-shadow">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-xl font-display font-semibold text-gradient">HopeHands</span>
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
                <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 rounded-full flex items-center justify-center font-semibold shadow-sm">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-neutral-700 font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-neutral-500 hover:text-neutral-700 transition-all flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-neutral-100"
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
      <main className="container py-10 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-sm border-t border-neutral-100 mt-auto">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="font-medium text-neutral-600">HopeHands Foundation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
