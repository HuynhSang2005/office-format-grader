import React, { createContext, useContext } from 'react'

type Color = 'light' | 'dark'

type ContextType = {
  colorScheme: Color
  toggleColorScheme: (value?: Color) => void
}

const ColorSchemeContext = createContext<ContextType>({
  colorScheme: 'light',
  toggleColorScheme: () => {},
})

export const useAppColorScheme = () => useContext(ColorSchemeContext)

export function AppColorSchemeProvider({
  children,
  colorScheme,
  toggleColorScheme,
}: {
  children: React.ReactNode
  colorScheme: Color
  toggleColorScheme: (value?: Color) => void
}) {
  return (
    <ColorSchemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  )
}

export default AppColorSchemeProvider
