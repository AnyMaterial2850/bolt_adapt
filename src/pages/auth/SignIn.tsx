import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LogIn, Wifi, WifiOff } from 'lucide-react';

export function SignIn() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isOnline) {
      setError('You are offline. Please check your internet connection and try again.');
      setIsLoading(false);
      return;
    }

    try {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        throw new Error('Email is required');
      }
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Password validation
      if (!password) {
        throw new Error('Password is required');
      }

      await signIn(email, password);
      navigate('/');
    } catch (err) {
      console.error('Signin error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to Adapt Health
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back! Please sign in to continue
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Offline</span>
              </>
            )}
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!error}
                disabled={!isOnline}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!error}
                disabled={!isOnline}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </a>
            </div>
            <div className="text-sm">
              <a
                href="/sign-up"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Create account
              </a>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
            disabled={!isOnline}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}