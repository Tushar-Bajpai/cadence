import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(9, 'Password must be at least 9 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: passwordSchema,
  companyName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
})

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'The code must be exactly 6 digits')

// OTP-based reset: the user submits their email, the 6-digit code they
// received by email, and their new password.
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  otp: otpCodeSchema,
  password: passwordSchema,
})

// Admin-only staff creation (no customer row is created)
export const staffCreateSchema = signupSchema.pick({
  name: true,
  email: true,
  password: true,
})
