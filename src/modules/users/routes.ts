import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { trackProcess, withPerformance } from '@/lib/response-meta.js'
import {
  createUserBodySchema,
  paginationQuerySchema,
  updateUserBodySchema,
  userIdParamsSchema,
  userListResponseSchema,
  userResponseSchema,
} from './schemas.js'
import { createUser, deleteUser, getUser, listUsers, updateUser } from './service.js'

const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.get(
    '/users',
    {
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema,
        response: {
          200: userListResponseSchema,
        },
      },
    },
    async (request) => {
      trackProcess(request, 'users.list.authenticate')
      const { page, limit } = request.query
      trackProcess(request, 'users.list.query')
      const result = await listUsers(fastify.prisma, page, limit)
      trackProcess(request, 'users.list.respond')
      return withPerformance(request, {
        data: result.data,
        meta: { page, limit, total: result.total },
      })
    },
  )

  fastify.get(
    '/users/:id',
    {
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        params: userIdParamsSchema,
        response: {
          200: userResponseSchema,
        },
      },
    },
    async (request) => {
      trackProcess(request, 'users.get.authenticate')
      trackProcess(request, 'users.get.query')
      const user = await getUser(fastify.prisma, request.params.id)
      trackProcess(request, 'users.get.respond')
      return withPerformance(request, { user })
    },
  )

  fastify.post(
    '/users',
    {
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        body: createUserBodySchema,
        response: {
          201: userResponseSchema,
        },
      },
    },
    async (request, reply) => {
      trackProcess(request, 'users.create.authenticate')
      trackProcess(request, 'users.create.persist')
      const user = await createUser(fastify.prisma, request.body)
      trackProcess(request, 'users.create.respond')
      return reply.status(201).send(withPerformance(request, { user }))
    },
  )

  fastify.patch(
    '/users/:id',
    {
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        params: userIdParamsSchema,
        body: updateUserBodySchema,
        response: {
          200: userResponseSchema,
        },
      },
    },
    async (request) => {
      trackProcess(request, 'users.update.authenticate')
      trackProcess(request, 'users.update.persist')
      const user = await updateUser(fastify.prisma, request.params.id, request.body)
      trackProcess(request, 'users.update.respond')
      return withPerformance(request, { user })
    },
  )

  fastify.delete(
    '/users/:id',
    {
      schema: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        params: userIdParamsSchema,
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      trackProcess(request, 'users.delete.authenticate')
      trackProcess(request, 'users.delete.persist')
      await deleteUser(fastify.prisma, request.params.id)
      trackProcess(request, 'users.delete.respond')
      const { performance } = withPerformance(request, {})
      reply.header('x-response-duration-ms', String(performance.durationMs))
      reply.header('x-response-process', performance.process.join(','))
      return reply.status(204).send(null)
    },
  )
}

export default usersRoutes
