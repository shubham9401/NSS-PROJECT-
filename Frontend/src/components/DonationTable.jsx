import React from 'react'
import { useAuth } from '../context/AuthContext'

function Badge({ status }) {
  const styles = {
    Success: 'bg-green-50 text-green-700 border border-green-200',
    Pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    Failed: 'bg-red-50 text-red-700 border border-red-200'
  }
  const icons = {
    Success: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    Pending: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Failed: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-stone-100 text-stone-700'}`}>
      {icons[status]}
      {status}
    </span>
  )
}

export default function DonationTable({ limit }) {
  const { donations, users } = useAuth()
  let enriched = donations.map(d => ({ ...d, user: users.find(u => u.id === d.userId) }))
  if (limit) enriched = enriched.slice(0, limit)
  const total = donations.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header - only show on full page */}
      {!limit && (
        <div>
          <h1 className="text-3xl font-semibold text-stone-800 mb-2">Donation Management</h1>
          <p className="text-stone-500">Track and monitor all donations</p>
        </div>
      )}

      {/* Summary Card - only on full page */}
      {!limit && (
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-teal-600 to-teal-700 text-white border-0">
            <p className="text-teal-100 text-sm font-medium mb-1">Total Collected</p>
            <p className="text-3xl font-semibold">₹{total.toFixed(2)}</p>
          </div>
          <div className="card p-6">
            <p className="text-stone-500 text-sm font-medium mb-1">Total Transactions</p>
            <p className="text-3xl font-semibold text-stone-800">{donations.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-stone-500 text-sm font-medium mb-1">Success Rate</p>
            <p className="text-3xl font-semibold text-green-600">
              {donations.length ? Math.round((donations.filter(d => d.status === 'Success').length / donations.length) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Donor</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {enriched.map(d => (
                <tr key={d.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-medium text-sm">
                        {d.user?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-stone-800">{d.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-stone-400">{d.user?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-stone-800">₹{d.amount.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={d.status} />
                  </td>
                  <td className="px-6 py-4 text-stone-600">
                    {new Date(d.timestamp).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                </tr>
              ))}
              {enriched.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-stone-500 font-medium">No donations yet</p>
                      <p className="text-stone-400 text-sm mt-1">Donations will appear here</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
