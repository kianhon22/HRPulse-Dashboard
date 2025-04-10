"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SingleDatePicker } from "@/components/ui/date-picker"
import { format } from "date-fns" // already used in date-picker.tsx

type Employee = {
  name: string
  email: string
  phone: string
  address: string
  work_mode: string
  employment_type: string
  position: string
  department: string
  join_company_date: string | null
  password: string
}

export default function CreateEmployeePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<Employee>({
    name: "",
    email: "",
    phone: "",
    address: "",
    work_mode: "",
    employment_type: "",
    position: "",
    department: "",
    join_company_date: null,
    password: "",
  })
  const [joiningDate, setJoiningDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setJoiningDate(date)
    setFormData(prev => ({
      ...prev,
      join_company_date: date ? format(date, "yyyy-MM-dd") : null,
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
    if (!formData.password.trim()) {
      showToast.error("Password is required")
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
      // Step 1: Create auth user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) {
        showToast.error("Failed to create user authentication: " + authError.message)
        setIsSubmitting(false)
        return
      }

      // Ensure we have a user ID from the auth system
      if (!authData.user || !authData.user.id) {
        console.log('ok')
        showToast.error("Failed to obtain user ID from authentication")
        setIsSubmitting(false)
        return
      }

      const userId = authData.user.id

      // Step 2: Create employee record in the users table with the auth ID
      const { data, error } = await supabase
        .from('users')
        .update({
          id: userId, // Use the auth user ID
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          work_mode: formData.work_mode,
          employment_type: formData.employment_type,
          position: formData.position,
          department: formData.department,
          join_company_date: formData.join_company_date,
        })
        .eq("id", userId)
        .select()
        .single()

      if (error) {
        // If there was an error creating the user profile, we should clean up the auth user
        await supabase.auth.admin.deleteUser(userId)
        showToast.error("Failed to create employee profile: " + error.message)
        setIsSubmitting(false)
        return
      }

      showToast.success("Employee created successfully")
      router.push(`/employees/${userId}`)
    } catch (error: any) {
      console.error("Error creating employee:", error)
      showToast.error("An unexpected error occurred: " + (error.message || error))
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
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter password"
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
                <Label htmlFor="work_mode">Work Mode *</Label>
                <Select
                  value={formData.work_mode}
                  onValueChange={(value) => handleSelectChange("work_mode", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Work Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Onsite">Onsite</SelectItem>
                    <SelectItem value="Remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employment_type">Employment Type *</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={(value) => handleSelectChange("employment_type", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Employment Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Time">Full Time</SelectItem>
                    <SelectItem value="Part Time">Part Time</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Joining Date</Label><br />
                <SingleDatePicker
                  date={joiningDate}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => router.push('/employees')}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Employee
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 