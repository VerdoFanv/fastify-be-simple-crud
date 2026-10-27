import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const DEMO_PASSWORD = 'Password123!'

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Admin User',
      passwordHash,
    },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash,
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      name: 'Demo User',
      passwordHash,
    },
    create: {
      email: 'user@example.com',
      name: 'Demo User',
      passwordHash,
    },
  })

  await prisma.product.deleteMany({
    where: {
      userId: { in: [admin.id, user.id] },
    },
  })

  await prisma.product.createMany({
    data: [
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 29.99,
        stock: 50,
        userId: admin.id,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard',
        price: 89.5,
        stock: 20,
        userId: admin.id,
      },
      {
        name: 'USB-C Hub',
        description: '7-in-1 USB-C hub',
        price: 45.0,
        stock: 35,
        userId: user.id,
      },
      {
        name: 'Laptop Stand',
        description: 'Aluminum laptop stand',
        price: 39.0,
        stock: 15,
        userId: user.id,
      },
    ],
  })

  console.log('Seed completed.')
  console.log('Demo credentials (password for all):', DEMO_PASSWORD)
  console.log('- admin@example.com')
  console.log('- user@example.com')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
