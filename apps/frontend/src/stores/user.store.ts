/**
 * @file user.store.ts
 * @description User Zustand store
 * @author Nguyễn Huỳnh Sang
 */

import { create } from 'zustand'
import type { User } from '../schemas/user.schema'

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))