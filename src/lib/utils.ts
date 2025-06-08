import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Validation utility functions
export const validateQuestionText = (text: string): boolean => {
  if (!text.trim()) return false
  
  // Check if the text contains only numerical characters
  const numbersOnly = /^\d+$/.test(text.trim())
  if (numbersOnly) return false
  
  // Check if the text contains at least one alphabetic character
  const hasAlphabetic = /[a-zA-Z]/.test(text.trim())
  return hasAlphabetic
}

export const validateSurveyTitle = (title: string): boolean => {
  return title.trim().length > 0
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Remove spaces, dashes, parentheses for validation
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  return cleanPhone.length >= 10 && /^\d+$/.test(cleanPhone)
}

export const validateRequired = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.toString().trim().length > 0
}
