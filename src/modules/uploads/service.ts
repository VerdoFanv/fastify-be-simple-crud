import { randomUUID } from 'node:crypto'
import { env } from '@/config/env.js'
import type { PrismaClient, Upload } from '@/generated/prisma/client.js'
import { badRequest } from '@/lib/errors.js'
import { objectUrl, uploadObject } from '@/lib/s3.js'

const ALLOWED_MIME_PREFIXES = ['image/', 'application/pdf', 'text/plain']

export type UploadDto = Upload & { url: string }

export function toUploadDto(upload: Upload): UploadDto {
  return {
    ...upload,
    url: objectUrl(upload.key),
  }
}

function isAllowedMime(contentType: string): boolean {
  return ALLOWED_MIME_PREFIXES.some((prefix) => contentType.startsWith(prefix))
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
}

export async function createUpload(
  prisma: PrismaClient,
  userId: string,
  file: {
    filename: string
    mimetype: string
    buffer: Buffer
  },
): Promise<UploadDto> {
  if (!file.buffer.length) {
    throw badRequest('Empty file')
  }
  if (!isAllowedMime(file.mimetype)) {
    throw badRequest('Unsupported file type')
  }
  if (file.buffer.length > env.UPLOAD_MAX_BYTES) {
    throw badRequest('File too large')
  }

  const key = `uploads/${userId}/${randomUUID()}-${sanitizeFilename(file.filename)}`
  await uploadObject({
    key,
    body: file.buffer,
    contentType: file.mimetype,
  })

  const upload = await prisma.upload.create({
    data: {
      userId,
      key,
      bucket: env.S3_BUCKET,
      contentType: file.mimetype,
      size: file.buffer.length,
    },
  })

  return toUploadDto(upload)
}
