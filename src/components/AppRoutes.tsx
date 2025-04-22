import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import GanttChartPage from './components/Projects/GanttChartPage';
import { Dashboard } from './components/Dashboard';
import { AuthForm } from './components/AuthForm';
import { CheckIn } from './components/Projects/CheckIn';
import { supabase } from './lib/supabase';

// Auth protection wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = supabase.auth.getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<AuthForm />} />
        <Route
          path="/projects/:projectId/gantt/:ganttId"
          element={
            <ProtectedRoute>
              <GanttChartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/check-in"
          element={
            <ProtectedRoute>
              <CheckIn />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
