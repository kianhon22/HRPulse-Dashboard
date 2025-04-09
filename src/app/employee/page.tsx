"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"

interface Employee {
  name: string
  email: string
  phone: string
  work_mode: string
  employment_type: string
  department: string
  join_company_date: string
  is_active: boolean
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
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "employment_type",
    header: "Employment",
  },
  {
    accessorKey: "work_mode",
    header: "Mode",
  },
  {
    accessorKey: "department",
    header: "Department",
  },
  // {
  //   accessorKey: "join_company_date",
  //   header: "Joining Date",
  //   cell: ({ row }) => {
  //     const date = row.getValue("join_company_date") as string
  //     return date ? format(new Date(date), "MMM dd, yyyy") : "-"
  //   },
  // },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const is_active = row.getValue("is_active")
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
  },
]

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq('role', 'employee')
          .order('created_at', { ascending: false })

        if (error) throw error

        // Transform data if needed (e.g., if fields have different names)
        // const transformedData = data.map((employee: any) => ({
        //   name: employee.name || employee.full_name || employee.username || "Unknown",
        //   email: employee.email || `${employee.name?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        //   department: employee.department || "General",
        //   position: employee.position || employee.title || "Staff",
        //   join_company_date: employee.join_company_date || employee.created_at || new Date().toISOString(),
        // }))
        
        setData(data)
      } catch (error) {
        console.error("Error fetching employees:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchEmployees()
  }, [])

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
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={data} 
        showYearFilter={false}
      />
    </div>
  )
} 