import { toast } from "@/components/ui/use-toast"
import { ToastActionElement } from "@/components/ui/toast"
import * as React from "react"

export const showToast = {
  success: (message: string, title = "Success") => {
    toast({
      title,
      description: message,
    })
  },
  error: (message: string, title = "Error") => {
    toast({
      title,
      description: message,
      variant: "destructive",
    })
  },
  info: (message: string, title = "Information") => {
    toast({
      title,
      description: message,
    })
  },
  warning: (message: string, title = "Warning") => {
    toast({
      title,
      description: message,
    })
  },
  custom: (params: { 
    title?: string; 
    description?: string; 
    action?: ToastActionElement 
  }) => {
    toast(params)
  }
} 