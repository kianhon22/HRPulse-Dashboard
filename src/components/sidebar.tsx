"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
  // {
  //   title: "SurveyRespomse",
  //   href: "/survey_response",
  //   icon: MessageSquare,
  // },
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
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div 
      className={cn(
        "group fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-[#6A1B9A] transition-all duration-300",
        isCollapsed ? "w-14" : "w-54"
      )}
      onMouseEnter={() => isCollapsed && setIsCollapsed(false)}
      onMouseLeave={() => isCollapsed && setIsCollapsed(true)}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center space-x-2">
          {/* <Image
            src="/logo.png"
            alt="HRPulse Logo"
            width={32}
            height={32}
            className="rounded-full"
          /> */}
          <span className={cn("font-bold text-white transition-all text-lg ml-5 duration-300", 
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            HRPulse
          </span>
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white hover:text-gray-200"
        >
          <Menu className={cn("h-6 w-6", isCollapsed ? "-ml-6" : "")}/>
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-1 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-[#6A1B9A]"
                  : "text-white hover:bg-white hover:text-[#6A1B9A]"
              )}
            >
              <item.icon className="-ml-0.5 h-5 w-5 flex-shrink-0" />
              <span className={cn("transition-all duration-300", 
                isCollapsed ? "opacity-0 w-0" : "opacity-100"
              )}>
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}