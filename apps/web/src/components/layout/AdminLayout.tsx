import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AppHeader } from './AppHeader';
import { MainNav } from './MainNav';
import { SubMenuBar } from './SubMenuBar';
import { AppFooter } from './AppFooter';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#EEF2F7' }}>
      <AppHeader />
      <MainNav />
      <SubMenuBar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  );
};
