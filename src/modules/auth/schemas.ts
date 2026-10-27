import { z } from 'zod'
import { withPerformanceSchema } from '@/lib/response-meta.js'

export const userPublicSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const registerBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
})

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const authResponseSchema = withPerformanceSchema({
  user: userPublicSchema,
  token: z.string(),
})

export const meResponseSchema = withPerformanceSchema({
  user: userPublicSchema,
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
