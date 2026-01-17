import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginRegister() {
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'user' })

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    login(form)
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
          <h1 className="text-3xl font-semibold text-stone-800">Welcome Back</h1>
          <p className="text-stone-500 mt-2">Sign in to continue making a difference</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
              <input 
                name="name" 
                onChange={handleChange} 
                value={form.name} 
                placeholder="Enter your full name" 
                className="input" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email Address</label>
              <input 
                name="email" 
                type="email"
                onChange={handleChange} 
                value={form.email} 
                placeholder="you@example.com" 
                className="input" 
              />
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
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">I am a...</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.role === 'user' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="role" value="user" checked={form.role==='user'} onChange={handleChange} className="sr-only" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Donor</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.role === 'admin' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="role" value="admin" checked={form.role==='admin'} onChange={handleChange} className="sr-only" />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium">Admin</span>
                </label>
              </div>
            </div>
            
            <button type="submit" className="btn-primary w-full py-3 text-base">
              Continue
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-stone-100 text-center">
            <p className="text-sm text-stone-400">
              Demo mode — no real authentication
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
