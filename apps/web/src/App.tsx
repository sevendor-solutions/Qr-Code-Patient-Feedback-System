import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';
import { MobileFeedbackPage } from './pages/public/MobileFeedbackPage';
import { TrackStatusPage } from './pages/public/TrackStatusPage';
import { LoginPage } from './pages/admin/LoginPage';

// Lazy load admin pages to keep public mobile bundle lightweight on slow 3G!
const DashboardPage = lazy(() =>
  import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const QrGeneratorPage = lazy(() =>
  import('./pages/admin/QrGeneratorPage').then((m) => ({ default: m.QrGeneratorPage })),
);
const BulkQrPrintPage = lazy(() =>
  import('./pages/admin/BulkQrPrintPage').then((m) => ({ default: m.BulkQrPrintPage })),
);
const FeedbackListPage = lazy(() =>
  import('./pages/admin/FeedbackListPage').then((m) => ({ default: m.FeedbackListPage })),
);
const ComplaintsPage = lazy(() =>
  import('./pages/admin/ComplaintsPage').then((m) => ({ default: m.ComplaintsPage })),
);
const MastersPage = lazy(() =>
  import('./pages/admin/MastersPage').then((m) => ({ default: m.MastersPage })),
);
const ReportsPage = lazy(() =>
  import('./pages/admin/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 3, // 3 minutes
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div
                className="d-flex align-items-center justify-content-center"
                style={{ minHeight: '100vh' }}
              >
                <div className="spinner-border text-primary" role="status" />
              </div>
            }
          >
            <Routes>
              {/* Public Citizen / Patient QR Routes */}
              <Route path="/feedback" element={<MobileFeedbackPage />} />
              <Route path="/track" element={<TrackStatusPage />} />

              {/* Admin Login */}
              <Route path="/admin/login" element={<LoginPage />} />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="services/qr-generate" element={<QrGeneratorPage />} />
                <Route path="services/bulk-print" element={<BulkQrPrintPage />} />
                <Route path="services/feedback-list" element={<FeedbackListPage />} />
                <Route path="services/complaints" element={<Navigate to="/admin/services/feedback-list" replace />} />
                <Route path="setup" element={<MastersPage />} />
                <Route path="reports" element={<ReportsPage />} />
              </Route>

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
