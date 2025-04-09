import { toast } from "@/hooks/use-toast"

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
  custom: (params: { title?: string; description?: string; action?: React.ReactNode }) => {
    toast(params)
  }
} 