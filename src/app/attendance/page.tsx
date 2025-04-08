"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

interface AttendanceRecord {
  id: string
  employeeName: string
  date: string
  checkIn: string
  checkOut: string
  status: "Present" | "Absent" | "Late" | "Half Day"
  location: string
}

const columns: ColumnDef<AttendanceRecord>[] = [
  {
    accessorKey: "employeeName",
    header: "Employee Name",
  },
  {
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "checkIn",
    header: "Check In",
  },
  {
    accessorKey: "checkOut",
    header: "Check Out",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            status === "Present"
              ? "bg-green-100 text-green-800"
              : status === "Absent"
              ? "bg-red-100 text-red-800"
              : status === "Late"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {status}
        </div>
      )
    },
  },
  {
    accessorKey: "location",
    header: "Location",
  },
]

const data: AttendanceRecord[] = [
  {
    id: "1",
    employeeName: "John Doe",
    date: "2024-04-08",
    checkIn: "09:00 AM",
    checkOut: "05:00 PM",
    status: "Present",
    location: "Office",
  },
  {
    id: "2",
    employeeName: "Jane Smith",
    date: "2024-04-08",
    checkIn: "09:15 AM",
    checkOut: "05:00 PM",
    status: "Late",
    location: "Office",
  },
  {
    id: "3",
    employeeName: "Mike Johnson",
    date: "2024-04-08",
    checkIn: "-",
    checkOut: "-",
    status: "Absent",
    location: "-",
  },
  {
    id: "4",
    employeeName: "Sarah Wilson",
    date: "2024-04-08",
    checkIn: "09:00 AM",
    checkOut: "01:00 PM",
    status: "Half Day",
    location: "Remote",
  },
]

export default function AttendancePage() {
  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          {/* <p className="text-muted-foreground">
            Track and manage employee attendance records
          </p> */}
        </div>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Add Record
        </Button>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  )
} 