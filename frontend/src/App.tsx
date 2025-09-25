import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/dashboard/Layout/DashboardLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ContentManagement from './pages/admin/ContentManagement'
import { ThemeProvider } from './contexts/ThemeContext'
import { DataProvider } from './contexts/DataContext'

function App() {
  useEffect(() => {
    document.title = 'BigTeam CRM - Community Platform'
  }, [])

  return (
    <ThemeProvider>
      <DataProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route index element={<Navigate to="dashboard" />} />
          </Route>
          <Route path="/" element={<Navigate to="/admin/dashboard" />} />
        </Routes>
      </DataProvider>
    </ThemeProvider>
  )
}

export default App