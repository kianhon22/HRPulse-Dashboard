"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  
  // Determine if sidebar should be visible
  const isSidebarVisible = isAuthenticated && pathname !== "/login"
  
  return (
    <main 
      className={cn(
        "flex-1 overflow-x-hidden transition-all duration-300",
        isSidebarVisible ? "pl-16 lg:pl-58" : "" // Add padding when sidebar is visible
      )}
    >
      {children}
    </main>
  )
} 