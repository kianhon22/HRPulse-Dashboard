"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

// Define the type for our data
type Leave = {
  id: string
  employee_name: string
  leave_type: string
  start_date: string
  end_date: string
  status: "Pending" | "Approved" | "Rejected"
  created_at: string
}

// Define the columns
const columns: ColumnDef<Leave>[] = [
  {
    accessorKey: "employee_name",
    header: "Employee Name",
  },
  {
    accessorKey: "leave_type",
    header: "Leave Type",
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
  },
  {
    accessorKey: "end_date",
    header: "End Date",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div className={`capitalize font-medium ${
          status === "Approved" ? "text-green-600" :
          status === "Rejected" ? "text-red-600" :
          "text-yellow-600"
        }`}>
          {status}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
  },
]

// Example data
const data: Leave[] = [
  {
    id: "1",
    employee_name: "John Doe",
    leave_type: "Annual Leave",
    start_date: "2024-04-10",
    end_date: "2024-04-15",
    status: "Pending",
    created_at: "2024-04-01T10:00:00Z",
  },
  {
    id: "2",
    employee_name: "Jane Smith",
    leave_type: "Sick Leave",
    start_date: "2024-04-12",
    end_date: "2024-04-12",
    status: "Approved",
    created_at: "2024-04-02T11:00:00Z",
  },
  {
    id: "3",
    employee_name: "Mike Johnson",
    leave_type: "Personal Leave",
    start_date: "2024-04-15",
    end_date: "2024-04-16",
    status: "Rejected",
    created_at: "2024-04-03T12:00:00Z",
  },
]

// Define filterable columns
const filterableColumns = [
  {
    id: "status",
    title: "Status",
    options: [
      { label: "Pending", value: "Pending" },
      { label: "Approved", value: "Approved" },
      { label: "Rejected", value: "Rejected" },
    ],
  },
]

export default function LeavePage() {
  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          New Leave Request
        </Button>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        filterableColumns={filterableColumns}
        defaultSort={{ id: "created_at", desc: true }}
      />
    </div>
  )
} 