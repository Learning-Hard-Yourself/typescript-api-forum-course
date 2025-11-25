import { z } from 'zod'

/**
 * Post Edit Request Validation
 *
 * Validates content and optional reason for editing a post
 */

export const PostEditRequestSchema = z.object({
    content: z.string().min(1, 'Content cannot be empty').max(10000, 'Content too long'),
    reason: z.string().max(500).optional(),
})

export type PostEditRequest = z.infer<typeof PostEditRequestSchema>

/**
 * Post Delete Request Validation
 */
export const PostDeleteRequestSchema = z.object({
    reason: z.string().max(500).optional(),
})

export type PostDeleteRequest = z.infer<typeof PostDeleteRequestSchema>
