import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { Layout } from './components/layout/Layout'
import { AdminLayout } from './components/layout/AdminLayout'
import { AdminRoute } from './components/layout/AdminRoute'

// User pages
import Login from './pages/Login'
import Register from './pages/Register'
import Schedule from './pages/Schedule'
import Bookings from './pages/Bookings'
import Results from './pages/Results'
import Feed from './pages/Feed'
import PRs from './pages/PRs'
import Profile from './pages/Profile'
import Plans from './pages/Plans'
import Leaderboard from './pages/Leaderboard'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminClasses from './pages/admin/Classes'
import AdminSchedules from './pages/admin/Schedules'
import AdminRoutines from './pages/admin/Routines'
import AdminPlans from './pages/admin/Plans'
import AdminPayments from './pages/admin/Payments'
import AdminDiscountCodes from './pages/admin/DiscountCodes'
import AdminInstructors from './pages/admin/Instructors'
import AdminChallenges from './pages/admin/Challenges'
import Challenges from './pages/Challenges'

// Public
import TVDisplay from './pages/TVDisplay'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/tv" element={<TVDisplay />} />

      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/" element={<Navigate to="/schedule" replace />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/results" element={<Results />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/prs" element={<PRs />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/leaderboard/:scheduleId?" element={<Leaderboard />} />
        <Route path="/challenges" element={<Challenges />} />
      </Route>

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="classes" element={<AdminClasses />} />
        <Route path="schedules" element={<AdminSchedules />} />
        <Route path="routines" element={<AdminRoutines />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="discount-codes" element={<AdminDiscountCodes />} />
        <Route path="challenges" element={<AdminChallenges />} />
        <Route path="instructors" element={<AdminInstructors />} />
      </Route>

      <Route path="*" element={<Navigate to="/schedule" replace />} />
    </Routes>
  )
}
