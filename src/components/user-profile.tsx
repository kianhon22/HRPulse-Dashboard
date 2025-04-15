"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import { useAuth } from "@/contexts/auth-context"

export function UserProfile() {
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated, signOut } = useAuth()
  
  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      showToast.success("Signed out successfully")
    } catch (error) {
      showToast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) return null

  // Get user initials from email
  const userInitials = user.email.charAt(0).toUpperCase()

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center p-2 bg-white rounded-lg shadow-md">
        <div className="bg-[#6A1B9A] text-white rounded-full w-8 h-8 flex items-center justify-center">
          {userInitials}
        </div>
        {/* <div className="mr-2">
          <span className="text-sm font-medium">{user.email}</span>
        </div> */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-600 hover:text-white hover:bg-[#6A1B9A] ml-1" 
          onClick={handleSignOut}
          disabled={isLoading}
        >
          <LogOut className="h-6.5 w-6.5" />
        </Button>
      </div>
    </div>
  )
} 