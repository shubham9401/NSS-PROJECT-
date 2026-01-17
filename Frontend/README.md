# NGO Registration & Donation UI (Frontend-only)

This is a frontend-only mock UI built with React, Vite, Tailwind, and React Router. It uses in-memory mock data and Context API — no backend.

Quick scripts:

```bash
npm install
npm run dev
```

Structure highlights:
- `src/context/AuthContext.jsx` — mock auth and shared state (users, donations)
- `src/pages` — `LoginRegister`, `UserDashboard`, `AdminDashboard`
- `src/components` — layout, tables, donation history

Notes:
- Donation flow is UI-only and assigns a random status (Success/Pending/Failed).
- Export button is UI-only. No real auth or payments.
