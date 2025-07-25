"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Award,
  BarChart3,
  Users,
  Menu,
  Clock,
  Gift,
  Star,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboards",
    icon: LayoutDashboard,
  },
  {
    title: "Employee",
    href: "/employees",
    icon: Users,
  },
  {
    title: "Attendance",
    href: "/attendances",
    icon: Calendar,
  },
  {
    title: "Leave",
    href: "/leaves",
    icon: Clock,
  },
  {
    title: "Survey",
    href: "/surveys",
    icon: MessageSquare,
  },
  {
    title: "Reward",
    href: "/rewards",
    icon: Gift,
  },
  {
    title: "Recognition",
    href: "/recognitions",
    icon: Award,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
]

const analyticsChildren = [
  {
    title: "Engagement Score",
    href: "/analytics/engagement-score",
  },
  {
    title: "Survey Response",
    href: "/analytics/survey-response",
  },
  {
    title: "Attendance Rate",
    href: "/analytics/attendance-rate",
  },
  {
    title: "Recognition Rate",
    href: "/analytics/recognition-rate",
  },
]

export function Sidebar({
  isCollapsed,
  setIsCollapsed
}: {
  isCollapsed: boolean
  setIsCollapsed: (val: boolean) => void
}) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  
  // Determine if any analytics child is active
  const isAnalyticsActive = analyticsChildren.some(child => pathname.startsWith(child.href))
  
  // Hide sidebar on login page or when not authenticated
  if (pathname === "/login" || !isAuthenticated) {
    return null
  }

  return (
    <div 
      className={cn(
        "group fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-[#6A1B9A] transition-all duration-300",
        isCollapsed ? "w-16" : "w-53"
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className="flex h-16 items-center justify-center border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/white logo.png"
            alt="HRPulse Logo"
            width={isCollapsed ? 52 : 80}
            height={isCollapsed ? 52 : 80}
            className="rounded-full flex-shrink-0"
          />
        </Link>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          if (item.title === "Analytics") {
            return (
              <div key="analytics" className="relative" onMouseEnter={() => setAnalyticsOpen(true)} onMouseLeave={() => setAnalyticsOpen(false)}>
                <div
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-1 py-2 text-sm font-medium transition-colors cursor-pointer select-none",
                    isCollapsed ? "px-2" : "pl-2",
                    (analyticsOpen || isAnalyticsActive)
                      ? "bg-white text-[#6A1B9A]"
                      : "text-white hover:bg-white hover:text-[#6A1B9A]"
                  )}
                >
                  <item.icon className="-ml-0.5 h-5 w-5 flex-shrink-0" />
                  <span className={cn("transition-all duration-300", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>Analytics</span>
                  <span className="ml-auto">
                    {(analyticsOpen || isAnalyticsActive)
                      ? isCollapsed ? null : <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />}
                  </span>
                </div>
                
                {((analyticsOpen || isAnalyticsActive) && !isCollapsed) && (
                  <div className="ml-6 mt-1 space-y-1 bg-[#721ca7] rounded shadow-lg py-2">
                    {analyticsChildren.map(child => {
                      const isChildActive = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block px-3 py-1 rounded text-sm transition-colors",
                            isChildActive
                              ? "bg-white text-[#6A1B9A] font-semibold"
                              : "text-white hover:bg-white hover:text-[#6A1B9A]"
                          )}
                        >
                          {child.title}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg py-2 text-sm font-medium transition-colors",
                isCollapsed ? "px-2" : "pl-2",
                isActive
                  ? "bg-white text-[#6A1B9A]"
                  : "text-white hover:bg-white hover:text-[#6A1B9A]"
              )}
            >
              <item.icon className="-ml-0.5 h-5 w-5 flex-shrink-0" />
              <span className={cn("transition-all duration-300", isCollapsed ? "opacity-0 w-0" : "opacity-100")}>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}