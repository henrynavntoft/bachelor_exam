"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative inline-flex h-9 w-16 items-center justify-center border transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Toggle theme"
        >
            <span className="sr-only">Toggle theme</span>
            <span
                className={`
          absolute left-1 flex h-7 w-7 items-center justify-center bg-brand transition-transform duration-300 ease-in-out
          ${theme === "dark" ? "translate-x-7" : "translate-x-0"}
        `}
            >
                {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                ) : (
                    <Sun className="h-4 w-4" />
                )}
            </span>
            <span className="absolute right-2 text-xs font-medium">
                {theme === "dark" ? "" : ""}
            </span>
            <span className="absolute left-2 text-xs font-medium">
                {theme === "dark" ? "" : ""}
            </span>
        </button>
    )
} 