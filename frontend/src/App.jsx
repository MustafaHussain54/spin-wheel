import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import VisitorRegistration from './pages/VisitorRegistration';
import SpinWheel from './pages/SpinWheel';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import VisitorManagement from './pages/admin/VisitorManagement';
import PrizeManagement from './pages/admin/PrizeManagement';
import ExpoSettings from './pages/admin/ExpoSettings';

// Protected Route Wrapper for Admin Panel
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('expo_admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <AdminLayout>{children}</AdminLayout>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Visitor Kiosk Flows */}
        <Route path="/" element={<VisitorRegistration />} />
        <Route path="/spin" element={<SpinWheel />} />

        {/* Admin Authentication */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Console Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/visitors"
          element={
            <ProtectedAdminRoute>
              <VisitorManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/prizes"
          element={
            <ProtectedAdminRoute>
              <PrizeManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedAdminRoute>
              <ExpoSettings />
            </ProtectedAdminRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
