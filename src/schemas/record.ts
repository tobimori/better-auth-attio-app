import {z} from "zod"

const recordIdSchema = z.object({
  workspace_id: z.string(),
  object_id: z.string(),
  record_id: z.string(),
})

export const recordSchema = z.object({
  id: recordIdSchema,
  created_at: z.string(),
  values: z.record(z.string(), z.any()),
})

export const queryRecordsResponseSchema = z.array(recordSchema)

export type Record = z.infer<typeof recordSchema>
export type QueryRecordsResponse = z.infer<typeof queryRecordsResponseSchema>
