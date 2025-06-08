"use client"

import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface MainContentProps {
  children: React.ReactNode,
  isCollapsed: boolean
}

export function MainContent({ children, isCollapsed }: MainContentProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  
  // Determine if sidebar should be visible
  const isSidebarVisible = isAuthenticated && pathname !== "/login"
  
  return (
    <main 
      className={cn(
        "flex-1 overflow-x-hidden transition-all duration-300",
        isSidebarVisible ? 
          isCollapsed ? 
            "pl-16 lg:pl-22" : "pl-64 lg:pl-58" 
          : ""
      )}
    >
      {children}
    </main>
  )
}