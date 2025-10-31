import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/dashboard/Layout/DashboardLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ContentManagement from './pages/admin/ContentManagement'
import AdManagement from './components/dashboard/AdManagement'
import UserLayout from './components/user/UserLayout'
import UserDashboard from './pages/user/Dashboard'
import UserProfile from './pages/user/Profile'
import UserFeed from './pages/user/Feed'
import MLMTree from './pages/user/MLMTree'
import Earnings from './pages/user/Earnings'
import Overview from './pages/user/Overview'
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
            <Route path="ads" element={<AdManagement />} />
            <Route index element={<Navigate to="dashboard" />} />
          </Route>

          {/* User routes with sidebar (hidden on mobile, visible on desktop) */}
          <Route path="/user" element={<UserLayout />}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="feed" element={<Overview />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="mlm-tree" element={<MLMTree />} />
            <Route path="earnings" element={<Earnings />} />
            <Route index element={<Navigate to="feed" />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </DataProvider>
    </ThemeProvider>
  )
}

export default App