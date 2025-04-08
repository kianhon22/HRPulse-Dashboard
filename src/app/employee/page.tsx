"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
  joinDate: string
  status: "Active" | "Inactive"
}

const columns: ColumnDef<Employee>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  {
    accessorKey: "position",
    header: "Position",
  },
  {
    accessorKey: "joinDate",
    header: "Join Date",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      )
    },
  },
]

// Temporary data - replace with Supabase fetch
const data: Employee[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    department: "Engineering",
    position: "Software Engineer",
    joinDate: "2023-01-15",
    status: "Active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    department: "Marketing",
    position: "Marketing Manager",
    joinDate: "2023-02-01",
    status: "Active",
  },
  // Add more sample data as needed
]

export default function EmployeesPage() {
  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          {/* <p className="text-muted-foreground">
            Manage and view all employee information
          </p> */}
        </div>
        <div className="flex space-x-4">
          <Button className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  )
} 