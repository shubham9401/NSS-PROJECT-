import React, { useState, useEffect } from 'react'
import { donationAPI } from '../services/api'
import toast from 'react-hot-toast'

const statusStyles = {
  success: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700'
}

export default function DonationHistory({ limit }) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchDonations()
  }, [page])

  async function fetchDonations() {
    try {
      setLoading(true)
      const res = await donationAPI.getMyDonations({
        page,
        limit: limit || 10,
        sortBy: 'donationDate',
        order: 'desc'
      })
      setDonations(res.data.donations || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch donations:', error)
      toast.error('Failed to load donations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="mt-2 text-neutral-500">Loading donations...</p>
      </div>
    )
  }

  if (donations.length === 0) {
    return (
      <div className="card p-8 text-center">
        <svg className="w-12 h-12 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-neutral-500">No donations yet</p>
        <p className="text-sm text-neutral-400 mt-1">Your donation history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!limit && <h2 className="section-title mb-4">Donation History</h2>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {donations.map(donation => (
                <tr key={donation._id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-neutral-600">
                    {new Date(donation.donationDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-neutral-800">
                    ₹{donation.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[donation.status]}`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-500">
                    {donation.receiptNumber || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!limit && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-neutral-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
