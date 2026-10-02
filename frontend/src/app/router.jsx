import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout.jsx'
import HomePage from '../features/public-catalog/pages/HomePage.jsx'
import LoginPage from '../features/auth/pages/LoginPage.jsx'
import RegisterPage from '../features/auth/pages/RegisterPage.jsx'
import DashboardPage from '../features/auth/pages/DashboardPage.jsx'
import { GuestRoute, ProtectedRoute } from '../features/auth/components/RouteGuards.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

// Shared integration file: only the integration lead should edit this file.
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      {
        element: <GuestRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute roles={['ADMIN']} />,
        children: [{ path: '/admin', element: <DashboardPage role="ADMIN" /> }],
      },
      {
        element: <ProtectedRoute roles={['MENTOR']} />,
        children: [{ path: '/mentor', element: <DashboardPage role="MENTOR" /> }],
      },
      {
        element: <ProtectedRoute roles={['STUDENT']} />,
        children: [{ path: '/student', element: <DashboardPage role="STUDENT" /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

