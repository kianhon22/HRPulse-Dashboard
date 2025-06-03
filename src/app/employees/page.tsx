"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Download, Eye, PencilLine } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { exportToCSV } from "@/lib/utils/csv-export"
import { titleCase } from "@/lib/utils/formatText"

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
  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: any }[]>([])
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
      cell: ({ row }) => {
        return titleCase(row.getValue("position"))
      },
    },
    {
      accessorKey: "join_company_date",
      header: "Joining Date",
      cell: ({ row }) => {
        const date = row.getValue("join_company_date") as string
        return date ? format(new Date(date), "dd MMM yyyy") : "-"
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("is_active")
        return (
          <span className={`capitalize font-medium px-2 py-1 rounded-md text-sm ${
            status ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"
          }`}>
            {status ? "Active" : "Inactive"}
          </span>
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

  const fetchEmployees = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq('role', 'employee')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching employees:', error)
        return
      }
      
      setData(data || [])
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

  return (
    <div className="py-8 pr-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Employees</h1>
        <div className="flex space-x-4">
          <Button onClick={() => exportToCSV(columns, data, "employees")}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push("/employees/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>
      <DataTable
        showYearFilter = {false}
        columns={columns}
        data={data}
        filterableColumns={[
          {
            id: "is_active",
            title: "Status",
            width: "w-[85px]",
            options: [
              { label: "Active", value: true },
              { label: "Inactive", value: false },
            ],
          },
          {
            id: "work_mode",
            title: "Mode",
            width: "w-[80px]",
            options: ["Onsit", "Remote"].map(mode => ({
              label: mode,
              value: mode,
            })),
          },
          {
            id: "employment_type",
            title: "Employment",
            width: "w-[125px]",
            options: ["Full Time", "Part Time", "Internship"].map(mode => ({
              label: mode,
              value: mode,
            })),
          },
          {
            id: "department",
            title: "Department",
            width: "w-[120px]",
            options: departmentOptions.map(dept => ({
              label: dept.label,
              value: dept.value,
            })),
          },
        ]}
        onRowClick={(row) => router.push(`/employees/${row.id}`)}
      />
    </div>
  )
}