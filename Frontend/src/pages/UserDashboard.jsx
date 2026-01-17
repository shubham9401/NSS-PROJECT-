import React, { useState } from 'react'
import Layout from '../components/Layout'
import { Routes, Route, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DonationHistory from '../components/DonationHistory'
import DonationModal from '../components/DonationModal'

function DashboardHome() {
  const { user, donations } = useAuth()
  const [open, setOpen] = useState(false)
  const myDonations = donations.filter(d => d.userId === user.id)
  const totalDonated = myDonations.reduce((sum, d) => sum + d.amount, 0)
  
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="card p-8 bg-gradient-to-r from-teal-600 to-teal-700 text-white border-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-teal-100 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="text-3xl font-semibold mb-2">{user.name}</h1>
            <p className="text-teal-100 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {user.phone || 'Not provided'}
              </span>
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-accent flex items-center gap-2 px-6 py-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Make a Donation
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-stone-500">Total Donated</p>
              <p className="text-2xl font-semibold text-stone-800">₹{totalDonated.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-stone-500">Successful</p>
              <p className="text-2xl font-semibold text-stone-800">{myDonations.filter(d => d.status === 'Success').length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-stone-500">Pending</p>
              <p className="text-2xl font-semibold text-stone-800">{myDonations.filter(d => d.status === 'Pending').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Message */}
      <div className="card p-6 bg-stone-100 border-stone-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-stone-800 mb-1">Your Impact Matters</h3>
            <p className="text-sm text-stone-600">Every donation helps us provide essential services to communities in need. Thank you for being part of our mission to create lasting change.</p>
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Donations</h2>
          <Link to="/user/donations" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
            View all →
          </Link>
        </div>
        <DonationHistory limit={5} />
      </div>

      <DonationModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

function ProfilePage() {
  const { user } = useAuth()
  return (
    <div className="max-w-2xl">
      <h1 className="section-title mb-6">Your Profile</h1>
      <div className="card p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center text-3xl font-semibold">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-stone-800">{user.name}</h2>
            <p className="text-stone-500">Donor since {new Date().getFullYear()}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">Email Address</label>
            <p className="text-stone-800">{user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-500 mb-1">Phone Number</label>
            <p className="text-stone-800">{user.phone || 'Not provided'}</p>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-stone-100">
          <p className="text-sm text-stone-400">Profile editing is disabled in demo mode.</p>
        </div>
      </div>
    </div>
  )
}

export default function UserDashboard() {
  return (
    <Routes>
      <Route element={<Layout role="user" />}>
        <Route index element={<DashboardHome />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="donations" element={<DonationHistory />} />
      </Route>
    </Routes>
  )
}
