"use client"
import { ThemeProvider as NextThemes } from "next-themes"
import { type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemes
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
      forcedTheme={undefined}
      {...props}
    >
      {children}
    </NextThemes>
  )
}