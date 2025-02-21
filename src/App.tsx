import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import Profile from './pages/Profile/Profile';

function App() {
  const { loadUser, loading, user } = useAuthStore();
  const { addLog } = useDebugStore();
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        addLog('Initializing application...', 'info');
        
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
  }, [loadUser, addLog]);

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
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <Router>
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
      <ConnectionStatus />
    </Router>
  );
}

export default App