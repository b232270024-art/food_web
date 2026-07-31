import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import './index.css'

const isDashboard = window.location.pathname === '/dashboard' || window.location.pathname.startsWith('/dashboard/')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isDashboard ? <AdminApp /> : <App />}
  </React.StrictMode>,
)
