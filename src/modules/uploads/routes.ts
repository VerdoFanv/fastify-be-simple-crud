import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { badRequest } from '@/lib/errors.js'
import { trackProcess, withPerformance } from '@/lib/response-meta.js'
import { uploadResponseSchema } from './schemas.js'
import { createUpload } from './service.js'

const uploadsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.post(
    '/uploads',
    {
      schema: {
        tags: ['Uploads'],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          201: uploadResponseSchema,
        },
      },
    },
    async (request, reply) => {
      trackProcess(request, 'uploads.create.authenticate')
      trackProcess(request, 'uploads.create.readMultipart')
      const file = await request.file()
      if (!file) {
        throw badRequest('File field is required')
      }

      const buffer = await file.toBuffer()
      trackProcess(request, 'uploads.create.putObject')
      trackProcess(request, 'uploads.create.persist')
      const upload = await createUpload(fastify.prisma, request.user.sub, {
        filename: file.filename,
        mimetype: file.mimetype,
        buffer,
      })

      trackProcess(request, 'uploads.create.respond')
      return reply.status(201).send(withPerformance(request, { upload }))
    },
  )
}

export default uploadsRoutes
