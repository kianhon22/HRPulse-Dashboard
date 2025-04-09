"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, ChevronsUpDown } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface Attendance {
  id: string
  user_id: string
  employee_name: string
  check_in: string
  check_out: string
  total_hours: number
  location: string
  users: {
    name: string
  } | null
}

// Define the columns
const columns: ColumnDef<Attendance>[] = [
  {
    accessorKey: "employee_name",
    header: "Employee Name"
  },
  {
    accessorKey: "check_in",
    header: "Check In",
    cell: ({ row }) => {
      const checkIn = row.getValue("check_in") as string
      return format(new Date(checkIn), "MMM dd, yyyy HH:mm")
    },
  },
  {
    accessorKey: "check_out",
    header: "Check Out",
    cell: ({ row }) => {
      const checkOut = row.getValue("check_out") as string | null
      if (!checkOut) return "Not checked out"
      return format(new Date(checkOut), "MMM dd, yyyy HH:mm")
    },
  },
  {
    accessorKey: "total_hours",
    header: "Total Hours",
    cell: ({ row }) => {
      const totalHours = row.getValue("total_hours") as number | null;
    
      if (!totalHours) return "N/A";
    
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
    
      return `${hours} hr${minutes > 0 ? ` ${minutes} min` : ''}`;
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      if (!row.getValue("location")) return "-";
    },
  },
]

export default function AttendancePage() {
  const [data, setData] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())

  const fetchAttendance = async (year: string) => {
    setLoading(true)
    try {
      const startDate = `${year}-01-01`
      const endDate = `${year}-12-31`
      
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          users (
            name
          )
        `)
        .gte('check_in', startDate)
        .lte('check_in', endDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedData = (data || []).map((item: any): Attendance => ({
        ...item,
        employee_name: item.users?.name || '-',
      }))

      setData(transformedData)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance(selectedYear)
  }, [selectedYear])

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Record Attendance
        </Button>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        onYearChange={handleYearChange}
      />
    </div>
  )
} 