import React, { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'

const statusStyles = {
  success: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700'
}

export default function DonationTable({ limit }) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [aggregation, setAggregation] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  })

  useEffect(() => {
    fetchDonations()
  }, [page, filters])

  async function fetchDonations() {
    try {
      setLoading(true)
      const params = {
        page,
        limit: limit || 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount })
      }
      const res = await adminAPI.getDonations(params)
      setDonations(res.data.donations || [])
      setTotalPages(res.data.totalPages || 1)
      setTotal(res.data.total || 0)
      setAggregation(res.data.aggregation || [])
    } catch (error) {
      console.error('Failed to fetch donations:', error)
      toast.error('Failed to load donations')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      toast.loading('Generating export...')
      const res = await adminAPI.exportDonations(filters)

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `donations_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.dismiss()
      toast.success('Export downloaded!')
    } catch (error) {
      toast.dismiss()
      toast.error('Export failed')
    }
  }

  // Calculate totals from aggregation
  const totalSuccess = aggregation.find(a => a._id === 'success')?.totalAmount || 0
  const totalPending = aggregation.find(a => a._id === 'pending')?.totalAmount || 0

  return (
    <div className="space-y-6">
      {!limit && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-stone-800">Donations</h1>
              <p className="text-stone-500">{total} total donations</p>
            </div>
            <button onClick={handleExport} className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="card p-4 bg-green-50 border-green-200">
              <p className="text-sm text-green-600 font-medium">Total Received</p>
              <p className="text-2xl font-semibold text-green-700">₹{totalSuccess.toLocaleString()}</p>
            </div>
            <div className="card p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Pending</p>
              <p className="text-2xl font-semibold text-yellow-700">₹{totalPending.toLocaleString()}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.status}
                onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}
                className="input w-auto"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <input
                type="number"
                placeholder="Min Amount"
                value={filters.minAmount}
                onChange={(e) => { setFilters(f => ({ ...f, minAmount: e.target.value })); setPage(1); }}
                className="input w-32"
              />
              <input
                type="number"
                placeholder="Max Amount"
                value={filters.maxAmount}
                onChange={(e) => { setFilters(f => ({ ...f, maxAmount: e.target.value })); setPage(1); }}
                className="input w-32"
              />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1); }}
                className="input w-auto"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1); }}
                className="input w-auto"
              />
              <button
                onClick={() => { setFilters({ status: '', startDate: '', endDate: '', minAmount: '', maxAmount: '' }); setPage(1); }}
                className="btn-secondary"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <svg className="animate-spin h-8 w-8 text-teal-600 mx-auto" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Donor</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Method</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {donations.map(donation => (
                  <tr key={donation._id} className="hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-stone-800">
                          {donation.isAnonymous ? 'Anonymous' : `${donation.userId?.firstName || ''} ${donation.userId?.lastName || ''}`}
                        </p>
                        {!donation.isAnonymous && (
                          <p className="text-sm text-stone-500">{donation.userId?.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-stone-800">
                      ₹{donation.amount?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusStyles[donation.status]}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-stone-600 capitalize">
                      {donation.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-sm text-stone-600">
                      {new Date(donation.donationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-stone-500">
                      {donation.receiptNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!limit && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-stone-600">
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
