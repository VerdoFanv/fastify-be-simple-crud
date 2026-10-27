import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { trackProcess, withPerformance } from '@/lib/response-meta.js'
import {
  createProductBodySchema,
  paginationQuerySchema,
  productIdParamsSchema,
  productListResponseSchema,
  productResponseSchema,
  updateProductBodySchema,
} from './schemas.js'
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from './service.js'

const productsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate)

  fastify.get(
    '/products',
    {
      schema: {
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        querystring: paginationQuerySchema,
        response: {
          200: productListResponseSchema,
        },
      },
    },
    async (request) => {
      trackProcess(request, 'products.list.authenticate')
      const { page, limit } = request.query
      trackProcess(request, 'products.list.query')
      const result = await listProducts(fastify.prisma, page, limit)
      trackProcess(request, 'products.list.respond')
      return withPerformance(request, {
        data: result.data,
        meta: { page, limit, total: result.total },
      })
    },
  )

  fastify.get(
    '/products/:id',
    {
      schema: {
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        params: productIdParamsSchema,
        response: {
          200: productResponseSchema,
        },
      },
    },
    async (request) => {
      trackProcess(request, 'products.get.authenticate')
      trackProcess(request, 'products.get.query')
      const product = await getProduct(fastify.prisma, request.params.id)
      trackProcess(request, 'products.get.respond')
      return withPerformance(request, { product })
    },
  )

  fastify.post(
    '/products',
    {
      schema: {
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        body: createProductBodySchema,
        response: {
          201: productResponseSchema,
        },
      },
    },
    async (request, reply) => {
      trackProcess(request, 'products.create.authenticate')
      trackProcess(request, 'products.create.persist')
      const product = await createProduct(fastify.prisma, request.user.sub, request.body)
      trackProcess(request, 'products.create.respond')
      return reply.status(201).send(withPerformance(request, { product }))
    },
  )

  fastify.patch(
    '/products/:id',
    {
      schema: {
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        params: productIdParamsSchema,
        body: updateProductBodySchema,
        response: {
          200: productResponseSchema,
        },
      },
    },
    async (request) => {
      trackProcess(request, 'products.update.authenticate')
      trackProcess(request, 'products.update.persist')
      const product = await updateProduct(fastify.prisma, request.params.id, request.body)
      trackProcess(request, 'products.update.respond')
      return withPerformance(request, { product })
    },
  )

  fastify.delete(
    '/products/:id',
    {
      schema: {
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        params: productIdParamsSchema,
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      trackProcess(request, 'products.delete.authenticate')
      trackProcess(request, 'products.delete.persist')
      await deleteProduct(fastify.prisma, request.params.id)
      trackProcess(request, 'products.delete.respond')
      const { performance } = withPerformance(request, {})
      reply.header('x-response-duration-ms', String(performance.durationMs))
      reply.header('x-response-process', performance.process.join(','))
      return reply.status(204).send(null)
    },
  )
}

export default productsRoutes
