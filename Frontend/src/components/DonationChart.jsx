import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export function DonationLineChart({ donations = [] }) {
  // Process donations to get daily totals for last 7 days
  const last7Days = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    last7Days.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      amount: 0,
      count: 0
    })
  }

  // Aggregate donations by date
  donations.forEach(donation => {
    if (donation.status === 'success') {
      const donationDate = new Date(donation.donationDate).toISOString().split('T')[0]
      const dayData = last7Days.find(d => d.date === donationDate)
      if (dayData) {
        dayData.amount += donation.amount
        dayData.count += 1
      }
    }
  })

  const data = {
    labels: last7Days.map(d => d.label),
    datasets: [
      {
        label: 'Donations (₹)',
        data: last7Days.map(d => d.amount),
        borderColor: 'rgb(20, 184, 166)',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(20, 184, 166)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context) => `₹${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#78716c'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#78716c',
          callback: (value) => `₹${value.toLocaleString()}`
        }
      }
    }
  }

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  )
}

export function DonationBarChart({ donations = [] }) {
  // Process donations to get daily counts for last 7 days
  const last7Days = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    last7Days.push({
      date: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      success: 0,
      pending: 0,
      failed: 0
    })
  }

  // Aggregate donations by date and status
  donations.forEach(donation => {
    const donationDate = new Date(donation.donationDate).toISOString().split('T')[0]
    const dayData = last7Days.find(d => d.date === donationDate)
    if (dayData) {
      if (donation.status === 'success') dayData.success += 1
      else if (donation.status === 'pending') dayData.pending += 1
      else if (donation.status === 'failed') dayData.failed += 1
    }
  })

  const data = {
    labels: last7Days.map(d => d.label),
    datasets: [
      {
        label: 'Successful',
        data: last7Days.map(d => d.success),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderRadius: 4
      },
      {
        label: 'Pending',
        data: last7Days.map(d => d.pending),
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderRadius: 4
      },
      {
        label: 'Failed',
        data: last7Days.map(d => d.failed),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderRadius: 4
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#78716c'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#78716c',
          stepSize: 1
        }
      }
    }
  }

  return (
    <div className="h-64">
      <Bar data={data} options={options} />
    </div>
  )
}
