"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { SingleDatePicker } from "@/components/ui/date-picker"

interface Employee {
  id: string
  name: string
  email: string
  join_company_date: Date | null
  left_company_date: Date | null
  work_mode: string
  employment_type: string
  position: string
  department: string
  phone: string | null
  is_active: boolean
  image_url: string | null
  leave: number | null
}

export default function EditEmployeePage() {
  const router = useRouter()
  const employeeId = useParams()?.id as string
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [joinDate, setJoinDate] = useState<Date | undefined>(undefined)
  const [leftDate, setLeftDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', employeeId)
          .single()
        
        if (error) {
          showToast.error("Error loading employee data")
          console.error('Error fetching employee:', error)
          return
        }

        setEmployee(data)
        if (data.join_company_date) {
          setJoinDate(new Date(data.join_company_date))
        }
        if (data.left_company_date) {
          setLeftDate(new Date(data.left_company_date))
        }
      } catch (error) {
        showToast.error("An unexpected error occurred")
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmployee()
  }, [employeeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      if (!employee) return

      const { error } = await supabase
        .from('users')
        .update({
          name: employee.name,
          email: employee.email,
          position: employee.position,
          department: employee.department,
          work_mode: employee.work_mode,
          employment_type: employee.employment_type,
          phone: employee.phone,
          is_active: employee.is_active,
          join_company_date: joinDate?.toISOString() || null,
          left_company_date: leftDate?.toISOString() || null,
          leave: employee.leave
        })
        .eq('id', employeeId)
      
      if (error) {
        showToast.error("Failed to update employee: " + error.message)
        console.error('Error updating employee:', error)
        return
      }

      showToast.success("Employee updated successfully")
      router.push(`/employees/${employeeId}`)
    } catch (error) {
      showToast.error("An unexpected error occurred")
      console.error('Error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEmployee(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [name]: value
      }
    })
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numValue = value === '' ? null : parseInt(value, 10)
    setEmployee(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [name]: numValue
      }
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setEmployee(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [name]: value
      }
    })
  }

  const handleStatusChange = (value: string) => {
    setEmployee(prev => {
      if (!prev) return prev
      return {
        ...prev,
        is_active: value === 'active'
      }
    })
  }

  if (loading) {
    return (
      <div className="py-8 pr-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Loading...</h1>
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
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Employee</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={employee.name || ''} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={employee.email || ''} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input 
                  id="position" 
                  name="position" 
                  value={employee.position || ''} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  name="department" 
                  value={employee.department || ''} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={employee.phone || ''} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="leave">Total Leave Days (Annual)</Label>
                <Input 
                  id="leave" 
                  name="leave" 
                  type="number"
                  min="0"
                  value={employee.leave || ''} 
                  onChange={handleNumberChange} 
                  placeholder="e.g., 15"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select 
                  value={employee.employment_type || ''} 
                  onValueChange={(value) => handleSelectChange('employment_type', value)}
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="work_mode">Work Mode</Label>
                <Select 
                  value={employee.work_mode || ''} 
                  onValueChange={(value) => handleSelectChange('work_mode', value)}
                >
                  <SelectTrigger id="work_mode">
                    <SelectValue placeholder="Select work mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={employee.is_active ? 'active' : 'inactive'} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-2">
                <Label>Join Date</Label>
                <SingleDatePicker 
                  // date={joinDate} 
                  // onDateChange={setJoinDate} 
                  // placeholder="Select join date"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Left Date</Label>
                <SingleDatePicker 
                  // date={leftDate} 
                  // onDateChange={setLeftDate}
                  // placeholder="Select left date (if applicable)"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => router.push(`/employees/${employeeId}`)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
} 