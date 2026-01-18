import React, { useState, useEffect } from 'react'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function RegistrationTable() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ isActive: '', startDate: '', endDate: '' })

  useEffect(() => {
    fetchUsers()
  }, [page, filters])

  async function fetchUsers() {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(filters.isActive && { isActive: filters.isActive }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      }
      const res = await adminAPI.getRegistrations(params)
      setUsers(res.data.registrations || [])
      setTotalPages(res.data.totalPages || 1)
      setTotal(res.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  async function handleExport() {
    try {
      toast.loading('Generating export...')
      const res = await adminAPI.exportRegistrations(filters)

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `registrations_${Date.now()}.csv`)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Registrations</h1>
          <p className="text-stone-500">{total} registered users</p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <select
            value={filters.isActive}
            onChange={(e) => setFilters(f => ({ ...f, isActive: e.target.value }))}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
            className="input w-auto"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
            className="input w-auto"
            placeholder="To"
          />
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

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
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Location</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Registered</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map(user => (
                  <tr key={user._id} className="hover:bg-stone-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-sm font-medium">
                          {user.firstName?.charAt(0)}
                        </div>
                        <span className="font-medium text-stone-800">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-stone-600">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-stone-600">{user.phone || '-'}</td>
                    <td className="py-3 px-4 text-sm text-stone-600">
                      {user.address?.city ? `${user.address.city}, ${user.address.state}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-stone-600">
                      {new Date(user.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
