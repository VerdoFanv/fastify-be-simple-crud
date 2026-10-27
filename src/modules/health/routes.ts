import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { trackProcess, withPerformance, withPerformanceSchema } from '@/lib/response-meta.js'

const healthResponseSchema = withPerformanceSchema({
  status: z.literal('ok'),
})

const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        response: {
          200: healthResponseSchema,
        },
      },
    },
    async (request) => {
      trackProcess(request, 'health.check')
      trackProcess(request, 'health.respond')
      return withPerformance(request, { status: 'ok' as const })
    },
  )
}

export default healthRoutes
