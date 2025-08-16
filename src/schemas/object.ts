import {z} from "zod"

export const objectSchema = z.object({
  id: z.object({
    workspace_id: z.string(),
    object_id: z.string(),
  }),
  api_slug: z.string(),
  singular_noun: z.string(),
  plural_noun: z.string(),
  created_at: z.string(),
})

export const listObjectsResponseSchema = z.array(objectSchema)

export type AttioObject = z.infer<typeof objectSchema>
export type ListObjectsResponse = z.infer<typeof listObjectsResponseSchema>