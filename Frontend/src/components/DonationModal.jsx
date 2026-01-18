import React, { useState, useEffect } from 'react'
import { paymentAPI } from '../services/api'
import toast from 'react-hot-toast'

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function DonationModal({ open, onClose }) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [donation, setDonation] = useState(null)
  const [step, setStep] = useState('form') // form, processing, result

  const presetAmounts = [100, 500, 1000, 5000]

  useEffect(() => {
    // Load Razorpay SDK when modal opens
    if (open) {
      loadRazorpayScript()
    }
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!amount || amount < 1) {
      toast.error('Please enter a valid amount (minimum ₹1)')
      return
    }

    setLoading(true)
    setStep('processing')

    try {
      // Check if Razorpay is loaded
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        throw new Error('Failed to load payment gateway')
      }

      // Create order on backend
      const res = await paymentAPI.createOrder({
        amount: Number(amount),
        notes
      })

      const { razorpayOptions, donation: donationData } = res.data
      setDonation(donationData)

      // Open Razorpay checkout
      const razorpay = new window.Razorpay({
        ...razorpayOptions,
        handler: async function (response) {
          // Payment successful, verify on backend
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donationId: donationData._id
            })

            setDonation(verifyRes.data.donation)
            setStep('result')
            toast.success('Payment successful! Thank you for your donation.')
          } catch (error) {
            console.error('Verification failed:', error)
            setStep('result')
            setDonation(prev => ({ ...prev, status: 'failed' }))
            toast.error('Payment verification failed. Please contact support.')
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the payment modal
            console.log('Payment modal closed')
            setStep('form')
            setLoading(false)
            toast.error('Payment cancelled')
          }
        },
        theme: {
          color: '#0d9488' // Teal color matching the app
        }
      })

      razorpay.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error)
        setStep('result')
        setDonation(prev => ({ ...prev, status: 'failed' }))
        toast.error(response.error.description || 'Payment failed')
      })

      razorpay.open()
      setLoading(false)

    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Failed to initiate payment')
      setStep('form')
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
      <div className="absolute inset-0 bg-black/50" onClick={step !== 'processing' ? handleClose : undefined}></div>

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-stone-800">
              {step === 'form' && 'Make a Donation'}
              {step === 'processing' && 'Processing Payment'}
              {step === 'result' && (donation?.status === 'success' ? 'Thank You!' : 'Payment Failed')}
            </h2>
            {step !== 'processing' && (
              <button onClick={handleClose} className="text-stone-400 hover:text-stone-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
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
                className="btn-primary w-full py-3 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay ₹{amount || '0'} Securely
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-xs text-stone-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secured by Razorpay
                </span>
                <span>•</span>
                <span>PCI DSS Compliant</span>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <svg className="animate-spin h-12 w-12 text-teal-600 mx-auto mb-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-stone-600">Connecting to payment gateway...</p>
              <p className="text-sm text-stone-400 mt-2">Please complete the payment in the Razorpay window</p>
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
                  <p className="text-stone-600 mb-4">Your donation of ₹{donation?.amount} has been received.</p>
                  {donation?.receiptNumber && (
                    <p className="text-sm text-stone-500">
                      Receipt: <span className="font-mono">{donation.receiptNumber}</span>
                    </p>
                  )}
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
