const users = [
  { id: 1, name: 'Priya Sharma', email: 'priya@example.org', phone: '+91 98765 43210', role: 'user' },
  { id: 2, name: 'Rahul Verma', email: 'rahul@example.org', phone: '+91 87654 32109', role: 'user' },
  { id: 3, name: 'Admin', email: 'admin@ngo.org', phone: '+91 99999 00000', role: 'admin' }
]

const donations = [
  { id: 101, userId: 1, amount: 2500, status: 'Success', timestamp: new Date(Date.now()-86400000).toISOString() },
  { id: 102, userId: 2, amount: 1000, status: 'Pending', timestamp: new Date(Date.now()-3600000).toISOString() },
  { id: 103, userId: 1, amount: 5000, status: 'Success', timestamp: new Date(Date.now()-172800000).toISOString() }
]

export default { users, donations }
