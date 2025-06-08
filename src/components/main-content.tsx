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
  
  // Check if we're on analytics pages
  const isAnalyticsPage = pathname?.startsWith("/analytics")
  
  return (
    <main 
      className={cn(
        "flex-1 overflow-x-hidden transition-all duration-300",
        isSidebarVisible ? 
          isCollapsed ? 
            isAnalyticsPage ? "pl-14" : "pl-16 lg:pl-22" :       
            isAnalyticsPage ? "pl-50" : "pl-64 lg:pl-58"
          : ""
      )}
    >
      {children}
    </main>
  )
}