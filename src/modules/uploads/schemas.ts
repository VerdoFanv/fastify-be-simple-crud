import { z } from 'zod'
import { withPerformanceSchema } from '@/lib/response-meta.js'

export const uploadSchema = z.object({
  id: z.string(),
  userId: z.string(),
  key: z.string(),
  bucket: z.string(),
  contentType: z.string(),
  size: z.number().int(),
  url: z.string(),
  createdAt: z.coerce.date(),
})

export const uploadResponseSchema = withPerformanceSchema({
  upload: uploadSchema,
})
