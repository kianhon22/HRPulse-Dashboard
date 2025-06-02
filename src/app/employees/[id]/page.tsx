"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, parseISO } from "date-fns"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { titleCase } from "@/lib/utils/formatText"
import { ArrowLeft, PencilLine, Mail, Phone, Briefcase, Building, Calendar, User, MonitorCog, Contact, CalendarDays } from "lucide-react"

type Employee = {
  id: string
  name: string
  email: string
  join_company_date: Date
  left_company_date: Date
  work_mode: string
  employment_type: string
  position: string
  department: string
  phone: string | null
  is_active: boolean
  image_url: string | null
  leave: number | null
}

type LeaveInfo = {
  total: number
  remaining: number
}

export default function EmployeeDetailPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [leaveInfo, setLeaveInfo] = useState<LeaveInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const employeeId = useParams()?.id as string

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      setLoading(true)
      try {
        // Fetch employee details with manager information
        const { data, error } = await supabase
          .from('users')
          .select(`
            *
          `)
          .eq('id', employeeId)
          .single()
        
        if (error) {
          showToast.error("Error loading employee details")
          console.error('Error fetching employee:', error)
          return
        }

        setEmployee(data)

        // Fetch leave information
        await fetchLeaveInfo(employeeId, data.leave || 0)
      } catch (error) {
        showToast.error("An unexpected error occurred")
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployeeDetails()
  }, [employeeId])

  const fetchLeaveInfo = async (userId: string, totalLeave: number) => {
    try {
      // Get the current year
      const currentYear = new Date().getFullYear()
      const startDate = `${currentYear}-01-01`
      const endDate = `${currentYear}-12-31`

      // Fetch approved leaves for the current year
      const { data, error } = await supabase
        .from('leaves')
        .select('period')
        .eq('user_id', userId)
        .eq('status', 'Approved')
        .gte('start_date', startDate)
        .lte('end_date', endDate)
      
      if (error) {
        console.error('Error fetching leave information:', error)
        return
      }

      // Calculate used leave days
      const usedLeave = data.reduce((total, leave) => {
        return total + (leave.period || 0)
      }, 0)

      setLeaveInfo({
        remaining: totalLeave - usedLeave,
        total: totalLeave
      })
    } catch (error) {
      console.error('Error calculating leave information:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading Employee...</h1>
        </div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Employee Not Found</h1>
        </div>
        <p>The requested employee could not be found.</p>
      </div>
    )
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{employee.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/employees/${employee.id}/edit`)}
          >
            <PencilLine className="mr-2 h-4 w-4" />
            Edit Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Employee Information</CardTitle>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(employee.is_active ? 'Active' : 'Inactive')}`}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p>{employee.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p>{employee.phone || "Not provided"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Position</p>
                      <p>{titleCase(employee.position)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Department</p>
                      <p>{employee.department}</p>
                    </div>
                  </div>

                  {leaveInfo && (
                    <div className="flex items-center">
                      <CalendarDays className="h-5 w-5 text-gray-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Remaining Leave</p>
                        <p>{leaveInfo.remaining}/{leaveInfo.total} days</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Contact className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Employment</p>
                      <p>{employee.employment_type}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MonitorCog className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Mode</p>
                      <p>{employee.work_mode}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Joining Date</p>
                      <p>{employee.join_company_date ? format(parseISO(employee.join_company_date.toString()), "MMMM d, yyyy") : "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Leaving Date</p>
                      <p>{employee.left_company_date ? format(parseISO(employee.left_company_date.toString()), "MMMM d, yyyy") : "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 overflow-hidden">
                {employee.image_url ? (
                  <img 
                    src={employee.image_url} 
                    alt={employee.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <User className="h-16 w-16" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold">{employee.name}</h3>
              <p className="text-gray-500">{titleCase(employee.position)}</p>
              <p className="text-gray-500">{employee.department}</p>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/attendance?user=${employee.id}`)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    View Attendance
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => router.push(`/leave?user=${employee.id}`)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    View Leave History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 