import bcrypt from 'bcryptjs'
import type { PrismaClient, User } from '@/generated/prisma/client.js'
import { conflict, notFound } from '@/lib/errors.js'
import { toPublicUser, type PublicUser } from '@/modules/auth/service.js'

const SALT_ROUNDS = 10

export async function listUsers(
  prisma: PrismaClient,
  page: number,
  limit: number,
): Promise<{ data: PublicUser[]; total: number }> {
  const skip = (page - 1) * limit
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ])

  return { data: users.map(toPublicUser), total }
}

export async function getUser(prisma: PrismaClient, id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    throw notFound('User not found')
  }
  return toPublicUser(user)
}

export async function createUser(
  prisma: PrismaClient,
  input: { email: string; password: string; name?: string },
): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw conflict('Email already registered')
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      name: input.name,
    },
  })
  return toPublicUser(user)
}

export async function updateUser(
  prisma: PrismaClient,
  id: string,
  input: { email?: string; password?: string; name?: string | null },
): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    throw notFound('User not found')
  }

  if (input.email && input.email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email: input.email } })
    if (emailTaken) {
      throw conflict('Email already registered')
    }
  }

  const data: {
    email?: string
    name?: string | null
    passwordHash?: string
  } = {}

  if (input.email !== undefined) data.email = input.email
  if (input.name !== undefined) data.name = input.name
  if (input.password !== undefined) {
    data.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)
  }

  const user: User = await prisma.user.update({ where: { id }, data })
  return toPublicUser(user)
}

export async function deleteUser(prisma: PrismaClient, id: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    throw notFound('User not found')
  }
  await prisma.user.delete({ where: { id } })
}
