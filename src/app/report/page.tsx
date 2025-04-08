"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
} from "lucide-react"

const metrics = [
  {
    title: "Employee Engagement",
    value: "85%",
    description: "Overall engagement score",
    icon: TrendingUp,
    trend: "+5%",
    trendUp: true,
  },
  {
    title: "Attendance Rate",
    value: "92%",
    description: "Last 30 days",
    icon: Calendar,
    trend: "+2%",
    trendUp: true,
  },
  {
    title: "Survey Response",
    value: "78%",
    description: "Last quarter",
    icon: MessageSquare,
    trend: "-3%",
    trendUp: false,
  },
  {
    title: "Employee Retention",
    value: "95%",
    description: "Year to date",
    icon: Users,
    trend: "+1%",
    trendUp: true,
  },
]

export default function ReportsPage() {
  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          {/* <p className="text-muted-foreground">
            Comprehensive insights and analytics dashboard
          </p> */}
        </div>
        <Button className="cursor-pointer">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-[#6A1B9A]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-2">
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
                <span
                  className={`text-xs font-medium ${
                    metric.trendUp
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {metric.trend}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart placeholder - Attendance trends over time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart placeholder - Engagement metrics by department
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Survey Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart placeholder - Survey response analysis
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recognition & Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart placeholder - Recognition distribution
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 