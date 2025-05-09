import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { Home } from './pages/Home';
import { ManageHabits } from './pages/admin/ManageHabits';
import { AnalyticsConfig } from './pages/admin/AnalyticsConfig';
import { ListTables } from './pages/admin/ListTables';
import { HabitConfiguration } from './pages/habits/HabitConfiguration';
import { useAuthStore } from './stores/authStore';
import { useEffect, useState } from 'react';
import { checkSupabaseConnection } from './lib/supabase';
import { useDebugStore } from './stores/debugStore';
import { Layout } from './components/Layout';
import { HealthCheck } from './components/shared/HealthCheck';
import { ConnectionStatus } from './components/ConnectionStatus';
import { DebugPanel } from './components/DebugPanel';
import { DebugActivator } from './components/DebugActivator';
import { DebugButton } from './components/DebugButton';
import { ServiceWorkerDebugger } from './components/ServiceWorkerDebugger';
import Profile from './pages/Profile/Profile';
import { useReminderNotifications } from './hooks/useReminderNotifications';

function App() {
  const { loadUser, loading, user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [appVersion] = useState(import.meta.env.VITE_APP_VERSION || '0.1.0');
  const [buildTime] = useState(import.meta.env.VITE_BUILD_TIME || new Date().toISOString());

  useReminderNotifications();

  // useLocation must be used inside Router, so we need to move Router up
  return (
    <Router>
      <AppContent
        loadUser={loadUser}
        loading={loading}
        user={user}
        addLog={addLog}
        connectionError={connectionError}
        setConnectionError={setConnectionError}
        appVersion={appVersion}
        buildTime={buildTime}
      />
    </Router>
  );
}

// Extract the main logic to a child component that is always rendered inside Router
function AppContent({
  loadUser,
  loading,
  user,
  addLog,
  connectionError,
  setConnectionError,
  appVersion,
  buildTime,
}: {
  loadUser: any;
  loading: boolean;
  user: any;
  addLog: any;
  connectionError: string | null;
  setConnectionError: (err: string | null) => void;
  appVersion: string;
  buildTime: string;
}) {
  const location = useLocation();

  useEffect(() => {
    const init = async () => {
      try {
        addLog('Initializing application...', 'info', {
          component: 'App',
          data: {
            version: appVersion,
            buildTime,
            environment: import.meta.env.MODE
          }
        });

        const isConnected = await checkSupabaseConnection();
        if (!isConnected) {
          setConnectionError('Unable to connect to the database. Please check your internet connection and try again.');
          addLog('Failed to connect to Supabase', 'error');
          return;
        }

        addLog('Connected to Supabase', 'success');
        await loadUser();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setConnectionError(`Failed to initialize the application: ${errorMessage}`);
        addLog('Initialization error: ' + errorMessage, 'error');
      }
    };

    init();
  }, [loadUser, addLog, appVersion, buildTime, setConnectionError]);

  if (connectionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Connection Error</h2>
            <p className="text-sm">{connectionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
        <DebugActivator />
        <DebugPanel />
        <ServiceWorkerDebugger />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        <DebugActivator />
        <DebugPanel />
        <ServiceWorkerDebugger />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/sign-in"
          element={user ? <Navigate to="/" replace /> : <SignIn />}
        />
        <Route
          path="/sign-up"
          element={user ? <Navigate to="/" replace /> : <SignUp />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/sign-in" replace />}
        />
        <Route element={<Layout />}>
          <Route
            path="/"
            element={user ? <Home /> : <Navigate to="/sign-in" replace />}
          />
          <Route
            path="/habits"
            element={user ? <Home /> : <Navigate to="/sign-in" replace />}
          />
          <Route
            path="/habits/:habitId"
            element={user ? <HabitConfiguration /> : <Navigate to="/sign-in" replace />}
          />
        </Route>
        <Route
          path="/admin/habits"
          element={
            user?.is_admin ? (
              <ManageHabits />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/analytics"
          element={
            user?.is_admin ? (
              <AnalyticsConfig />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/tables"
          element={
            user?.is_admin ? (
              <ListTables />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
      <HealthCheck />
      {location.pathname !== '/sign-in' && location.pathname !== '/sign-up' && (
        <ConnectionStatus />
      )}
      <DebugActivator />
      <DebugPanel />
      <DebugButton />
      <ServiceWorkerDebugger />
      {/* Version info in production */}
      {import.meta.env.MODE === 'production' && (
        <div className="fixed bottom-1 right-1 text-[8px] text-gray-400 opacity-50 z-10">
          v{appVersion}
        </div>
      )}
    </>
  );
}

export default App
