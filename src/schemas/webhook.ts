import {z} from "zod"

// webhook subscription schema
const webhookSubscriptionSchema = z.object({
  event_type: z.enum([
    "call-recording.created",
    "comment.created",
    "comment.resolved",
    "comment.unresolved",
    "comment.deleted",
    "list.created",
    "list.updated",
    "list.deleted",
    "list-attribute.created",
    "list-attribute.updated",
    "list-entry.created",
    "list-entry.updated",
    "list-entry.deleted",
    "object-attribute.created",
    "object-attribute.updated",
    "note.created",
    "note-content.updated",
    "note.updated",
    "note.deleted",
    "record.created",
    "record.merged",
    "record.updated",
    "record.deleted",
    "task.created",
    "task.updated",
    "task.deleted",
    "workspace-member.created",
  ]),
  filter: z.union([
    z.object({
      $or: z.array(
        z.union([
          z.object({
            field: z.string(),
            operator: z.literal("equals"),
            value: z.string(),
          }),
          z.object({
            field: z.string(),
            operator: z.literal("not_equals"),
            value: z.string(),
          }),
        ])
      ),
    }),
    z.object({
      $and: z.array(
        z.union([
          z.object({
            field: z.string(),
            operator: z.literal("equals"),
            value: z.string(),
          }),
          z.object({
            field: z.string(),
            operator: z.literal("not_equals"),
            value: z.string(),
          }),
        ])
      ),
    }),
    z.null(),
  ]),
})

// webhook schema
const webhookSchema = z.object({
  target_url: z.url(),
  subscriptions: z.array(webhookSubscriptionSchema),
  id: z.object({
    workspace_id: z.uuid(),
    webhook_id: z.uuid(),
  }),
  status: z.enum(["active", "degraded", "inactive"]),
  created_at: z.string(),
})

// create webhook response schema (includes secret)
export const createWebhookResponseSchema = webhookSchema.extend({
  secret: z.string(),
})

// list webhooks response schema
export const listWebhooksResponseSchema = z.array(webhookSchema)

export type Webhook = z.infer<typeof webhookSchema>
export type CreateWebhookResponse = z.infer<typeof createWebhookResponseSchema>
export type ListWebhooksResponse = z.infer<typeof listWebhooksResponseSchema>
