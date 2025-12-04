import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { DataProvider } from './contexts/DataContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Eager load only critical components
import LoginPage from './pages/LoginPage'

// Lazy load admin components
const DashboardLayout = lazy(() => import('./components/dashboard/Layout/DashboardLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ContentManagement = lazy(() => import('./pages/admin/ContentManagement'))
const UserTreeView = lazy(() => import('./pages/admin/UserTreeView'))
const CustomerOverview = lazy(() => import('./pages/admin/CustomerOverview'))
const AdManagement = lazy(() => import('./components/dashboard/AdManagement'))
const MeetingManagement = lazy(() => import('./pages/admin/MeetingManagement'))
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'))

// Lazy load user components
const UserLayout = lazy(() => import('./components/user/UserLayout'))
const UserProfile = lazy(() => import('./pages/user/Profile'))
const TeamStructure = lazy(() => import('./pages/user/TeamStructure'))
const Earnings = lazy(() => import('./pages/user/Earnings'))
const Overview = lazy(() => import('./pages/user/Overview'))
const Photos = lazy(() => import('./pages/user/Photos'))
const Meetings = lazy(() => import('./pages/user/Meetings'))
const Videos = lazy(() => import('./pages/user/Videos'))
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

            {/* Admin routes - protected, requires admin role */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="customers" element={<CustomerOverview />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="ads" element={<AdManagement />} />
              <Route path="meetings" element={<MeetingManagement />} />
              <Route path="tree" element={<UserTreeView />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route index element={<Navigate to="dashboard" />} />
            </Route>

            {/* User routes - protected, requires customer role */}
            <Route path="/user" element={
              <ProtectedRoute requiredRole="customer">
                <UserLayout />
              </ProtectedRoute>
            }>
              <Route path="home" element={<Overview />} />
              <Route path="photos" element={<Photos />} />
              <Route path="videos" element={<Videos />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="tree-profile" element={<TreeProfile />} />
              <Route path="team-structure" element={<TeamStructure />} />
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