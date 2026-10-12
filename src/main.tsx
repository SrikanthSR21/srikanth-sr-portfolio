import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ContentProvider } from './context/ContentContext';

// The admin dashboard is a separate lazily-loaded chunk: visitors never download it.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  <ContentProvider>
    {isAdminRoute ? (
      <Suspense fallback={null}>
        <AdminPage />
      </Suspense>
    ) : (
      <App />
    )}
  </ContentProvider>
);
