import React, { useState } from 'react'
import { donationAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function DonationModal({ open, onClose }) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [donation, setDonation] = useState(null)
  const [step, setStep] = useState('form') // form, processing, result

  const presetAmounts = [100, 500, 1000, 5000]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || amount < 1) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const res = await donationAPI.initiate({
        amount: Number(amount),
        paymentMethod,
        notes
      })

      setDonation(res.data.donation)
      setStep('processing')

      // For sandbox mode, simulate payment after 2 seconds
      setTimeout(async () => {
        try {
          // Randomly succeed or fail for demo purposes
          const status = Math.random() > 0.2 ? 'success' : 'failed'
          await donationAPI.simulatePayment(res.data.donation._id, status)
          setStep('result')
          setDonation(prev => ({ ...prev, status }))

          if (status === 'success') {
            toast.success('Donation successful! Thank you for your contribution.')
          } else {
            toast.error('Payment failed. Please try again.')
          }
        } catch (error) {
          console.error('Simulation error:', error)
          setStep('result')
          setDonation(prev => ({ ...prev, status: 'failed' }))
        }
      }, 2000)

    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate donation')
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('form')
    setAmount('')
    setNotes('')
    setDonation(null)
    setLoading(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose}></div>

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-stone-800">
              {step === 'form' && 'Make a Donation'}
              {step === 'processing' && 'Processing Payment'}
              {step === 'result' && (donation?.status === 'success' ? 'Thank You!' : 'Payment Failed')}
            </h2>
            <button onClick={handleClose} className="text-stone-400 hover:text-stone-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Select Amount</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {presetAmounts.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${amount == preset
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                    >
                      ₹{preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Or enter custom amount"
                  className="input"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['upi', 'card', 'netbanking', 'wallet'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium capitalize transition-colors ${paymentMethod === method
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Note (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add a message with your donation"
                  className="input resize-none"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !amount}
                className="btn-primary w-full py-3 disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Donate ₹${amount || '0'}`}
              </button>
            </form>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <svg className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-stone-600">Processing your donation...</p>
              <p className="text-sm text-stone-400 mt-2">Please wait while we confirm your payment</p>
            </div>
          )}

          {step === 'result' && (
            <div className="text-center py-8">
              {donation?.status === 'success' ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">Donation Successful!</h3>
                  <p className="text-stone-600">Your donation of ₹{donation?.amount} has been received.</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-stone-800 mb-2">Payment Failed</h3>
                  <p className="text-stone-600">Something went wrong. Please try again.</p>
                </>
              )}
              <button onClick={handleClose} className="btn-primary mt-6">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
