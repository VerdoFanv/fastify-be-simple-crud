import type { Prisma, PrismaClient, Product } from '@/generated/prisma/client.js'
import { notFound } from '@/lib/errors.js'

export type ProductDto = Omit<Product, 'price'> & { price: string }

export function toProductDto(product: Product): ProductDto {
  return {
    ...product,
    price: product.price.toString(),
  }
}

export async function listProducts(
  prisma: PrismaClient,
  page: number,
  limit: number,
): Promise<{ data: ProductDto[]; total: number }> {
  const skip = (page - 1) * limit
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count(),
  ])

  return { data: products.map(toProductDto), total }
}

export async function getProduct(prisma: PrismaClient, id: string): Promise<ProductDto> {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    throw notFound('Product not found')
  }
  return toProductDto(product)
}

export async function createProduct(
  prisma: PrismaClient,
  userId: string,
  input: { name: string; description?: string; price: number; stock?: number },
): Promise<ProductDto> {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock ?? 0,
      userId,
    },
  })
  return toProductDto(product)
}

export async function updateProduct(
  prisma: PrismaClient,
  id: string,
  input: {
    name?: string
    description?: string | null
    price?: number
    stock?: number
  },
): Promise<ProductDto> {
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    throw notFound('Product not found')
  }

  const data: Prisma.ProductUpdateInput = {}
  if (input.name !== undefined) data.name = input.name
  if (input.description !== undefined) data.description = input.description
  if (input.price !== undefined) data.price = input.price
  if (input.stock !== undefined) data.stock = input.stock

  const product = await prisma.product.update({ where: { id }, data })
  return toProductDto(product)
}

export async function deleteProduct(prisma: PrismaClient, id: string): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    throw notFound('Product not found')
  }
  await prisma.product.delete({ where: { id } })
}
