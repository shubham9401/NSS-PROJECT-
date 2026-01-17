import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginRegister() {
  const { login, register } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    if (isLogin) {
      await login(form.email, form.password)
    } else {
      await register(form)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 to-teal-50 p-6">
      {/* Decorative background element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-100 rounded-full opacity-50"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-100 rounded-full opacity-30"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-semibold text-stone-800">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-stone-500 mt-2">
            {isLogin ? 'Sign in to continue making a difference' : 'Join us in making a difference'}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">First Name</label>
                    <input
                      name="firstName"
                      onChange={handleChange}
                      value={form.firstName}
                      placeholder="John"
                      className="input"
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Last Name</label>
                    <input
                      name="lastName"
                      onChange={handleChange}
                      value={form.lastName}
                      placeholder="Doe"
                      className="input"
                      required={!isLogin}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone Number</label>
                  <input
                    name="phone"
                    onChange={handleChange}
                    value={form.phone}
                    placeholder="+91 98765 43210"
                    className="input"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email Address</label>
              <input
                name="email"
                type="email"
                onChange={handleChange}
                value={form.email}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                onChange={handleChange}
                value={form.password}
                placeholder="••••••••"
                className="input"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-sm text-stone-600">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-2 text-teal-600 hover:text-teal-700 font-medium"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 flex items-center justify-center gap-6 text-stone-400 text-sm">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Trusted
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Non-profit
          </span>
        </div>
      </div>
    </div>
  )
}
