import Fastify from 'fastify'
import type { FastifyError } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { AppError } from '@/lib/errors.js'
import { buildPerformance, trackProcess } from '@/lib/response-meta.js'
import authRoutes from '@/modules/auth/routes.js'
import healthRoutes from '@/modules/health/routes.js'
import productsRoutes from '@/modules/products/routes.js'
import uploadsRoutes from '@/modules/uploads/routes.js'
import usersRoutes from '@/modules/users/routes.js'
import jwtPlugin from '@/plugins/jwt.js'
import multipartPlugin from '@/plugins/multipart.js'
import prismaPlugin from '@/plugins/prisma.js'
import responseMetaPlugin from '@/plugins/response-meta.js'
import swaggerPlugin from '@/plugins/swagger.js'

function isFastifyError(error: unknown): error is FastifyError {
  return typeof error === 'object' && error !== null && 'statusCode' in error
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
  }).withTypeProvider<ZodTypeProvider>()

  await app.register(responseMetaPlugin)
  await app.register(swaggerPlugin)
  await app.register(prismaPlugin)
  await app.register(jwtPlugin)
  await app.register(multipartPlugin)

  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(usersRoutes)
  await app.register(productsRoutes)
  await app.register(uploadsRoutes)

  app.setErrorHandler((error, request, reply) => {
    trackProcess(request, 'error.handle')

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        message: error.message,
        performance: buildPerformance(request),
      })
    }

    if (isFastifyError(error) && error.validation) {
      return reply.status(400).send({
        message: 'Validation error',
        details: error.validation,
        performance: buildPerformance(request),
      })
    }

    app.log.error(error)

    if (isFastifyError(error) && error.statusCode) {
      return reply.status(error.statusCode).send({
        message: error.message,
        performance: buildPerformance(request),
      })
    }

    return reply.status(500).send({
      message: 'Internal Server Error',
      performance: buildPerformance(request),
    })
  })

  return app
}
