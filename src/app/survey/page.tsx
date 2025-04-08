"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

interface SurveyResponse {
  id: string
  employeeName: string
  surveyType: string
  submissionDate: string
  sentiment: "Positive" | "Neutral" | "Negative"
  response: string
  category: string
}

const columns: ColumnDef<SurveyResponse>[] = [
  {
    accessorKey: "employeeName",
    header: "Employee Name",
  },
  {
    accessorKey: "surveyType",
    header: "Survey Type",
  },
  {
    accessorKey: "submissionDate",
    header: "Submission Date",
  },
  {
    accessorKey: "sentiment",
    header: "Sentiment",
    cell: ({ row }) => {
      const sentiment = row.getValue("sentiment") as string
      return (
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            sentiment === "Positive"
              ? "bg-green-100 text-green-800"
              : sentiment === "Neutral"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {sentiment}
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "response",
    header: "Response",
    cell: ({ row }) => {
      const response = row.getValue("response") as string
      return (
        <div className="max-w-[500px] truncate" title={response}>
          {response}
        </div>
      )
    },
  },
]

const data: SurveyResponse[] = [
  {
    id: "1",
    employeeName: "John Doe",
    surveyType: "Quarterly Pulse",
    submissionDate: "2024-04-01",
    sentiment: "Positive",
    response: "Great work environment and supportive team members. The new project management tools have improved our workflow significantly.",
    category: "Work Environment",
  },
  {
    id: "2",
    employeeName: "Jane Smith",
    surveyType: "Workload Assessment",
    submissionDate: "2024-04-02",
    sentiment: "Neutral",
    response: "Current workload is manageable but could use better task prioritization guidelines.",
    category: "Workload",
  },
  {
    id: "3",
    employeeName: "Mike Johnson",
    surveyType: "Team Collaboration",
    submissionDate: "2024-04-03",
    sentiment: "Positive",
    response: "Team meetings are productive and everyone's input is valued. Good communication channels in place.",
    category: "Team Dynamics",
  },
  {
    id: "4",
    employeeName: "Sarah Wilson",
    surveyType: "Career Development",
    submissionDate: "2024-04-04",
    sentiment: "Negative",
    response: "Would like more opportunities for skill development and career advancement within the company.",
    category: "Career Growth",
  },
]

export default function SurveysPage() {
  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Surveys & Feedback</h1>
          {/* <p className="text-muted-foreground">
            Monitor and analyze employee feedback and survey responses
          </p> */}
        </div>
        <div className="flex space-x-4">
          <Button className="cursor-pointer">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create Survey
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  )
} 