import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useDebugStore } from './debugStore';
import { handleError } from '../lib/error-handling';
import type { Profile } from '../types/database';

interface AuthState {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    const { addLog } = useDebugStore.getState();
    addLog('Attempting sign in...', 'info');
    
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError || !authData.user) {
        addLog(`Sign in failed: ${signInError?.message || 'No user returned'}`, 'error');
        throw signInError || new Error('Sign in failed');
      }

      // Load the user profile after successful sign in
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        addLog(`Failed to load profile: ${profileError?.message || 'Profile not found'}`, 'error');
        // Sign out if we can't load the profile
        await supabase.auth.signOut();
        throw new Error('Failed to load user profile');
      }

      // Log the full profile data
      addLog('Loaded profile data:', 'debug', { data: profile });

      addLog(`Sign in successful: ${email}`, 'success');
      set({ user: profile });
    } catch (err) {
      const appError = handleError(err);
      addLog(`Sign in error: ${appError.message}`, 'error');
      throw appError;
    }
  },
  signUp: async (email: string, password: string) => {
    const { addLog } = useDebugStore.getState();
    addLog('Starting sign up process...', 'info');
    
    try {
      // First, check if a user with this email already exists
      addLog('Checking if user exists...', 'info');
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        const message = 'An account with this email already exists';
        addLog(message, 'error');
        throw new Error(message);
      }

      // Create the auth user
      addLog('Creating new user...', 'info');
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError || !authData.user) {
        addLog(`Sign up failed: ${signUpError?.message || 'No user created'}`, 'error');
        throw signUpError || new Error('Failed to create user');
      }

      // Create the profile
      addLog('Creating user profile...', 'info');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: email,
            is_admin: false,
          }
        ])
        .select()
        .single();

      if (profileError || !profile) {
        addLog(`Profile creation failed: ${profileError?.message || 'No profile returned'}`, 'error');
        // Clean up by signing out if profile creation fails
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile');
      }

      // Log the created profile data
      addLog('Created profile data:', 'debug', { data: profile });

      addLog(`Sign up successful: ${email}`, 'success');
      set({ user: profile });
    } catch (err) {
      const appError = handleError(err);
      addLog(`Sign up error: ${appError.message}`, 'error');
      throw appError;
    }
  },
  signOut: async () => {
    const { addLog } = useDebugStore.getState();
    addLog('Attempting sign out...', 'info');
    
    try {
      // First clear the local state
      set({ user: null });

      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        addLog(`Sign out failed: ${error.message}`, 'error');
        throw error;
      }

      addLog('Sign out successful', 'success');
    } catch (err) {
      const appError = handleError(err);
      addLog(`Sign out error: ${appError.message}`, 'error');
      throw appError;
    }
  },
  loadUser: async () => {
    const { addLog } = useDebugStore.getState();
    addLog('Loading user session...', 'info');
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog(`Session error: ${sessionError.message}`, 'error');
        set({ user: null, loading: false });
        return;
      }
      
      if (!session) {
        addLog('No active session found', 'info');
        set({ user: null, loading: false });
        return;
      }

      addLog(`Found session for user: ${session.user.email}`, 'info');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        addLog(`Profile load error: ${profileError.message}`, 'error');
        set({ user: null, loading: false });
        return;
      }
      
      if (!profile) {
        addLog('No profile found for user', 'error');
        set({ user: null, loading: false });
        return;
      }
      
      // Log the loaded profile data
      addLog('Loaded profile data:', 'debug', { data: profile });
      
      addLog(`User ${profile.email} loaded successfully`, 'success');
      set({ user: profile, loading: false });
    } catch (err) {
      const appError = handleError(err);
      addLog(`Load user error: ${appError.message}`, 'error');
      set({ user: null, loading: false });
    }
  },
}));