"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Download, Eye, PencilLine } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

// Define the type for our data
type Employee = {
  id: string
  name: string
  email: string
  phone: string
  work_mode: string
  employment_type: string
  department: string
  position: string
  join_company_date: string
  is_active: boolean
}

export default function EmployeesPage() {
  const router = useRouter()
  const [data, setData] = useState<Employee[]>([])
  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(true)

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
      accessorKey: "work_mode",
      header: "Mode",
    },
    {
      accessorKey: "employment_type",
      header: "Employment",
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
      accessorKey: "join_company_date",
      header: "Joining Date",
      cell: ({ row }) => {
        const date = row.getValue("join_company_date") as string
        return date ? format(new Date(date), "MMM dd, yyyy") : "-"
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("is_active")
        return (
          <div className={`capitalize font-medium ${
            status ? "text-green-600" : "text-red-600"
          }`}>
            {status ? "Active" : "Inactive"}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const employee = row.original
        
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/employees/${employee.id}`)
              }}
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/employees/${employee.id}/edit`)
              }}
              className="h-8 w-8"
            >
              <PencilLine className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // Define filterable columns
  const filterableColumns = [
    {
      id: "is_active",
      title: "Status",
      options: [
        { label: "Active", value: 'true' },
        { label: "Inactive", value: 'false' },
      ],
    },
    {
      id: "department",
      title: "Departments",
      options: departmentOptions
    },
  ]

  const fetchEmployees = async () => {
    setLoading(true)
    
    try {
      const { data: employeesData, error } = await supabase
        .from("users")
        .select("*")
        .eq('role', 'employee')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching employees:', error)
        return
      }
      
      setData(employeesData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('department')
      .eq('role', 'employee')
  
    if (error) {
      console.error("Failed to fetch departments:", error)
      return
    }
  
    // Extract unique departments
    const uniqueDepartments = Array.from(new Set(data.map(emp => emp.department).filter(Boolean)))
  
    const formatted = uniqueDepartments.map(dep => ({
      label: dep,
      value: dep,
    }))
  
    setDepartmentOptions(formatted)
  }

  useEffect(() => {
    fetchEmployees()
    fetchDepartments()
  }, [])

  const handleRowClick = (employee: Employee) => {
    router.push(`/employees/${employee.id}`)
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Employees</h1>
        <Button onClick={() => router.push('/employees/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>
      <DataTable 
        columns={columns} 
        data={data} 
        filterableColumns={filterableColumns}
        onRowClick={handleRowClick}
      />
    </div>
  )
} 
{/* <div className="flex space-x-4">
<Button>
  <Download className="mr-2 h-4 w-4" />
  Export
</Button>
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Employee
</Button>
</div> */}