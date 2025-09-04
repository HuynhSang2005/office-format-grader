import { create } from 'zustand';
import type { User } from '@/types';

/**
 * Interface for the authentication state.
 */
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

/**
 * Interface for the actions that can be performed on the auth state.
 */
interface AuthActions {
  setUser: (user: User) => void;
  clearUser: () => void;
  logout: () => void;
}

/**
 * Zustand store for managing authentication state globally across the application.
 * This store holds the current user's information and their authentication status.
 */
export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
