"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, ThumbsUp, ShieldCheck, ShieldX, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
        <Badge className={getStatusColor(status)}>
          {getStatusIcon(status)}
          {status}
        </Badge>
      )
    }
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Approved': return 'bg-green-100 text-green-800 border-green-200'
    case 'Rejected': return 'bg-red-100 text-red-800 border-red-200'
    case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Approved': return <ShieldCheck className="mr-1 h-3 w-3" />
    case 'Rejected': return <ShieldX className="mr-1 h-3 w-3" />
    case 'Pending': return <ThumbsUp className="mr-1 h-3 w-3" />
    default: return null
  }
}

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