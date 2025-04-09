"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function ToastDemo() {
  const { toast } = useToast()

  return (
    <Button
      variant="outline"
      onClick={() => {
        toast({
          title: "Success",
          description: "Your action was completed successfully!",
        })
      }}
    >
      Show Toast
    </Button>
  )
}

export function ToastDestructiveDemo() {
  const { toast } = useToast()

  return (
    <Button
      variant="destructive"
      onClick={() => {
        toast({
          title: "Error",
          description: "Something went wrong! Please try again.",
        })
      }}
    >
      Show Error Toast
    </Button>
  )
}

export function ToastWithActionDemo() {
  const { toast } = useToast()

  return (
    <Button
      variant="default"
      onClick={() => {
        toast({
          title: "Action Required",
          description: "Please confirm your action.",
          action: (
            <Button
              variant="outline"
              className="h-8 px-4 text-xs"
              onClick={() => console.log("Action confirmed")}
            >
              Confirm
            </Button>
          ),
        })
      }}
    >
      Show Action Toast
    </Button>
  )
} 