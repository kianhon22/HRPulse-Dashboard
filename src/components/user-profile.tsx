"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LogOut, User, Key } from "lucide-react"
import { showToast } from "@/lib/utils/toast"
import { useAuth } from "@/contexts/auth-context"

export function UserProfile() {
  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false)
  const [isLogoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const { user, isAuthenticated, signOut, changePassword } = useAuth()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
      showToast.success("Signed out successfully")
    } catch (error) {
      showToast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setLogoutConfirmOpen(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showToast.error("Passwords do not match")
      return
    }
    setIsLoading(true)
    try {
      await changePassword(newPassword)
      showToast.success("Password changed successfully")
      setPasswordModalOpen(false)
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      showToast.error("Failed to change password")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated || !user) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className="relative"
        onMouseEnter={() => setDropdownOpen(true)}
        onMouseLeave={() => setDropdownOpen(false)}
      >
        <button className="bg-white text-[#6A1B9A] rounded-full w-10 h-10 flex items-center justify-center focus:outline-none">
          <User className="w-6 h-6" />
        </button>
        {isDropdownOpen && (
          <div className="absolute left-0 bottom-full mb-0.5 w-45 bg-white text-black rounded-lg shadow-lg border border-gray-800 py-2">
            <div className="px-4 py-1 text-xs font-bold tracking-widest cursor-default select-text">
              {user.email}
            </div>
            <div
              className="px-4 py-1 text-sm text-black font-semibold hover:bg-[#6A1B9A] hover:text-white cursor-pointer transition"
              onClick={() => setPasswordModalOpen(true)}
            >
              <Key className="inline-block mr-2 w-4 h-4" />
              Change Password
            </div>
            <div
              className="px-4 py-1 text-sm font-semibold text-black hover:bg-[#6A1B9A] hover:text-white cursor-pointer flex items-center transition"
              onClick={() => setLogoutConfirmOpen(true)}
            >
              <LogOut className="inline-block mr-2 w-4 h-4" />
              Log Out
            </div>
          </div>
        )}
        {/* Password Modal */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 border-black border">
              <h2 className="text-lg font-bold mb-2 text-gray-900">Change Password</h2>
              <input
                type="password"
                placeholder="New password"
                className="w-full border rounded px-3 py-2 mb-2"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full border rounded px-3 py-2 mb-4"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPasswordModalOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleChangePassword} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Logout Confirm Modal */}
        {isLogoutConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 border-black border w-80">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Proceed to log out?</h2>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setLogoutConfirmOpen(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button onClick={handleSignOut} disabled={isLoading}>
                  {isLoading ? "Logging out..." : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 