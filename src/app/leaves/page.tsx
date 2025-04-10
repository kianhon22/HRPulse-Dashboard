"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { LeaveDetailDialog } from "@/components/leave/leave-detail-dialog"

// Define the type for our data
type Leave = {
  id: string
  user_id: string
  employee_name: string
  leave_type: string
  start_date: string
  end_date: string
  status: "Pending" | "Approved" | "Rejected"
  reason: string
  hr_remarks: string | null
  attachment_url: string | null
  created_at: string
  users: {
    name: string
  } | null
}

// Define the columns
const columns: ColumnDef<Leave>[] = [
  {
    accessorKey: "employee_name",
    header: "Employee",
  },
  {
    accessorKey: "leave_type",
    header: "Leave Type",
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
    cell: ({ row }) => {
      const date = row.getValue("start_date") as string
      return format(new Date(date), "MMM dd, yyyy")
    },
  },
  {
    accessorKey: "end_date",
    header: "End Date",
    cell: ({ row }) => {
      const date = row.getValue("end_date") as string
      return format(new Date(date), "MMM dd, yyyy")
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => {
      const reason = row.getValue("reason") as string | null
      return reason || "-"
    },
  },
  // {
  //   accessorKey: "hr_remarks",
  //   header: "HR Remarks",
  //   cell: ({ row }) => {
  //     const remarks = row.getValue("hr_remarks") as string | null
  //     return remarks || "-"
  //   },
  // },
  {
    accessorKey: "attachment_url",
    header: "Attachment",
    cell: ({ row }) => {
      const url = row.getValue("attachment_url") as string | null
      return url ? (
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          View
        </a>
      ) : "-"
    },
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
  const [data, setData] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [selectedLeave, setSelectedLeave] = useState<Leave | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchLeaves = async (year: string) => {
    setLoading(true)
    
    try {
      // Get the start and end of the selected year
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      // Fetch leaves for the selected year
      const { data: leavesData, error } = await supabase
        .from('leaves')
        .select(`
          id,
          user_id,
          start_date,
          end_date,
          leave_type,
          status,
          reason,
          hr_remarks,
          attachment_url,
          created_at,
          users:user_id (
            name
          )
        `)
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching leaves:', error)
        return
      }
      
      // Transform the data to include employee name
      const transformedData = leavesData.map((leave: any) => ({
        ...leave,
        employee_name: leave.users?.name || 'Unknown'
      }))
      
      setData(transformedData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaves(selectedYear)
  }, [selectedYear])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  const onRowClick = (leave: Leave) => {
    setSelectedLeave(leave)
    setDialogOpen(true)
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <div className="flex space-x-4">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        filterableColumns={filterableColumns}
        onYearChange={handleYearChange}
        onRowClick={onRowClick}
      />
      
      <LeaveDetailDialog
        leave={selectedLeave}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onLeaveUpdated={() => fetchLeaves(selectedYear)}
      />
    </div>
  )
} 