"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { showToast } from "@/lib/utils/toast"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        showToast.error(error.message || "Failed to sign in")
        return
      }

      if (data.user) {
        const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (roleError) {
        showToast.error("Failed to login")
        return
      }

      if (userData.role !== "admin") {
        showToast.error("Access denied, you are not an admin")
        return
      }

      showToast.success("Logged in successfully")
      router.push("/dashboards")
      }
    } catch (error: any) {
      showToast.error(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center">
      <Card className="w-[400px] shadow-md">
        <CardHeader className="flex flex-col items-center space-y-1">
          <div className="mb-4 mt-2">
            <Image
              src="/logo.png"
              alt="HRPulse Logo"
              width={80}
              height={80}
              className="rounded-md"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-center">HRPulse Admin Portal</CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 