import { z } from 'zod'
import { withPerformanceSchema } from '@/lib/response-meta.js'
import { userPublicSchema } from '@/modules/auth/schemas.js'

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const userIdParamsSchema = z.object({
  id: z.string().min(1),
})

export const createUserBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
})

export const updateUserBodySchema = z
  .object({
    email: z.email().optional(),
    password: z.string().min(8).max(128).optional(),
    name: z.string().min(1).max(120).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })

export const userListResponseSchema = withPerformanceSchema({
  data: z.array(userPublicSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
  }),
})

export const userResponseSchema = withPerformanceSchema({
  user: userPublicSchema,
})

export { userPublicSchema }
