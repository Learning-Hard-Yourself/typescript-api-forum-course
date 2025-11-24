import { z } from 'zod'

import { ValidationError } from '@/app/Errors/ValidationError'
import type { UserRole } from '@/app/Models/User'

const usernameRegex = /^[a-zA-Z0-9_]+$/u

const userUpdateSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must contain at least 3 characters')
      .max(32, 'Username cannot exceed 32 characters')
      .regex(usernameRegex, 'Username can only contain letters, numbers and underscores')
      .optional(),
    email: z.string().email('Email must be valid').optional(),
    displayName: z
      .string()
      .min(3, 'Display name must contain at least 3 characters')
      .max(80, 'Display name cannot exceed 80 characters')
      .optional(),
    avatarUrl: z
      .union([z.string().url('Avatar URL must be a valid URL'), z.null()])
      .optional(),
    password: z
      .string()
      .min(12, 'Password must contain at least 12 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/[A-Z]/u, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/u, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/u, 'Password must contain at least one number')
      .regex(/[^\da-zA-Z]/u, 'Password must contain at least one symbol')
      .optional(),
    role: z.custom<UserRole>().optional(),
  })
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field must be provided',
        path: ['body'],
      })
    }
  })

export type UserUpdateAttributes = z.infer<typeof userUpdateSchema>

export class UserUpdateRequest {
  public validate(input: unknown): UserUpdateAttributes {
    const result = userUpdateSchema.safeParse(input)

    if (result.success) {
      return result.data
    }

    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }))

    throw new ValidationError(details)
  }
}
