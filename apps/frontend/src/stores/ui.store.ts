/**
 * @file ui.store.ts
 * @description UI state management with localStorage persistence
 * @author Your Name
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { MantineColorScheme } from '@mantine/core'

interface UIState {
  theme: MantineColorScheme
  locale: string
  sidebar: {
    mobileOpened: boolean
    desktopOpened: boolean
  }
  setTheme: (theme: MantineColorScheme) => void
  setLocale: (locale: string) => void
  toggleMobileSidebar: () => void
  toggleDesktopSidebar: () => void
  setSidebarState: (mobileOpened: boolean, desktopOpened: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      locale: 'vi',
      sidebar: {
        mobileOpened: false,
        desktopOpened: true,
      },
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      toggleMobileSidebar: () => set((state) => ({
        sidebar: {
          ...state.sidebar,
          mobileOpened: !state.sidebar.mobileOpened,
        }
      })),
      toggleDesktopSidebar: () => set((state) => ({
        sidebar: {
          ...state.sidebar,
          desktopOpened: !state.sidebar.desktopOpened,
        }
      })),
      setSidebarState: (mobileOpened, desktopOpened) => set((state) => ({
        sidebar: {
          ...state.sidebar,
          mobileOpened,
          desktopOpened,
        }
      })),
    }),
    {
      name: 'ui-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({
        theme: state.theme,
        locale: state.locale,
        sidebar: state.sidebar,
      }),
      storage: createJSONStorage(() => localStorage),
    }
  )
)