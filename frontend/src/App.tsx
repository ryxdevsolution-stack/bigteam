import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './components/dashboard/Layout/DashboardLayout'
import Dashboard from './pages/admin/Dashboard'
import UserManagement from './pages/admin/UserManagement'
import ContentManagement from './pages/admin/ContentManagement'
import UserTreeView from './pages/admin/UserTreeView'
import AdManagement from './components/dashboard/AdManagement'
import UserLayout from './components/user/UserLayout'
import UserProfile from './pages/user/Profile'
import MLMTree from './pages/user/MLMTree'
import Earnings from './pages/user/Earnings'
import Overview from './pages/user/Overview'
import Videos from './pages/user/Videos'
import Photos from './pages/user/Photos'
import Meetings from './pages/user/Meetings'
import TreeProfile from './pages/user/TreeProfile'
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
            <Route path="tree" element={<UserTreeView />} />
            <Route index element={<Navigate to="dashboard" />} />
          </Route>

          {/* User routes with sidebar (hidden on mobile, visible on desktop) */}
          <Route path="/user" element={<UserLayout />}>
            <Route path="home" element={<Overview />} />
            <Route path="videos" element={<Videos />} />
            <Route path="photos" element={<Photos />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="tree-profile" element={<TreeProfile />} />
            <Route path="mlm-tree" element={<MLMTree />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="profile" element={<UserProfile />} />
            <Route index element={<Navigate to="home" replace />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </DataProvider>
    </ThemeProvider>
  )
}

export default App