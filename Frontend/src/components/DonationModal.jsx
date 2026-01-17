import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const presetAmounts = [500, 1000, 2500, 5000]

export default function DonationModal({ open, onClose }) {
  const { user, addDonation } = useAuth()
  const [amount, setAmount] = useState('')
  const [result, setResult] = useState(null)

  if (!open) return null

  function handleClose() {
    setAmount('')
    setResult(null)
    onClose()
  }

  async function submit(e) {
    e.preventDefault()
    if (!amount || isNaN(amount)) return
    const donation = addDonation({ userId: user.id, amount })
    setResult(donation)
  }

  const statusStyles = {
    Success: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500', text: 'text-green-700' },
    Pending: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-500', text: 'text-yellow-700' },
    Failed: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', text: 'text-red-700' }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={handleClose}></div>
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Make a Donation</h3>
                <p className="text-teal-100 text-sm">Every contribution matters</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!result ? (
            <form onSubmit={submit} className="space-y-5">
              {/* Preset amounts */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-3">Quick select</label>
                <div className="grid grid-cols-4 gap-2">
                  {presetAmounts.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset.toString())}
                      className={`py-2.5 rounded-lg border-2 font-medium transition-colors ${
                        amount === preset.toString()
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Or enter custom amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="input pl-8"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-accent flex-1" disabled={!amount}>
                  Donate ₹{amount || '0'}
                </button>
              </div>
            </form>
          ) : (
            /* Result display */
            <div className="text-center py-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${statusStyles[result.status].bg} mb-4`}>
                {result.status === 'Success' && (
                  <svg className={`w-8 h-8 ${statusStyles[result.status].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {result.status === 'Pending' && (
                  <svg className={`w-8 h-8 ${statusStyles[result.status].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {result.status === 'Failed' && (
                  <svg className={`w-8 h-8 ${statusStyles[result.status].icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              <h4 className={`text-lg font-semibold ${statusStyles[result.status].text} mb-1`}>
                {result.status === 'Success' && 'Thank You!'}
                {result.status === 'Pending' && 'Processing...'}
                {result.status === 'Failed' && 'Payment Failed'}
              </h4>
              
              <p className="text-stone-600 mb-4">
                {result.status === 'Success' && `Your donation of ₹${result.amount.toFixed(2)} has been received.`}
                {result.status === 'Pending' && `Your donation of ₹${result.amount.toFixed(2)} is being processed.`}
                {result.status === 'Failed' && 'There was an issue processing your donation. Please try again.'}
              </p>
              
              <p className="text-xs text-stone-400 mb-6">
                {new Date(result.timestamp).toLocaleString()}
              </p>
              
              <button onClick={handleClose} className="btn-primary">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
