// Common types used throughout the application

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
}

export interface Service {
  id: string
  title: string
  description: string
  icon?: string
  features: string[]
}
