import React, { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Routes, Route, Link } from 'react-router-dom'
import { adminAPI } from '../services/api'
import RegistrationTable from '../components/RegistrationTable'
import DonationTable from '../components/DonationTable'
import toast from 'react-hot-toast'

function DashboardHome() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  async function fetchDashboard() {
    try {
      const res = await adminAPI.getDashboard()
      setDashboard(res.data.dashboard)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin h-10 w-10 text-teal-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-stone-800 mb-2">Admin Dashboard</h1>
        <p className="text-stone-500">Monitor registrations and donations at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">Total Registrations</p>
              <p className="text-3xl font-semibold text-stone-800">{dashboard?.users?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-sm text-stone-500">
              <span className="text-green-600 font-medium">+{dashboard?.users?.newToday || 0}</span> today
            </p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">Total Donations</p>
              <p className="text-3xl font-semibold text-stone-800">
                ₹{(dashboard?.donations?.totalAmountReceived || 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-sm text-stone-500">
              <span className="text-green-600 font-medium">₹{(dashboard?.donations?.today?.amount || 0).toLocaleString()}</span> today
            </p>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">Successful</p>
              <p className="text-3xl font-semibold text-green-600">{dashboard?.donations?.successful || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-stone-400 mt-4 pt-4 border-t border-stone-100">Completed donations</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-stone-500 mb-1">Pending</p>
              <p className="text-3xl font-semibold text-yellow-600">{dashboard?.donations?.pending || 0}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-stone-400 mt-4 pt-4 border-t border-stone-100">Awaiting confirmation</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-stone-800 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/registrations" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Manage Registrations
          </Link>
          <Link to="/admin/donations" className="btn-secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View Donation Reports
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="section-title mb-4">Recent Registrations</h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-stone-100">
              {dashboard?.recent?.registrations?.slice(0, 5).map(user => (
                <div key={user._id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-medium">
                    {user.firstName?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-stone-500 truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-stone-400">
                    {new Date(user.registrationDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="section-title mb-4">Recent Donations</h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-stone-100">
              {dashboard?.recent?.donations?.slice(0, 5).map(donation => (
                <div key={donation._id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800">₹{donation.amount?.toLocaleString()}</p>
                    <p className="text-sm text-stone-500 truncate">
                      {donation.userId?.firstName} {donation.userId?.lastName}
                    </p>
                  </div>
                  <span className="text-xs text-stone-400">
                    {donation.receiptNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <Routes>
      <Route element={<Layout role="admin" />}>
        <Route index element={<DashboardHome />} />
        <Route path="registrations" element={<RegistrationTable />} />
        <Route path="donations" element={<DonationTable />} />
      </Route>
    </Routes>
  )
}
