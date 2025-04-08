"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Calendar,
  MessageSquare,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react"

const overviewCards = [
  {
    title: "Total Employees",
    value: "150",
    icon: Users,
    description: "Active employees",
  },
  {
    title: "Attendance Rate",
    value: "95%",
    icon: Calendar,
    description: "Last 30 days",
  },
  {
    title: "Survey Response",
    value: "85%",
    icon: MessageSquare,
    description: "Last quarter",
  },
  {
    title: "Rewards Given",
    value: "45",
    icon: Award,
    description: "This month",
  },
  {
    title: "Productivity",
    value: "92%",
    icon: TrendingUp,
    description: "Team average",
  },
  {
    title: "Leave Requests",
    value: "12",
    icon: Clock,
    description: "Pending approval",
  },
]

export default function DashboardPage() {
  return (
    <div className="py-8 pr-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        {/* <p className="text-muted-foreground">
          Welcome to your HR management dashboard
        </p> */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card) => (
          <Card key={card.title} style={{"--border": "black"} as React.CSSProperties}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-8 w-8 text-[#6A1B9A]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add charts and other components here */}
    </div>
  )
} 