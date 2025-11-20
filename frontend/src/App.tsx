import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { DataProvider } from './contexts/DataContext'

// Eager load only critical components
import LoginPage from './pages/LoginPage'

// Lazy load admin components
const DashboardLayout = lazy(() => import('./components/dashboard/Layout/DashboardLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ContentManagement = lazy(() => import('./pages/admin/ContentManagement'))
const UserTreeView = lazy(() => import('./pages/admin/UserTreeView'))
const CustomerOverview = lazy(() => import('./pages/admin/CustomerOverview'))
const AdManagement = lazy(() => import('./components/dashboard/AdManagement'))

// Lazy load user components
const UserLayout = lazy(() => import('./components/user/UserLayout'))
const UserProfile = lazy(() => import('./pages/user/Profile'))
const MLMTree = lazy(() => import('./pages/user/MLMTree'))
const Earnings = lazy(() => import('./pages/user/Earnings'))
const Overview = lazy(() => import('./pages/user/Overview'))
const Videos = lazy(() => import('./pages/user/Videos'))
const Photos = lazy(() => import('./pages/user/Photos'))
const Meetings = lazy(() => import('./pages/user/Meetings'))
const TreeProfile = lazy(() => import('./pages/user/TreeProfile'))

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-light-100 dark:bg-gradient-dark">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-orange"></div>
  </div>
)

function App() {
  useEffect(() => {
    document.title = 'BigTeam CRM - Community Platform'
  }, [])

  return (
    <ThemeProvider>
      <DataProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/admin" element={<DashboardLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<CustomerOverview />} />
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
        </Suspense>
      </DataProvider>
    </ThemeProvider>
  )
}

export default App