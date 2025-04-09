"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid"

type Employee = {
  name: string
  email: string
  position: string
  department: string
  hire_date: string | null
  phone: string | null
  status: "Active" | "Inactive" | "On Leave"
  address: string | null
  manager_id: string | null
  bio: string | null
  employee_id: string | null
}

type Manager = {
  id: string
  name: string
}

export default function CreateEmployeePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Employee>({
    name: "",
    email: "",
    position: "",
    department: "",
    hire_date: null,
    phone: null,
    status: "Active",
    address: null,
    manager_id: null,
    bio: null,
    employee_id: null
  })
  const [hireDate, setHireDate] = useState<Date | undefined>(undefined)
  const [managers, setManagers] = useState<Manager[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch managers for the dropdown
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name')
          .eq('status', 'Active')
          .order('name', { ascending: true })
        
        if (error) {
          console.error('Error fetching managers:', error)
          return
        }
        
        setManagers(data || [])
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchManagers()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setHireDate(date)
    setFormData(prev => ({
      ...prev,
      hire_date: date ? date.toISOString() : null
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast.error("Employee name is required")
      return false
    }
    if (!formData.email.trim()) {
      showToast.error("Email address is required")
      return false
    }
    if (!formData.position.trim()) {
      showToast.error("Position is required")
      return false
    }
    if (!formData.department.trim()) {
      showToast.error("Department is required")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)

    try {
      // Generate default employee ID if not provided
      const employeeId = formData.employee_id || `EMP-${Math.floor(100000 + Math.random() * 900000)}`
      
      // Create employee
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...formData,
          employee_id: employeeId,
          // Include default password hash for new user accounts
          password_hash: "default-password-hash" // This would be replaced with a proper hash in a real app
        })
        .select()
        .single()

      if (error) {
        showToast.error("Failed to create employee: " + error.message)
        setIsSubmitting(false)
        return
      }

      showToast.success("Employee created successfully")
      router.push(`/employees/${data.id}`)
    } catch (error) {
      console.error("Error creating employee:", error)
      showToast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-8 pr-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Add New Employee</h1>
      </div>

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  value={formData.employee_id || ""}
                  onChange={handleInputChange}
                  placeholder="Auto-generated if not provided"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address || ""}
                onChange={handleInputChange}
                placeholder="Enter address"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Enter position"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleSelectChange("department", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hire Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-1 justify-start text-left font-normal"
                    >
                      {hireDate ? format(hireDate, "PPP") : "Select hire date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={hireDate}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "Active" | "Inactive" | "On Leave") => handleSelectChange("status", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="manager_id">Manager</Label>
                <Select
                  value={formData.manager_id || ""}
                  onValueChange={(value) => handleSelectChange("manager_id", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio || ""}
                onChange={handleInputChange}
                placeholder="Enter employee bio or notes"
                className="mt-1"
                rows={4}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Employee"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 