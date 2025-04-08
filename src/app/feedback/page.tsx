"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3 } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

interface Feedback {
  id: string
  employeeName: string
  category: string
  submissionDate: string
  status: "Open" | "In Progress" | "Resolved"
  priority: "Low" | "Medium" | "High"
  description: string
}

const columns: ColumnDef<Feedback>[] = [
  {
    accessorKey: "employeeName",
    header: "Employee Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "submissionDate",
    header: "Submission Date",
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            priority === "High"
              ? "bg-red-100 text-red-800"
              : priority === "Medium"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {priority}
        </span>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "Resolved"
              ? "bg-green-100 text-green-800"
              : status === "In Progress"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
]

// Temporary data - replace with Supabase fetch
const data: Feedback[] = [
  {
    id: "1",
    employeeName: "John Doe",
    category: "Work Environment",
    submissionDate: "2024-03-10",
    status: "Open",
    priority: "Medium",
    description: "Need better lighting in the office space",
  },
  {
    id: "2",
    employeeName: "Jane Smith",
    category: "Process Improvement",
    submissionDate: "2024-03-08",
    status: "In Progress",
    priority: "High",
    description: "Suggestion for improving project workflow",
  },
  // Add more sample data as needed
]

export default function FeedbackPage() {
  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Feedback Management</h1>
          {/* <p className="text-muted-foreground">
            Track and manage employee feedback and suggestions
          </p> */}
        </div>
        <div className="flex space-x-4">
          <Button className="cursor-pointer">
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </Button>
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Submit Feedback
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  )
} 